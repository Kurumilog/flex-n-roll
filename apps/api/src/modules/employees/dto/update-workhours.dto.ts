import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWorkHoursDto {
  @ApiProperty({
    description: 'Время окончания работы (HH:mm)',
    example: '23:59',
  })
  @IsString()
  workEnd!: string;
}
