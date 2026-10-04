import { Types } from 'mongoose';
import { UserAnswerService } from './user-answer.service';

describe('UserAnswerService trajectory', () => {
  it('filters score cards and sessions by range and compares with the prior period', async () => {
    const userId = new Types.ObjectId();
    const today = new Date();
    const todayUtc = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );
    const atUtcDay = (daysAgo: number) => {
      const date = new Date(todayUtc);
      date.setUTCDate(date.getUTCDate() - daysAgo);
      return date;
    };

    const fixtures = [
      { id: new Types.ObjectId(), daysAgo: 0, score: 80 },
      { id: new Types.ObjectId(), daysAgo: 1, score: 70 },
      { id: new Types.ObjectId(), daysAgo: 7, score: 50 },
      { id: new Types.ObjectId(), daysAgo: 8, score: 40 },
    ];
    const sessions = fixtures.map(({ id, daysAgo }) => ({
      _id: id,
      noOfQuestions: 2,
      updatedAt: atUtcDay(daysAgo),
      participantsInfo: [
        {
          userId,
          isCompleted: true,
          answersSubmitted: 2,
          skippedQuestions: [],
          completedAt: atUtcDay(daysAgo),
        },
      ],
    }));
    const results = fixtures.map(({ id, daysAgo, score }) => ({
      sessionId: id,
      completedAt: atUtcDay(daysAgo),
      finalResults: {
        overallScore: score,
        metrics: { reflective: 15, openness: 12, hiddenInternalMetric: 20 },
      },
    }));

    const service = new UserAnswerService(
      {
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest
              .fn()
              .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
          }),
        }),
      } as any,
      {
        find: jest.fn().mockReturnValue({
          lean: jest
            .fn()
            .mockReturnValue({ exec: jest.fn().mockResolvedValue(sessions) }),
        }),
      } as any,
      {} as any,
      {
        find: jest.fn().mockReturnValue({
          lean: jest
            .fn()
            .mockReturnValue({ exec: jest.fn().mockResolvedValue(results) }),
        }),
      } as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const data = await service.getTrajectory(userId.toString(), '7d');

    expect(data.currentScore).toBe(80);
    expect(data.highestRecordedScore).toEqual({ score: 80, date: atUtcDay(0) });
    expect(data.lowestRecordedScore).toEqual({ score: 70, date: atUtcDay(1) });
    expect(data.averageScore).toBe(75);
    expect(data.trend).toMatchObject({ direction: 'Improving', change: 30 });
    expect(data.totalSessionsCompleted).toBe(2);
    expect(data.currentStreak).toBe(2);
    expect(data.trajectory).toHaveLength(2);
    expect(data.whatYouAreExploring).toEqual(
      expect.arrayContaining([
        { area: 'Self-Awareness', averageScore: 15 },
        { area: 'Emotional Awareness', averageScore: 12 },
      ]),
    );
    expect(data.whatYouAreExploring).not.toEqual(
      expect.arrayContaining([
        { area: 'hiddenInternalMetric', averageScore: 20 },
      ]),
    );
  });

  it('rejects unsupported date ranges', async () => {
    const service = new UserAnswerService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.getTrajectory('507f1f77bcf86cd799439011', '14d'),
    ).rejects.toThrow('Range must be one of 7d, 30d, 90d, 1y, or all');
  });

  it('derives a score from persisted answers when no session result exists', async () => {
    const userId = new Types.ObjectId();
    const sessionId = new Types.ObjectId();
    const completedAt = new Date();
    const session = {
      _id: sessionId,
      noOfQuestions: 2,
      participantsInfo: [
        {
          userId,
          isCompleted: true,
          answersSubmitted: 2,
          skippedQuestions: [],
          completedAt,
        },
      ],
    };
    const answers = [
      {
        sessionId,
        score: { similarityScore: 70, metrics: { reflective: 12 } },
      },
      {
        sessionId,
        score: { similarityScore: 81, metrics: { reflective: 18 } },
      },
    ];
    const service = new UserAnswerService(
      {
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest
              .fn()
              .mockReturnValue({ exec: jest.fn().mockResolvedValue(answers) }),
          }),
        }),
      } as any,
      {
        find: jest.fn().mockReturnValue({
          lean: jest
            .fn()
            .mockReturnValue({ exec: jest.fn().mockResolvedValue([session]) }),
        }),
      } as any,
      {} as any,
      {
        find: jest.fn().mockReturnValue({
          lean: jest
            .fn()
            .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
        }),
      } as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const data = await service.getTrajectory(userId.toString(), '30d');

    expect(data.currentScore).toBe(76);
    expect(data.averageScore).toBe(76);
    expect(data.totalSessionsCompleted).toBe(1);
    expect(data.whatYouAreExploring).toContainEqual({
      area: 'Self-Awareness',
      averageScore: 15,
    });
  });
});
