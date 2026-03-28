/** DTOs for the Season API endpoints. */

export class CreateSeasonDto {
  year: number;
}

export type SeasonSummary = {
  id: string;
  year: number;
  raceCount: number;
  createdAt: Date;
};

export type WinnerDto = {
  id: string;
  name: string;
  teamName: string;
};

export type SeasonRaceDto = {
  id: string;
  name: string;
  raceType: 'SINGLE' | 'STAGE';
  stageNumber: number | null;
  raceGroupId: string | null;
  raceGroupName: string | null;
  status: 'PENDING' | 'RUNNING' | 'FINISHED';
  winner: WinnerDto | null;
};

export type SeasonDetailDto = {
  id: string;
  year: number;
  createdAt: Date;
  races: SeasonRaceDto[];
};
