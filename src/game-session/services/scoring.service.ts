import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GeminiService } from '../../gemini/gemini.service';

export interface ScoringResult {
  similarityScore: number; // 0-100
  metrics: {
    reflective: number; // 0-20
    coherence: number; // 0-20
    openness: number; // 0-20
    authenticity: number; // 0-20
  };
}

@Injectable()
export class ScoringService {
  constructor(private geminiService: GeminiService) {}

  /**
   * Score user answer against model answer
   * @param userAnswer - The user's answer
   * @param modelAnswer - The ideal model answer
   * @returns Scoring result with similarity score and metrics
   */
  async scoreAnswer(
    userAnswer: string,
    modelAnswer: string,
  ): Promise<ScoringResult> {
    try {
      if (!userAnswer || !modelAnswer) {
        throw new HttpException(
          'User answer and model answer are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create a prompt for scoring
      const scoringPrompt = this.buildScoringPrompt(userAnswer, modelAnswer);

      // Get scoring from Gemini
      const scoringResponse =
        await this.geminiService.generateContent(scoringPrompt);

      // Parse the response
      const result = this.parseScoringResponse(scoringResponse);

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error scoring answer: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Build prompt for AI scoring
   * @param userAnswer - User's answer
   * @param modelAnswer - Model answer
   * @returns Formatted prompt
   */
  private buildScoringPrompt(userAnswer: string, modelAnswer: string): string {
    return `You are an expert evaluator. Score the following user answer against the model answer.

MODEL ANSWER (IDEAL RESPONSE):
"${modelAnswer}"

USER ANSWER (TO BE SCORED):
"${userAnswer}"

Please provide:

1. SIMILARITY SCORE (0-100):
   How closely does the user's answer match the quality and substance of the model answer?
   Consider: relevance, depth of insight, alignment with core ideas.
   Return as: Similarity Score: [NUMBER]

2. QUALITY METRICS (Each 0-20):
   
   Reflective (0-20): How deep and thoughtful is the answer? Does it show genuine reflection?
   Return as: Reflective: [NUMBER]
   
   Coherence (0-20): How well organized and clear is the answer? Does it flow logically?
   Return as: Coherence: [NUMBER]
   
   Openness (0-20): How receptive and vulnerable is the answer? Does it show genuine openness?
   Return as: Openness: [NUMBER]
   
   Authenticity (0-20): How genuine and personal is the answer? Does it feel real and honest?
   Return as: Authenticity: [NUMBER]

FORMAT YOUR RESPONSE EXACTLY AS:
Similarity Score: [NUMBER]
Reflective: [NUMBER]
Coherence: [NUMBER]
Openness: [NUMBER]
Authenticity: [NUMBER]

Remember: Be fair but honest. Similarity can be high even if slightly different wording. Score authenticity and openness based on emotional genuineness, not just words.`;
  }

  /**
   * Parse scoring response from Gemini
   * @param response - Raw response from Gemini
   * @returns Structured scoring result
   */
  private parseScoringResponse(response: string): ScoringResult {
    try {
      console.log('=== SCORING RESPONSE ===');
      console.log('Full response:', response);
      console.log('=== END RESPONSE ===');

      const lines = response.split('\n');

      let similarityScore: number | null = null;
      let metrics = {
        reflective: 0,
        coherence: 0,
        openness: 0,
        authenticity: 0,
      };

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine) continue; // Skip empty lines

        console.log('Processing line:', trimmedLine);

        // Parse Similarity Score - try multiple patterns
        if (trimmedLine.toLowerCase().includes('similarity')) {
          let match = trimmedLine.match(/:\s*(\d+)/);
          if (!match) match = trimmedLine.match(/(\d+)/);
          if (match) {
            similarityScore = Math.min(
              100,
              Math.max(0, parseInt(match[1], 10)),
            );
            console.log('✓ Parsed Similarity Score:', similarityScore);
          }
        }

        // Parse Reflective - try multiple patterns
        if (trimmedLine.toLowerCase().includes('reflective')) {
          let match = trimmedLine.match(/:\s*(\d+)/);
          if (!match) match = trimmedLine.match(/(\d+)/);
          if (match) {
            metrics.reflective = Math.min(
              20,
              Math.max(0, parseInt(match[1], 10)),
            );
            console.log('✓ Parsed Reflective:', metrics.reflective);
          }
        }

        // Parse Coherence - try multiple patterns
        if (trimmedLine.toLowerCase().includes('coherence')) {
          let match = trimmedLine.match(/:\s*(\d+)/);
          if (!match) match = trimmedLine.match(/(\d+)/);
          if (match) {
            metrics.coherence = Math.min(
              20,
              Math.max(0, parseInt(match[1], 10)),
            );
            console.log('✓ Parsed Coherence:', metrics.coherence);
          }
        }

        // Parse Openness - try multiple patterns
        if (trimmedLine.toLowerCase().includes('openness')) {
          let match = trimmedLine.match(/:\s*(\d+)/);
          if (!match) match = trimmedLine.match(/(\d+)/);
          if (match) {
            metrics.openness = Math.min(
              20,
              Math.max(0, parseInt(match[1], 10)),
            );
            console.log('✓ Parsed Openness:', metrics.openness);
          }
        }

        // Parse Authenticity - try multiple patterns
        if (trimmedLine.toLowerCase().includes('authenticity')) {
          let match = trimmedLine.match(/:\s*(\d+)/);
          if (!match) match = trimmedLine.match(/(\d+)/);
          if (match) {
            metrics.authenticity = Math.min(
              20,
              Math.max(0, parseInt(match[1], 10)),
            );
            console.log('✓ Parsed Authenticity:', metrics.authenticity);
          }
        }
      }

      // Use defaults if not found
      if (similarityScore === null) {
        console.warn('⚠ Similarity score not found, using default value 65');
        similarityScore = 65;
      }

      if (metrics.reflective === 0) {
        console.warn('⚠ Reflective not found, using default value 14');
        metrics.reflective = 14;
      }

      if (metrics.coherence === 0) {
        console.warn('⚠ Coherence not found, using default value 14');
        metrics.coherence = 14;
      }

      if (metrics.openness === 0) {
        console.warn('⚠ Openness not found, using default value 14');
        metrics.openness = 14;
      }

      if (metrics.authenticity === 0) {
        console.warn('⚠ Authenticity not found, using default value 14');
        metrics.authenticity = 14;
      }

      console.log('Final parsed scores:', {
        similarityScore,
        metrics,
      });

      return {
        similarityScore,
        metrics,
      };
    } catch (error) {
      console.error('Scoring parse error:', error);
      throw new HttpException(
        `Error parsing scoring response: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Calculate aggregate scores from multiple per-question scores
   * @param allScores - Array of scores from all questions
   * @returns Final aggregate scores
   */
  calculateAggregateScores(allScores: ScoringResult[]) {
    if (allScores.length === 0) {
      throw new HttpException('No scores to aggregate', HttpStatus.BAD_REQUEST);
    }

    // Calculate overall score as average of similarity scores
    const overallScore =
      allScores.reduce((sum, score) => sum + score.similarityScore, 0) /
      allScores.length;

    // Calculate metric averages
    const reflective =
      allScores.reduce((sum, score) => sum + score.metrics.reflective, 0) /
      allScores.length;

    const coherence =
      allScores.reduce((sum, score) => sum + score.metrics.coherence, 0) /
      allScores.length;

    const openness =
      allScores.reduce((sum, score) => sum + score.metrics.openness, 0) /
      allScores.length;

    const authenticity =
      allScores.reduce((sum, score) => sum + score.metrics.authenticity, 0) /
      allScores.length;

    return {
      overallScore: Math.round(overallScore),
      metrics: {
        reflective: Math.round(reflective),
        coherence: Math.round(coherence),
        openness: Math.round(openness),
        authenticity: Math.round(authenticity),
      },
    };
  }
}
