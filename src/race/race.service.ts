import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Race } from '../engine/models/race';
import { Cyclist } from '../engine/models/cyclist';
import { runSimulation } from '../engine/core/simulation';
import { CreateRaceDto, SimulateRaceDto } from './race.dto';

/**
 * In-memory store – no database.
 * All races live for the lifetime of the process.
 */
@Injectable()
export class RaceService {
  private readonly store = new Map<string, Race>();

  createRace(dto: CreateRaceDto): Race {
    const id = uuidv4();

    const cyclists: Cyclist[] = dto.cyclists.map((c) => ({
      id: c.id,
      name: c.name,
      teamId: c.teamId,
      stats: { ...c.stats },
      dynamic: {
        energy: c.stats.stamina,
        fatigue: 0,
        position: 0,
        speed: 0,
        isDropped: false,
      },
    }));

    const race: Race = {
      id,
      name: dto.name,
      totalDistance: dto.totalDistance,
      segments: dto.segments.map((s) => ({ ...s })),
      teams: dto.teams.map((t) => ({ ...t })),
      cyclists,
      snapshots: [],
      status: 'PENDING',
      seed: dto.seed,
      createdAt: new Date().toISOString(),
    };

    this.store.set(id, race);
    return race;
  }

  simulate(id: string, dto?: SimulateRaceDto): Race {
    const race = this.getRace(id);

    if (race.status === 'RUNNING') {
      throw new ConflictException(`Race ${id} is already running.`);
    }
    if (race.status === 'FINISHED') {
      throw new ConflictException(
        `Race ${id} has already been simulated. Create a new race to re-run.`,
      );
    }

    race.status = 'RUNNING';
    if (dto?.seed !== undefined) race.seed = dto.seed;

    // Clear previous snapshots (in case of re-trigger after error)
    race.snapshots = [];

    runSimulation(race);

    race.status = 'FINISHED';
    race.finishedAt = new Date().toISOString();

    return race;
  }

  getRace(id: string): Race {
    const race = this.store.get(id);
    if (!race) throw new NotFoundException(`Race ${id} not found.`);
    return race;
  }

  getSnapshots(id: string) {
    return this.getRace(id).snapshots;
  }

  getSnapshot(id: string, km: number) {
    const snapshots = this.getSnapshots(id);
    const snap = snapshots.find((s) => s.km === km);
    if (!snap)
      throw new NotFoundException(`No snapshot at km ${km} for race ${id}.`);
    return snap;
  }

  listRaces(): Pick<Race, 'id' | 'name' | 'totalDistance' | 'status' | 'createdAt' | 'finishedAt'>[] {
    return [...this.store.values()].map(
      ({ id, name, totalDistance, status, createdAt, finishedAt }) => ({
        id,
        name,
        totalDistance,
        status,
        createdAt,
        finishedAt,
      }),
    );
  }

  getLeaderboard(id: string) {
    const race = this.getRace(id);
    if (race.status !== 'FINISHED') {
      throw new ConflictException(`Race ${id} has not been simulated yet.`);
    }
    const last = race.snapshots[race.snapshots.length - 1];
    return [...last.cyclists]
      .sort((a, b) => b.position - a.position)
      .map((c, i) => ({ rank: i + 1, ...c }));
  }
}
