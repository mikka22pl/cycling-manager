import { Race, RaceSnapshot } from '../models/race';
import { Cyclist, CyclistWithTeam, Intent } from '../models/cyclist';
import { Segment } from '../models/segment';
import { resolveStepDistance } from './stepResolver';
import { computeSpeed, BASE_SPEED } from '../services/speed.service';
import { computeFatigueUpdate } from '../services/fatigue.service';
import { resolveGroups, Group } from '../services/group.service';
import { decideEffort } from '../services/tactics.service';
import { createRng, SeededRandom } from '../utils/random';
import { Logger } from '@nestjs/common';

/** Finds the segment that covers a given km point. */
function getSegmentAt(segments: Segment[], km: number): Segment {
  const seg = segments.find((s) => km >= s.startKm && km < s.endKm);
  // Fall back to last segment if we're exactly at the end
  return seg ?? segments[segments.length - 1];
}

/** Builds a RaceSnapshot from current cyclist states. */
function buildSnapshot(km: number, cyclists: CyclistWithTeam[]): RaceSnapshot {
  return {
    km,
    cyclists: cyclists.map((c) => ({
      id: c.id,
      name: c.name,
      teamId: c.teamId,
      teamName: c.teamName,
      position: parseFloat(c.dynamic.position.toFixed(3)),
      speed: parseFloat(c.dynamic.speed.toFixed(2)),
      energy: parseFloat(c.dynamic.energy.toFixed(1)),
      intent: c.dynamic.intent,
      groupId: c.dynamic.groupId,
      isDropped: c.dynamic.isDropped,
    })),
  };
}

// Intents that cause a rider to break from their group and move at individual speed
const SOLO_INTENTS = new Set<Intent>(['ATTACK', 'SPRINT', 'CHASE']);

/**
 * Runs the full race simulation and returns the array of snapshots.
 * Mutates race.cyclists and appends to race.snapshots.
 */
