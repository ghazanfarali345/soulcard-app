import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { GeminiService } from './gemini.service';
import { GenerateContentDto, ChatDto } from './dto';

@ApiTags('AI - Gemini')
@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  /**
   * POST /gemini/generate
   * Generate content using Gemini AI
   */
  @Post('generate')
  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @ApiSecurity('access-token')
  @ApiOperation({
    summary: 'Generate Content with Gemini AI',
    description:
      'Send a prompt to Google Gemini and get AI-generated content response',
  })
  @ApiBody({
    type: GenerateContentDto,
    description: 'The prompt to generate content from',
  })
  @ApiResponse({
    status: 200,
    description: 'Content generated successfully',
    schema: {
      example: {
        success: true,
        data: 'Here is a fun icebreaker question...',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Empty prompt',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing JWT token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Gemini API error',
  })
  async generateContent(@Body() dto: GenerateContentDto) {
    try {
      const response = await this.geminiService.generateContent(dto.prompt);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to generate content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /gemini/chat
   * Chat with Gemini AI
   */
  @Post('chat')
  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @ApiSecurity('access-token')
  @ApiOperation({
    summary: 'Chat with Gemini AI',
    description: 'Have a multi-turn conversation with Google Gemini',
  })
  @ApiBody({
    type: ChatDto,
    description: 'Array of messages for multi-turn conversation',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat response received',
    schema: {
      example: {
        success: true,
        data: 'I can help you with various tasks...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing JWT token',
  })
  async chat(@Body() dto: ChatDto) {
    try {
      const response = await this.geminiService.chat(dto.messages);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to process chat',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
