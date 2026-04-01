/** DTOs for the Race API endpoints. */

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

export class CreateRaceDto {
  name: string;
  totalDistance: number;
  segments: CreateSegmentDto[];
  teamIds: string[];
  cyclistIds: string[];
  seed?: number;
}

export class SimulateRaceDto {
  seed?: number;
}

export class CreateSimpleRaceDto {
  name: string;
  seasonId: string;
  status?: 'DRAFT' | 'OPEN';
}

export class AddSegmentItemDto {
  distance: number;
  type: 'flat' | 'climb' | 'descent';
  gradient: number;
}

export class AddSegmentsDto {
  segments: AddSegmentItemDto[];
}

export class RegisterForRaceEntryDto {
  cyclistId: string;
  isLeader: boolean;
  role: 'LEADER' | 'DOMESTIQUE' | 'SPRINTER' | 'CLIMBER' | 'ROULEUR';
}

export class RegisterForRaceDto {
  entries: RegisterForRaceEntryDto[];
}
