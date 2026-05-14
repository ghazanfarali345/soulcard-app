import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GeminiService } from '../../gemini/gemini.service';
import {
  EngagementMode,
  ENGAGEMENT_MODE_CONFIG,
} from '../engagement-mode.config';

export interface ScoringResult {
  similarityScore: number; // 0-100
  metrics: Record<string, number>; // Dynamic metrics based on engagement mode
  constructiveFeedback: string; // Encouraging feedback to prompt deeper reflection
  guidedInsight: string; // Personalized feedback on the answer
}

export interface ReflectiveInsights {
  reflectiveStrengths: string;
  deepeningAwareness: string;
  whatThisMeans: string;
  nextBestAction: string;
  personalizedRecommendations: string[];
}

@Injectable()
export class ScoringService {
  constructor(private geminiService: GeminiService) {}

  async scoreAnswer(
    userAnswer: string,
    modelAnswer: string,
    engagementMode: EngagementMode = EngagementMode.REFLECTIVE,
  ): Promise<ScoringResult> {
    try {
      if (!userAnswer || !modelAnswer) {
        throw new HttpException(
          'User answer and model answer are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const scoringPrompt = this.buildScoringPrompt(
        userAnswer,
        modelAnswer,
        engagementMode,
      );
      const scoringResponse =
        await this.geminiService.generateContent(scoringPrompt);
      const result = this.parseScoringResponse(scoringResponse, engagementMode);

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

  private buildScoringPrompt(
    userAnswer: string,
    modelAnswer: string,
    engagementMode: EngagementMode,
  ): string {
    const config = ENGAGEMENT_MODE_CONFIG[engagementMode];
    const parametersPrompt = config.parameters
      .map(
        (p) =>
          `${p.name} (0-20): ${p.description}\n   Return as: ${p.name}: [NUMBER]`,
      )
      .join('\n\n   ');

    const formatPrompt = config.parameters
      .map((p) => `${p.name}: [NUMBER]`)
      .join('\n');

    return `You are an expert evaluator acting as a ${config.guidanceLayer}. Score the following user answer against the model answer.
Engagement Mode: ${engagementMode}
Guidance Style: ${config.guidanceLayer} (${config.reason})

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
   
   ${parametersPrompt}

3. CONSTRUCTIVE FEEDBACK (1-2 sentences):
   Provide encouraging feedback in your capacity as a ${config.guidanceLayer}.
   If the answer seems brief or lacking depth, prompt deeper reflection aligned with ${engagementMode} goals.
   Return as: Constructive Feedback: [Your feedback text]

4. GUIDED INSIGHT (1-2 sentences):
   Provide personalized, deeper feedback that helps the user understand their answer better.
   Focus on what they did well and one area for deeper reflection or growth.
   Return as: Guided Insight: [Your insight text]

FORMAT YOUR RESPONSE EXACTLY AS:
Similarity Score: [NUMBER]
${formatPrompt}
Constructive Feedback: [Your feedback text]
Guided Insight: [Your insight text]

Remember: Be fair but honest. Similarity can be high even if slightly different wording. Score the metrics based on the definitions provided above for the ${engagementMode} mode.`;
  }

  private parseScoringResponse(
    response: string,
    engagementMode: EngagementMode,
  ): ScoringResult {
    try {
      const config = ENGAGEMENT_MODE_CONFIG[engagementMode];
      const lines = response.split('\n');

      let similarityScore: number | null = null;
      let constructiveFeedback: string | null = null;
      let guidedInsight: string | null = null;
      const metrics: Record<string, number> = {};

      // Initialize metrics with default 0
      config.parameters.forEach((p) => {
        metrics[p.name.toLowerCase()] = 0;
      });

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Parse Similarity Score
        if (trimmedLine.toLowerCase().includes('similarity')) {
          const match = trimmedLine.match(/:\s*(\d+)/) || trimmedLine.match(/(\d+)/);
          if (match) {
            similarityScore = Math.min(100, Math.max(0, parseInt(match[1], 10)));
          }
        }

        // Parse dynamic metrics
        for (const p of config.parameters) {
          if (trimmedLine.toLowerCase().startsWith(p.name.toLowerCase())) {
            const match = trimmedLine.match(/:\s*(\d+)/) || trimmedLine.match(/(\d+)/);
            if (match) {
              metrics[p.name.toLowerCase()] = Math.min(
                20,
                Math.max(0, parseInt(match[1], 10)),
              );
            }
          }
        }

        // Parse Constructive Feedback
        if (trimmedLine.toLowerCase().includes('constructive feedback')) {
          const match = trimmedLine.match(/constructive feedback:\s*(.+)/i);
          if (match && match[1]) {
            constructiveFeedback = match[1].trim();
          }
        }

        // Parse Guided Insight
        if (trimmedLine.toLowerCase().includes('guided insight')) {
          const match = trimmedLine.match(/guided insight:\s*(.+)/i);
          if (match && match[1]) {
            guidedInsight = match[1].trim();
          }
        }
      }

      // Defaults if not found
      if (similarityScore === null) similarityScore = 65;
      
      config.parameters.forEach((p) => {
        const key = p.name.toLowerCase();
        if (metrics[key] === 0) metrics[key] = 14;
      });

      if (!constructiveFeedback) {
        constructiveFeedback = 'Try to elaborate further — sharing a specific example or memory could make your answer even more meaningful.';
      }

      if (!guidedInsight) {
        guidedInsight = 'Your response shows your perspective. Consider exploring the model answer to deepen your understanding of this question.';
      }

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

    // Get all metric keys from the first score
    const metricKeys = Object.keys(allScores[0].metrics);
    const aggregateMetrics: Record<string, number> = {};

    metricKeys.forEach((key) => {
      const sum = allScores.reduce((s, score) => s + (score.metrics[key] || 0), 0);
      aggregateMetrics[key] = Math.round(sum / allScores.length);
    });

    return {
      overallScore: Math.round(overallScore),
      metrics: aggregateMetrics,
    };
  }

  async generateReflectiveInsights(
    overallScore: number,
    metrics: Record<string, number>,
    context: { soulSpace: string; vibe: string; engagementMode: EngagementMode },
  ): Promise<ReflectiveInsights> {
    try {
      const config = ENGAGEMENT_MODE_CONFIG[context.engagementMode];
      const metricsList = Object.entries(metrics)
        .map(([key, value]) => `- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}/20`)
        .join('\n');

      const prompt = `You are a deeply empathetic and insightful ${config.guidanceLayer}. Analyze the following results from a "Soul Card Game" session and provide personalized, narrative feedback.
Engagement Mode: ${context.engagementMode}
Guidance Layer: ${config.guidanceLayer}

SESSION CONTEXT:
- Soul Space: ${context.soulSpace}
- Vibe: ${context.vibe}

AGGREGATE SCORES:
- Overall Score: ${overallScore}/100
${metricsList}

Please generate exactly 5 fields. Use a tone that is encouraging, authentic, and growth-oriented, reflecting your role as a ${config.guidanceLayer}.

1. REFLECTIVE STRENGTHS:
   Write 2-3 sentences about what the user did well in this ${context.engagementMode} journey. Acknowledge their participation as a major first step. Reference specific strong metrics (score > 15/20).

2. DEEPENING AWARENESS:
   Identify one area for growth (the lowest score). Provide 2-3 sentences about how they can improve. Include 2-3 specific strategies (bullet points starting with →). Use the exact phrases like "To enhance your ${context.engagementMode === EngagementMode.LEARNING ? 'mastery' : 'self-awareness'}, consider focusing on [Area Name]".

3. WHAT THIS MEANS:
   Provide a 1-2 sentence interpretation of their overall performance. Assign a "Growth Level" (e.g., Opening Awareness, Emerging Awareness, Deepening Awareness).

4. NEXT BEST ACTION:
   A single, powerful sentence recommending one thing they should do immediately to continue their journey.

5. PERSONALIZED RECOMMENDATIONS:
   Provide 3-5 specific, actionable bullet-point recommendations (starting with •) relevant to the ${context.engagementMode} mode.

FORMAT YOUR RESPONSE EXACTLY AS:
REFLECTIVE STRENGTHS: [Text]
DEEPENING AWARENESS: [Text with bullet points]
WHAT THIS MEANS: [Text]
NEXT BEST ACTION: [Text]
PERSONALIZED RECOMMENDATIONS:
• [Recommendation 1]
• [Recommendation 2]
• [Recommendation 3]
`;

      const response = await this.geminiService.generateContent(prompt);
      return this.parseReflectiveInsights(response);
    } catch (error) {
      console.error('Error generating reflective insights:', error);
      return {
        reflectiveStrengths: 'You showed up and participated, which is the most important step!',
        deepeningAwareness: 'Every journey of self-discovery has areas to explore further.',
        whatThisMeans: 'You are on a journey of growth.',
        nextBestAction: 'Continue holding space for what arises.',
        personalizedRecommendations: [
          'Practice regular reflection',
          'Explore different themes',
          'Be patient with your growth journey',
        ],
      };
    }
  }

  private parseReflectiveInsights(response: string): ReflectiveInsights {
    const lines = response.split('\n').map((l) => l.trim());
    let reflectiveStrengths = '';
    let deepeningAwareness = '';
    let whatThisMeans = '';
    let nextBestAction = '';
    const personalizedRecommendations: string[] = [];

    let currentSection = '';

    for (const line of lines) {
      if (!line) continue;

      if (line.startsWith('REFLECTIVE STRENGTHS:')) {
        currentSection = 'strengths';
        reflectiveStrengths = line.replace('REFLECTIVE STRENGTHS:', '').trim();
      } else if (line.startsWith('DEEPENING AWARENESS:')) {
        currentSection = 'awareness';
        deepeningAwareness = line.replace('DEEPENING AWARENESS:', '').trim();
      } else if (line.startsWith('WHAT THIS MEANS:')) {
        currentSection = 'meaning';
        whatThisMeans = line.replace('WHAT THIS MEANS:', '').trim();
      } else if (line.startsWith('NEXT BEST ACTION:')) {
        currentSection = 'action';
        nextBestAction = line.replace('NEXT BEST ACTION:', '').trim();
      } else if (line.startsWith('PERSONALIZED RECOMMENDATIONS:')) {
        currentSection = 'recommendations';
      } else {
        if (currentSection === 'strengths') {
          reflectiveStrengths += ' ' + line;
        } else if (currentSection === 'awareness') {
          deepeningAwareness += '\n' + line;
        } else if (currentSection === 'meaning') {
          whatThisMeans += ' ' + line;
        } else if (currentSection === 'action') {
          nextBestAction += ' ' + line;
        } else if (currentSection === 'recommendations' && (line.startsWith('•') || line.startsWith('-'))) {
          personalizedRecommendations.push(line.substring(1).trim());
        }
      }
    }

    return {
      reflectiveStrengths: reflectiveStrengths.trim(),
      deepeningAwareness: deepeningAwareness.trim(),
      whatThisMeans: whatThisMeans.trim(),
      nextBestAction: nextBestAction.trim(),
      personalizedRecommendations: personalizedRecommendations.length > 0 
        ? personalizedRecommendations 
        : ['Continue your reflection journey'],
    };
  }
}