export function runSimulation(race: Race): RaceSnapshot[] {
  const rng: SeededRandom = createRng(race.seed);

  // Reset dynamic state
  for (const cyclist of race.cyclists) {
    cyclist.dynamic = {
      energy: cyclist.stats.stamina,
      fatigue: 0,
      position: 0,
      speed: 0,
      groupId: undefined,
      intent: undefined,
      isDropped: false,
    };
  }

  // Per-race form factor per cyclist (good day / bad day variation)
  const formFactors = new Map<string, number>();
  for (const cyclist of race.cyclists) {
    formFactors.set(cyclist.id, rng.range(0.88, 1.12));
  }

  // Build team lookup
  const teamMap = new Map(race.teams.map((t) => [t.id, t]));

  // Local finish tracking — does not mutate the Cyclist model
  const finishOrder: { cyclistId: string }[] = [];
  const finishedIds = new Set<string>();

  // Initial group resolve so the first step has groupIds available
  resolveGroups(race.cyclists);

  while (true) {
    const active = race.cyclists.filter(
      (c) => !c.dynamic.isDropped && !finishedIds.has(c.id),
    );
    if (active.length === 0) break;

    const leaderPosition = Math.max(...active.map((c) => c.dynamic.position));
    const remainingKm = race.totalDistance - leaderPosition;
    if (remainingKm <= 0) break;

    const stepKm = resolveStepDistance(remainingKm);
    // Fixed time reference: how many hours does this step represent at BASE_SPEED
    const stepTime = stepKm / BASE_SPEED;

    const segment = getSegmentAt(race.segments, leaderPosition);

    // --- Phase 1: Resolve groups from current positions ---
    // This gives us group membership + group collective speed before anyone moves.
    const groups: Group[] = resolveGroups(active);
    const cyclistGroupMap = new Map<string, Group>();
    for (const g of groups) {
      for (const id of g.cyclistIds) {
        cyclistGroupMap.set(id, g);
      }
    }

    // --- Phase 2: Per-cyclist — decide intent, compute speed and fatigue ---
    for (const cyclist of active) {
      const team = teamMap.get(cyclist.teamId);
      if (!team) continue;

      const { intent, effort } = decideEffort(
        cyclist,
        race.cyclists,
        team,
        remainingKm,
        rng,
      );
      cyclist.dynamic.intent = intent;

      // Sprint stat boost in final km
      let sprintAdjustedEffort = effort;
      if (remainingKm < 3) {
        const sprintBoost =
          (cyclist.stats.sprint / 100) * (cyclist.dynamic.energy / 100) * 0.3;
        sprintAdjustedEffort = Math.min(1.5, effort + sprintBoost);
      }

      const groupSize = cyclistGroupMap.get(cyclist.id)?.cyclistIds.length ?? 1;

      const speed = computeSpeed(
        cyclist,
        segment,
        Math.max(1, groupSize),
        sprintAdjustedEffort,
        rng,
        formFactors.get(cyclist.id) ?? 1.0,
      );
      Logger.log('speed ' + cyclist.name + ' : ' + speed);

      const { fatigue, energy } = computeFatigueUpdate(
        cyclist,
        sprintAdjustedEffort,
        segment,
        rng,
      );

      cyclist.dynamic.speed = speed;
      cyclist.dynamic.fatigue = fatigue;
      cyclist.dynamic.energy = energy;

      if (energy <= 0) {
        cyclist.dynamic.isDropped = true;
      }
    }

    // --- Phase 3: Move riders ---
    // Riders with ATTACK / SPRINT / CHASE intent break from the group and travel
    // at their own speed. All others ride at the group's collective speed so the
    // peloton stays cohesive by default.
    for (const cyclist of active) {
      if (cyclist.dynamic.isDropped) continue;

      const group = cyclistGroupMap.get(cyclist.id);
      const useSoloSpeed =
        (cyclist.dynamic.intent !== undefined &&
          SOLO_INTENTS.has(cyclist.dynamic.intent)) ||
        !group;
      const dist = useSoloSpeed
        ? cyclist.dynamic.speed * stepTime
        : group!.speed * stepTime;

      cyclist.dynamic.position += dist;
    }

    // --- Phase 4: Detect finishers this step ---
    const newFinishers = active.filter(
      (c) => !c.dynamic.isDropped && c.dynamic.position >= race.totalDistance,
    );
    for (const c of newFinishers) {
      c.dynamic.position = race.totalDistance; // clamp to finish line
    }
    // Within the same step, rank by individual speed (faster = crossed the line first)
    newFinishers.sort((a, b) => {
      const speedDiff = b.dynamic.speed - a.dynamic.speed;
      if (Math.abs(speedDiff) > 0.01) return speedDiff;
      // Near-identical speed: use sprint/energy/rng tiebreaker
      const scoreA =
        (a.stats.sprint / 100) * 0.5 +
        (a.dynamic.energy / 100) * 0.3 +
        rng.range(0, 0.2);
      const scoreB =
        (b.stats.sprint / 100) * 0.5 +
        (b.dynamic.energy / 100) * 0.3 +
        rng.range(0, 0.2);
      return scoreB - scoreA;
    });
    for (const c of newFinishers) {
      finishOrder.push({ cyclistId: c.id });
      finishedIds.add(c.id);
    }

    // --- Phase 5: Re-resolve groups for correct groupIds in the snapshot ---
    resolveGroups(race.cyclists.filter((c) => !c.dynamic.isDropped));

    // --- Phase 6: Save snapshot ---
    const actualLeaderKm = Math.max(
      ...race.cyclists.map((c) => c.dynamic.position),
    );
    const snapshotKm = parseFloat(actualLeaderKm.toFixed(3));
    const snapshot = buildSnapshot(snapshotKm, race.cyclists);
    race.snapshots.push(snapshot);

    if (snapshotKm >= race.totalDistance) break;
  }

  // --- Assign finishPosition from actual crossing order ---
  const lastSnapshot = race.snapshots[race.snapshots.length - 1];

  finishOrder.forEach((entry, idx) => {
    const snapshotEntry = lastSnapshot.cyclists.find(
      (c) => c.id === entry.cyclistId,
    );
    if (snapshotEntry) snapshotEntry.finishPosition = idx + 1;
  });

  // Dropped riders ranked by furthest position reached
  const dropped = race.cyclists
    .filter((c) => c.dynamic.isDropped)
    .sort((a, b) => b.dynamic.position - a.dynamic.position);

  dropped.forEach((c, idx) => {
    const snapshotEntry = lastSnapshot.cyclists.find((e) => e.id === c.id);
    if (snapshotEntry)
      snapshotEntry.finishPosition = finishOrder.length + 1 + idx;
  });

  // Riders who are still active but never crossed the line — rank by position
  const notFinishedActive = race.cyclists
    .filter((c) => !c.dynamic.isDropped && !finishedIds.has(c.id))
    .sort((a, b) => b.dynamic.position - a.dynamic.position);

  const afterDropped = finishOrder.length + dropped.length + 1;
  notFinishedActive.forEach((c, idx) => {
    const snapshotEntry = lastSnapshot.cyclists.find((e) => e.id === c.id);
    if (snapshotEntry) snapshotEntry.finishPosition = afterDropped + idx;
  });

  return race.snapshots;
}
