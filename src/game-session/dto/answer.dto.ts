import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitAnswerDto {
  @ApiProperty({
    example: 'This is my answer to the question...',
    description: 'User answer text',
  })
  @IsNotEmpty({ message: 'Answer cannot be empty' })
  @IsString({ message: 'Answer must be a string' })
  answer: string;
}

export class SkipQuestionDto {
  // No body needed - question ID is in the URL
}

export class SkipResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Question number skipped',
  })
  questionNumber: number;

  @ApiProperty({
    example: 5,
    description: 'Total questions in session',
  })
  totalQuestions: number;

  @ApiProperty({
    example: [2, 5],
    description: 'Array of all skipped question numbers',
  })
  skippedQuestions: number[];

  @ApiProperty({
    example: false,
    description: 'Whether this was the last question',
  })
  isLastQuestion: boolean;
}

export class PerQuestionScoreDto {
  @ApiProperty({
    example: 78,
    description: 'Similarity score with model answer (0-100)',
  })
  similarityScore: number;

  @ApiProperty({
    description: 'Quality metrics breakdown',
  })
  metrics: {
    reflective: number; // 0-20
    coherence: number; // 0-20
    openness: number; // 0-20
    authenticity: number; // 0-20
  };

  @ApiProperty({
    example:
      'Your response demonstrates strong reflection. Consider exploring the distinction between activity and strategy that the model answer emphasizes.',
    description: 'Personalized guided insight and feedback on the answer',
  })
  guidedInsight: string;
}

export class AnswerResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Question number answered',
  })
  questionNumber: number;

  @ApiProperty({
    example: 5,
    description: 'Total questions in session',
  })
  totalQuestions: number;

  @ApiProperty({
    type: PerQuestionScoreDto,
    description: 'Score for this question',
  })
  score: PerQuestionScoreDto;

  @ApiProperty({
    example: false,
    description: 'Whether this was the last question',
  })
  isLastQuestion: boolean;
}

export class FinalMetricsDto {
  @ApiProperty({
    example: 79,
    description: 'Overall score (0-100)',
  })
  overallScore: number;

  @ApiProperty({
    description: 'Metric breakdown (each 0-20)',
  })
  metrics: {
    reflective: number;
    coherence: number;
    openness: number;
    authenticity: number;
  };
}

export class AnswerBreakdownDto {
  @ApiProperty({
    example: 1,
    description: 'Question number',
  })
  questionNumber: number;

  @ApiProperty({
    example: 'What does this teach you?',
    description: 'The question',
  })
  question: string;

  @ApiProperty({
    example: 'User provided answer...',
    description: 'User answer',
  })
  userAnswer: string;

  @ApiProperty({
    example: 'Model answer text...',
    description: 'Model answer',
  })
  modelAnswer: string;

  @ApiProperty({
    type: PerQuestionScoreDto,
    description: 'Score for this answer',
  })
  score: PerQuestionScoreDto;
}

export class FinalResultsDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Session ID',
  })
  sessionId: string;

  @ApiProperty({
    type: FinalMetricsDto,
    description: 'Final aggregate results',
  })
  finalResults: FinalMetricsDto;

  @ApiProperty({
    type: [AnswerBreakdownDto],
    description: 'Breakdown of all answers',
  })
  answersBreakdown: AnswerBreakdownDto[];
}

export class ProgressDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Session ID',
  })
  sessionId: string;

  @ApiProperty({
    example: 5,
    description: 'Total questions',
  })
  totalQuestions: number;

  @ApiProperty({
    example: 3,
    description: 'Answers submitted',
  })
  answersSubmitted: number;

  @ApiProperty({
    example: [2, 5],
    description: 'Skipped question numbers',
  })
  skippedQuestions: number[];

  @ApiProperty({
    example: false,
    description: 'Is quiz complete',
  })
  isComplete: boolean;

  @ApiProperty({
    example: 'IN_PROGRESS',
    description: 'Session status',
  })
  status: string;

  @ApiProperty({
    type: FinalMetricsDto,
    nullable: true,
    description: 'Results if complete',
  })
  results: FinalMetricsDto | null;
}
