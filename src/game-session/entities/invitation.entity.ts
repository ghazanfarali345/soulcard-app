import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Invitation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Session', required: true })
  sessionId: Types.ObjectId;

  @Prop({ required: true })
  code: string; // 12-char OTP code

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({
    type: String,
    enum: ['PENDING', 'USED', 'EXPIRED'],
    default: 'PENDING',
  })
  status: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation);
