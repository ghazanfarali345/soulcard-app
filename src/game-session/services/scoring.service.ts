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
  constructiveFeedback: string; // Encouraging feedback to prompt deeper reflection
  guidedInsight: string; // Personalized feedback on the answer
}

@Injectable()
export class ScoringService {
  constructor(private geminiService: GeminiService) {}

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

      const scoringPrompt = this.buildScoringPrompt(userAnswer, modelAnswer);
      const scoringResponse =
        await this.geminiService.generateContent(scoringPrompt);
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

3. CONSTRUCTIVE FEEDBACK (1-2 sentences):
   If the answer seems brief or lacking depth, provide encouraging feedback to prompt deeper reflection.
   Suggest what additional perspective or detail could enrich their answer.
   Return as: Constructive Feedback: [Your feedback text]

4. GUIDED INSIGHT (1-2 sentences):
   Provide personalized, deeper feedback that helps the user understand their answer better.
   Focus on what they did well and one area for deeper reflection.
   Return as: Guided Insight: [Your insight text]

FORMAT YOUR RESPONSE EXACTLY AS:
Similarity Score: [NUMBER]
Reflective: [NUMBER]
Coherence: [NUMBER]
Openness: [NUMBER]
Authenticity: [NUMBER]
Constructive Feedback: [Your feedback text]
Guided Insight: [Your insight text]

Remember: Be fair but honest. Similarity can be high even if slightly different wording. Score authenticity and openness based on emotional genuineness, not just words.`;
  }

  private parseScoringResponse(response: string): ScoringResult {
    try {
      console.log('=== SCORING RESPONSE ===');
      console.log('Full response:', response);
      console.log('=== END RESPONSE ===');

      const lines = response.split('\n');

      let similarityScore: number | null = null;
      let constructiveFeedback: string | null = null;
      let guidedInsight: string | null = null;
      let metrics = {
        reflective: 0,
        coherence: 0,
        openness: 0,
        authenticity: 0,
      };

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine) continue;

        console.log('Processing line:', trimmedLine);

        // Parse Similarity Score
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

        // Parse Reflective
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

        // Parse Coherence
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

        // Parse Openness
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

        // Parse Authenticity
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

        // Parse Constructive Feedback
        if (trimmedLine.toLowerCase().includes('constructive feedback')) {
          const match = trimmedLine.match(/constructive feedback:\s*(.+)/i);
          if (match && match[1]) {
            constructiveFeedback = match[1].trim();
            console.log(
              '✓ Parsed Constructive Feedback:',
              constructiveFeedback,
            );
          }
        }

        // Parse Guided Insight
        if (trimmedLine.toLowerCase().includes('guided insight')) {
          const match = trimmedLine.match(/guided insight:\s*(.+)/i);
          if (match && match[1]) {
            guidedInsight = match[1].trim();
            console.log('✓ Parsed Guided Insight:', guidedInsight);
          }
        }
      }

      // Defaults if not found
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

      if (!constructiveFeedback) {
        console.warn('⚠ Constructive feedback not found, using default');
        constructiveFeedback =
          'Try to elaborate further — sharing a specific example or memory could make your answer even more meaningful.';
      }

      if (!guidedInsight) {
        console.warn('⚠ Guided insight not found, using default feedback');
        guidedInsight =
          'Your response shows your perspective. Consider exploring the model answer to deepen your understanding of this question.';
      }

      console.log('Final parsed scores:', {
        similarityScore,
        metrics,
        constructiveFeedback,
        guidedInsight,
      });

      return {
        similarityScore,
        metrics,
        constructiveFeedback,
        guidedInsight,
      };
    } catch (error) {
      console.error('Scoring parse error:', error);
      throw new HttpException(
        `Error parsing scoring response: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  calculateAggregateScores(allScores: ScoringResult[]) {
    if (allScores.length === 0) {
      throw new HttpException('No scores to aggregate', HttpStatus.BAD_REQUEST);
    }

    const overallScore =
      allScores.reduce((sum, score) => sum + score.similarityScore, 0) /
      allScores.length;

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
