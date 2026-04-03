import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsUrl } from "class-validator";

export class BitrixLoginDto {
  @ApiPropertyOptional({
    description: "Bitrix24 portal URL",
    example: "https://mycompany.bitrix24.com",
  })
  @IsOptional()
  @IsUrl()
  portalUrl?: string;
}
