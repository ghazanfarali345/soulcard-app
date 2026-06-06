import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionStatus } from './entities/session.entity';
import { QuestionAnswerKey } from './entities/question-answer-key.entity';
import { SessionDetailsDto } from './dto/session-details.dto';
import { GeminiService } from '../gemini/gemini.service';
import * as crypto from 'crypto';
import {
  EngagementMode,
  ENGAGEMENT_MODE_CONFIG,
  getEngagementMode,
} from './engagement-mode.config';
import { UsersService } from '../users/users.service';

interface QuestionData {
  question: string;
  modelAnswer: string;
  scoring: Record<string, number>;
  aiFeedback: string;
}

const DIFFICULTY_DEFINITIONS = {
  SEEKER: {
    description: 'Simple, thoughtful, easy reflection',
    level: 'Upper Elementary Level (Grade 4–5)',
    goal: 'Simple thoughtful reflection',
  },
  SCHOLAR: {
    description: 'Clear analytical thinking with simple depth',
    level: 'Middle School Level (Grade 6–8)',
    goal: 'Clear analytical thinking',
  },
  SAGE: {
    description: 'Advanced philosophical and abstract reasoning',
    level: 'College / Adult Level Postsecondary',
    goal: 'Advanced philosophical exploration',
  },
  LUMINARY: {
    description: 'Mature reasoning, deeper reflection, and stronger intellectual discussion',
    level: 'High School Level (Grade 9–12)',
    goal: 'Mature intellectual reflection',
  },
};

