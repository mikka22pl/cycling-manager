import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type RaceSummary } from '../api/client'

export function useSimulateRace(raceId: string) {
  const queryClient = useQueryClient()
  return useMutation<RaceSummary, Error, void>({
    mutationFn: () => api.simulateRace(raceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['race', raceId] })
    },
  })
}
