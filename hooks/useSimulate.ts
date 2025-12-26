"use client";

import { useMutation } from "@tanstack/react-query";
import { simulateApi } from "@/lib/api";

/**
 * Hook na spustenie AI simulácie hovoru.
 * Volá /ai/simulate/start endpoint s parametrami task_id, operator_id, user_email a training.
 */
export function useStartSimulation() {
  return useMutation({
    mutationFn: (params: {
      task_id: string;
      operator_id: number;
      user_email: string;
      training: string;
      practice?: boolean;
      phone_number?: string;
    }) => simulateApi.start(params),
  });
}

/**
 * Hook na posielanie správ do AI simulácie.
 * Volá /ai/simulate/chat endpoint so session_id a správou operátora.
 */
export function useChatSimulation() {
  return useMutation({
    mutationFn: ({
      session_id,
      message,
    }: {
      session_id: string;
      message: string;
    }) => simulateApi.chat(session_id, message),
  });
}

/**
 * Hook na ukončenie AI simulácie hovoru.
 * Volá /ai/simulate/end endpoint, vyhodnotí skóre a vráti výsledok.
 */
export function useEndSimulation() {
  return useMutation({
    mutationFn: (session_id: string) => simulateApi.end(session_id),
  });
}
