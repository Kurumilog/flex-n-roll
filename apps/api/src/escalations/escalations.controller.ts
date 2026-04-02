import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiOkResponse } from "@nestjs/swagger";

import { EscalationsService, type Escalation } from "./escalations.service";

@ApiTags("escalations")
@Controller("escalations")
export class EscalationsController {
  constructor(private readonly escalationsService: EscalationsService) {}

  @ApiOperation({ summary: "Get SLA escalations list" })
  @ApiOkResponse({
    description: "Escalations retrieved successfully",
    schema: {
      type: "array",
      items: { $ref: "#/components/schemas/Escalation" },
    },
  })
  @Get()
  getEscalations(): Escalation[] {
    return this.escalationsService.getEscalations();
  }
}
