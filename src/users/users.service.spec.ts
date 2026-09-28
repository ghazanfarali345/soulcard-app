import { describe, expect, it, jest } from '@jest/globals';
import { UsersService } from './users.service';

describe('UsersService device tokens', () => {
  it('returns unique tokens from legacy and multi-device fields', () => {
    const service = new UsersService({} as any);

    expect(
      service.getFcmTokens({
        fcmToken: 'legacy-token',
        fcmTokens: ['legacy-token', 'device-token'],
      }),
    ).toEqual(['legacy-token', 'device-token']);
  });

  it('adds a device token without replacing existing device tokens', async () => {
    const user = { _id: 'user-1', fcmTokens: ['existing-token', 'new-token'] };
    const findByIdAndUpdate = jest.fn(async () => user);
    const service = new UsersService({ findByIdAndUpdate } as any);

    await service.addFcmToken('user-1', 'new-token');

    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      'user-1',
      { $addToSet: { fcmTokens: 'new-token' } },
      { new: true },
    );
  });
});
