import { useQuery } from '@tanstack/react-query'
import { api, type Race } from '../api/client'

export function useRace(id: string) {
  return useQuery<Race>({
    queryKey: ['race', id],
    queryFn: () => api.getRace(id),
  })
}
