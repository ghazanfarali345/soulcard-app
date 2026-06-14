import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class QuestionAnswerKey extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Session', required: true })
  sessionId: Types.ObjectId;

  @Prop({ required: true })
  questionNumber: number;

  @Prop({ required: true })
  modelAnswer: string;

  @Prop({
    type: Object, // Dynamic metrics like { depth: 10, coherence: 8, ... }
    required: true,
  })
  scoring: Record<string, number>;

  @Prop({ required: true })
  aiFeedback: string;

  @Prop({ type: [String], default: [] })
  spiritSuggestions: string[];

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const QuestionAnswerKeySchema =
  SchemaFactory.createForClass(QuestionAnswerKey);
