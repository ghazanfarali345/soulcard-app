import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface AnswerBreakdown {
  questionNumber: number;
  question: string;
  userAnswer: string;
  modelAnswer: string;
  score: {
    similarityScore: number;
    metrics: Record<string, number>;
    isSubstantive: boolean;
    guidedInsight: string;
    constructiveFeedback: string;
  };
}

export interface FinalResultsData {
  overallScore: number; // 0-100
  metrics: Record<string, number>; // Dynamic metrics based on engagement mode
}

@Schema({ timestamps: true })
export class SessionResult extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Session', required: true })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  soulSpace: string;

  @Prop({ required: true })
  vibe: string;

  @Prop({ type: Number, required: true })
  totalQuestions: number;

  @Prop({ type: Number, required: true })
  answersSubmitted: number;

  @Prop({ type: [Number], default: [] })
  skippedQuestions: number[];

  @Prop({
    type: {
      overallScore: Number,
      metrics: { type: Object }, // Dynamic metrics
    },
    required: true,
  })
  finalResults: FinalResultsData;

  @Prop({ type: Object, default: null })
  reflectiveInsights: Record<string, string | string[]>;

  @Prop({
    type: [
      {
        questionNumber: Number,
        question: String,
        userAnswer: String,
        modelAnswer: String,
        score: {
          similarityScore: Number,
          metrics: { type: Object }, // Dynamic metrics
          isSubstantive: { type: Boolean, default: true },
          guidedInsight: String,
          constructiveFeedback: String,
        },
      },
    ],
    default: [],
  })
  answersBreakdown: AnswerBreakdown[];

  @Prop({ default: Date.now })
  completedAt: Date;
}

export const SessionResultSchema = SchemaFactory.createForClass(SessionResult);
