import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: "User full name",
    example: "Ivan Ivanov",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({
    description: "User department",
    example: "Sales",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  department?: string;

  @ApiPropertyOptional({
    description: "User timezone",
    example: "Europe/Minsk",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  timezone?: string;

  @ApiPropertyOptional({
    description: "User biography",
    example: "Контролирую маршрутизацию и качество ответов по входящим заявкам.",
    maxLength: 280,
  })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;
}
