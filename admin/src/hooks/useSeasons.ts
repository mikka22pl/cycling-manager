import { useQuery } from '@tanstack/react-query'
import { api, SeasonSummary } from '../api/client'

export function useSeasons() {
  return useQuery<SeasonSummary[]>({
    queryKey: ['seasons'],
    queryFn: () => api.getSeasons(),
  })
}
