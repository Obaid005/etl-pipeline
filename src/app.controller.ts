import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';
import { WarehouseService } from './modules/warehouse/warehouse.service';
import {
  ActivityInput,
  DeviceInput,
  OrderInput,
} from './interfaces/data.interfaces';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectConnection() private readonly connection: Connection,
    private readonly warehouseService: WarehouseService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): {
    status: string;
    timestamp: string;
    services: Record<string, boolean>;
  } {
    const mongodbConnected =
      this.connection.readyState === ConnectionStates.connected; // 1 = connected
    const warehouseConnected = this.warehouseService.isConnected();

    return {
      status: mongodbConnected && warehouseConnected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongodbConnected,
        warehouse: warehouseConnected,
      },
    };
  }

  @Post('test/order')
  async createTestOrder(@Body() orderData: OrderInput): Promise<any> {
    return this.appService.createTestOrder(orderData);
  }

  @Post('test/device')
  async createTestDevice(@Body() deviceData: DeviceInput): Promise<any> {
    return this.appService.createTestDevice(deviceData);
  }

  @Post('test/activity')
  async createTestUserActivity(
    @Body() activityData: ActivityInput,
  ): Promise<any> {
    return this.appService.createTestUserActivity(activityData);
  }

  @Get('test/status')
  async getETLStatus(): Promise<any> {
    return this.appService.getETLStatus();
  }
}
