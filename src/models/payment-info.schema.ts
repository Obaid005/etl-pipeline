import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class PaymentInfo {
  @Prop({ required: true })
  method: string;

  @Prop({ required: true })
  transactionId: string;
}

export const PaymentInfoSchema = SchemaFactory.createForClass(PaymentInfo);
