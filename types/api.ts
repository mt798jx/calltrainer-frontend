export interface UserResponse {
  id: number;
  email: string;
  created_at: string;
  first_name: string;
  last_name: string;
  organization?: string;
  phone?: string;
  profile_picture?: string;
  role: "ADMIN" | "OPERATOR";
  is_active: boolean;
  calls_count: number;
  score: number | null;
  is_2fa_enabled: boolean;
  require_2fa: boolean;
}

export interface ScenarioResponse {
  id: string;
  title: string;
  caller: string;
  age: number;
  duration: string;
  symptoms: string[];
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  status: "ACTIVE" | "INACTIVE";
  situation?: string;
  patient_state?: string;
  hidden_cause?: string;
  caller_behavior?: string;
  dispatcher_goal?: string;
  key_facts?: string;
  response_style?: string;
  description?: string;
  instructions?: string;
}

export interface CreateScenarioData {
  title: string;
  caller: string;
  age: number;
  duration: string;
  symptoms: string[];
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  status: "ACTIVE" | "INACTIVE";
  situation?: string;
  patient_state?: string;
  hidden_cause?: string;
  caller_behavior?: string;
  dispatcher_goal?: string;
  key_facts?: string;
  response_style?: string;
  description?: string;
  instructions?: string;
}

export interface UpdateScenarioData {
  title?: string;
  caller?: string;
  age?: number;
  duration?: string;
  symptoms?: string[];
  severity?: "CRITICAL" | "HIGH" | "MEDIUM";
  status?: "ACTIVE" | "INACTIVE";
  situation?: string;
  patient_state?: string;
  hidden_cause?: string;
  caller_behavior?: string;
  dispatcher_goal?: string;
  key_facts?: string;
  response_style?: string;
  description?: string;
  instructions?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  organization: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface TwoFactorRequiredResponse {
  detail: "2fa_required";
}

export type LoginResult = LoginResponse | TwoFactorRequiredResponse;

export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  scenarioId?: string;
  deadline?: string;
  operatorIds: number[];
  minScore: number;
  maxAttempts: number;
  status: "ACTIVE" | "COMPLETED" | "OVERDUE";
  progress: { completed: number; total: number };
}

export interface SystemSettingsResponse {
  system?: {
    system_name?: string;
    support_email?: string;
    max_session_duration?: number;
  };
  notifications?: {
    email_notifications?: boolean;
    weekly_reports?: boolean;
    performance_alerts?: boolean;
  };
  security?: {
    min_password_length?: number;
    session_timeout?: number;
    two_factor_auth?: boolean;
  };
  training?: {
    min_passing_score?: number;
    scenario_rotation?: boolean;
    auto_evaluation?: boolean;
  };
  email?: {
    smtp_server?: string;
    smtp_port?: number;
    username?: string;
    password?: string;
  };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  scenarioId?: string;
  deadline?: string;
  operatorIds: number[];
  minScore: number;
  maxAttempts: number;
}
