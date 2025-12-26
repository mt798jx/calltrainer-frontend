"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { scenariosApi } from "@/lib/api";
import type {
  CreateScenarioData,
  ScenarioResponse,
  UpdateScenarioData,
} from "@/types";

export function useScenarios() {
  return useQuery<ScenarioResponse[]>({
    queryKey: ["scenarios"],
    queryFn: () => scenariosApi.list(),
  });
}

export function useScenario(scenarioId: string) {
  return useQuery<ScenarioResponse>({
    queryKey: ["scenarios", scenarioId],
    queryFn: () => scenariosApi.get(scenarioId),
    enabled: !!scenarioId,
  });
}

export function useCreateScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateScenarioData) => scenariosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });
}

export function useUpdateScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scenarioId,
      data,
    }: {
      scenarioId: string;
      data: UpdateScenarioData;
    }) => scenariosApi.update(scenarioId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });
}

export function useDeleteScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scenarioId: string) => scenariosApi.delete(scenarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });
}
