import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiOkResponse } from "@nestjs/swagger";

import { MetricsService, type TodayMetrics } from "./metrics.service";

@ApiTags("metrics")
@Controller("metrics")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @ApiOperation({ summary: "Get today's KPI metrics" })
  @ApiOkResponse({
    description: "Today's metrics retrieved successfully",
    schema: {
      type: "object",
      properties: {
        totalProcessed: { type: "number", example: 47 },
        aiConfidenceAvg: { type: "number", example: 88 },
        autoRouted: { type: "number", example: 39 },
        manualReview: { type: "number", example: 8 },
        slaCompliance: { type: "number", example: 94 },
      },
    },
  })
  @Get("today")
  getTodayMetrics(): TodayMetrics {
    return this.metricsService.getTodayMetrics();
  }
}
