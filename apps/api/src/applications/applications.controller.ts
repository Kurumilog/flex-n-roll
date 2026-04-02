import { Controller, Get, Post, Param, Query, Body } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiOkResponse, ApiBadRequestResponse } from "@nestjs/swagger";

import { ApplicationFiltersDto } from "./dto/application-filters.dto";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { ApplicationsService, type Application } from "./applications.service";

@ApiTags("applications")
@Controller("applications")
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @ApiOperation({ summary: "Get all applications with filters" })
  @ApiOkResponse({
    description: "List of applications retrieved successfully",
    schema: {
      type: "object",
      properties: {
        items: { type: "array", items: { $ref: "#/components/schemas/Application" } },
        total: { type: "number", example: 12 },
      },
    },
  })
  @ApiBadRequestResponse({ description: "Invalid filter parameters" })
  @Get()
  findAll(@Query() filters: ApplicationFiltersDto) {
    const result = this.applicationsService.findAll({
      intent: filters.intent,
      urgency: filters.urgency,
      status: filters.status,
      limit: filters.limit,
      offset: filters.offset,
    });

    return result;
  }

  @ApiOperation({ summary: "Get application by ID" })
  @ApiOkResponse({
    description: "Application found",
    type: Object,
  })
  @Get(":id")
  findOne(@Param("id") id: string) {
    const application = this.applicationsService.findOne(id);

    if (!application) {
      return { error: "Application not found" };
    }

    return application;
  }

  @ApiOperation({ summary: "Create new application (stub for n8n webhook)" })
  @Post()
  create(@Body() payload: CreateApplicationDto) {
    return this.applicationsService.create(payload);
  }
}
