import { IsString, IsInt, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Название задачи',
    example: 'Подготовить КП для ООО Вита',
  })
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    description: 'Описание задачи',
    example: 'Клиент интересу термоусадочную этикетку 58x40мм, тираж 50000',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'ID ответственного менеджера (Bitrix24 user ID)',
    example: 13,
  })
  @Type(() => Number)
  @IsInt()
  responsibleId!: number;

  @ApiPropertyOptional({
    description: 'Дедлайн задачи (ISO 8601)',
    example: '2026-04-15T18:00:00+03:00',
  })
  @IsString()
  @IsOptional()
  deadline?: string;
}
