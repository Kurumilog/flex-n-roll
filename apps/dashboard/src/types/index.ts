export interface DashboardManager {
  id: number;
  name: string;
  lastName: string;
  department: string | null;
  kpiScore: number;
  isAvailable: boolean;
  dealsWon: number;
  dealsLost: number;
  avgResponseMinutes: number;
  activeDialogsCount: number;
  openTasksCount: number;
}

export interface DashboardSummary {
  managers: DashboardManager[];
  mailingStats: {
    total: number;
    sent: number;
    failed: number;
    responseReceived: number;
    responseRate: number;
  };
  totalEmployees: number;
  availableEmployees: number;
}

export interface OpenSession {
  id: string;
  USER_ID: number;
  MANAGER_NAME?: string;
  CHAT_ID: string;
  PROVIDER: string;
  START_DATE: string;
  LAST_MESSAGE?: string;
  WAITING_TIME?: number;
  WAITING_TIME_RAW?: string;
}

export interface BitrixTask {
  ID: string;
  TITLE: string;
  DESCRIPTION?: string;
  RESPONSIBLE_ID: string;
  DEADLINE?: string;
  STATUS: string;
  CREATED_DATE: string;
}

export interface FunnelStatus {
  statusId: string;
  name: string;
  count: number;
  percentage: number;
}

export interface RejectionReason {
  reason: string;
  count: number;
}

export interface KpiHistoryEntry {
  period: string;
  kpiScore: number;
  dealsWon: number;
  dealsLost: number;
}
