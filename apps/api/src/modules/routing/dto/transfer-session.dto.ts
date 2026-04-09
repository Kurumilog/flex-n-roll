import { IsString, IsNotEmpty, IsInt, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TransferReason {
  UNAVAILABLE = 'unavailable',
  END_OF_DAY = 'end_of_day',
}

export class TransferSessionDto {
  @ApiProperty({
    description: 'ID сессии в Bitrix24 Open Line',
    example: 'session_12345',
  })
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @ApiProperty({
    description: 'ID текущего менеджера (Bitrix24 ID)',
    example: 13,
  })
  @IsInt()
  @Min(1)
  currentManagerId!: number;

  @ApiProperty({
    description: 'Причина передачи',
    enum: TransferReason,
    example: TransferReason.UNAVAILABLE,
  })
  @IsEnum(TransferReason)
  reason!: TransferReason;
}

export class TransferResultDto {
  @ApiProperty({ description: 'ID нового менеджера' })
  newManagerId!: number;

  @ApiProperty({ description: 'Имя нового менеджера' })
  newManagerName!: string;

  @ApiProperty({ description: 'ID сессии' })
  sessionId!: string;

  @ApiProperty({ description: 'Причина передачи' })
  reason!: string;

  @ApiProperty({
    description: 'Была ли сессия успешно передана',
    example: true,
  })
  transferred!: boolean;
}
