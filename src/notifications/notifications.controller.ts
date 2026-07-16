import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  BadRequestException,
} from '@nestjs/common';
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
    type: PushNotificationDto,
    description: 'Push notification payload',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification queued/sent',
    schema: {
      example: {
        success: true,
        message: 'Notification sent successfully',
        data: {
          type: 'participant_joined',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    schema: {
      example: {
        statusCode: 400,
        message: 'token is required',
        error: 'Bad Request',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async push(@Body() dto: PushNotificationDto) {
    const token = dto.token;
    if (!token) throw new BadRequestException('token is required');

    const title = dto.title || dto.type;
    const body = dto.body;
    const data = dto.data || { type: dto.type };

    await this.notificationsService.sendPushNotification(
      token,
      title,
      body,
      data,
    );

    return {
      success: true,
      message: 'Notification sent successfully',
      data: {
        type: dto.type,
      },
    };
  }
}
