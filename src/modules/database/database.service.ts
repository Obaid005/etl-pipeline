import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../../models/order.model';
import { Device, DeviceDocument } from '../../models/device.model';
import {
  UserActivity,
  UserActivityDocument,
} from '../../models/user-activity.model';
import { OrderItem } from 'src/interfaces/data.interfaces';

@Injectable()
export class DatabaseService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
    @InjectModel(UserActivity.name)
    private userActivityModel: Model<UserActivityDocument>,
  ) {}

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    const order = new this.orderModel(orderData);
    return order.save();
  }

  async updateOrder(
    orderId: string,
    orderData: Partial<Order>,
  ): Promise<Order | null> {
    return this.orderModel
      .findOneAndUpdate({ orderId }, { $set: orderData }, { new: true })
      .exec();
  }

  async createDevice(deviceData: Partial<Device>): Promise<Device> {
    const device = new this.deviceModel(deviceData);
    return device.save();
  }

  async updateDevice(
    deviceId: string,
    deviceData: Partial<Device>,
  ): Promise<Device | null> {
    return this.deviceModel
      .findOneAndUpdate({ deviceId }, { $set: deviceData }, { new: true })
      .exec();
  }

  async createUserActivity(
    activityData: Partial<UserActivity>,
  ): Promise<UserActivity> {
    const activity = new this.userActivityModel(activityData);
    return activity.save();
  }

  // Method to generate sample data
  async generateSampleData() {
    // Create sample orders
    await this.createOrder({
      orderId: `ORD-${Date.now()}-1`,
      customerId: 'CUST001',
      items: [
        { productId: 'PROD001', quantity: 2, price: 29.99 },
        { productId: 'PROD002', quantity: 1, price: 49.99 },
      ] as OrderItem[], // Type assertion to fix type mismatch
      totalAmount: 109.97,
      status: 'pending',
      shippingAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA',
      },
      paymentInfo: {
        method: 'credit_card',
        transactionId: 'TX12345',
      },
    });

    // Create sample device
    await this.createDevice({
      deviceId: `DEV-${Date.now()}`,
      userId: 'USER001',
      deviceType: 'smartphone',
      manufacturer: 'Apple',
      model: 'iPhone 15',
      osVersion: 'iOS 17.4',
      appVersion: '2.1.0',
      isActive: true,
      lastActive: new Date(),
      registrationDate: new Date(),
      metadata: {
        pushToken: 'TOKEN123',
        settings: { darkMode: true, notifications: true },
      },
    });

    // Create sample user activity
    await this.createUserActivity({
      userId: 'USER001',
      activityType: 'login',
      timestamp: new Date(),
      deviceId: `DEV-${Date.now()}`,
      ipAddress: '192.168.1.1',
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        city: 'San Francisco',
        country: 'USA',
      },
      sessionId: `SESSION-${Date.now()}`,
      metadata: {
        browser: 'Chrome',
        platform: 'iOS',
      },
      duration: 0,
    });
  }
}
