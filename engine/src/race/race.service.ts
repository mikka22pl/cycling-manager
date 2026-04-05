import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { RaceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Race } from '../engine/models/race';
import { runSimulation } from '../engine/core/simulation';
import {
  CreateRaceDto,
  CreateSimpleRaceDto,
  SimulateRaceDto,
  AddSegmentsDto,
  RegisterForRaceDto,
} from './race.dto';
import {
  toEngineRace,
  toEngineSnapshot,
  toCyclistSnapshotInputs,
} from './race.mapper';

/** Full include shape for a race with teams, cyclists, and segments. */
const RACE_WITH_RELATIONS = {
  segments: true,
  raceTeams: { include: { team: { include: { cyclists: true } } } },
  raceEntries: { select: { cyclistId: true } },
} as const;

/** Full include shape for a snapshot with its cyclist rows and parent cyclists. */
const SNAPSHOT_WITH_CHILDREN = {
  cyclistSnapshots: { include: { cyclist: { include: { team: true } } } },
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
      const missing = dto.teamIds.filter(
        (id) => !teams.find((t) => t.id === id),
      );
      throw new NotFoundException(`Teams not found: ${missing.join(', ')}`);
    }

    // Verify all cyclists exist and belong to the provided teams.
    const cyclists = await this.prisma.cyclist.findMany({
      where: { id: { in: dto.cyclistIds } },
    });
    if (cyclists.length !== dto.cyclistIds.length) {
      const missing = dto.cyclistIds.filter(
        (id) => !cyclists.find((c) => c.id === id),
      );
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

  async createSimpleRace(dto: CreateSimpleRaceDto) {
    const season = await this.prisma.season.findUnique({
      where: { id: dto.seasonId },
      select: { id: true },
    });
    if (!season) {
      throw new NotFoundException(`Season ${dto.seasonId} not found.`);
    }

    return this.prisma.race.create({
      data: {
        name: dto.name,
        totalDistance: 0,
        seasonId: dto.seasonId,
        raceType: 'SINGLE',
        ...(dto.status ? { status: dto.status as RaceStatus } : {}),
      },
      select: {
        id: true,
        name: true,
        totalDistance: true,
        status: true,
        raceType: true,
        seasonId: true,
        createdAt: true,
      },
    });
  }

  async addSegments(id: string, dto: AddSegmentsDto) {
    const race = await this.prisma.race.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        segments: {
          select: { endKm: true },
          orderBy: { endKm: 'desc' },
          take: 1,
        },
      },
    });
    if (!race) throw new NotFoundException(`Race ${id} not found.`);
    if (race.status !== 'DRAFT') {
      throw new ConflictException(
        `Cannot add segments to a race with status ${race.status}.`,
      );
    }

    let cursor = race.segments[0]?.endKm ?? 0;
    const segmentData = dto.segments.map((s) => {
      const startKm = cursor;
      const endKm = cursor + s.distance;
      cursor = endKm;
      return { raceId: id, startKm, endKm, type: s.type, gradient: s.gradient };
    });

    await this.prisma.$transaction([
      this.prisma.segment.createMany({ data: segmentData }),
      this.prisma.race.update({
        where: { id },
        data: { totalDistance: cursor },
      }),
    ]);

    return this.prisma.segment.findMany({
      where: { raceId: id },
      orderBy: { startKm: 'asc' },
    });
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
      Logger.log('race_snapshot ' + id + ' : ' + snapshot.km);
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
        seasonId: true,
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
    if (!lastSnapshot)
      throw new NotFoundException(`No snapshots for race ${id}.`);

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
        teamName: cs.cyclist.team.name,
        position: cs.position,
        speed: cs.speed,
        energy: cs.energy,
        intent: cs.intent ?? undefined,
        groupId: cs.groupId ?? undefined,
        isDropped: cs.isDropped,
        finishPosition: cs.finishPosition ?? undefined,
      }));
  }

  async getStartlist(id: string) {
    await this.assertRaceExists(id);

    const entries = await this.prisma.raceEntry.findMany({
      where: { raceId: id },
      include: {
        cyclist: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: [{ teamId: 'asc' }, { isLeader: 'desc' }],
    });

    const teamMap = new Map<
      string,
      { id: string; name: string; cyclists: object[] }
    >();
    for (const entry of entries) {
      if (!teamMap.has(entry.teamId)) {
        teamMap.set(entry.teamId, {
          id: entry.teamId,
          name: entry.team.name,
          cyclists: [],
        });
      }
      teamMap.get(entry.teamId)!.cyclists.push({
        id: entry.cyclist.id,
        name: entry.cyclist.name,
        role: entry.role,
        isLeader: entry.isLeader,
        startNumber: entry.startNumber ?? null,
      });
    }

    return { teams: [...teamMap.values()] };
  }

  async openRace(id: string) {
    const race = await this.prisma.race.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!race) throw new NotFoundException(`Race ${id} not found.`);
    if (race.status !== 'DRAFT') {
      throw new ConflictException(
        `Cannot open a race with status ${race.status}.`,
      );
    }
    return this.prisma.race.update({
      where: { id },
      data: { status: 'OPEN' },
      select: { id: true, name: true, status: true, totalDistance: true, createdAt: true, finishedAt: true },
    });
  }

  async closeStartlist(raceId: string) {
    const race = await this.prisma.race.findUnique({
      where: { id: raceId },
      select: { id: true, status: true },
    });
    if (!race) throw new NotFoundException(`Race ${raceId} not found.`);
    if (race.status !== 'OPEN') {
      throw new ConflictException(
        `Cannot close startlist for a race with status ${race.status}.`,
      );
    }

    const entries = await this.prisma.raceEntry.findMany({
      where: { raceId },
      orderBy: [{ teamId: 'asc' }, { isLeader: 'desc' }, { id: 'asc' }],
    });

    const teamMap = new Map<string, typeof entries>();
    for (const entry of entries) {
      if (!teamMap.has(entry.teamId)) teamMap.set(entry.teamId, []);
      teamMap.get(entry.teamId)!.push(entry);
    }

    const assignments: { id: string; startNumber: number }[] = [];
    let teamIndex = 1;
    for (const cyclists of teamMap.values()) {
      cyclists.forEach((entry, j) => {
        assignments.push({ id: entry.id, startNumber: (teamIndex - 1) * 10 + (j + 1) });
      });
      teamIndex++;
    }

    return this.prisma.$transaction(async (tx) => {
      await Promise.all(
        assignments.map(({ id, startNumber }) =>
          tx.raceEntry.update({ where: { id }, data: { startNumber } }),
        ),
      );
      return tx.race.update({
        where: { id: raceId },
        data: { status: 'PENDING' },
        select: { id: true, name: true, status: true, totalDistance: true, createdAt: true, finishedAt: true },
      });
    });
  }

  async registerForRace(
    userId: string,
    raceId: string,
    dto: RegisterForRaceDto,
  ) {
    const race = await this.prisma.race.findUnique({
      where: { id: raceId },
      select: { id: true, status: true },
    });
    if (!race) throw new NotFoundException(`Race ${raceId} not found.`);
    if (race.status !== 'OPEN') {
      throw new ConflictException(
        `Cannot register for a race with status ${race.status}.`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });
    if (!user?.teamId) {
      throw new UnprocessableEntityException('You do not have a team.');
    }
    const teamId = user.teamId;

    if (dto.entries.length > 0) {
      const cyclistIds = dto.entries.map((e) => e.cyclistId);
      const cyclists = await this.prisma.cyclist.findMany({
        where: { id: { in: cyclistIds }, teamId },
        select: { id: true },
      });
      if (cyclists.length !== cyclistIds.length) {
        const found = new Set(cyclists.map((c) => c.id));
        const invalid = cyclistIds.filter((id) => !found.has(id));
        throw new UnprocessableEntityException(
          `Cyclists do not belong to your team: ${invalid.join(', ')}`,
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.raceEntry.deleteMany({ where: { raceId, teamId } }),
      this.prisma.raceEntry.createMany({
        data: dto.entries.map((e) => ({
          raceId,
          teamId,
          cyclistId: e.cyclistId,
          isLeader: e.isLeader,
          role: e.role,
        })),
      }),
    ]);

    // Ensure RaceTeam junction exists (upsert not available on composite PK with createMany workaround)
    await this.prisma.raceTeam.upsert({
      where: { raceId_teamId: { raceId, teamId } },
      update: {},
      create: { raceId, teamId },
    });

    return this.prisma.raceEntry.findMany({
      where: { raceId, teamId },
      include: { cyclist: { select: { id: true, name: true } } },
    });
  }

  async getMyRaceEntries(userId: string, raceId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });
    if (!user?.teamId) return [];

    return this.prisma.raceEntry.findMany({
      where: { raceId, teamId: user.teamId },
      include: { cyclist: { select: { id: true, name: true } } },
    });
  }

  async copyStartlist(fromId: string, toId: string) {
    const [fromRace, toRace] = await Promise.all([
      this.prisma.race.findUnique({
        where: { id: fromId },
        select: { id: true },
      }),
      this.prisma.race.findUnique({
        where: { id: toId },
        select: { id: true },
      }),
    ]);
    if (!fromRace) throw new NotFoundException(`Race ${fromId} not found.`);
    if (!toRace) throw new NotFoundException(`Race ${toId} not found.`);

    const entries = await this.prisma.raceEntry.findMany({
      where: { raceId: fromId },
      select: { cyclistId: true, teamId: true, isLeader: true, role: true },
    });

    if (entries.length === 0) return { copied: 0 };

    const teamIds = [...new Set(entries.map((e) => e.teamId))];

    await this.prisma.raceTeam.createMany({
      data: teamIds.map((teamId) => ({ raceId: toId, teamId })),
      skipDuplicates: true,
    });

    await this.prisma.raceEntry.createMany({
      data: entries.map((e) => ({ ...e, raceId: toId })),
      skipDuplicates: true,
    });

    return { copied: entries.length };
  }

  private async assertRaceExists(id: string): Promise<void> {
    const exists = await this.prisma.race.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Race ${id} not found.`);
  }
}
