/** DTOs for the RaceGroup API endpoints. */

export class StageDto {
  name: string;
}

export class CreateRaceGroupDto {
  name: string;
  seasonId: string;
  stages: StageDto[];
  status?: 'DRAFT' | 'OPEN';
}

export type RaceGroupResult = {
  id: string;
  name: string;
  seasonId: string;
  createdAt: Date;
  stageCount: number;
};
