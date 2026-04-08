import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Topic {
  PRICE_NEGOTIATION = 'price_negotiation',
  TECHNICAL_SPECS = 'technical_specs',
  DELIVERY = 'delivery',
  COMPLAINT = 'complaint',
  NEW_CLIENT = 'new_client',
  URGENT_REORDER = 'urgent_reorder',
  OTHER = 'other',
}

export enum Urgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class RoutingResultDto {
  @ApiPropertyOptional({
    description: 'ID назначенного менеджера (null = автоответ)',
    example: 13,
  })
  managerId!: number | null;

  @ApiPropertyOptional({
    description: 'Имя назначенного менеджера',
    example: 'Марина',
  })
  managerName!: string | null;

  @ApiProperty({
    description: 'Тема обращения',
    enum: Topic,
    example: Topic.PRICE_NEGOTIATION,
  })
  topic!: Topic;

  @ApiProperty({
    description: 'Срочность',
    enum: Urgency,
    example: Urgency.MEDIUM,
  })
  urgency!: Urgency;

  @ApiProperty({
    description: 'Обоснование выбора менеджера',
    example: 'Лучший KPI по ценовым переговорам',
  })
  reason!: string;

  @ApiProperty({
    description: 'Является ли личным менеджером',
    example: false,
  })
  isPersonalManager!: boolean;

  @ApiPropertyOptional({
    description: 'Текст автоответа (если managerId = null)',
    example: 'Все специалисты заняты, ответим до 10:00',
  })
  autoReplyText!: string | null;
}