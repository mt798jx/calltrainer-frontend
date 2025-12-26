import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api";

export function useTasksDashboard(operatorId: number | undefined) {
  return useQuery({
    queryKey: ["tasks", "dashboard", operatorId],
    queryFn: () => {
      if (!operatorId) {
        throw new Error("Operator ID is required");
      }
      return tasksApi.dashboard(operatorId);
    },
    enabled: !!operatorId,
  });
}

export function useStartTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      operatorId,
    }: {
      taskId: string;
      operatorId: number;
    }) => tasksApi.start(taskId, operatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
