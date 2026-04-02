import { Injectable } from "@nestjs/common";

export interface Escalation {
  id: string;
  applicationId: string;
  reason: "sla_breach" | "manual_escalation" | "complexity_high";
  escalatedAt: string;
  assignedTo: { id: string; name: string };
  originalManager: { id: string; name: string };
  status: "pending" | "resolved" | "in_progress";
}

@Injectable()
export class EscalationsService {
  getEscalations(): Escalation[] {
    return [
      {
        id: "esc-1",
        applicationId: "app-urgent-1",
        reason: "sla_breach",
        escalatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        assignedTo: { id: "sup-1", name: "Supervisor Anna" },
        originalManager: { id: "mgr-1", name: "Ivan Ivanov" },
        status: "in_progress",
      },
      {
        id: "esc-2",
        applicationId: "app-complex-1",
        reason: "complexity_high",
        escalatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        assignedTo: { id: "sup-1", name: "Supervisor Anna" },
        originalManager: { id: "mgr-2", name: "Bitrix Agent" },
        status: "pending",
      },
    ];
  }
}
