import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiSecurity,
  ApiParam,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { GameSessionService } from './game-session.service';
import { UserAnswerService } from './services/user-answer.service';
import { SessionDetailsDto } from './dto/session-details.dto';
import { QuestionResponseDto } from './dto/generate-questions.dto';
import {
  SubmitAnswerDto,
  SkipQuestionDto,
  SkipResponseDto,
  AnswerResponseDto,
  FinalResultsDto,
  ProgressDto,
} from './dto/answer.dto';

@ApiTags('Game Sessions')
@Controller('game-sessions')
export class GameSessionController {
  constructor(
    private readonly gameSessionService: GameSessionService,
    private readonly userAnswerService: UserAnswerService,
  ) {}

  @Post('sessionDetails')
  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @ApiSecurity('access-token')
  @ApiOperation({
    summary: 'Collect Session Details',
    description:
      'Create a new game session by collecting session configuration details including soul space, vibe, number of players, difficulty level, engagement mode, engagement type, and number of questions.',
  })
  @ApiBody({
    type: SessionDetailsDto,
    description: 'Session configuration details',
  })
  @ApiResponse({
    status: 201,
    description: 'Session details collected successfully',
    schema: {
      example: {
        success: true,
        message: 'Session details collected successfully',
        data: {
          _id: '507f1f77bcf86cd799439011',
          userId: '507f1f77bcf86cd799439012',
          soulSpace: 'personal',
          vibe: 'relaxed',
          noOfPlayers: 2,
          difficultyLevel: 'medium',
          engagementMode: 'competitive',
          engagement: 'deep',
          noOfQuestions: 10,
          createdAt: '2026-04-19T10:30:00.000Z',
          updatedAt: '2026-04-19T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT token',
  })
  async sessionDetails(@Req() req: any, @Body() dto: SessionDetailsDto) {
    const userId = req.user?.userId;
    const data = await this.gameSessionService.createSessionDetails(
      userId,
      dto,
    );
    return {
      success: true,
      message: 'Session details collected successfully',
      data,
    };
  }

  @Post(':sessionId/generate-questions')
  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @ApiSecurity('access-token')
  @ApiParam({
    name: 'sessionId',
    description: 'The ID of the session',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOperation({
    summary: 'Generate Questions from Session Details',
    description:
      'Generate thought-provoking questions based on all session parameters (soul space, vibe, difficulty level, engagement mode, etc.) using AI',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions generated successfully',
    schema: {
      example: {
        success: true,
        message: 'Questions generated successfully',
        data: {
          questions: [
            {
              question:
                'What is the most important thing reinforcement teaches you about change in real life?',
            },
            {
              question:
                'What does studying living systems teach you about how interconnected life really is?',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to generate questions',
  })
  async generateQuestions(@Param('sessionId') sessionId: string) {
    const session =
      await this.gameSessionService.generateQuestionsFromSession(sessionId);

    // Return only question text with question numbers for tracking
    const questions = session.questions.map((q, index) => ({
      questionNumber: index + 1,
      question: q.question,
    }));

    return {
      success: true,
      message: 'Questions generated successfully',
      data: {
        questions,
      },
    };
  }

  @Post(':sessionId/questions/:questionId/answer')
  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @ApiSecurity('access-token')
  @ApiParam({
    name: 'sessionId',
    description: 'The ID of the session',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'questionId',
    description:
      'The question number (1-based). Use 1 for first question, 2 for second, etc.',
    example: '1',
  })
  @ApiOperation({
    summary: 'Submit Answer to a Question',
    description:
      'Submit user answer to a question and get immediate per-question scoring with similarity score and quality metrics',
  })
  @ApiBody({
    type: SubmitAnswerDto,
    description: 'User answer text',
  })
  @ApiResponse({
    status: 200,
    description: 'Answer submitted and scored successfully',
    type: AnswerResponseDto,
    schema: {
      example: {
        success: true,
        message: 'Answer submitted successfully',
        data: {
          questionNumber: 1,
          totalQuestions: 5,
          score: {
            similarityScore: 78,
            metrics: {
              reflective: 16,
              coherence: 18,
              openness: 15,
              authenticity: 17,
            },
            guidedInsight:
              'Your response demonstrates strong reflection. Consider exploring the distinction between activity and strategy that the model answer emphasizes.',
          },
          isLastQuestion: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Session or question not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to score answer',
  })
  async submitAnswer(
    @Param('sessionId') sessionId: string,
    @Param('questionId') questionId: string,
    @Body() dto: SubmitAnswerDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    // Convert 1-based question number to 0-based index
    const questionIndex = parseInt(questionId, 10) - 1;

    const data = await this.userAnswerService.submitAnswer(
      sessionId,
      questionIndex,
      dto.answer,
      userId,
    );

    return {
      success: true,
      message: 'Answer submitted successfully',
      data,
    };
  }

  @Post(':sessionId/questions/:questionId/skip')
  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @ApiSecurity('access-token')
  @ApiParam({
    name: 'sessionId',
    description: 'The ID of the session',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'questionId',
    description:
      'The question number to skip (1-based). Use 1 for first question, 2 for second, etc.',
    example: '1',
  })
  @ApiOperation({
    summary: 'Skip a Question',
    description:
      'Skip a question without answering it. Track skipped questions for final results.',
  })
  @ApiBody({
    type: SkipQuestionDto,
    description: 'Skip question (no body required)',
  })
  @ApiResponse({
    status: 200,
    description: 'Question skipped successfully',
    type: SkipResponseDto,
    schema: {
      example: {
        success: true,
        message: 'Question skipped successfully',
        data: {
          questionNumber: 1,
          totalQuestions: 5,
          skippedQuestions: [1],
          isLastQuestion: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Session or question not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT token',
  })
  @ApiResponse({
    status: 400,
    description: 'Question already skipped',
  })
  async skipQuestion(
    @Param('sessionId') sessionId: string,
    @Param('questionId') questionId: string,
  ) {
    // Convert 1-based question number to 0-based index
    const questionIndex = parseInt(questionId, 10) - 1;

    const data = await this.userAnswerService.skipQuestion(
      sessionId,
      questionIndex,
    );

    return {
      success: true,
      message: 'Question skipped successfully',
      data,
    };
  }

  @Get(':sessionId/progress')
  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @ApiSecurity('access-token')
  @ApiParam({
    name: 'sessionId',
    description: 'The ID of the session',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOperation({
    summary: 'Get Session Progress',
    description:
      'Get current progress of the quiz - how many questions answered, current status, and results if complete',
  })
  @ApiResponse({
    status: 200,
    description: 'Progress retrieved successfully',
    type: ProgressDto,
    schema: {
      example: {
        success: true,
        data: {
          sessionId: '507f1f77bcf86cd799439011',
          totalQuestions: 5,
          answersSubmitted: 3,
          isComplete: false,
          status: 'IN_PROGRESS',
          results: null,
          reflectiveInsights: null,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT token',
  })
  async getProgress(@Param('sessionId') sessionId: string) {
    const data = await this.userAnswerService.getSessionProgress(sessionId);
    return {
      success: true,
      data,
    };
  }

  @Get(':sessionId/final-results')
  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @ApiSecurity('access-token')
  @ApiParam({
    name: 'sessionId',
    description: 'The ID of the session',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOperation({
    summary: 'Get Final Results',
    description:
      'Get final aggregate results after all questions are answered - overall score and metric breakdown',
  })
  @ApiResponse({
    status: 200,
    description: 'Final results retrieved successfully',
    type: FinalResultsDto,
    schema: {
      example: {
        success: true,
        message: 'Results calculated successfully',
        data: {
          sessionId: '507f1f77bcf86cd799439011',
          finalResults: {
            overallScore: 79,
            metrics: {
              reflective: 16,
              coherence: 18,
              openness: 15,
              authenticity: 17,
            },
          },
          reflectiveInsights: {
            reflectiveStrengths: 'You showed up and participated, which is the most important step!',
            deepeningAwareness: 'To enhance your self-awareness, consider focusing on Reflective Depth...',
            whatThisMeans: 'Your responses demonstrate authentic self-awareness...',
            nextBestAction: 'Continue holding space for what arises...',
            personalizedRecommendations: [
              'Begin with short, simple reflections',
              'Read reflective essays'
            ]
          },
          answersBreakdown: [
            {
              questionNumber: 1,
              question: 'What is the most important thing...?',
              userAnswer: 'User answer text...',
              modelAnswer: 'Model answer text...',
              score: {
                similarityScore: 78,
                metrics: {
                  reflective: 16,
                  coherence: 18,
                  openness: 15,
                  authenticity: 17,
                },
                guidedInsight:
                  'Your response demonstrates strong reflection on the topic.',
              },
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Session or answers not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to calculate results',
  })
  async getFinalResults(@Param('sessionId') sessionId: string) {
    const data = await this.userAnswerService.calculateFinalResults(sessionId);
    return {
      success: true,
      message: 'Results calculated successfully',
      data,
    };
  }
}
