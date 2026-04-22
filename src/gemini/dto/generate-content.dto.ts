import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateContentDto {
  @ApiProperty({
    example: 'Write a fun icebreaker question for a game session',
    description: 'The prompt to send to Gemini AI',
  })
  @IsNotEmpty({ message: 'Prompt cannot be empty' })
  @IsString({ message: 'Prompt must be a string' })
  prompt: string;
}
