import { IsString, IsEnum, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Channel {
  TELEGRAM = 'telegram',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  PHONE = 'phone',
}

export class RouteMessageDto {
  @ApiProperty({
    description: 'Текст сообщения клиента',
    example: 'Нужен расчёт на этикетку 58х40мм, тираж 50000',
  })
  @IsString()
  messageText!: string;

  @ApiProperty({
    description: 'Канал обращения',
    enum: Channel,
    example: Channel.TELEGRAM,
  })
  @IsEnum(Channel)
  channel!: Channel;

  @ApiPropertyOptional({
    description: 'Телефон клиента',
    example: '+375291234567',
  })
  @IsString()
  @IsOptional()
  clientPhone?: string;

  @ApiPropertyOptional({
    description: 'Email клиента',
    example: 'client@example.com',
  })
  @IsEmail()
  @IsOptional()
  clientEmail?: string;

  @ApiPropertyOptional({
    description: 'ID сессии в Bitrix24 Open Line',
    example: 'session-123',
  })
  @IsString()
  @IsOptional()
  clientBitrixId?: string;

  @ApiPropertyOptional({
    description: 'ID события для дедупликации',
    example: 'event-456',
  })
  @IsString()
  @IsOptional()
  eventId?: string;
}