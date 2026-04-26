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
