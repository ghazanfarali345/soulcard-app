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

      // Validate user is a participant
      const isParticipant = session.participants.some(
        (p) => p.toString() === userId,
      );
      if (!isParticipant) {
        throw new HttpException(
          'User is not a participant in this session',
          HttpStatus.FORBIDDEN,
        );
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
        playerId: new Types.ObjectId(userId),
        questionNumber,
        question: simpleQuestion.question,
        modelAnswer: questionKey.modelAnswer,
        userAnswer,
        score: {
          similarityScore: scoringResult.similarityScore,
          metrics: scoringResult.metrics,
          guidedInsight: scoringResult.guidedInsight,
          constructiveFeedback: scoringResult.constructiveFeedback,
        },
        answeredAt: new Date(),
      });

      await userAnswerRecord.save();

      // Update session progress for this specific participant
      const participantIndex = session.participantsInfo.findIndex(p => p.userId.toString() === userId);
      if (participantIndex !== -1) {
        session.participantsInfo[participantIndex].answersSubmitted = await this.userAnswerModel.countDocuments({
          sessionId: new Types.ObjectId(sessionId),
          playerId: new Types.ObjectId(userId),
        });
      } else {
        // If not in participantsInfo yet (e.g. host who hasn't joined formally but is playing)
        session.participantsInfo.push({
          userId: new Types.ObjectId(userId),
          displayName: 'Player', // Fallback
          answersSubmitted: 1,
          skippedQuestions: [],
        });
      }

      // Update global session answers count (optional, can be sum of all or just for backward compatibility)
      session.answersSubmitted = await this.userAnswerModel.countDocuments({
        sessionId: new Types.ObjectId(sessionId),
      });

      // Update status if all participants completed (or just this one)
      // For now, let's say the session is IN_PROGRESS until at least one person finishes?
      // Or just keep it simple: if the player who just answered finished all questions
      const currentPlayerProgress = session.participantsInfo.find(p => p.userId.toString() === userId);
      if (currentPlayerProgress && (currentPlayerProgress.answersSubmitted + currentPlayerProgress.skippedQuestions.length) === session.noOfQuestions) {
        // Individual completion reached
      }
      
      // Update session status to COMPLETED only when at least one person is done? 
      // Actually, better to keep it IN_PROGRESS as long as it's active.
      session.status = SessionStatus.IN_PROGRESS;

      await session.save();

      return {
        questionNumber,
        totalQuestions: session.noOfQuestions,
        score: {
          similarityScore: scoringResult.similarityScore,
          metrics: scoringResult.metrics,
          guidedInsight: scoringResult.guidedInsight,
          constructiveFeedback: scoringResult.constructiveFeedback,
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
  async skipQuestion(sessionId: string, questionId: number, userId: string) {
    try {
      // Fetch the session
      const session = await this.sessionModel.findById(sessionId);
      if (!session) {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }

      // Validate user is a participant
      const isParticipant = session.participants.some(p => p.toString() === userId);
      if (!isParticipant) {
        throw new HttpException('User is not a participant in this session', HttpStatus.FORBIDDEN);
      }

      // Validate question exists
      if (questionId < 0 || questionId >= session.questions.length) {
        throw new HttpException(
          'Invalid question number',
          HttpStatus.BAD_REQUEST,
        );
      }

      const questionNumber = questionId + 1;

      // Track skip for this participant
      const participant = session.participantsInfo.find(p => p.userId.toString() === userId);
      if (!participant) {
        // Fallback for untracked host
        session.participantsInfo.push({
          userId: new Types.ObjectId(userId),
          displayName: 'Player',
          answersSubmitted: 0,
          skippedQuestions: [questionNumber],
        });
      } else {
        if (participant.skippedQuestions.includes(questionNumber)) {
          throw new HttpException(
            'Question already skipped',
            HttpStatus.BAD_REQUEST,
          );
        }
        participant.skippedQuestions.push(questionNumber);
      }

      // Also update top-level skippedQuestions for backward compatibility (optional)
      if (!session.skippedQuestions.includes(questionNumber)) {
        session.skippedQuestions.push(questionNumber);
      }

      await session.save();

      const updatedParticipant = session.participantsInfo.find(p => p.userId.toString() === userId);
      const totalResponded = (updatedParticipant?.answersSubmitted || 0) + (updatedParticipant?.skippedQuestions.length || 0);

      return {
        questionNumber,
        totalQuestions: session.noOfQuestions,
        skippedQuestions: updatedParticipant?.skippedQuestions || [],
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
   * Calculate final results for a specific player in a session
   * @param sessionId - Session ID
   * @param userId - Player ID
   * @returns Final aggregated results for this player
   */
  async calculateFinalResults(sessionId: string, userId: string) {
    try {
      const session = await this.sessionModel.findById(sessionId);
      if (!session) {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }

      // Get all answers for this player in this session
      const answers = await this.userAnswerModel.find({
        sessionId: new Types.ObjectId(sessionId),
        playerId: new Types.ObjectId(userId),
      }).sort({ questionNumber: 1 });

      if (answers.length === 0) {
        throw new HttpException(
          'No answers found for this player in this session',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Extract scoring results
      const scores: ScoringResult[] = answers.map((answer) => ({
        similarityScore: answer.score.similarityScore,
        metrics: answer.score.metrics,
        guidedInsight: answer.score.guidedInsight,
        constructiveFeedback: answer.score.constructiveFeedback ?? '',
      }));

      // Calculate aggregate scores
      const aggregateScores =
        this.scoringService.calculateAggregateScores(scores);

      // Generate AI narrative insights
      const reflectiveInsights = await this.scoringService.generateReflectiveInsights(
        aggregateScores.overallScore,
        aggregateScores.metrics,
        { soulSpace: session.soulSpace, vibe: session.vibe }
      );

      // Create and save SessionResult for history (per player)
      const answersBreakdown = answers.map((answer) => ({
        questionNumber: answer.questionNumber,
        question: answer.question,
        userAnswer: answer.userAnswer,
        modelAnswer: answer.modelAnswer,
        score: {
          similarityScore: answer.score.similarityScore,
          metrics: answer.score.metrics,
          guidedInsight: answer.score.guidedInsight,
          constructiveFeedback: answer.score.constructiveFeedback,
        },
      }));

      // We might want to store multiple results per session now, one for each user
      // Or update the existing one if it's the same user.
      const sessionResult = new this.sessionResultModel({
        sessionId: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId),
        soulSpace: session.soulSpace,
        vibe: session.vibe,
        totalQuestions: session.noOfQuestions,
        answersSubmitted: answers.length,
        skippedQuestions: session.participantsInfo.find(p => p.userId.toString() === userId)?.skippedQuestions || [],
        finalResults: {
          overallScore: aggregateScores.overallScore,
          metrics: aggregateScores.metrics,
        },
        reflectiveInsights,
        answersBreakdown,
        completedAt: new Date(),
      });

      await sessionResult.save();

      return {
        sessionId,
        userId,
        finalResults: aggregateScores,
        reflectiveInsights,
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
   * Get session progress for all participants
   * @param sessionId - Session ID
   * @returns Progress information for each participant
   */
  async getSessionProgress(sessionId: string) {
    try {
      const session = await this.sessionModel.findById(sessionId);
      if (!session) {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }

      const playerProgress = await Promise.all(session.participantsInfo.map(async (p) => {
        const answersCount = await this.userAnswerModel.countDocuments({
          sessionId: new Types.ObjectId(sessionId),
          playerId: p.userId,
        });

        const totalResponded = answersCount + p.skippedQuestions.length;
        const isComplete = totalResponded === session.noOfQuestions;

        let results: any = null;
        if (isComplete) {
          const sessionResult = await this.sessionResultModel.findOne({
            sessionId: new Types.ObjectId(sessionId),
            userId: p.userId,
          });
          if (sessionResult) {
            results = sessionResult.finalResults;
          }
        }

        return {
          playerId: p.userId,
          displayName: p.displayName,
          answersSubmitted: answersCount,
          skippedQuestions: p.skippedQuestions,
          isComplete,
          results,
        };
      }));

      return {
        sessionId,
        totalQuestions: session.noOfQuestions,
        participants: playerProgress,
        status: session.status,
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
