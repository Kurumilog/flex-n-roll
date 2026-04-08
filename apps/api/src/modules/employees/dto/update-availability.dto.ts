import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAvailabilityDto {
  @ApiProperty({
    description: 'Доступность менеджера',
    example: true,
  })
  @IsBoolean()
  isAvailable!: boolean;
}
