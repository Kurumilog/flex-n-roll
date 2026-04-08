import { IsString, IsEnum, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MailingChannel {
  EMAIL = 'email',
  TELEGRAM = 'telegram',
  WHATSAPP = 'whatsapp',
}

export class SendMailingDto {
  @ApiProperty({
    description: 'Список ID лидов для рассылки',
    example: ['27984', '27985'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  leadIds!: string[];

  @ApiPropertyOptional({
    description: 'Канал рассылки',
    enum: MailingChannel,
    default: MailingChannel.EMAIL,
  })
  @IsEnum(MailingChannel)
  @IsOptional()
  channel?: MailingChannel = MailingChannel.EMAIL;
}
