import { Controller, Get, Post, Query, Body, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { BitrixService } from '../bitrix/bitrix.service';
import { CreateTaskDto } from './dto/create-task.dto';

@ApiTags('bitrix')
@Controller('bitrix')
export class BitrixProxyController {
  constructor(private readonly bitrixService: BitrixService) {}

  @Get('open-sessions')
  @ApiOperation({
    summary: 'Открытые сессии Bitrix24 (диалоги с клиентами)',
    description:
      'Прокси к imopenlines.session.list. Возвращает активные диалоги в реальном времени.',
  })
  @ApiResponse({
    status: 200,
    description: 'Список открытых сессий',
  })
  async getOpenSessions(): Promise<{
    success: boolean;
    data: any[];
  }> {
    const result = await this.bitrixService.getOpenSessions();

    return {
      success: true,
      data: Array.isArray(result) ? result : [],
    };
  }

  @Get('tasks')
  @ApiOperation({
    summary: 'Задачи менеджера из Bitrix24',
    description:
      'Прокси к crm.task.list. Возвращает открытые задачи указанного менеджера.',
  })
  @ApiQuery({
    name: 'employeeId',
    required: true,
    description: 'Bitrix24 ID сотрудника',
    example: 13,
  })
  @ApiResponse({
    status: 200,
    description: 'Список задач менеджера',
  })
  async getTasks(
    @Query('employeeId', ParseIntPipe) employeeId: number,
  ): Promise<{
    success: boolean;
    data: any[];
  }> {
    const result = await this.bitrixService.listTasks({
      filter: { RESPONSIBLE_ID: employeeId.toString(), '!STATUS': '5' },
    });

    return {
      success: true,
      data: Array.isArray(result) ? result : [],
    };
  }

  @Post('tasks')
  @ApiOperation({
    summary: 'Создать задачу в Bitrix24',
    description:
      'Прокси к tasks.task.add. Создаёт задачу на указанного менеджера.',
  })
  @ApiResponse({
    status: 200,
    description: 'Задача создана',
    schema: {
      example: {
        success: true,
        data: { taskId: '12345' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Невалидные данные' })
  async createTask(
    @Body() dto: CreateTaskDto,
  ): Promise<{
    success: boolean;
    data: { taskId: string };
  }> {
    const result = await this.bitrixService.createTask({
      TITLE: dto.title,
      DESCRIPTION: dto.description,
      RESPONSIBLE_ID: dto.responsibleId,
      DEADLINE: dto.deadline,
    });

    return {
      success: true,
      data: { taskId: result?.id || result?.result?.id || 'unknown' },
    };
  }
}
