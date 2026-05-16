import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PendingUserDocument = HydratedDocument<PendingUser>;

@Schema({ timestamps: true })
export class PendingUser {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true })
  otpExpiresAt: Date;

  @Prop({ default: false })
  termsAccepted: boolean;
}

export const PendingUserSchema = SchemaFactory.createForClass(PendingUser);

// Index for automatic deletion after expiration (TTL index)
PendingUserSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });
