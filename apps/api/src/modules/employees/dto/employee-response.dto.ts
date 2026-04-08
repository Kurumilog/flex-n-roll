import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmployeeResponseDto {
  @ApiProperty({ description: 'Bitrix24 ID сотрудника' })
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional({ description: 'Должность' })
  position!: string | null;

  @ApiPropertyOptional({ description: 'Отдел/специализация' })
  department!: string | null;

  @ApiProperty({ description: 'KPI score (0-100)' })
  kpiScore!: number;

  @ApiProperty({ description: 'Доступность' })
  isAvailable!: boolean;

  @ApiProperty({
    description: 'Является ли личным менеджером клиента',
  })
  isPersonalManager!: boolean;
}

export class AvailableEmployeesResponseDto {
  @ApiProperty({ type: [EmployeeResponseDto] })
  employees!: EmployeeResponseDto[];

  @ApiPropertyOptional({
    description: 'ID личного менеджера (если найден)',
  })
  personalManagerId!: number | null;
}

export class EmployeeKpiHistoryDto {
  @ApiProperty()
  period!: Date;

  @ApiProperty()
  kpiScore!: number;
}

export class EmployeeKpiResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  kpiScore!: number;

  @ApiProperty()
  dealsWon!: number;

  @ApiProperty()
  dealsLost!: number;

  @ApiProperty()
  avgResponseMinutes!: number;

  @ApiProperty({ type: [EmployeeKpiHistoryDto] })
  kpiHistory!: EmployeeKpiHistoryDto[];
}
