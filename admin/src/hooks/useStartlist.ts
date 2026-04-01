import { useQuery } from "@tanstack/react-query";
import { api, type Startlist } from "../api/client";

export function useStartlist(raceId: string) {
  return useQuery<Startlist>({
    queryKey: ["startlist", raceId],
    queryFn: () => api.getStartlist(raceId),
  });
}
