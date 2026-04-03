import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({
    description: "User email address",
    example: "demo@flexnroll.ai",
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: "User password",
    example: "demo12345",
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
