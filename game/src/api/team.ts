import client from './client'

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

export async function createTeam(payload: CreateTeamPayload, token: string): Promise<TeamResponse> {
  const res = await client.post<TeamResponse>('/team/generate', payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export async function getMyTeam(token: string): Promise<TeamResponse | null> {
  try {
    const res = await client.get<TeamResponse>('/team/my', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  } catch (err: any) {
    if (err?.response?.status === 404) return null
    throw err
  }
}
