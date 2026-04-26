import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface AnswerBreakdown {
  questionNumber: number;
  question: string;
  userAnswer: string;
  modelAnswer: string;
  score: {
    similarityScore: number;
    metrics: {
      reflective: number;
      coherence: number;
      openness: number;
      authenticity: number;
    };
  };
}

export interface FinalResultsData {
  overallScore: number; // 0-100
  metrics: {
    reflective: number; // 0-20
    coherence: number; // 0-20
    openness: number; // 0-20
    authenticity: number; // 0-20
  };
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
      metrics: {
        reflective: Number,
        coherence: Number,
        openness: Number,
        authenticity: Number,
      },
    },
    required: true,
  })
  finalResults: FinalResultsData;

  @Prop({
    type: [
      {
        questionNumber: Number,
        question: String,
        userAnswer: String,
        modelAnswer: String,
        score: {
          similarityScore: Number,
          metrics: {
            reflective: Number,
            coherence: Number,
            openness: Number,
            authenticity: Number,
          },
        },
      },
    ],
    default: [],
  })
  answersBreakdown: AnswerBreakdown[];

  @Prop({ default: Date.now })
  completedAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const SessionResultSchema = SchemaFactory.createForClass(SessionResult);
