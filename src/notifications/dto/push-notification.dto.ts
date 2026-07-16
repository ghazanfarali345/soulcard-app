import { IsNotEmpty, IsOptional, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PushNotificationDto {
  @ApiProperty({
    description:
      'Event type identifier (used by frontend to handle the notification)',
    example: 'participant_joined',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Notification body text',
    example: 'You have a new invite to play',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'Optional notification title',
    example: 'Game Invite',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'FCM device token to send the notification to',
    example: 'fcm_token_abc123',
    required: false,
  })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiProperty({
    description:
      'Optional arbitrary data payload delivered with the notification',
    example: { gameId: 'abc123' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
