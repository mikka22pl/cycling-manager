import { Cyclist, Intent } from '../models/cyclist';
import { Team } from '../models/team';
import { SeededRandom } from '../utils/random';

const INTENT_EFFORT: Record<Intent, number> = {
  SAVE_ENERGY: 0.7,
  FOLLOW_PELOTON: 0.85,
  CHASE: 1.05,
  ATTACK: 1.15,
  BREAKAWAY: 1.05,
  PROTECT_LEADER: 0.95,
  SPRINT_PREP: 1.0,
  SPRINT: 1.2,
};

export type EffortDecision = { intent: Intent; effort: number };

/**
 * Determines intent and effort for a single cyclist.
 * Pure function – does not mutate cyclist.
 */
export function decideEffort(
  cyclist: Cyclist,
  allCyclists: Cyclist[],
  team: Team,
  remainingKm: number,
  rng: SeededRandom,
): EffortDecision {
  const { performance, vigilance, resistance, recovery, sprint } =
    cyclist.stats;
  const { energy, groupId } = cyclist.dynamic;

  // ---- Race phase ----
  const racePhase: number = remainingKm > 50 ? 0 : remainingKm > 10 ? 0.2 : 0.5;

  // ---- Situation pressure (higher when behind) ----
  const sortedByPos = [...allCyclists].sort(
    (a, b) => b.dynamic.position - a.dynamic.position,
  );
  const rank = sortedByPos.findIndex((c) => c.id === cyclist.id);
  const positionPercentile = rank / Math.max(1, allCyclists.length - 1);
  const situationPressure = (1 - positionPercentile) * (vigilance / 100);

  // ---- Group context ----
  const inBreakaway =
    groupId !== undefined &&
    !allCyclists.some(
      (c) =>
        c.dynamic.groupId !== groupId &&
        c.dynamic.position > cyclist.dynamic.position - 0.1,
    );
  const groupContext = inBreakaway ? 0.2 : 0;

  // ---- Energy state ----
  const energyState = energy / 100 - 0.5;

  // ---- Personality ----
  const personality =
    0.4 * (performance / 100) +
    0.3 * (resistance / 100) +
    0.3 * (vigilance / 100);

  // ---- Decision score ----
  const decisionScore =
    0.25 * situationPressure +
    0.2 * groupContext +
    0.25 * energyState +
    0.15 * racePhase +
    0.15 * personality;

  // ---- Determine intent ----
  let intent: Intent = 'FOLLOW_PELOTON';
  const isLeader = cyclist.id === team.leaderId;

  if (remainingKm < 3) {
    intent = 'SPRINT';
  } else if (remainingKm < 10) {
    intent = sprint > 70 && energy > 60 ? 'SPRINT_PREP' : 'FOLLOW_PELOTON';
  } else if (isLeader && team.strategy === 'GENERAL_CLASSIFICATION') {
    intent = energy < 40 ? 'SAVE_ENERGY' : 'PROTECT_LEADER';
  } else if (inBreakaway) {
    intent = 'BREAKAWAY';
  } else if (
    team.strategy === 'BREAKAWAY' &&
    energy > 60 &&
    remainingKm > 10 &&
    rng.next() < 0.15
  ) {
    intent = 'ATTACK';
  } else if (energy < 30) {
    intent = 'SAVE_ENERGY';
  }

  // ---- Compute effort ----
  let effort = INTENT_EFFORT[intent];

  // Mental decision modulator (±5%)
  const mentalModifier = decisionScore * 0.1;
  effort = clamp(effort + mentalModifier + rng.range(-0.05, 0.05), 0.6, 1.2);

  // Archetype adjustments
  const isAggressive = performance + vigilance > 140;
  const isConservative = recovery + resistance > 140;
  if (isAggressive) effort = clamp(effort + 0.05, 0.6, 1.2);
  if (isConservative) effort = clamp(effort - 0.05, 0.6, 1.2);

  // Unsustainable effort if energy is very low
  if (energy < 15) effort = clamp(effort, 0.6, 0.75);

  return { intent, effort };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
