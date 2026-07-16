import { Body, Controller, HttpCode, HttpStatus, Post, BadRequestException } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { PushNotificationDto } from './dto/push-notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('push')
  @ApiOperation({ summary: 'Send a push notification (generic)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        trigger: { type: 'string', example: 'game.invite' },
        body: { type: 'string', example: 'You have a new invite to play' },
        title: { type: 'string', example: 'Game Invite' },
        token: { type: 'string', example: 'fcm_token_abc123' },
        data: { type: 'object', example: { gameId: 'abc123' } },
      },
      required: ['trigger', 'body'],
    },
  })
  @ApiResponse({ status: 200, description: 'Notification queued/sent', schema: { example: { success: true } } })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @HttpCode(HttpStatus.OK)
  async push(@Body() dto: PushNotificationDto) {
    const token = dto.token;
    if (!token) throw new BadRequestException('token is required');

    const title = dto.title || dto.trigger;
    const body = dto.body;
    const data = dto.data || { trigger: dto.trigger };

    await this.notificationsService.sendPushNotification(token, title, body, data);

    return { success: true };
  }
}
