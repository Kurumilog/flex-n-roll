import { Injectable } from "@nestjs/common";

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface DealStats {
  dealId: string;
  totalAmount: number;
  stage: string;
  createdAt: string;
  closedAt?: string;
  probability: number;
}

@Injectable()
export class AnalyticsService {
  getCategoriesDistribution(): CategoryDistribution[] {
    return [
      { category: "commercial", count: 28, percentage: 60 },
      { category: "support", count: 12, percentage: 25 },
      { category: "technical", count: 7, percentage: 15 },
    ];
  }

  getDealStats(dealId: string): DealStats | null {
    // Mock deal stats
    const mockDeals: Record<string, DealStats> = {
      "BX-1001": {
        dealId: "BX-1001",
        totalAmount: 125000,
        stage: "PROPOSAL",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        probability: 75,
      },
      "BX-1002": {
        dealId: "BX-1002",
        totalAmount: 15000,
        stage: "NEGOTIATION",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        probability: 90,
      },
    };

    return mockDeals[dealId] ?? null;
  }
}
