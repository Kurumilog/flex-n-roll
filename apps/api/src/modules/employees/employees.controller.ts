import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { UpdateWorkHoursDto } from './dto/update-workhours.dto';
import {
  AvailableEmployeesResponseDto,
  EmployeeResponseDto,
  EmployeeKpiResponseDto,
} from './dto/employee-response.dto';

@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('available')
  @ApiOperation({
    summary: 'Список доступных менеджеров для маршрутизации',
    description:
      'Возвращает менеджеров с isAvailable=true, отсортированных по KPI (по убыванию). ' +
      'Если указаны clientPhone или clientEmail, также проверяется наличие личного менеджера.',
  })
  @ApiQuery({
    name: 'clientPhone',
    required: false,
    description: 'Телефон клиента для определения личного менеджера',
  })
  @ApiQuery({
    name: 'clientEmail',
    required: false,
    description: 'Email клиента для определения личного менеджера',
  })
  @ApiResponse({
    status: 200,
    description: 'Список доступных менеджеров',
    type: AvailableEmployeesResponseDto,
  })
  async getAvailableEmployees(
    @Query('clientPhone') clientPhone?: string,
    @Query('clientEmail') clientEmail?: string,
  ): Promise<{
    success: boolean;
    data: AvailableEmployeesResponseDto;
  }> {
    const [employees, personalManager] = await Promise.all([
      this.employeesService.getAvailableEmployees(),
      this.employeesService.getPersonalManager(clientPhone, clientEmail),
    ]);

    // Если найден личный менеджер, добавить его в список с флагом
    const employeesWithPersonalFlag: EmployeeResponseDto[] = employees.map(
      (emp) => ({
        ...emp,
        isPersonalManager: personalManager ? personalManager.id === emp.id : false,
      }),
    );

    return {
      success: true,
      data: {
        employees: employeesWithPersonalFlag,
        personalManagerId: personalManager ? personalManager.id : null,
      },
    };
  }

  @Patch(':id/availability')
  @ApiOperation({
    summary: 'Обновить доступность менеджера',
    description:
      'Вызывается n8n при смене статуса менеджера в Bitrix24.',
  })
  @ApiResponse({
    status: 200,
    description: 'Доступность обновлена',
    schema: {
      example: {
        success: true,
        data: { id: 13, name: 'Марина', isAvailable: false },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Менеджер не найден' })
  async updateAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAvailabilityDto,
  ): Promise<{
    success: boolean;
    data: { id: number; name: string; isAvailable: boolean };
  }> {
    const result = await this.employeesService.updateAvailability(
      id,
      dto.isAvailable,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id/workhours')
  @ApiOperation({
    summary: 'Обновить рабочее время менеджера',
    description:
      'Временно обновить workEnd для тестирования маршрутизации.',
  })
  @ApiResponse({
    status: 200,
    description: 'Рабочее время обновлено',
    schema: {
      example: {
        success: true,
        data: { id: 13, name: 'Марина', workEnd: '23:59' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Менеджер не найден' })
  async updateWorkHours(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkHoursDto,
  ): Promise<{
    success: boolean;
    data: { id: number; name: string; workEnd: string };
  }> {
    const result = await this.employeesService.updateWorkHours(
      id,
      dto.workEnd,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get(':id/kpi')
  @ApiOperation({
    summary: 'Текущий KPI + история за последние 30 дней',
  })
  @ApiResponse({
    status: 200,
    description: 'KPI сотрудника с историей',
    type: EmployeeKpiResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Менеджер не найден' })
  async getEmployeeKpi(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{
    success: boolean;
    data: EmployeeKpiResponseDto;
  }> {
    const result = await this.employeesService.getEmployeeKpi(id);

    return {
      success: true,
      data: result,
    };
  }
}
