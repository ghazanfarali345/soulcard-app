import { describe, expect, it, jest } from '@jest/globals';
import { EngagementMode } from '../engagement-mode.config';
import { ScoringService } from './scoring.service';

describe('ScoringService', () => {
  it('generates Guided Insight as a grounded first-person response to the question', async () => {
    let generatedPrompt = '';
    const geminiService = {
      generateContent: jest
        .fn<(prompt: string) => Promise<string>>()
        .mockImplementation(async (prompt) => {
          generatedPrompt = prompt;
          return [
            'Similarity Score: 80',
            'Reflective: 16',
            'Coherence: 16',
            'Authenticity: 16',
            'Openness: 16',
            'Constructive Feedback: Your answer identifies a useful idea.',
            'Guided Insight: I could pause before responding and consider how my choices affect others.',
          ].join('\n');
        }),
    };
    const service = new ScoringService(geminiService as any);

    const result = await service.scoreAnswer(
      'I try to be thoughtful.',
      'I try to consider the impact of my choices before acting.',
      EngagementMode.REFLECTIVE,
      'guided',
      'How can you make more thoughtful choices?',
    );

    expect(generatedPrompt).toContain(
      '"How can you make more thoughtful choices?"',
    );
    expect(generatedPrompt).toContain(
      'Write it in first person, directly answer the question',
    );
    expect(generatedPrompt).toMatch(/invent personal experiences or facts/i);
    expect(result.guidedInsight).toBe(
      'I could pause before responding and consider how my choices affect others.',
    );
  });
});
