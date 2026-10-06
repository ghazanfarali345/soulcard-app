import { describe, expect, it, jest } from '@jest/globals';
import { InvitationService } from './invitation.service';
import { SessionStatus } from '../entities/session.entity';

describe('InvitationService.createInvitation', () => {
  it('uses the session share code instead of generating another code', async () => {
    const save = jest.fn(async function (this: any) {
      return this;
    });
    const invitationModel = jest
      .fn<(data: any) => any>()
      .mockImplementation((data) => ({ ...data, save }));
    const shareCode = '123456';
    const generateJoinCode = jest.fn();
    const service = new InvitationService(
      invitationModel as any,
      {
        findById: jest.fn<() => Promise<any>>().mockResolvedValue({
          hostId: { toString: () => 'host-id' },
          shareCode,
        }),
      } as any,
      { generateJoinCode } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const invitation = await service.createInvitation(
      '507f1f77bcf86cd799439011',
      'host-id',
    );

    expect(invitation.code).toBe(shareCode);
    expect(invitation.expiresAt).toBeUndefined();
    expect(generateJoinCode).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
  });
});

describe('InvitationService.acceptInvitation', () => {
  it('rejects joining a completed session with a share code', async () => {
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
