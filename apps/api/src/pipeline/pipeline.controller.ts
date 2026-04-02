import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiOkResponse } from "@nestjs/swagger";

import { PipelineService, type PipelineStatus } from "./pipeline.service";

@ApiTags("pipeline")
@Controller("pipeline")
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @ApiOperation({ summary: "Get current pipeline processing status" })
  @ApiOkResponse({
    description: "Pipeline status retrieved successfully",
    type: Object,
  })
  @Get("status")
  getStatus(): PipelineStatus {
    return this.pipelineService.getPipelineStatus();
  }

  @ApiOperation({ summary: "Get pipeline processing history" })
  @ApiOkResponse({
    description: "Pipeline history retrieved successfully",
    schema: {
      type: "array",
      items: { $ref: "#/components/schemas/PipelineStatus" },
    },
  })
  @Get("history")
  getHistory(): PipelineStatus[] {
    return this.pipelineService.getPipelineHistory();
  }
}
