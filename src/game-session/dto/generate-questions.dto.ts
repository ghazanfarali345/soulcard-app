import { ApiProperty } from '@nestjs/swagger';

export class GeneratedQuestion {
  @ApiProperty({
    example: 1,
    description: 'Question number (1-based)',
  })
  questionNumber: number;

  @ApiProperty({
    example:
      'What is the most important thing reinforcement teaches you about change in real life?',
    description: 'The generated question',
  })
  question: string;

  @ApiProperty({
    type: [String],
    example: [
      'Mention what led up to it and how you felt physically in the moment.',
      'Give a concrete example of one action you took that made a difference.',
      'Reflect on a lesson you learned and how it changed your behavior.',
    ],
    description:
      'Array of three short supportive suggestions shown while the user types (precomputed).',
  })
  spiritSuggestions: string[];
}

export class GenerateQuestionsDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Session ID',
  })
  sessionId: string;
}

export class QuestionResponseDto {
  @ApiProperty({
    type: [GeneratedQuestion],
    description: 'Array of generated questions',
  })
  questions: GeneratedQuestion[];
}
