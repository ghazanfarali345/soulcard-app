import { describe, expect, it, jest } from '@jest/globals';
import { GameSessionService } from './game-session.service';

describe('GameSessionService.getSessionsByUser', () => {
  it('returns questions and submitted answers for each session history item', async () => {
    const sessionQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn<() => Promise<any[]>>().mockResolvedValue([
        {
          _id: 'session-1',
          soulSpace: 'Reflection',
          vibe: 'Calm',
          status: 'COMPLETED',
          noOfQuestions: 1,
          engagement: 'guided',
          engagementMode: 'self',
          hostId: 'host-user',
          participants: ['host-user'],
          participantsInfo: [{ userId: 'host-user', displayName: 'Host' }],
          questions: [{ questionNumber: 1, question: 'Why do you reflect?' }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    };

    const userAnswerQuery = {
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn<() => Promise<any[]>>().mockResolvedValue([
        {
          sessionId: 'session-1',
          questionNumber: 1,
          question: 'Why do you reflect?',
          userAnswer: 'To understand myself better',
          modelAnswer: 'To learn more about your inner world',
        },
      ]),
    };

    const service = new GameSessionService(
      { find: jest.fn().mockReturnValue(sessionQuery) } as any,
      {} as any,
      {} as any,
      { findByIds: jest.fn<() => Promise<any[]>>().mockResolvedValue([]) } as any,
      { find: jest.fn().mockReturnValue(userAnswerQuery) } as any,
    );

    const result = await service.getSessionsByUser('507f1f77bcf86cd799439011');

    expect(result[0].questions).toEqual([
      { questionNumber: 1, question: 'Why do you reflect?' },
    ]);
    expect(result[0].questionAnswers).toEqual([
      {
        questionNumber: 1,
        question: 'Why do you reflect?',
        answer: 'To understand myself better',
        modelAnswer: 'To learn more about your inner world',
      },
    ]);
  });
});
