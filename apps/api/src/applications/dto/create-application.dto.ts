import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsString, IsOptional, IsUrl, MinLength, IsUUID, IsNumber, Min, Max, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export enum ApplicationSource {
  EMAIL = "email",
  FACEBOOK = "facebook",
  WEBFORM = "webform",
}

export enum ApplicationIntent {
  COMMERCIAL = "commercial",
  SUPPORT = "support",
  TECHNICAL = "technical",
}

export enum ApplicationUrgency {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum ApplicationComplexity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum ApplicationStatus {
  PROCESSING = "processing",
  ASSIGNED = "assigned",
  ESCALATED = "escalated",
}

export class AssignedUserDto {
  @ApiProperty({ example: "usr-123" })
  @IsUUID()
  @IsString()
  id!: string;

  @ApiProperty({ example: "Ivan Ivanov" })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: "https://example.com/avatar.jpg" })
  @IsOptional()
  @IsUrl()
  avatar?: string;
}

export class CreateApplicationDto {
  @ApiProperty({ enum: ApplicationSource, example: ApplicationSource.EMAIL })
  @IsEnum(ApplicationSource)
  source!: ApplicationSource;

  @ApiProperty({ example: "Нужна этикетка для продукта, 1000 шт" })
  @IsString()
  @MinLength(10)
  rawText!: string;

  @ApiProperty({ enum: ApplicationIntent, example: ApplicationIntent.COMMERCIAL })
  @IsEnum(ApplicationIntent)
  intent!: ApplicationIntent;

  @ApiProperty({ enum: ApplicationUrgency, example: ApplicationUrgency.MEDIUM })
  @IsEnum(ApplicationUrgency)
  urgency!: ApplicationUrgency;

  @ApiProperty({ enum: ApplicationComplexity, example: ApplicationComplexity.LOW })
  @IsEnum(ApplicationComplexity)
  complexity!: ApplicationComplexity;

  @ApiProperty({ example: 85, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  aiConfidence!: number;

  @ApiProperty({ type: () => AssignedUserDto })
  @ValidateNested()
  @Type(() => AssignedUserDto)
  assignedTo!: AssignedUserDto;

  @ApiPropertyOptional({ example: "BX-12345" })
  @IsOptional()
  @IsString()
  bitrix24DealId?: string;

  @ApiPropertyOptional({ example: "https://bitrix24.ru/crm/deal/12345" })
  @IsOptional()
  @IsUrl()
  bitrix24DealUrl?: string;
}
