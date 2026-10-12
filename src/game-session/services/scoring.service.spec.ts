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
            'Substantive Response: YES',
            'Similarity Score: 80',
            'Reflective: 17',
            'Coherence: 13',
            'Authenticity: 18',
            'Openness: 11',
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
    expect(result.isSubstantive).toBe(true);
    expect(result.metrics).toEqual({
      reflective: 17,
      coherence: 13,
      authenticity: 18,
      openness: 11,
    });
  });

  it('does not assign scores to an insufficient response', async () => {
    const geminiService = {
      generateContent: jest
        .fn<(prompt: string) => Promise<string>>()
        .mockResolvedValue(
          [
            'Substantive Response: NO',
            'Similarity Score: 72',
            'Reflective: 14',
            'Coherence: 14',
            'Authenticity: 14',
            'Openness: 14',
            'Constructive Feedback: Please share more about your thoughts.',
            'Guided Insight: I could explain what I am unsure about.',
          ].join('\n'),
        ),
    };
    const service = new ScoringService(geminiService as any);

    const result = await service.scoreAnswer(
      'test, asas, dot',
      'A thoughtful response with a relevant example.',
      EngagementMode.REFLECTIVE,
      'guided',
      'What did you learn?',
    );

    expect(result.isSubstantive).toBe(false);
    expect(result.similarityScore).toBe(0);
    expect(Object.values(result.metrics)).toEqual([0, 0, 0, 0]);
  });

  it.each(['Not sure', "I don't know", '0', 'test, asas, dot, ETC'])(
    'sends "%s" to AI for content classification and honors its insufficient result',
    async (answer) => {
      const geminiService = {
        generateContent: jest
          .fn<(prompt: string) => Promise<string>>()
          .mockResolvedValue(
            [
              'Substantive Response: NO',
              'Similarity Score: 72',
              'Reflective: 14',
              'Coherence: 14',
              'Authenticity: 14',
              'Openness: 14',
              'Constructive Feedback: Please share a relevant thought.',
              'Guided Insight: I could add more detail.',
            ].join('\n'),
          ),
      };
      const service = new ScoringService(geminiService as any);

      const result = await service.scoreAnswer(
        answer,
        'A thoughtful response with a relevant example.',
        EngagementMode.REFLECTIVE,
        'guided',
        'What did you learn?',
      );

      expect(result.isSubstantive).toBe(false);
      expect(result.similarityScore).toBe(0);
      expect(Object.values(result.metrics)).toEqual([0, 0, 0, 0]);
      expect(geminiService.generateContent).toHaveBeenCalledTimes(1);
      expect(geminiService.generateContent.mock.calls[0][0]).toContain(
        `USER ANSWER (TO BE SCORED):\n"${answer}"`,
      );
      expect(geminiService.generateContent.mock.calls[0][0]).toContain(
        'Do not classify by matching individual words or phrases',
      );
    },
  );

  it('allows AI to score an answer containing a word often used as placeholder text', async () => {
    const geminiService = {
      generateContent: jest
        .fn<(prompt: string) => Promise<string>>()
        .mockResolvedValue(
          [
            'Substantive Response: YES',
            'Similarity Score: 84',
            'Reflective: 17',
            'Coherence: 16',
            'Authenticity: 15',
            'Openness: 18',
            'Constructive Feedback: You explain the purpose clearly.',
            'Guided Insight: I can check whether the test measures what it is meant to.',
          ].join('\n'),
        ),
    };
    const service = new ScoringService(geminiService as any);
    const answer =
      'A test is meaningful when it measures what it was designed to measure.';

    const result = await service.scoreAnswer(
      answer,
      'A useful evaluation checks whether a process meets its intended goal.',
      EngagementMode.REFLECTIVE,
      'guided',
      'What makes a test meaningful?',
    );

    expect(result.isSubstantive).toBe(true);
    expect(result.similarityScore).toBe(84);
    expect(geminiService.generateContent.mock.calls[0][0]).toContain(answer);
  });

  it('aggregates only substantive answers and preserves zero metric values', () => {
    const service = new ScoringService({} as any);

    const result = service.calculateAggregateScores([
      {
        similarityScore: 80,
        metrics: { reflective: 0, coherence: 13 },
        isSubstantive: true,
        constructiveFeedback: '',
      },
      {
        similarityScore: 0,
        metrics: { reflective: 0, coherence: 0 },
        isSubstantive: false,
        constructiveFeedback: '',
      },
    ]);

    expect(result).toEqual({
      overallScore: 80,
      metrics: { reflective: 0, coherence: 13 },
    });
  });
});
