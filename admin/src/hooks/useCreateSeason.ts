import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, SeasonSummary } from '../api/client'

export function useCreateSeason() {
  const queryClient = useQueryClient()
  return useMutation<SeasonSummary, Error, { year: number }>({
    mutationFn: (data) => api.createSeason(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seasons'] }),
  })
}
