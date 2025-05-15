import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { GeoLocation } from 'src/interfaces/data.interfaces';
import { GeoLocationSchema } from './geo-location.schema';

export type UserActivityDocument = UserActivity & Document;

@Schema({ timestamps: true })
export class UserActivity {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  activityType: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop()
  deviceId: string;

  @Prop()
  ipAddress: string;

  @Prop({ type: GeoLocationSchema })
  location: GeoLocation;

  @Prop()
  sessionId: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop()
  duration: number;
}

export const UserActivitySchema = SchemaFactory.createForClass(UserActivity);
