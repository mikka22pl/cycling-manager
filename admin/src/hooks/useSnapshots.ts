import { useQuery } from '@tanstack/react-query'
import { api, type Snapshot } from '../api/client'

export function useSnapshots(raceId: string, isRunning: boolean) {
  return useQuery<Snapshot[]>({
    queryKey: ['snapshots', raceId],
    queryFn: () => api.getSnapshots(raceId),
    refetchInterval: isRunning ? 10_000 : false,
  })
}
