import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class GeoLocation {
  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  country: string;
}

export const GeoLocationSchema = SchemaFactory.createForClass(GeoLocation);
