import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserAnswer, PerQuestionScore } from '../entities/user-answer.entity';
import { Session, SessionStatus } from '../entities/session.entity';
import { QuestionAnswerKey } from '../entities/question-answer-key.entity';
import { SessionResult } from '../entities/session-result.entity';
import { ScoringService, ScoringResult } from './scoring.service';

@Injectable()
export class UserAnswerService {
  constructor(
    @InjectModel(UserAnswer.name) private userAnswerModel: Model<UserAnswer>,
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    @InjectModel(QuestionAnswerKey.name)
    private questionAnswerKeyModel: Model<QuestionAnswerKey>,
    @InjectModel(SessionResult.name)
    private sessionResultModel: Model<SessionResult>,
    private scoringService: ScoringService,
  ) {}

  /**
   * Submit answer for a question and get immediate scoring
   * @param sessionId - Session ID
   * @param questionId - Question ID (index or identifier)
   * @param userAnswer - User's answer text
   * @param userId - User ID
   * @returns Scoring result for this question
   */
  async submitAnswer(
    sessionId: string,
    questionId: number,
    userAnswer: string,
    userId: string,
  ) {
    try {
      // Fetch the session
      const session = await this.sessionModel.findById(sessionId);
      if (!session) {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }

      // Validate question exists
      if (questionId < 0 || questionId >= session.questions.length) {
        throw new HttpException(
          'Invalid question number',
          HttpStatus.BAD_REQUEST,
        );
      }

      const simpleQuestion = session.questions[questionId];
      const questionNumber = questionId + 1;

      // Fetch full question details (modelAnswer, scoring) from QuestionAnswerKey
      const questionKey = await this.questionAnswerKeyModel.findOne({
        sessionId: new Types.ObjectId(sessionId),
        questionNumber,
      });

      if (!questionKey) {
        throw new HttpException(
          'Question details not found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Score the answer using modelAnswer from QuestionAnswerKey
      const scoringResult = await this.scoringService.scoreAnswer(
        userAnswer,
        questionKey.modelAnswer,
      );

      // Create and save user answer record
      const userAnswerRecord = new this.userAnswerModel({
        sessionId: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId),
        questionNumber,
        question: simpleQuestion.question,
        modelAnswer: questionKey.modelAnswer,
        userAnswer,
        score: {
          similarityScore: scoringResult.similarityScore,
          metrics: scoringResult.metrics,
        },
        answeredAt: new Date(),
      });

      await userAnswerRecord.save();

      // Update session progress
      session.answersSubmitted = await this.userAnswerModel.countDocuments({
        sessionId: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId),
      });

      // Update status if all questions answered
      if (session.answersSubmitted === session.noOfQuestions) {
        session.status = SessionStatus.COMPLETED;
      } else {
        session.status = SessionStatus.IN_PROGRESS;
      }

      await session.save();

      return {
        questionNumber,
        totalQuestions: session.noOfQuestions,
        score: {
          similarityScore: scoringResult.similarityScore,
          metrics: scoringResult.metrics,
        },
        isLastQuestion: session.answersSubmitted === session.noOfQuestions,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error submitting answer: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Skip a question
   * @param sessionId - Session ID
   * @param questionId - Question ID (0-based index)
   * @returns Skip confirmation with skipped questions list
   */
  async skipQuestion(sessionId: string, questionId: number) {
    try {
      // Fetch the session
      const session = await this.sessionModel.findById(sessionId);
      if (!session) {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }

      // Validate question exists
      if (questionId < 0 || questionId >= session.questions.length) {
        throw new HttpException(
          'Invalid question number',
          HttpStatus.BAD_REQUEST,
        );
      }

      const questionNumber = questionId + 1;

      // Check if already skipped
      if (session.skippedQuestions.includes(questionNumber)) {
        throw new HttpException(
          'Question already skipped',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Add to skipped questions
      session.skippedQuestions.push(questionNumber);

      // Check if all questions are now either answered or skipped
      const totalResponded =
        session.answersSubmitted + session.skippedQuestions.length;
      if (totalResponded === session.noOfQuestions) {
        session.status = SessionStatus.COMPLETED;
      } else {
        session.status = SessionStatus.IN_PROGRESS;
      }

      await session.save();

      return {
        questionNumber,
        totalQuestions: session.noOfQuestions,
        skippedQuestions: session.skippedQuestions,
        isLastQuestion: totalResponded === session.noOfQuestions,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error skipping question: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all answers for a session
   * @param sessionId - Session ID
   * @returns All user answers for the session
   */
  async getSessionAnswers(sessionId: string) {
    try {
      const answers = await this.userAnswerModel
        .find({
          sessionId: new Types.ObjectId(sessionId),
        })
        .sort({ questionNumber: 1 });

      return answers;
    } catch (error) {
      throw new HttpException(
        `Error fetching answers: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Calculate final results for a session
   * @param sessionId - Session ID
   * @returns Final aggregated results
   */
  async calculateFinalResults(sessionId: string) {
    try {
      const session = await this.sessionModel.findById(sessionId);
      if (!session) {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }

      // Get all answers for this session
      const answers = await this.getSessionAnswers(sessionId);

      if (answers.length === 0) {
        throw new HttpException(
          'No answers found for this session',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Extract scoring results
      const scores: ScoringResult[] = answers.map((answer) => ({
        similarityScore: answer.score.similarityScore,
        metrics: answer.score.metrics,
      }));

      // Calculate aggregate scores
      const aggregateScores =
        this.scoringService.calculateAggregateScores(scores);

      // Create and save SessionResult for history
      const answersBreakdown = answers.map((answer) => ({
        questionNumber: answer.questionNumber,
        question: answer.question,
        userAnswer: answer.userAnswer,
        modelAnswer: answer.modelAnswer,
        score: {
          similarityScore: answer.score.similarityScore,
          metrics: answer.score.metrics,
        },
      }));

      const sessionResult = new this.sessionResultModel({
        sessionId: new Types.ObjectId(sessionId),
        userId: session.userId,
        soulSpace: session.soulSpace,
        vibe: session.vibe,
        totalQuestions: session.noOfQuestions,
        answersSubmitted: session.answersSubmitted,
        skippedQuestions: session.skippedQuestions,
        finalResults: {
          overallScore: aggregateScores.overallScore,
          metrics: aggregateScores.metrics,
        },
        answersBreakdown,
        completedAt: new Date(),
      });

      await sessionResult.save();

      return {
        sessionId,
        finalResults: aggregateScores,
        answersBreakdown,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error calculating final results: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get session progress
   * @param sessionId - Session ID
   * @returns Progress information
   */
  async getSessionProgress(sessionId: string) {
    try {
      const session = await this.sessionModel.findById(sessionId);
      if (!session) {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }

      const answersCount = await this.userAnswerModel.countDocuments({
        sessionId: new Types.ObjectId(sessionId),
      });

      // Total responded = answered + skipped
      const totalResponded = answersCount + session.skippedQuestions.length;
      const isComplete = totalResponded === session.noOfQuestions;

      // Fetch results from SessionResult collection if complete
      let results: any = null;
      if (isComplete) {
        const sessionResult = await this.sessionResultModel.findOne({
          sessionId: new Types.ObjectId(sessionId),
        });
        if (sessionResult) {
          results = sessionResult.finalResults;
        }
      }

      return {
        sessionId,
        totalQuestions: session.noOfQuestions,
        answersSubmitted: answersCount,
        skippedQuestions: session.skippedQuestions,
        isComplete,
        status: session.status,
        results,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error getting progress: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
