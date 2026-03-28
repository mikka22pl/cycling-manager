import { useQuery } from '@tanstack/react-query'
import { api, type LeaderboardEntry } from '../api/client'

export function useLeaderboard(raceId: string, enabled: boolean) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', raceId],
    queryFn: () => api.getLeaderboard(raceId),
    enabled,
  })
}
