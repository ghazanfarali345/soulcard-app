import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface PerQuestionScore {
  constructiveFeedback: string;
  similarityScore: number; // 0-100
  metrics: Record<string, number>; // Dynamic metrics based on engagement mode
  guidedInsight: string; // Personalized feedback on the answer
}

@Schema({ timestamps: true })
export class UserAnswer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Session', required: true })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  playerId: Types.ObjectId;

  @Prop({ required: true })
  questionNumber: number;

  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  modelAnswer: string;

  @Prop({ required: true })
  userAnswer: string;

  @Prop({
    type: {
      similarityScore: Number,
      metrics: { type: Object }, // Dynamic metrics
      guidedInsight: String,
      constructiveFeedback: String,
    },
    required: true,
  })
  score: PerQuestionScore;

  @Prop()
  answeredAt: Date;
}

export const UserAnswerSchema = SchemaFactory.createForClass(UserAnswer);
