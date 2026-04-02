import { Injectable } from "@nestjs/common";

export interface PipelineStep {
  id: string;
  label: string;
  status: "idle" | "active" | "done" | "error";
  duration?: number; // ms
}

export interface PipelineStatus {
  steps: PipelineStep[];
}

@Injectable()
export class PipelineService {
  getPipelineStatus(): PipelineStatus {
    return {
      steps: [
        { id: "1", label: "Webhook Received", status: "done", duration: 12 },
        { id: "2", label: "AI Parsing", status: "done", duration: 245 },
        { id: "3", label: "Intent Classification", status: "done", duration: 89 },
        { id: "4", label: "Urgency Detection", status: "done", duration: 67 },
        { id: "5", label: "Manager Assignment", status: "active", duration: 156 },
        { id: "6", label: "Bitrix24 Sync", status: "idle" },
        { id: "7", label: "Notification Sent", status: "idle" },
      ],
    };
  }

  getPipelineHistory(): PipelineStatus[] {
    // Mock history - last 5 processed applications
    return Array(5)
      .fill(null)
      .map((_, i) => ({
        steps: [
          { id: "1", label: "Webhook Received", status: "done", duration: 10 + i * 2 },
          { id: "2", label: "AI Parsing", status: "done", duration: 200 + i * 10 },
          { id: "3", label: "Intent Classification", status: "done", duration: 80 + i * 5 },
          { id: "4", label: "Urgency Detection", status: "done", duration: 60 + i * 3 },
          { id: "5", label: "Manager Assignment", status: "done", duration: 140 + i * 8 },
          { id: "6", label: "Bitrix24 Sync", status: "done", duration: 95 + i * 4 },
          { id: "7", label: "Notification Sent", status: "done", duration: 23 + i * 2 },
        ],
      }));
  }
}
