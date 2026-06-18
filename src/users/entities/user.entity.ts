import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  termsAccepted: boolean;

  @Prop({ type: String, default: null, sparse: true })
  resetToken?: string | null;

  @Prop({ type: Date, default: null })
  resetTokenExpiry?: Date | null;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isAdmin: boolean;

  @Prop({ type: String, default: null, sparse: true })
  fullName?: string | null;

  @Prop({ type: String, default: null })
  profileImage?: string | null;

  @Prop({ type: String, default: null })
  fcmToken?: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes are handled by @Prop definitions
