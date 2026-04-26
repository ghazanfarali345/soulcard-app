import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionStatus } from './entities/session.entity';
import { QuestionAnswerKey } from './entities/question-answer-key.entity';
import { SessionDetailsDto } from './dto/session-details.dto';
import { GeminiService } from '../gemini/gemini.service';

interface QuestionData {
  question: string;
  modelAnswer: string;
  scoring: {
    depth: number;
    coherence: number;
    authenticity: number;
    openness: number;
  };
  aiFeedback: string;
}

@Injectable()
export class GameSessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    @InjectModel(QuestionAnswerKey.name) private questionAnswerKeyModel: Model<QuestionAnswerKey>,
    private geminiService: GeminiService,
  ) {}

  async createSessionDetails(
    userId: string,
    dto: SessionDetailsDto,
  ): Promise<Session> {
    const newSession = new this.sessionModel({
      userId: new Types.ObjectId(userId),
      ...dto,
    });
    return await newSession.save();
  }

  /**
   * Generate questions based on session details
   * @param sessionId - The session ID
   * @returns Session with generated questions
   */
  async generateQuestionsFromSession(sessionId: string): Promise<Session> {
    try {
      // Fetch the session
      const session = await this.sessionModel.findById(sessionId);
      if (!session) {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }

      // Build a comprehensive prompt from session fields
      const prompt = this.buildPrompt(session);

      // Generate questions using Gemini
      const generatedContent = await this.geminiService.generateContent(prompt);

      // Log raw response for debugging
      console.log('Gemini API Response Length:', generatedContent.length);
      console.log(
        'Gemini Response Preview:',
        generatedContent.substring(0, 500),
      );

      // Parse the generated content to extract questions with scoring
      const fullQuestions = this.parseQuestionsWithScoring(generatedContent);

      console.log('Parsed Questions Count:', fullQuestions.length);

      if (fullQuestions.length === 0) {
        console.warn('Warning: No questions were parsed from Gemini response');
        throw new HttpException(
          'Failed to parse questions from AI response',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Save full questions (with modelAnswer, scoring, feedback) to QuestionAnswerKey
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

      // Store only simple questions (questionNumber, question) in session
      const simpleQuestions = fullQuestions.map((q, index) => ({
        questionNumber: index + 1,
        question: q.question,
      }));

      session.questions = simpleQuestions;
      session.status = SessionStatus.QUESTIONS_GENERATED;
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

  /**
   * Build a comprehensive prompt from session details for Gemini
   * @param session - The session object
   * @returns Formatted prompt string
   */
  private buildPrompt(session: Session): string {
    return `You are an expert educational content creator. Generate exactly ${session.noOfQuestions} profound, thought-provoking questions for the Soul Card Game.

SESSION PARAMETERS:
- Soul Space: ${session.soulSpace}
- Vibe/Domain: ${session.vibe}
- Difficulty Level: ${session.difficultyLevel}
- Engagement Mode: ${session.engagementMode}
- Engagement Type: ${session.engagement}

For EACH question, provide in this EXACT format:

═══════════════════════════════════════
Q[number]:
[THE QUESTION]
MODEL ANSWER:
[A comprehensive, authentic model answer that demonstrates depth and vulnerability. 3-5 sentences that show real insight]
SCORING:
Depth: [X]/10 | Coherence: [X]/10 | Authenticity: [X]/10 | Openness: [X]/10
AI FEEDBACK:
"[2-3 sentences of qualitative feedback on what makes this response strong, highlighting the most valuable insights]"
═══════════════════════════════════════

QUALITY REQUIREMENTS:
1. Each question should be:
   - Thought-provoking and open-ended
   - Appropriate for ${session.difficultyLevel} difficulty
   - Suitable for the "${session.vibe}" domain/theme
   - Encouraging ${session.engagement} engagement
   - Relevant to "${session.soulSpace}" soul space

2. Model answers should:
   - Demonstrate genuine reflection
   - Show personal insight balanced with practical wisdom
   - Be authentic and vulnerable, not generic
   - Connect to the question meaningfully

3. Scoring should:
   - Depth: How much intellectual/emotional depth is shown (0-10)
   - Coherence: How well organized and logical (0-10)
   - Authenticity: How genuine and personal (0-10)
   - Openness: How receptive and non-defensive (0-10)
   - Range: Mostly 8-10, with variety

4. AI Feedback should:
   - Highlight the strongest elements
   - Show what makes the answer valuable
   - Be encouraging and specific
   - Reference exact phrases when possible

Generate ${session.noOfQuestions} questions now. Ensure each follows the format exactly.`;
  }

  /**
   * Parse questions from generated content with scoring and feedback
   * @param content - The generated content from Gemini
   * @returns Array of parsed question objects with scoring
   */
  private parseQuestionsWithScoring(content: string): QuestionData[] {
    const questions: QuestionData[] = [];

    // Try splitting by the separator first
    let blocks = content.split('═══════════════════════════════════════');

    // If separator not found, try alternate separators
    if (blocks.length <= 1) {
      console.log('Separator not found, trying alternate parsing...');
      blocks = content.split('Q');
      if (blocks.length > 1) {
        blocks = blocks.slice(1).map((b) => 'Q' + b); // Re-add Q prefix
      }
    }

    for (const block of blocks) {
      if (!block.trim()) continue;

      try {
        const questionData = this.parseQuestionBlock(block);
        if (questionData) {
          questions.push(questionData);
        }
      } catch (error) {
        // Log parsing error but continue with next question
        console.error('Error parsing question block:', error.message);
      }
    }

    return questions;
  }

  /**
   * Parse individual question block
   * @param block - A single question block
   * @returns Parsed question data or null
   */
  private parseQuestionBlock(block: string): QuestionData | null {
    const lines = block.split('\n').map((line) => line.trim());

    let question = '';
    let modelAnswer = '';
    let scoring = {
      depth: 0,
      coherence: 0,
      authenticity: 0,
      openness: 0,
    };
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
        // Parse scoring line - try multiple patterns
        let scoringMatch = line.match(
          /Depth:\s*(\d+)\/10\s*\|\s*Coherence:\s*(\d+)\/10\s*\|\s*Authenticity:\s*(\d+)\/10\s*\|\s*Openness:\s*(\d+)\/10/,
        );

        // If first pattern fails, try alternate patterns
        if (!scoringMatch) {
          scoringMatch = line.match(
            /Depth:\s*(\d+)\s*\|\s*Coherence:\s*(\d+)\s*\|\s*Authenticity:\s*(\d+)\s*\|\s*Openness:\s*(\d+)/,
          );
        }

        if (scoringMatch) {
          scoring = {
            depth: parseInt(scoringMatch[1], 10),
            coherence: parseInt(scoringMatch[2], 10),
            authenticity: parseInt(scoringMatch[3], 10),
            openness: parseInt(scoringMatch[4], 10),
          };
        } else {
          console.log('Could not parse scoring from line:', line);
        }
        continue;
      }

      if (line.includes('AI FEEDBACK:')) {
        currentSection = 'ai_feedback';
        continue;
      }

      // Collect content for each section
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
        if (modelAnswer) {
          modelAnswer += ' ' + line;
        } else {
          modelAnswer = line;
        }
      } else if (currentSection === 'ai_feedback' && line && line.length > 0) {
        // Remove quotes if present
        const cleanedLine = line.replace(/^["']|["']$/g, '');
        if (aiFeedback) {
          aiFeedback += ' ' + cleanedLine;
        } else {
          aiFeedback = cleanedLine;
        }
      }
    }

    // Validate that we have all required fields - be more lenient with scoring
    if (question && modelAnswer) {
      // Set default scoring if not found
      if (scoring.depth === 0) {
        console.log(
          'Warning: Using default scoring for question:',
          question.substring(0, 50),
        );
        scoring = {
          depth: 7,
          coherence: 7,
          authenticity: 7,
          openness: 7,
        };
      }

      // Set default feedback if not found
      if (!aiFeedback) {
        aiFeedback =
          'This response shows thoughtful consideration of the topic.';
      }

      return {
        question: question.trim(),
        modelAnswer: modelAnswer.trim(),
        scoring,
        aiFeedback: aiFeedback.trim(),
      };
    }

    console.log(
      'Block skipped - missing required fields. Q:',
      !!question,
      'MA:',
      !!modelAnswer,
    );
    return null;
  }
}
