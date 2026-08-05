import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type SoulSpaceDocument = HydratedDocument<SoulSpace>;

@Schema({ _id: false })
class Vibe {
  @ApiProperty({ example: 'Calm', description: 'The name of the vibe' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({
    example: 'A state of tranquility and peace.',
    description: 'The description of the vibe',
  })
  @Prop({ required: true })
  description: string;
}

const VibeSchema = SchemaFactory.createForClass(Vibe);

@Schema({ timestamps: true })
export class SoulSpace {
  @ApiProperty({
    example: 'Zen Garden',
    description: 'The name of the soul space',
  })
  @Prop({ required: true })
  name: string;

  @ApiProperty({
    example: '/uploads/soul-space-icons/sun.png',
    description: 'Icon URL for the soul space',
    required: false,
  })
  @Prop({ required: false })
  icon?: string;

  @ApiProperty({
    type: [Vibe],
    description: 'A list of vibes with their descriptions',
  })
  @Prop({ type: [VibeSchema], required: true })
  vibes: Vibe[];
}

export const SoulSpaceSchema = SchemaFactory.createForClass(SoulSpace);
