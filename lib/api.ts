import type {
  CreateScenarioData,
  CreateTaskData,
  ScenarioResponse,
  SystemSettingsResponse,
  SystemStats,
  TaskResponse,
  UpdateScenarioData,
  UserResponse,
} from "../types";

const BASE_URL = process.env.NEXT_PUBLIC_GATEWAY_URL;

export async function apiGet<T>(path: string): Promise<T> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error(`API GET ${path} failed with ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, data: unknown): Promise<T> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      error.detail || `API POST ${path} failed with ${res.status}`,
    );
  }
  return res.json();
}

export async function apiPut<T>(path: string, data: unknown): Promise<T> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API PUT ${path} failed with ${res.status}`);
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error(`API DELETE ${path} failed with ${res.status}`);
}

export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiPost<{ access_token?: string; token_type?: string; detail?: string }>(
      "/api/auth/login",
      data,
    ),
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    organization: string;
  }) => apiPost<UserResponse>("/api/auth/register", data),

  verify2fa: async (payload: { email: string; code: string }) => {
    return apiPost<{ access_token: string; token_type: string }>(
      "/api/auth/verify-2fa",
      payload,
    );
  },

  resend2fa: (email: string) =>
    apiPost<{ message?: string }>("/api/auth/resend-2fa", { email }),

  me: () => apiGet<UserResponse>("/api/auth/me"),

  requestPasswordReset: (email: string) =>
    apiPost<{ message: string }>("/api/auth/forgot_password", { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiPost<{ message: string }>("/api/auth/reset_password", {
      token,
      new_password: newPassword,
    }),

  validateResetToken: (token: string) =>
    apiPost<{ valid: boolean; message?: string }>(
      "/api/auth/validate-reset-token",
      { token },
    ),
};

export const usersApi = {
  list: () => apiGet<UserResponse[]>("/users/overview"),
  create: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    organization: string;
    phone?: string;
    role: "OPERATOR" | "ADMIN";
  }) => apiPost<UserResponse>("/api/users", data),
  update: (
    userId: number,
    data: {
      first_name?: string;
      last_name?: string;
      email?: string;
      organization?: string;
      phone?: string;
      role?: "OPERATOR" | "ADMIN";
      is_active?: boolean;
      is_2fa_enabled?: boolean;
      require_2fa?: boolean;
    },
  ) => apiPut<UserResponse>(`/api/users/${userId}`, data),
  delete: (userId: number) => apiDelete(`/api/users/${userId}`),
  approve: (userId: number) =>
    apiPut<UserResponse>(`/api/users/${userId}/approve`, {}),
  reject: (userId: number) => apiDelete(`/api/users/${userId}`),
  deactivate: (userId: number) =>
    apiPut<UserResponse>(`/api/users/${userId}/deactivate`, {}),
  changePassword: (
    userId: number,
    data: { current_password?: string; new_password: string },
  ) =>
    apiPost<{ message: string }>(`/api/users/${userId}/change-password`, data),
  toggle2fa: (userId: number, data: { enable: boolean }) =>
    apiPost<UserResponse>(`/api/users/${userId}/2fa`, data),
  uploadProfilePicture: (userId: number, profilePicture: string) =>
    apiPost<UserResponse>(`/api/users/${userId}/profile-picture`, {
      profile_picture: profilePicture,
    }),
};

export const scenariosApi = {
  list: () => apiGet<ScenarioResponse[]>("/ai/scenarios"),
  get: (scenarioId: string) =>
    apiGet<ScenarioResponse>(`/ai/scenarios/${scenarioId}`),
  create: (data: CreateScenarioData) =>
    apiPost<ScenarioResponse>("/ai/scenarios/create", data),
  update: (scenarioId: string, data: UpdateScenarioData) =>
    apiPut<ScenarioResponse>(`/ai/scenarios/${scenarioId}`, data),
  delete: (scenarioId: string) => apiDelete(`/ai/scenarios/${scenarioId}`),
};

export const tasksApi = {
  list: () => apiGet<TaskResponse[]>("/ai/tasks"),
  dashboard: (operatorId: number) =>
    apiGet<{
      stats: {
        pending: number;
        completed: number;
        successRate: string;
      };
      tasks: Array<{
        id: string;
        title: string;
        status: "pending" | "progress" | "completed";
        statusLabel: string;
        statusText?: string;
        description?: string;
        deadline?: string;
        daysLeft?: number;
        minScore?: number;
        currentScore?: number;
        completedDate?: string;
        score?: number;
        attempts: {
          current: number;
          total: number;
          remaining: number;
        };
        buttonLabel?: string;
      }>;
    }>(`/ai/tasks/dashboard?operator_id=${operatorId}`),
  create: (data: CreateTaskData) =>
    apiPost<TaskResponse>("/ai/tasks/create", data),
  update: (taskId: string, data: Partial<CreateTaskData>) =>
    apiPut<TaskResponse>(`/ai/tasks/${taskId}`, data),
  delete: (taskId: string) => apiDelete(`/ai/tasks/${taskId}`),
  start: (taskId: string, operatorId: number) =>
    apiPost<{
      mode: "new" | "resume";
      attempt_id: string;
      scenario_title: string;
    }>(`/ai/tasks/${taskId}/start?operator_id=${operatorId}`, {}),
};

