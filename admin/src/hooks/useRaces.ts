import { useQuery } from '@tanstack/react-query'
import { api, type RaceSummary } from '../api/client'

export function useRaces() {
  return useQuery<RaceSummary[]>({
    queryKey: ['races'],
    queryFn: () => api.getRaces(),
    refetchInterval: 10_000,
  })
}
