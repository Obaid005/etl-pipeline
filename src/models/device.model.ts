import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DeviceDocument = Device & Document;

@Schema({ timestamps: true })
export class Device {
  @Prop({ required: true, unique: true })
  deviceId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  deviceType: string;

  @Prop({ required: true })
  manufacturer: string;

  @Prop({ required: true })
  model: string;

  @Prop()
  osVersion: string;

  @Prop()
  appVersion: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastActive: Date;

  @Prop()
  registrationDate: Date;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
