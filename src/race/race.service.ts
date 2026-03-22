import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Race } from '../engine/models/race';
import { runSimulation } from '../engine/core/simulation';
import { CreateRaceDto, SimulateRaceDto } from './race.dto';
import {
  toEngineRace,
  toEngineSnapshot,
  toCyclistSnapshotInputs,
} from './race.mapper';

/** Full include shape for a race with teams, cyclists, and segments. */
const RACE_WITH_RELATIONS = {
  segments: true,
  raceTeams: { include: { team: { include: { cyclists: true } } } },
} as const;

/** Full include shape for a snapshot with its cyclist rows and parent cyclists. */
const SNAPSHOT_WITH_CHILDREN = {
  cyclistSnapshots: { include: { cyclist: true } },
} as const;

@Injectable()
export class RaceService {
  constructor(private readonly prisma: PrismaService) {}

  async createRace(dto: CreateRaceDto): Promise<Race> {
    // Verify all teams exist.
    const teams = await this.prisma.team.findMany({
      where: { id: { in: dto.teamIds } },
    });
    if (teams.length !== dto.teamIds.length) {
      const missing = dto.teamIds.filter((id) => !teams.find((t) => t.id === id));
      throw new NotFoundException(`Teams not found: ${missing.join(', ')}`);
    }

    // Verify all cyclists exist and belong to the provided teams.
    const cyclists = await this.prisma.cyclist.findMany({
      where: { id: { in: dto.cyclistIds } },
    });
    if (cyclists.length !== dto.cyclistIds.length) {
      const missing = dto.cyclistIds.filter((id) => !cyclists.find((c) => c.id === id));
      throw new NotFoundException(`Cyclists not found: ${missing.join(', ')}`);
    }
    const teamIdSet = new Set(dto.teamIds);
    const orphans = cyclists.filter((c) => !teamIdSet.has(c.teamId));
    if (orphans.length > 0) {
      throw new UnprocessableEntityException(
        `Cyclists do not belong to the provided teams: ${orphans.map((c) => c.id).join(', ')}`,
      );
    }

    // Create the race with its segments, team junctions, and cyclist roster.
    const dbRace = await this.prisma.race.create({
      data: {
        name: dto.name,
        totalDistance: dto.totalDistance,
        seed: dto.seed,
        cyclistIds: dto.cyclistIds,
        segments: {
          create: dto.segments.map((s) => ({
            startKm: s.startKm,
            endKm: s.endKm,
            type: s.type,
            gradient: s.gradient,
            windDirection: s.wind?.direction ?? null,
            windStrength: s.wind?.strength ?? null,
          })),
        },
        raceTeams: {
          create: dto.teamIds.map((teamId) => ({ teamId })),
        },
      },
      include: RACE_WITH_RELATIONS,
    });

    return toEngineRace(dbRace);
  }

  async simulate(id: string, dto?: SimulateRaceDto): Promise<Race> {
    const dbRace = await this.prisma.race.findUnique({
      where: { id },
      include: RACE_WITH_RELATIONS,
    });
    if (!dbRace) throw new NotFoundException(`Race ${id} not found.`);

    if (dbRace.status === 'RUNNING') {
      throw new ConflictException(`Race ${id} is already running.`);
    }
    if (dbRace.status === 'FINISHED') {
      throw new ConflictException(
        `Race ${id} has already been simulated. Create a new race to re-run.`,
      );
    }

    await this.prisma.race.update({
      where: { id },
      data: {
        status: 'RUNNING',
        ...(dto?.seed !== undefined ? { seed: dto.seed } : {}),
      },
    });

    const engineRace = toEngineRace(dbRace);
    if (dto?.seed !== undefined) engineRace.seed = dto.seed;

    runSimulation(engineRace);

    // Persist each snapshot sequentially (createMany for cyclist rows per step).
    for (const snapshot of engineRace.snapshots) {
      const dbSnapshot = await this.prisma.raceSnapshot.create({
        data: { raceId: id, km: snapshot.km },
      });
      await this.prisma.cyclistSnapshot.createMany({
        data: toCyclistSnapshotInputs(dbSnapshot.id, snapshot),
      });
    }

    const finishedAt = new Date();
    await this.prisma.race.update({
      where: { id },
      data: { status: 'FINISHED', finishedAt },
    });

    engineRace.status = 'FINISHED';
    engineRace.finishedAt = finishedAt.toISOString();
    return engineRace;
  }

  async getRace(id: string): Promise<Race> {
    const dbRace = await this.prisma.race.findUnique({
      where: { id },
      include: RACE_WITH_RELATIONS,
    });
    if (!dbRace) throw new NotFoundException(`Race ${id} not found.`);
    return toEngineRace(dbRace);
  }

  async getSnapshots(id: string) {
    await this.assertRaceExists(id);
    const snapshots = await this.prisma.raceSnapshot.findMany({
      where: { raceId: id },
      include: SNAPSHOT_WITH_CHILDREN,
      orderBy: { km: 'asc' },
    });
    return snapshots.map(toEngineSnapshot);
  }

  async getSnapshot(id: string, km: number) {
    const snap = await this.prisma.raceSnapshot.findUnique({
      where: { raceId_km: { raceId: id, km } },
      include: SNAPSHOT_WITH_CHILDREN,
    });
    if (!snap)
      throw new NotFoundException(`No snapshot at km ${km} for race ${id}.`);
    return toEngineSnapshot(snap);
  }

  async listRaces() {
    return this.prisma.race.findMany({
      select: {
        id: true,
        name: true,
        totalDistance: true,
        status: true,
        createdAt: true,
        finishedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLeaderboard(id: string) {
    const dbRace = await this.prisma.race.findUnique({ where: { id } });
    if (!dbRace) throw new NotFoundException(`Race ${id} not found.`);
    if (dbRace.status !== 'FINISHED') {
      throw new ConflictException(`Race ${id} has not been simulated yet.`);
    }

    const lastSnapshot = await this.prisma.raceSnapshot.findFirst({
      where: { raceId: id },
      orderBy: { km: 'desc' },
      include: SNAPSHOT_WITH_CHILDREN,
    });
    if (!lastSnapshot) throw new NotFoundException(`No snapshots for race ${id}.`);

    return [...lastSnapshot.cyclistSnapshots]
      .sort((a, b) => {
        if (a.finishPosition != null && b.finishPosition != null)
          return a.finishPosition - b.finishPosition;
        if (b.position !== a.position) return b.position - a.position;
        return b.speed - a.speed;
      })
      .map((cs, i) => ({
        rank: i + 1,
        id: cs.cyclist.id,
        name: cs.cyclist.name,
        teamId: cs.cyclist.teamId,
        position: cs.position,
        speed: cs.speed,
        energy: cs.energy,
        intent: cs.intent ?? undefined,
        groupId: cs.groupId ?? undefined,
        isDropped: cs.isDropped,
        finishPosition: cs.finishPosition ?? undefined,
      }));
  }

  private async assertRaceExists(id: string): Promise<void> {
    const exists = await this.prisma.race.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Race ${id} not found.`);
  }
}
