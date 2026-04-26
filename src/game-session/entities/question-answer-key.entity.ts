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
    type: {
      depth: Number,
      coherence: Number,
      authenticity: Number,
      openness: Number,
    },
    required: true,
  })
  scoring: {
    depth: number;
    coherence: number;
    authenticity: number;
    openness: number;
  };

  @Prop({ required: true })
  aiFeedback: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const QuestionAnswerKeySchema = SchemaFactory.createForClass(QuestionAnswerKey);
