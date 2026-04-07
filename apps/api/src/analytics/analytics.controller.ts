import { Controller, Get, Param, NotFoundException } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiOkResponse, ApiNotFoundResponse } from "@nestjs/swagger";

import { AnalyticsService, type CategoryDistribution, type DealStats } from "./analytics.service";

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({ summary: "Get applications distribution by category" })
  @ApiOkResponse({
    description: "Category distribution retrieved successfully",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          count: { type: "number" },
          percentage: { type: "number" },
        },
      },
    },
  })
  @Get("categories")
  getCategories(): CategoryDistribution[] {
    return this.analyticsService.getCategoriesDistribution();
  }

  @ApiOperation({ summary: "Get deal statistics by Bitrix24 deal ID" })
  @ApiOkResponse({
    description: "Deal stats retrieved successfully",
  })
  @ApiNotFoundResponse({ description: "Deal not found" })
  @Get("deal/:id")
  getDealStats(@Param("id") id: string): DealStats {
    const stats = this.analyticsService.getDealStats(id);

    if (!stats) {
      throw new NotFoundException("Deal not found");
    }

    return stats;
  }
}
