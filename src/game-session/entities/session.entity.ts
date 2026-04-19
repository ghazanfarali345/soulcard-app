import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Session extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  soulSpace: string;

  @Prop({ required: true })
  vibe: string;

  @Prop({ required: true })
  noOfPlayers: number;

  @Prop({ required: true })
  difficultyLevel: string;

  @Prop({ required: true })
  engagementMode: string;

  @Prop({ required: true })
  engagement: string;

  @Prop({ required: true })
  noOfQuestions: number;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
