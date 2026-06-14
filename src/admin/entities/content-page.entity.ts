import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContentPageDocument = ContentPage & Document;

@Schema({ timestamps: true })
export class ContentPage {
  @Prop({ required: true, unique: true })
  key: string; // 'terms' | 'privacy'

  @Prop({ type: String, default: '' })
  content: string;

  @Prop({ default: false })
  isPublished: boolean;

  @Prop({ type: String, default: null })
  lastEditedBy: string | null;
}

export const ContentPageSchema = SchemaFactory.createForClass(ContentPage);
