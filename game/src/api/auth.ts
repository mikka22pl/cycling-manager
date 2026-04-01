import client from './client'

export interface AuthUser {
  id: string
  email: string
  name: string
  teamId: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  access_token: string
  user: AuthUser
}

export async function apiRegister(email: string, name: string, password: string): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>('/auth/register', { email, name, password })
  return res.data
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>('/auth/login', { email, password })
  return res.data
}
