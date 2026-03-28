export interface CreateTeamPayload {
  name: string
  townName: string
  managerName: string
  nationality: string
  numberOfRiders?: number
}

export interface TeamResponse {
  id: string
  name: string
  townName?: string
  managerName?: string
  nationality?: string
  riders: Array<{
    id: string
    name: string
    nationality?: string
    stats: Record<string, number>
  }>
}

export async function createTeam(payload: CreateTeamPayload): Promise<TeamResponse> {
  const res = await fetch('/api/team/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<TeamResponse>
}
