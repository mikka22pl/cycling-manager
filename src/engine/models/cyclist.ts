export type Intent =
  | 'SAVE_ENERGY'
  | 'FOLLOW_PELOTON'
  | 'CHASE'
  | 'ATTACK'
  | 'BREAKAWAY'
  | 'PROTECT_LEADER'
  | 'SPRINT_PREP'
  | 'SPRINT';

export type CyclistStats = {
  stamina: number;     // 0–100: endurance base
  performance: number; // 0–100: current form / power ceiling
  climbing: number;    // 0–100: uphill efficiency
  sprint: number;      // 0–100: short-burst speed
  vigilance: number;   // 0–100: reaction / positioning
  resistance: number;  // 0–100: crash/condition resilience
  recovery: number;    // 0–100: fatigue reduction ability
};

export type CyclistDynamic = {
  energy: number;      // 0–100
  fatigue: number;     // cumulative (unbounded – energy = stamina – fatigue)
  position: number;    // km from start
  speed: number;       // km/h
  groupId?: string;
  intent?: Intent;
  isDropped: boolean;
};

export type Cyclist = {
  id: string;
  name: string;
  nationality?: string;
  teamId: string;
  stats: CyclistStats;
  dynamic: CyclistDynamic;
};
