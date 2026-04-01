import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type RaceSummary } from '../api/client'

export function useCloseStartlist(raceId: string) {
  const queryClient = useQueryClient()
  return useMutation<RaceSummary, Error, void>({
    mutationFn: () => api.closeStartlist(raceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['race', raceId] })
      queryClient.invalidateQueries({ queryKey: ['startlist', raceId] })
    },
  })
}
