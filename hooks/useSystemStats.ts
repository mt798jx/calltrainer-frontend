import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/lib/api";
import type { SystemStats } from "@/types/stats";

async function fetchSystemStats(): Promise<SystemStats> {
  return await statsApi.getSystemStats();
}

export function useSystemStats() {
  return useQuery<SystemStats, Error>({
    queryKey: ["systemStats"],
    queryFn: fetchSystemStats,
  });
}
