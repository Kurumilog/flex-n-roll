import { Injectable } from "@nestjs/common";

export interface TodayMetrics {
  totalProcessed: number;
  aiConfidenceAvg: number;
  autoRouted: number;
  manualReview: number;
  slaCompliance: number;
}

@Injectable()
export class MetricsService {
  getTodayMetrics(): TodayMetrics {
    // Mock data - later will calculate from real applications
    return {
      totalProcessed: 47,
      aiConfidenceAvg: 88,
      autoRouted: 39,
      manualReview: 8,
      slaCompliance: 94,
    };
  }
}
