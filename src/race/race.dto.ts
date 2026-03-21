/** DTOs for the Race API endpoints. */

export class CyclistStatsDto {
  stamina: number;
  performance: number;
  climbing: number;
  sprint: number;
  vigilance: number;
  resistance: number;
  recovery: number;
}

export class CreateCyclistDto {
  id: string;
  name: string;
  teamId: string;
  stats: CyclistStatsDto;
}

export class WindDto {
  direction: 'head' | 'tail' | 'cross';
  strength: number;
}

export class CreateSegmentDto {
  startKm: number;
  endKm: number;
  type: 'flat' | 'climb' | 'descent';
  gradient: number;
  wind?: WindDto;
}

export class CreateTeamDto {
  id: string;
  name: string;
  leaderId: string;
  domestiqueIds: string[];
  strategy: 'GENERAL_CLASSIFICATION' | 'SPRINT_STAGE' | 'BREAKAWAY' | 'BALANCED';
}

export class CreateRaceDto {
  name: string;
  totalDistance: number;
  segments: CreateSegmentDto[];
  teams: CreateTeamDto[];
  cyclists: CreateCyclistDto[];
  seed?: number;
}

export class SimulateRaceDto {
  seed?: number;
}
