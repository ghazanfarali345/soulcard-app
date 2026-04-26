import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface SimpleQuestion {
  questionNumber: number;
  question: string;
}

export enum SessionStatus {
  INITIALIZED = 'INITIALIZED',
  QUESTIONS_GENERATED = 'QUESTIONS_GENERATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

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

  @Prop({ type: [Object], default: [] })
  questions: SimpleQuestion[];

  @Prop({
    type: String,
    enum: SessionStatus,
    default: SessionStatus.INITIALIZED,
  })
  status: SessionStatus;

  @Prop({ type: Number, default: 0 })
  answersSubmitted: number;

  @Prop({ type: [Number], default: [] })
  skippedQuestions: number[];
}

export const SessionSchema = SchemaFactory.createForClass(Session);
