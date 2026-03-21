import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';
import { SeededRandom, createRng } from './random';
import { Cyclist, CyclistStats, CyclistDynamic } from '../models/cyclist';
import { TeamWithRiders } from '../models/team';

export interface GenerateTeamOptions {
  name?: string;
  seed?: number;
}

type StatRanges = {
  [K in keyof CyclistStats]: [number, number];
};

type Archetype =
  | 'GC_LEADER'
  | 'LIEUTENANT'
  | 'CLIMBER'
  | 'SPRINTER'
  | 'LEAD_OUT'
  | 'DOMESTIQUE';

const ARCHETYPE_RANGES: Record<Archetype, StatRanges> = {
  GC_LEADER: {
    stamina:     [82, 92],
    performance: [80, 90],
    climbing:    [78, 90],
    sprint:      [50, 70],
    vigilance:   [72, 85],
    resistance:  [68, 80],
    recovery:    [75, 88],
  },
  LIEUTENANT: {
    stamina:     [74, 86],
    performance: [72, 84],
    climbing:    [65, 80],
    sprint:      [55, 72],
    vigilance:   [65, 80],
    resistance:  [65, 78],
    recovery:    [68, 80],
  },
  CLIMBER: {
    stamina:     [72, 84],
    performance: [65, 80],
    climbing:    [80, 95],
    sprint:      [30, 50],
    vigilance:   [55, 70],
    resistance:  [55, 72],
    recovery:    [70, 84],
  },
  SPRINTER: {
    stamina:     [65, 78],
    performance: [72, 85],
    climbing:    [30, 50],
    sprint:      [85, 100],
    vigilance:   [65, 80],
    resistance:  [60, 75],
    recovery:    [60, 75],
  },
  LEAD_OUT: {
    stamina:     [70, 82],
    performance: [65, 78],
    climbing:    [40, 58],
    sprint:      [68, 82],
    vigilance:   [78, 92],
    resistance:  [65, 78],
    recovery:    [62, 76],
  },
  DOMESTIQUE: {
    stamina:     [65, 78],
    performance: [58, 72],
    climbing:    [50, 68],
    sprint:      [45, 62],
    vigilance:   [55, 70],
    resistance:  [62, 78],
    recovery:    [60, 74],
  },
};

/** Box-Muller transform — Gaussian age, mean=27, std=4, clamped [18, 40]. */
function gaussianAge(rng: SeededRandom): number {
  const u1 = Math.max(rng.next(), 1e-10);
  const u2 = rng.next();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return Math.round(Math.min(40, Math.max(18, 27 + z0 * 4)));
}

/** Scales a stat by an age-based multiplier and clamps to [30, 100]. */
function applyAgeModifier(stat: number, age: number): number {
  let mult: number;
  if (age <= 21) mult = 0.93;
  else if (age <= 25) mult = 0.97;
  else if (age <= 30) mult = 1.0;
  else if (age <= 33) mult = 0.99;
  else if (age <= 36) mult = 0.96;
  else mult = 0.92;
  return Math.floor(Math.min(100, Math.max(30, stat * mult)));
}

function rollStats(rng: SeededRandom, ranges: StatRanges): CyclistStats {
  return {
    stamina:     Math.floor(rng.range(ranges.stamina[0],     ranges.stamina[1])),
    performance: Math.floor(rng.range(ranges.performance[0], ranges.performance[1])),
    climbing:    Math.floor(rng.range(ranges.climbing[0],    ranges.climbing[1])),
    sprint:      Math.floor(rng.range(ranges.sprint[0],      ranges.sprint[1])),
    vigilance:   Math.floor(rng.range(ranges.vigilance[0],   ranges.vigilance[1])),
    resistance:  Math.floor(rng.range(ranges.resistance[0],  ranges.resistance[1])),
    recovery:    Math.floor(rng.range(ranges.recovery[0],    ranges.recovery[1])),
  };
}

function makeInitialDynamic(stamina: number): CyclistDynamic {
  return {
    energy: stamina,
    fatigue: 0,
    position: 0,
    speed: 0,
    isDropped: false,
  };
}

function makeCyclist(
  rng: SeededRandom,
  archetype: Archetype,
  teamId: string,
): Cyclist {
  const age = gaussianAge(rng);
  const raw = rollStats(rng, ARCHETYPE_RANGES[archetype]);
  const stats: CyclistStats = {
    stamina:     applyAgeModifier(raw.stamina,     age),
    performance: applyAgeModifier(raw.performance, age),
    climbing:    applyAgeModifier(raw.climbing,    age),
    sprint:      applyAgeModifier(raw.sprint,      age),
    vigilance:   applyAgeModifier(raw.vigilance,   age),
    resistance:  applyAgeModifier(raw.resistance,  age),
    recovery:    applyAgeModifier(raw.recovery,    age),
  };
  return {
    id: uuidv4(),
    name: faker.person.fullName({ sex: 'male' }),
    teamId,
    stats,
    dynamic: makeInitialDynamic(stats.stamina),
  };
}

/**
 * Generates a fully-formed 9-rider team with realistic archetype distribution:
 * 1 GC Leader, 1 Lieutenant, 2 Climbers, 1 Sprinter, 1 Lead-out, 3 Domestiques.
 */
export function generateTeam(options: GenerateTeamOptions = {}): TeamWithRiders {
  const rng = createRng(options.seed);
  const teamId = uuidv4();
  const teamName = options.name ?? faker.company.name();

  const archetypes: Archetype[] = [
    'GC_LEADER',
    'LIEUTENANT',
    'CLIMBER',
    'CLIMBER',
    'SPRINTER',
    'LEAD_OUT',
    'DOMESTIQUE',
    'DOMESTIQUE',
    'DOMESTIQUE',
  ];

  const riders = archetypes.map((archetype) => makeCyclist(rng, archetype, teamId));

  return {
    id: teamId,
    name: teamName,
    leaderId: riders[0].id,
    domestiqueIds: riders.slice(6).map((r) => r.id),
    strategy: 'GENERAL_CLASSIFICATION',
    riders,
  };
}
