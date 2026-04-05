import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type RaceSummary } from '../api/client'

export function useOpenRace(raceId: string) {
  const queryClient = useQueryClient()
  return useMutation<RaceSummary, Error, void>({
    mutationFn: () => api.openRace(raceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['race', raceId] })
    },
  })
}
