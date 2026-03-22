import { Race, RaceSnapshot } from '../models/race';
import { Cyclist } from '../models/cyclist';
import { Segment } from '../models/segment';
import { resolveStepDistance } from './stepResolver';
import { computeSpeed } from '../services/speed.service';
import { computeFatigueUpdate } from '../services/fatigue.service';
import { resolveGroups } from '../services/group.service';
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
function buildSnapshot(km: number, cyclists: Cyclist[]): RaceSnapshot {
  return {
    km,
    cyclists: cyclists.map((c) => ({
      id: c.id,
      name: c.name,
      teamId: c.teamId,
      position: parseFloat(c.dynamic.position.toFixed(3)),
      speed: parseFloat(c.dynamic.speed.toFixed(2)),
      energy: parseFloat(c.dynamic.energy.toFixed(1)),
      intent: c.dynamic.intent,
      groupId: c.dynamic.groupId,
      isDropped: c.dynamic.isDropped,
    })),
  };
}

/**
 * Runs the full race simulation and returns the array of snapshots.
 * Mutates race.cyclists and appends to race.snapshots.
 */
export function runSimulation(race: Race): RaceSnapshot[] {
  const rng: SeededRandom = createRng(race.seed);
  let currentKm = 0;

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

  // Build team lookup
  const teamMap = new Map(race.teams.map((t) => [t.id, t]));

  while (currentKm < race.totalDistance) {
    const remainingKm = race.totalDistance - currentKm;
    const stepKm = resolveStepDistance(remainingKm);

    const segment = getSegmentAt(race.segments, currentKm);

    // --- Per-cyclist: decide effort → compute speed & fatigue ---
    for (const cyclist of race.cyclists) {
      if (cyclist.dynamic.isDropped) continue;

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
        sprintAdjustedEffort = Math.min(1.2, effort + sprintBoost);
      }

      // Compute group size for drafting (use previous step's groups)
      const groupSize = race.cyclists.filter(
        (c) =>
          !c.dynamic.isDropped && c.dynamic.groupId === cyclist.dynamic.groupId,
      ).length;

      const speed = computeSpeed(
        cyclist,
        segment,
        Math.max(1, groupSize),
        sprintAdjustedEffort,
        rng,
      );

      const { fatigue, energy } = computeFatigueUpdate(
        cyclist,
        sprintAdjustedEffort,
        segment,
        rng,
      );

      cyclist.dynamic.speed = speed;
      cyclist.dynamic.fatigue = fatigue;
      cyclist.dynamic.energy = energy;

      // Advance position by step distance (all active riders cover the step)
      cyclist.dynamic.position = parseFloat((currentKm + stepKm).toFixed(3));
      // cyclist.dynamic.position +=
      // cyclist.dynamic.speed * (stepKm / cyclist.dynamic.speed);

      // Logger.log('cyclist position ' + cyclist.dynamic.position);
      // Mark as dropped if energy completely depleted
      if (energy <= 0) {
        cyclist.dynamic.isDropped = true;
      }
    }

    // --- Resolve groups ---
    resolveGroups(race.cyclists.filter((c) => !c.dynamic.isDropped));

    // --- Save snapshot ---
    const snapshotKm = currentKm + stepKm;
    const snapshot = buildSnapshot(snapshotKm, race.cyclists);
    race.snapshots.push(snapshot);

    currentKm += stepKm;
  }

  // --- Final sprint tiebreaker ---
  const finishers = race.cyclists.filter((c) => !c.dynamic.isDropped);
  const dropped = race.cyclists.filter((c) => c.dynamic.isDropped);

  // Score: 50% sprint stat, 30% remaining energy, 20% seeded randomness
  const scored = finishers
    .map((c) => ({
      id: c.id,
      score:
        (c.stats.sprint / 100) * 0.5 +
        (c.dynamic.energy / 100) * 0.3 +
        rng.range(0, 0.2),
    }))
    .sort((a, b) => b.score - a.score);

  const lastSnapshot = race.snapshots[race.snapshots.length - 1];
  scored.forEach((s, idx) => {
    const entry = lastSnapshot.cyclists.find((c) => c.id === s.id);
    if (entry) entry.finishPosition = idx + 1;
  });
  dropped.forEach((c, idx) => {
    const entry = lastSnapshot.cyclists.find((e) => e.id === c.id);
    if (entry) entry.finishPosition = finishers.length + 1 + idx;
  });

  return race.snapshots;
}
