import { describe, expect, it, jest } from '@jest/globals';
import { InvitationService } from './invitation.service';
import { SessionStatus } from '../entities/session.entity';

describe('InvitationService.acceptInvitation', () => {
  it('rejects joining a completed session', async () => {
    const service = new InvitationService(
      {} as any,
      {} as any,
      {
        validateJoinCode: jest.fn<() => Promise<any>>().mockResolvedValue({
          status: SessionStatus.COMPLETED,
          participants: [],
          participantsInfo: [],
        }),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.acceptInvitation('123456', '507f1f77bcf86cd799439011', 'Player'),
    ).rejects.toMatchObject({
      status: 400,
      response: 'This session has ended and is no longer accepting players',
    });
  });
});
