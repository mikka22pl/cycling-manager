import {
  Cyclist as PrismaCyclist,
  Team as PrismaTeam,
  Segment as PrismaSegment,
  Race as PrismaRace,
  RaceSnapshot as PrismaRaceSnapshot,
  CyclistSnapshot as PrismaCyclistSnapshot,
  RaceTeam as PrismaRaceTeam,
  Prisma,
} from '@prisma/client';
import { CyclistWithTeam } from '../engine/models/cyclist';
import { Team } from '../engine/models/team';
import { Segment } from '../engine/models/segment';
import { Race, RaceSnapshot } from '../engine/models/race';

// ─── Prisma relation shapes ───────────────────────────────────────────────────

type PrismaRaceWithRelations = PrismaRace & {
  cyclistIds: string[];
  segments: PrismaSegment[];
  raceTeams: (PrismaRaceTeam & {
    team: PrismaTeam & { cyclists: PrismaCyclist[] };
  })[];
  snapshots?: (PrismaRaceSnapshot & {
    cyclistSnapshots: (PrismaCyclistSnapshot & { cyclist: PrismaCyclist })[];
  })[];
};

type PrismaSnapshotWithChildren = PrismaRaceSnapshot & {
  cyclistSnapshots: (PrismaCyclistSnapshot & {
    cyclist: PrismaCyclist & { team: PrismaTeam };
  })[];
};

// ─── Prisma → Engine ──────────────────────────────────────────────────────────

export function toEngineCyclist(
  dbCyclist: PrismaCyclist,
  teamName: string,
): CyclistWithTeam {
  return {
    id: dbCyclist.id,
    name: dbCyclist.name,
    teamId: dbCyclist.teamId,
    teamName: teamName,
    stats: {
      stamina: dbCyclist.stamina,
      performance: dbCyclist.performance,
      climbing: dbCyclist.climbing,
      sprint: dbCyclist.sprint,
      vigilance: dbCyclist.vigilance,
      resistance: dbCyclist.resistance,
      recovery: dbCyclist.recovery,
    },
    dynamic: {
      energy: dbCyclist.stamina,
      fatigue: 0,
      position: 0,
      speed: 0,
      isDropped: false,
    },
  };
}

export function toEngineTeam(dbTeam: PrismaTeam): Team {
  return {
    id: dbTeam.id,
    name: dbTeam.name,
    leaderId: dbTeam.leaderId,
    domestiqueIds: dbTeam.domestiqueIds,
    strategy: dbTeam.strategy as Team['strategy'],
  };
}

export function toEngineSegment(dbSeg: PrismaSegment): Segment {
  const seg: Segment = {
    startKm: dbSeg.startKm,
    endKm: dbSeg.endKm,
    type: dbSeg.type as Segment['type'],
    gradient: dbSeg.gradient,
  };
  if (dbSeg.windDirection && dbSeg.windStrength != null) {
    seg.wind = {
      direction: dbSeg.windDirection as 'head' | 'tail' | 'cross',
      strength: dbSeg.windStrength,
    };
  }
  return seg;
}

export function toEngineSnapshot(
  dbSnap: PrismaSnapshotWithChildren,
): RaceSnapshot {
  return {
    km: dbSnap.km,
    cyclists: dbSnap.cyclistSnapshots.map((cs) => ({
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
    })),
  };
}

export function toEngineRace(dbRace: PrismaRaceWithRelations): Race {
  const teams: Team[] = dbRace.raceTeams.map((rt) => toEngineTeam(rt.team));
  const teamNamesMap = new Map<string, string>();
  for (const team of teams) {
    teamNamesMap.set(team.id, team.name);
  }
  const rosterIds = new Set(dbRace.cyclistIds);
  const cyclists: CyclistWithTeam[] = dbRace.raceTeams.flatMap((rt) =>
    rt.team.cyclists
      .filter((c) => rosterIds.size === 0 || rosterIds.has(c.id))
      .map((c) => toEngineCyclist(c, teamNamesMap.get(c.teamId) ?? '')),
  );
  const segments: Segment[] = dbRace.segments.map(toEngineSegment);
  const snapshots: RaceSnapshot[] = (dbRace.snapshots ?? []).map(
    toEngineSnapshot,
  );

  return {
    id: dbRace.id,
    name: dbRace.name,
    totalDistance: dbRace.totalDistance,
    status: dbRace.status as Race['status'],
    seed: dbRace.seed ?? undefined,
    createdAt: dbRace.createdAt.toISOString(),
    finishedAt: dbRace.finishedAt?.toISOString(),
    segments,
    teams,
    cyclists,
    snapshots,
  };
}

// ─── Engine → Prisma (snapshot persistence) ───────────────────────────────────

export function toCyclistSnapshotInputs(
  snapshotId: string,
  engineSnapshot: RaceSnapshot,
): Prisma.CyclistSnapshotCreateManyInput[] {
  return engineSnapshot.cyclists.map((c) => ({
    snapshotId,
    cyclistId: c.id,
    position: c.position,
    speed: c.speed,
    energy: c.energy,
    fatigue: 0, // per-step fatigue not exposed by the engine snapshot
    intent: c.intent ?? null,
    groupId: c.groupId ?? null,
    isDropped: c.isDropped,
    finishPosition: c.finishPosition ?? null,
  }));
}
