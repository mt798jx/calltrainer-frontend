export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  userGrowth: number;
  totalCalls: number;
  averageScore: number;
  callGrowth: number;
  topOperators: TopOperator[];
  organizationStats: OrganizationStat[];
  systemHealth: SystemHealth;
}

export interface TopOperator {
  rank: number;
  name: string;
  organization: string;
  score: number;
  calls: number;
}

export interface OrganizationStat {
  name: string;
  users: number;
  calls: number;
  score: number;
}

export interface SystemHealth {
  availability: number;
  completion: number;
  satisfaction: number;
}
