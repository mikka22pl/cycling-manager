import { useQuery } from '@tanstack/react-query'
import { api, type Snapshot } from '../api/client'

export function useSnapshotAt(raceId: string, km: number | null) {
  return useQuery<Snapshot>({
    queryKey: ['snapshot', raceId, km],
    queryFn: () => api.getSnapshotAt(raceId, km!),
    enabled: km !== null,
  })
}
