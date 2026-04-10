import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(':trackingNumber')
  async getTracking(@Param('trackingNumber') trackingNumber: string) {
    const data = await this.trackingService.getTrackingByNumber(trackingNumber);
    return { success: true, data };
  }

  @Post('generate')
  async generateTrackingPlan(@Body() body: { identifier: string, managerId: number }) {
    const data = await this.trackingService.testGeneratePlan(body.identifier, body.managerId);
    return { success: true, data };
  }

  @Post(':trackingNumber/update')
  async updateTrackingPlan(
    @Param('trackingNumber') trackingNumber: string,
    @Body() updateData: any,
  ) {
    const data = await this.trackingService.updateTrackingPlan(trackingNumber, updateData);
    return { success: true, data };
  }

  @Get('manager/:managerId')
  async getManagerTrackings(@Param('managerId') managerId: string) {
    const data = await this.trackingService.getAllForManager(Number(managerId));
    return { success: true, data };
  }

  @Get('manager/:managerId/clients')
  async getManagerClients(@Param('managerId') managerId: string) {
    const data = await this.trackingService.getManagerClients(Number(managerId));
    return { success: true, data };
  }
}
