import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type SegmentInput } from '../api/client'

export function useAddSegments(raceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (segments: SegmentInput[]) => api.addSegments(raceId, segments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['race', raceId] })
    },
  })
}
