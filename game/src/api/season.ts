import client from "./client";

export interface SeasonSummary {
  id: string;
  year: number;
  raceCount: number;
  createdAt: string;
}

export interface SeasonRace {
  id: string;
  name: string;
  raceType: "SINGLE" | "STAGE";
  totalDistance: number;
  stageNumber: number | null;
  raceGroupId: string | null;
  raceGroupName: string | null;
  status: "DRAFT" | "OPEN" | "PENDING" | "RUNNING" | "FINISHED";
  winner: { id: string; name: string; teamName: string } | null;
}

export interface SeasonDetail extends SeasonSummary {
  races: SeasonRace[];
}

export async function getCurrentSeason(): Promise<SeasonSummary | null> {
  const res = await client.get<SeasonSummary | null>("/season/current");
  return res.data;
}

export async function getSeasonDetail(id: string): Promise<SeasonDetail> {
  const res = await client.get<SeasonDetail>(`/season/${id}`);
  return res.data;
}