@Injectable()
export class GameSessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    @InjectModel(QuestionAnswerKey.name)
    private questionAnswerKeyModel: Model<QuestionAnswerKey>,
    private geminiService: GeminiService,
    private usersService: UsersService,
  ) {}

  async createSessionDetails(
    userId: string,
    dto: SessionDetailsDto,
  ): Promise<Session> {
    const userObjectId = new Types.ObjectId(userId);
    const user = await this.usersService.findById(userId);
    
    const newSession = new this.sessionModel({
      userId: userObjectId,
      hostId: userObjectId,
      participants: [userObjectId],
      participantsInfo: [
        {
          userId: userObjectId,
          displayName: user?.username || user?.fullName || 'Host',
          answersSubmitted: 0,
          skippedQuestions: [],
          isCompleted: false,
        },
      ],
      ...dto,
    });
    return await newSession.save();
  }

  async generateJoinCode(sessionId: string): Promise<string> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    const allowedChars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_+=';
    let code = '';
    const bytes = crypto.randomBytes(12);
    for (let i = 0; i < 12; i++) {
      code += allowedChars[bytes[i] % allowedChars.length];
    }

    const ttl = parseInt(process.env.JOIN_CODE_TTL_MINUTES || '15', 10);
    session.joinCode = code;
    session.joinCodeExpiresAt = new Date(Date.now() + ttl * 60 * 1000);
    await session.save();

    return code;
  }

  async validateJoinCode(code: string): Promise<Session> {
    const session = await this.sessionModel.findOne({
      joinCode: code,
      joinCodeExpiresAt: { $gt: new Date() },
    });

    if (!session) {
      throw new HttpException(
        'Invalid or expired join code',
        HttpStatus.BAD_REQUEST,
      );
    }

    return session;
  }

  async generateQuestionsFromSession(sessionId: string): Promise<Session> {
    try {
      const session = await this.sessionModel.findById(sessionId);
      if (!session) {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }

      const prompt = this.buildPrompt(session);
      const generatedContent = await this.geminiService.generateContent(prompt);

      console.log('Gemini API Response Length:', generatedContent.length);

      const fullQuestions = this.parseQuestionsWithScoring(
        generatedContent,
        getEngagementMode(session.engagementMode),
      );

      console.log('Parsed Questions Count:', fullQuestions.length);

      if (fullQuestions.length === 0) {
        throw new HttpException(
          'Failed to parse questions from AI response',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      for (let i = 0; i < fullQuestions.length; i++) {
        const q = fullQuestions[i];
        await this.questionAnswerKeyModel.create({
          sessionId: session._id,
          questionNumber: i + 1,
          modelAnswer: q.modelAnswer,
          scoring: q.scoring,
          aiFeedback: q.aiFeedback,
        });
      }

      const simpleQuestions = fullQuestions.map((q, index) => ({
        questionNumber: index + 1,
        question: q.question,
      }));

      session.questions = simpleQuestions;
      session.status = SessionStatus.QUESTIONS_GENERATED;
      session.turnOrder = [...session.participants];
      session.currentTurnIndex = 0;
      await session.save();

      return session;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error in generateQuestionsFromSession:', error);
      throw new HttpException(
        `Error generating questions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private buildPrompt(session: Session): string {
    const mode = getEngagementMode(session.engagementMode);
    const config = ENGAGEMENT_MODE_CONFIG[mode];
    
    const scoringFormat = config.parameters
      .map((p) => `${p.name}: [X]/10`)
      .join(' | ');

    const scoringRequirements = config.parameters
      .map((p) => `- ${p.name}: ${p.description} (0-10)`)
      .join('\n   ');

    const difficulty = (session.difficultyLevel?.toUpperCase() || 'SEEKER') as keyof typeof DIFFICULTY_DEFINITIONS;
    const diffDef = DIFFICULTY_DEFINITIONS[difficulty] || DIFFICULTY_DEFINITIONS.SEEKER;

    return `You are an expert educational content creator. Generate exactly ${session.noOfQuestions} profound, thought-provoking questions for the Soul Card Game.

SESSION PARAMETERS:
- Soul Space: ${session.soulSpace}
- Vibe/Domain: ${session.vibe}
- Difficulty Level: ${session.difficultyLevel} (${diffDef.goal})
- Intellectual Depth: ${diffDef.level}
- Target Tone: ${diffDef.description}
- Engagement Mode: ${session.engagementMode}
- Engagement Type: ${session.engagement}
- Guidance Layer: ${config.guidanceLayer}

For EACH question, provide in this EXACT format:

═══════════════════════════════════════
Q[number]:
[THE QUESTION]
MODEL ANSWER:
[A comprehensive, authentic model answer demonstration depth and vulnerability aligned with ${config.guidanceLayer} style. 3-5 sentences that show real insight]
SCORING:
${scoringFormat}
AI FEEDBACK:
"[2-3 sentences of qualitative feedback on what makes this response strong, highlighting the most valuable insights]"
═══════════════════════════════════════

QUALITY REQUIREMENTS:
1. Each question should be:
   - Thought-provoking and open-ended
   - Appropriate for ${session.difficultyLevel} difficulty (${diffDef.level}: ${diffDef.description})
   - Suitable for the "${session.vibe}" domain/theme
   - Encouraging ${session.engagement} engagement
   - Relevant to "${session.soulSpace}" soul space

2. Model answers should:
   - Demonstrate genuine reflection and ${mode} goals
   - Show personal insight balanced with practical wisdom
   - Be authentic and vulnerable, not generic
   - Connect to the question meaningfully

3. Scoring should follow these criteria for ${mode}:
   ${scoringRequirements}
   - Range: Mostly 8-10, with variety

4. AI Feedback should:
   - Highlight the strongest elements
   - Show what makes the answer valuable in the context of ${mode}
   - Be encouraging and specific
   - Reference exact phrases when possible

Generate ${session.noOfQuestions} questions now. Ensure each follows the format exactly.`;
  }

  private parseQuestionsWithScoring(
    content: string,
    mode: EngagementMode,
  ): QuestionData[] {
    const questions: QuestionData[] = [];
    let blocks = content.split('═══════════════════════════════════════');

    if (blocks.length <= 1) {
      blocks = content.split('Q');
      if (blocks.length > 1) {
        blocks = blocks.slice(1).map((b) => 'Q' + b);
      }
    }

    for (const block of blocks) {
      if (!block.trim()) continue;

      try {
        const questionData = this.parseQuestionBlock(block, mode);
        if (questionData) {
          questions.push(questionData);
        }
      } catch (error) {
        console.error('Error parsing question block:', error.message);
      }
    }

    return questions;
  }

  private parseQuestionBlock(
    block: string,
    mode: EngagementMode,
  ): QuestionData | null {
    const config = ENGAGEMENT_MODE_CONFIG[mode];
    const lines = block.split('\n').map((line) => line.trim());

    let question = '';
    let modelAnswer = '';
    const scoring: Record<string, number> = {};
    let aiFeedback = '';

    let currentSection = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('Q') && !currentSection) {
        currentSection = 'question_header';
        continue;
      }

      if (line.includes('MODEL ANSWER:')) {
        currentSection = 'model_answer';
        continue;
      }

      if (line.includes('SCORING:')) {
        currentSection = 'scoring';
        // Dynamic scoring parsing
        config.parameters.forEach((p) => {
          const regex = new RegExp(`${p.name}:\\s*(\\d+)`, 'i');
          const match = line.match(regex);
          if (match) {
            scoring[p.name.toLowerCase()] = parseInt(match[1], 10);
          }
        });
        continue;
      }

      if (line.includes('AI FEEDBACK:')) {
        currentSection = 'ai_feedback';
        continue;
      }

      if (
        currentSection === 'question_header' &&
        line &&
        !line.startsWith('Q')
      ) {
        question = line;
        currentSection = 'question';
      } else if (currentSection === 'question' && line && line.length > 0) {
        if (!question.includes('?')) {
          question = line;
        }
      } else if (currentSection === 'model_answer' && line && line.length > 0) {
        modelAnswer = modelAnswer ? modelAnswer + ' ' + line : line;
      } else if (currentSection === 'ai_feedback' && line && line.length > 0) {
        const cleanedLine = line.replace(/^["']|["']$/g, '');
        aiFeedback = aiFeedback ? aiFeedback + ' ' + cleanedLine : cleanedLine;
      }
    }

    if (question && modelAnswer) {
      // Set defaults for missing scoring
      config.parameters.forEach((p) => {
        const key = p.name.toLowerCase();
        if (scoring[key] === undefined || scoring[key] === 0) {
          scoring[key] = 7;
        }
      });

      if (!aiFeedback) {
        aiFeedback = 'This response shows thoughtful consideration of the topic.';
      }

      return {
        question: question.trim(),
        modelAnswer: modelAnswer.trim(),
        scoring,
        aiFeedback: aiFeedback.trim(),
      };
    }

    return null;
  }

  async endSession(sessionId: string, userId: string): Promise<Session> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    // Find the participant in participantsInfo
    const participantIndex = session.participantsInfo.findIndex(
      (p) => p.userId.toString() === userId,
    );

    if (participantIndex === -1) {
      // If not in participantsInfo (like a host who hasn't formally joined as a player yet)
      session.participantsInfo.push({
        userId: new Types.ObjectId(userId),
        displayName: 'Player', // Fallback
        answersSubmitted: await this.questionAnswerKeyModel.countDocuments({ sessionId: new Types.ObjectId(sessionId) }), // This count logic might need adjustment but usually we'd have them in info
        skippedQuestions: [],
        isCompleted: true,
      });
    } else {
      if (session.participantsInfo[participantIndex].isCompleted) {
        throw new HttpException(
          'You have already completed this session',
          HttpStatus.BAD_REQUEST,
        );
      }
      session.participantsInfo[participantIndex].isCompleted = true;
    }

    // Check if ALL participants have completed
    const allCompleted = session.participantsInfo.every((p) => p.isCompleted);
    if (allCompleted && session.participantsInfo.length > 0) {
      session.status = SessionStatus.COMPLETED;
    }

    return await session.save();
  }

  async getSessionById(sessionId: string): Promise<any> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    const participantsInfo = session.participantsInfo || [];
    const userIds = participantsInfo.map((p) => p.userId.toString());
    const users = await this.usersService.findByIds(userIds);
    const userMap = new Map(users.map((u) => [u._id.toString(), u.profileImage]));

    const sessionObj = session.toObject();
    sessionObj.participantsInfo = sessionObj.participantsInfo.map((p: any) => ({
      ...p,
      profileImage: userMap.get(p.userId.toString()) || null,
    }));

    return sessionObj;
  }
}
