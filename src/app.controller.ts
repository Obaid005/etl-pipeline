import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
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

  @Post('test/order')
  async createTestOrder(@Body() orderData: OrderInput): Promise<any> {
    const orderCollection = this.connection.collection('orders');
    const result = await orderCollection.insertOne({
      orderId: `ORD-${Date.now()}`,
      customerId:
        orderData.customerId || `CUST-${Math.floor(Math.random() * 1000)}`,
      items: orderData.items || [
        {
          productId: `PROD-${Math.floor(Math.random() * 100)}`,
          quantity: Math.floor(Math.random() * 5) + 1,
          price: Math.floor(Math.random() * 100) + 10,
        },
      ],
      totalAmount:
        orderData.totalAmount || Math.floor(Math.random() * 500) + 50,
      status: orderData.status || 'pending',
      shippingAddress: orderData.shippingAddress || {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA',
      },
      paymentInfo: orderData.paymentInfo || {
        method: 'credit_card',
        transactionId: `TXN-${Date.now()}`,
      },
      createdAt: new Date(),
      ...orderData,
    });

    return {
      success: true,
      message: 'Test order created',
      data: result,
    };
  }

  @Post('test/device')
  async createTestDevice(@Body() deviceData: DeviceInput): Promise<any> {
    const deviceCollection = this.connection.collection('devices');
    const result = await deviceCollection.insertOne({
      deviceId: `DEV-${Date.now()}`,
      userId: deviceData.userId || `USER-${Math.floor(Math.random() * 1000)}`,
      type:
        deviceData.type ||
        ['mobile', 'tablet', 'desktop'][Math.floor(Math.random() * 3)],
      model: deviceData.model || `Model-${Math.floor(Math.random() * 10)}`,
      osVersion:
        deviceData.osVersion ||
        `${Math.floor(Math.random() * 10) + 10}.${Math.floor(Math.random() * 10)}`,
      lastActiveAt: new Date(),
      ...deviceData,
    });

    return {
      success: true,
      message: 'Test device created',
      data: result,
    };
  }

  @Post('test/activity')
  async createTestUserActivity(
    @Body() activityData: ActivityInput,
  ): Promise<any> {
    const activityCollection = this.connection.collection('useractivities');
    const result = await activityCollection.insertOne({
      activityId: `ACT-${Date.now()}`,
      userId: activityData.userId || `USER-${Math.floor(Math.random() * 1000)}`,
      activityType:
        activityData.type ||
        ['login', 'purchase', 'view', 'search'][Math.floor(Math.random() * 4)],
      details: activityData.details || {
        page: ['home', 'product', 'cart', 'checkout'][
          Math.floor(Math.random() * 4)
        ],
        duration: Math.floor(Math.random() * 300) + 10,
      },
      timestamp: new Date(),
      deviceId: `DEV-${Date.now()}`,
      sessionId: `SESSION-${Date.now()}`,
      ipAddress:
        activityData.ipAddress ||
        `192.168.1.${Math.floor(Math.random() * 255)}`,
      location: {
        latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
        city: 'San Francisco',
        country: 'USA',
      },
      duration:
        activityData.details?.duration || Math.floor(Math.random() * 300) + 10,
      ...activityData,
    });

    return {
      success: true,
      message: 'Test user activity created',
      data: result,
    };
  }

  @Get('test/status')
  async getETLStatus(): Promise<any> {
    // Count documents in each collection
    const orderCount = await this.connection
      .collection('orders')
      .countDocuments();
    const deviceCount = await this.connection
      .collection('devices')
      .countDocuments();
    const activityCount = await this.connection
      .collection('useractivities')
      .countDocuments();

    // Get warehouse status
    const warehouseStatus = this.warehouseService.getWarehouseStatus();

    return {
      mongodb: {
        orders: orderCount,
        devices: deviceCount,
        userActivities: activityCount,
      },
      warehouse: warehouseStatus,
    };
  }
}
