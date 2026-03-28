import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, RaceSummary } from '../api/client'

type CreateRacePayload = { name: string; seasonId: string }

export function useCreateRace() {
  const queryClient = useQueryClient()
  return useMutation<RaceSummary, Error, CreateRacePayload>({
    mutationFn: (data) => api.createRace(data),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: ['season', variables.seasonId] }),
  })
}
