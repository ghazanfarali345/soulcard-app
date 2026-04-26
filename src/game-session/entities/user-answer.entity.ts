import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface PerQuestionScore {
  similarityScore: number; // 0-100
  metrics: {
    reflective: number; // 0-20
    coherence: number; // 0-20
    openness: number; // 0-20
    authenticity: number; // 0-20
  };
}

@Schema({ timestamps: true })
export class UserAnswer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Session', required: true })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

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
      metrics: {
        reflective: Number,
        coherence: Number,
        openness: Number,
        authenticity: Number,
      },
    },
    required: true,
  })
  score: PerQuestionScore;

  @Prop()
  answeredAt: Date;
}

export const UserAnswerSchema = SchemaFactory.createForClass(UserAnswer);
