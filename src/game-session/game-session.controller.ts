import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { GameSessionService } from './game-session.service';
import { SessionDetailsDto } from './dto/session-details.dto';

@ApiTags('Game Sessions')
@Controller('game-sessions')
export class GameSessionController {
  constructor(private readonly gameSessionService: GameSessionService) {}

  @Post('sessionDetails')
  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @ApiSecurity('access-token')
  @ApiOperation({
    summary: 'Collect Session Details',
    description:
      'Create a new game session by collecting session configuration details including soul space, vibe, number of players, difficulty level, engagement mode, engagement type, and number of questions.',
  })
  @ApiBody({
    type: SessionDetailsDto,
    description: 'Session configuration details',
  })
  @ApiResponse({
    status: 201,
    description: 'Session details collected successfully',
    schema: {
      example: {
        success: true,
        message: 'Session details collected successfully',
        data: {
          _id: '507f1f77bcf86cd799439011',
          userId: '507f1f77bcf86cd799439012',
          soulSpace: 'personal',
          vibe: 'relaxed',
          noOfPlayers: 2,
          difficultyLevel: 'medium',
          engagementMode: 'competitive',
          engagement: 'deep',
          noOfQuestions: 10,
          createdAt: '2026-04-19T10:30:00.000Z',
          updatedAt: '2026-04-19T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT token',
  })
  async sessionDetails(@Req() req: any, @Body() dto: SessionDetailsDto) {
    const userId = req.user?.userId;
    const data = await this.gameSessionService.createSessionDetails(
      userId,
      dto,
    );
    return {
      success: true,
      message: 'Session details collected successfully',
      data,
    };
  }
}
