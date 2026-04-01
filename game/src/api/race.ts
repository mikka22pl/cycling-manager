import client from "./client";

export type RaceStatus = "DRAFT" | "OPEN" | "PENDING" | "RUNNING" | "FINISHED";
export type CyclistRole =
  | "LEADER"
  | "DOMESTIQUE"
  | "SPRINTER"
  | "CLIMBER"
  | "ROULEUR";

export interface RaceDetail {
  id: string;
  name: string;
  status: RaceStatus;
  totalDistance: number;
}

export interface RaceEntryResponse {
  id: string;
  cyclistId: string;
  isLeader: boolean;
  role: CyclistRole;
  cyclist: { id: string; name: string };
}

export interface RegisterEntryPayload {
  cyclistId: string;
  isLeader: boolean;
  role: CyclistRole;
}

export async function getRace(id: string): Promise<RaceDetail> {
  const res = await client.get<RaceDetail>(`/race/${id}`);
  return res.data;
}

export async function getMyRaceEntries(
  id: string,
  token: string,
): Promise<RaceEntryResponse[]> {
  const res = await client.get<RaceEntryResponse[]>(`/race/${id}/my-entries`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function registerForRace(
  id: string,
  entries: RegisterEntryPayload[],
  token: string,
): Promise<RaceEntryResponse[]> {
  const res = await client.post<RaceEntryResponse[]>(
    `/race/${id}/register`,
    { entries },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data;
}
