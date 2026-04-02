import { IsOptional, IsUrl } from "class-validator";

export class BitrixLoginDto {
  @IsOptional()
  @IsUrl()
  portalUrl?: string;
}
