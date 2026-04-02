import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

import { ApplicationIntent, ApplicationUrgency, ApplicationStatus } from "./create-application.dto";

export class ApplicationFiltersDto {
  @ApiPropertyOptional({ enum: ApplicationIntent })
  @IsOptional()
  @IsEnum(ApplicationIntent)
  intent?: ApplicationIntent;

  @ApiPropertyOptional({ enum: ApplicationUrgency })
  @IsOptional()
  @IsEnum(ApplicationUrgency)
  urgency?: ApplicationUrgency;

  @ApiPropertyOptional({ enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ example: 10, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
