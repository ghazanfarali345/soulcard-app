import { describe, expect, it, jest } from '@jest/globals';
import { GameSessionService } from './game-session.service';

describe('GameSessionService', () => {
  it('persists timerSeconds from the session details DTO', async () => {
    const sessionData = {
      soulSpace: 'Reflection',
      vibe: 'Calm',
      noOfPlayers: 1,
      difficultyLevel: 'Seeker',
      engagementMode: 'Reflective',
      engagement: 'guided',
      noOfQuestions: 3,
      timerSeconds: 60,
    };
    const save = jest.fn(async function (this: any) {
      return this;
    });
    const sessionModel = jest
      .fn<(data: any) => any>()
      .mockImplementation((data) => ({
        ...data,
        save,
      }));
    Object.assign(sessionModel, {
      exists: jest.fn<() => Promise<any>>().mockResolvedValue(null),
    });
    const service = new GameSessionService(
      sessionModel as any,
      {} as any,
      {} as any,
      {
        findById: jest
          .fn<() => Promise<any>>()
          .mockResolvedValue({ username: 'Host' }),
      } as any,
      {} as any,
      {} as any,
    );

    await service.createSessionDetails('507f1f77bcf86cd799439011', sessionData);

    expect(sessionModel).toHaveBeenCalledWith(
      expect.objectContaining({
        timerSeconds: 60,
        shareCode: expect.stringMatching(/^\d{6}$/),
      }),
    );
    expect(save).toHaveBeenCalled();
  });

  it('validates permanent share codes as well as unexpired OTP codes', async () => {
    const session = { status: 'INITIALIZED' };
    const findOne = jest
      .fn<() => Promise<any>>()
      .mockResolvedValueOnce(session);
    const service = new GameSessionService(
      { findOne } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    const shareCode = '123456';

    await expect(service.validateJoinCode(shareCode)).resolves.toBe(session);
    expect(findOne).toHaveBeenCalledWith({ shareCode });
  });

  it('falls back to a non-expired OTP when no share code matches', async () => {
    const session = { status: 'INITIALIZED' };
    const findOne = jest
      .fn<() => Promise<any>>()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(session);
    const service = new GameSessionService(
      { findOne } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(service.validateJoinCode('654321')).resolves.toBe(session);
    expect(findOne).toHaveBeenLastCalledWith({
      joinCode: '654321',
      joinCodeExpiresAt: { $gt: expect.any(Date) },
    });
  });

  it('returns timerSeconds in session details', async () => {
    const session = {
      participantsInfo: [],
      timerSeconds: 60,
      toObject: () => ({ participantsInfo: [], timerSeconds: 60 }),
    };
    const service = new GameSessionService(
      {
        findById: jest.fn<() => Promise<any>>().mockResolvedValue(session),
      } as any,
      {} as any,
      {} as any,
      {
        findByIds: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
      } as any,
      {} as any,
      {} as any,
    );

    const result = await service.getSessionById('session-1');

    expect(result.timerSeconds).toBe(60);
  });

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
      {
        findByIds: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
      } as any,
      { find: jest.fn().mockReturnValue(userAnswerQuery) } as any,
      {} as any,
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

  it('ends the session and notifies everyone when a non-host participant ends it', async () => {
    const session = {
      _id: 'session-1',
      hostId: 'host-1',
      participants: ['host-1', 'user-2', 'user-1'],
      participantsInfo: [
        { userId: 'host-1', displayName: 'Host', isCompleted: false },
        { userId: 'user-2', displayName: 'Player 2', isCompleted: false },
        { userId: 'user-1', displayName: 'Player 1', isCompleted: false },
      ],
      status: 'QUESTIONS_GENERATED',
      save: jest.fn(async function () {
        return this;
      }),
    };

    const sendPushNotification = jest.fn<
      (token: string, title: string, body: string, data?: any) => Promise<void>
    >(async () => undefined);

    const service = new GameSessionService(
      { findById: jest.fn(async () => session) } as any,
      { countDocuments: jest.fn(async () => 0) } as any,
      {} as any,
      {
        findByIds: jest.fn(async () => [
          {
            _id: 'host-1',
            fcmToken: 'host-token',
            fcmTokens: ['host-token', 'host-token-2'],
          },
          { _id: 'user-2', fcmToken: 'guest-token' },
          { _id: 'user-1', fcmToken: 'player-token' },
        ]),
        getFcmTokens: (user: any) =>
          Array.from(
            new Set([...(user.fcmTokens || []), user.fcmToken].filter(Boolean)),
          ),
      } as any,
      {} as any,
      { sendPushNotification } as any,
    );

    const result = await service.endSession('session-1', 'user-1');

    expect(result.status).toBe('COMPLETED');
    expect(result.participantsInfo[2].isCompleted).toBe(true);
    expect(sendPushNotification).toHaveBeenCalledTimes(4);
    expect(sendPushNotification.mock.calls.map(([token]) => token)).toEqual(
      expect.arrayContaining([
        'host-token',
        'host-token-2',
        'guest-token',
        'player-token',
      ]),
    );
  });
});
