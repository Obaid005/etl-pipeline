import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../../models/order.model';
import { Device, DeviceSchema } from '../../models/device.model';
import {
  UserActivity,
  UserActivitySchema,
} from '../../models/user-activity.model';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: UserActivity.name, schema: UserActivitySchema },
    ]),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService, MongooseModule],
})
export class DatabaseModule {}
