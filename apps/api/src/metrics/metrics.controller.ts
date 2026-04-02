import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiOkResponse } from "@nestjs/swagger";

import { MetricsService, type TodayMetrics } from "./metrics.service";

@ApiTags("metrics")
@Controller("metrics")
export class MetricsController {
  private readonly metricsService = new MetricsService();

  @ApiOperation({ summary: "Get today's KPI metrics" })
  @ApiOkResponse({
    description: "Today's metrics retrieved successfully",
    type: Object,
  })
  @Get("today")
  getTodayMetrics(): TodayMetrics {
    return this.metricsService.getTodayMetrics();
  }
}