// API funkcie pre AI simuláciu hovorov
export const simulateApi = {
  /**
   * Spustí novú AI simuláciu alebo obnoví existujúcu.
   * Vytvorí attempt v MongoDB a inicializuje AI reťazec.
   */
  start: (params: {
    task_id: string;
    operator_id: number;
    user_email: string;
    training: string;
    practice?: boolean;
    phone_number?: string;
  }) =>
    apiPost<{
      session_id: string;
      attempt_id: string;
      task_id: string;
      attempt_number: number;
      training: string;
      dialogue: Array<{
        role: string;
        message: string;
        timestamp: string;
      }>;
      mode: "resume" | "new";
      call_sid?: string;
    }>(
      `/ai/simulate/start?task_id=${params.task_id}&operator_id=${params.operator_id}&user_email=${encodeURIComponent(params.user_email)}&training=${encodeURIComponent(params.training)}&practice=${params.practice || false}${params.phone_number ? `&phone_number=${encodeURIComponent(params.phone_number)}` : ""}`,
      {},
    ),
  /**
   * Pošle správu operátora do AI a dostane odpoveď volajúceho.
   * Uloží dialóg do MongoDB session aj attempt.
   */
  chat: (session_id: string, message: string) =>
    apiPost<{
      reply: string;
      session_id: string;
      attempt_id: string;
      dialogue_append: Array<{
        role: string;
        message: string;
        timestamp: string;
      }>;
    }>(
      `/ai/simulate/chat?session_id=${encodeURIComponent(session_id)}&message=${encodeURIComponent(message)}`,
      {},
    ),
  /**
   * Appends a message to the session dialogue without triggering LLM.
   */
  appendMessage: (session_id: string, role: string, content: string) =>
    apiPost<{
      status: string;
      appended: { role: string; message: string; timestamp: string };
    }>(`/ai/simulate/append_message`, {
      session_id,
      role,
      content,
    }),
  /**
   * Ukončí simuláciu, automaticky vyhodnotí dialóg pomocou LLM
   * a vráti skóre a status (completed/failed).
   */
  end: (session_id: string) =>
    apiPost<{
      session_id: string;
      attempt_id: string;
      score: number;
      status: "completed" | "failed";
      evaluation: unknown;
    }>(`/ai/simulate/end?session_id=${encodeURIComponent(session_id)}`, {}),
  updateForm: (session_id: string, form: unknown) =>
    apiPost<{ ok: boolean; form: unknown }>(
      `/ai/simulate/form?session_id=${encodeURIComponent(session_id)}`,
      form,
    ),
};

export const historyApi = {
  list: (operatorId: number) =>
    apiGet<{
      stats: {
        totalCalls: number;
        averageScore: number;
        lastCallDate: string | null;
      };
      calls: Array<{
        id: string;
        name: string;
        severity: "critical" | "high" | "medium";
        date: string;
        time: string;
        duration: string;
        score: number;
        operator_id: number;
        scenario_id?: string;
        task_id?: string;
        attempt_id?: string;
        created_at?: string;
      }>;
    }>(`/ai/history?operator_id=${operatorId}`),
};

export const statsApi = {
  getSystemStats: () => apiGet<SystemStats>("/stats/system"),
  getSkills: (operatorId: number) =>
    apiGet<
      Array<{
        id: string;
        name: string;
        current: number;
        target: number;
      }>
    >(`/ai/stats/skills?operator_id=${operatorId}`),
  getSummary: (operatorId: number) =>
    apiGet<{
      totalCalls: number;
      averageScore: number;
      averageTime: string;
      bestScore: number;
    }>(`/ai/stats/summary?operator_id=${operatorId}`),
};

export const settingsApi = {
  get: () => apiGet<SystemSettingsResponse>("/api/settings"),
  update: (data: unknown) => apiPut<{ message: string }>("/api/settings", data),
  testEmail: () => apiPost<{ message: string }>("/api/settings/test-email", {}),
  clearData: () => apiPost<{ message: string }>("/admin/clear-all", {}),
  reset: () =>
    apiPost<{ message: string; settings?: SystemSettingsResponse }>(
      "/api/settings/reset",
      {},
    ),
};
