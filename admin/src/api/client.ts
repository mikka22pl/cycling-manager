const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

// --- Domain types ---

export type RaceStatus = 'PENDING' | 'RUNNING' | 'FINISHED'
export type RaceType = 'SINGLE' | 'STAGE'
export type SegmentType = 'flat' | 'climb' | 'descent'
export type WindDirection = 'head' | 'tail' | 'cross'
export type Intent =
  | 'SAVE_ENERGY'
  | 'FOLLOW_PELOTON'
  | 'CHASE'
  | 'ATTACK'
  | 'BREAKAWAY'
  | 'PROTECT_LEADER'
  | 'SPRINT_PREP'
  | 'SPRINT'

export type RaceSummary = {
  id: string
  name: string
  status: RaceStatus
  totalDistance: number
  createdAt: string
  finishedAt?: string | null
}

export type Segment = {
  id: string
  startKm: number
  endKm: number
  type: SegmentType
  gradient: number
  windDirection?: WindDirection
  windStrength?: number
}

export type Race = RaceSummary & {
  seed?: number | null
  segments: Segment[]
}

export type CyclistSnapshot = {
  id: string
  name: string
  teamId: string
  teamName: string
  position: number
  speed: number
  energy: number
  intent: Intent
  groupId: string | null
  isDropped: boolean
}

export type Snapshot = {
  km: number
  cyclists: CyclistSnapshot[]
}

export type LeaderboardEntry = {
  rank: number
  id: string
  name: string
  teamId: string
  teamName: string
  position: number
  speed: number
  energy: number
  intent: Intent
  groupId: string | null
  isDropped: boolean
}

export type SegmentInput = {
  distance: number
  type: SegmentType
  gradient: number
}

export type SeasonSummary = {
  id: string
  year: number
  raceCount: number
  createdAt: string
}

export type SeasonWinner = {
  id: string
  name: string
  teamName: string
}

export type SeasonRace = {
  id: string
  name: string
  raceType: RaceType
  stageNumber: number | null
  raceGroupId: string | null
  raceGroupName: string | null
  status: RaceStatus
  winner: SeasonWinner | null
}

export type SeasonDetail = {
  id: string
  year: number
  createdAt: string
  races: SeasonRace[]
}

// --- API functions ---

export const api = {
  getRaces: () => get<RaceSummary[]>('/race'),
  getRace: (id: string) => get<Race>(`/race/${id}`),
  getSnapshots: (id: string) => get<Snapshot[]>(`/race/${id}/snapshots`),
  getSnapshotAt: (id: string, km: number) =>
    get<Snapshot>(`/race/${id}/snapshots/at?km=${km}`),
  getLeaderboard: (id: string) => get<LeaderboardEntry[]>(`/race/${id}/leaderboard`),

  getSeasons: () => get<SeasonSummary[]>('/season'),
  getSeason: (id: string) => get<SeasonDetail>(`/season/${id}`),
  createSeason: (body: { year: number }) => post<SeasonSummary>('/season', body),
  createRace: (body: { name: string; seasonId: string }) =>
    post<RaceSummary>('/race', body),
  createRaceGroup: (body: { name: string; seasonId: string; stages: { name: string }[] }) =>
    post<{ id: string; name: string; seasonId: string; stageCount: number }>('/race-group', body),
  addSegments: (raceId: string, segments: SegmentInput[]) =>
    post<Segment[]>(`/race/${raceId}/segments`, { segments }),
}
