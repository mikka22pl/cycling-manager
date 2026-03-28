import { useQuery } from '@tanstack/react-query'
import { api, SeasonDetail } from '../api/client'

export function useSeason(id: string) {
  return useQuery<SeasonDetail>({
    queryKey: ['season', id],
    queryFn: () => api.getSeason(id),
    enabled: !!id,
  })
}
