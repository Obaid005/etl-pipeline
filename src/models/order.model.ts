import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  OrderItem,
  PaymentInfo,
  ShippingAddress,
} from 'src/interfaces/data.interfaces';
import { ShippingAddressSchema } from './shipping-address.schema';
import { PaymentInfoSchema } from './payment-info.schema';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  customerId: string;

  @Prop({ required: true })
  items: OrderItem[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({
    required: true,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: ShippingAddressSchema })
  shippingAddress: ShippingAddress;

  @Prop({ type: PaymentInfoSchema })
  paymentInfo: PaymentInfo;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
