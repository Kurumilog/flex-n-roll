import type { DashboardSummary, OpenSession, BitrixTask, FunnelStatus, RejectionReason, KpiHistoryEntry } from '../types';

const API_BASE = '/api';

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'API returned success: false');
  return json.data as T;
}

async function postApi<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'API returned success: false');
  return json.data as T;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return fetchApi<DashboardSummary>('/dashboard/summary');
}

export async function getOpenSessions(): Promise<OpenSession[]> {
  return fetchApi<OpenSession[]>('/bitrix/open-sessions');
}

export async function getTasks(employeeId: number): Promise<BitrixTask[]> {
  return fetchApi<BitrixTask[]>(`/bitrix/tasks?employeeId=${employeeId}`);
}

export async function createTask(data: {
  title: string;
  description?: string;
  responsibleId: number;
  deadline?: string;
}): Promise<{ taskId: string }> {
  return postApi<{ taskId: string }>('/bitrix/tasks', data);
}

export async function getFunnel(): Promise<{ total: number; byStatus: FunnelStatus[] }> {
  return fetchApi('/analytics/funnel');
}

export async function getRejections(): Promise<RejectionReason[]> {
  return fetchApi('/analytics/rejections');
}

export async function getKpiHistory(employeeId: number): Promise<KpiHistoryEntry[]> {
  return fetchApi<KpiHistoryEntry[]>(`/kpi/${employeeId}/history`);
}
