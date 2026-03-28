import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

type CreateRaceGroupPayload = {
  name: string
  seasonId: string
  stages: { name: string }[]
}

type RaceGroupResult = {
  id: string
  name: string
  seasonId: string
  stageCount: number
}

export function useCreateRaceGroup() {
  const queryClient = useQueryClient()
  return useMutation<RaceGroupResult, Error, CreateRaceGroupPayload>({
    mutationFn: (data) => api.createRaceGroup(data),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: ['season', variables.seasonId] }),
  })
}
