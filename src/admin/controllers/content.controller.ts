import { Controller, Get, Put, Post, Body, Param } from '@nestjs/common';
import { ContentService } from '../services/content.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Admin - Content')
@Controller('admin/content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('terms')
  @ApiOperation({ summary: 'Get Terms of Service content' })
  @ApiResponse({ status: 200, description: 'Terms content' })
  async getTerms() {
    const page = await this.contentService.getByKey('terms');
    return { success: true, data: page };
  }

  @Put('terms')
  @ApiOperation({ summary: 'Update Terms (save draft)' })
  @ApiBody({ schema: { properties: { content: { type: 'string' }, editorId: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Draft saved' })
  async updateTerms(
    @Body('content') content: string,
    @Body('editorId') editorId?: string,
  ) {
    const updated = await this.contentService.update(
      'terms',
      content,
      editorId,
    );
    return { success: true, data: updated };
  }

  @Post('terms/publish')
  @ApiOperation({ summary: 'Publish Terms' })
  @ApiBody({ schema: { properties: { editorId: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Published' })
  async publishTerms(@Body('editorId') editorId?: string) {
    const published = await this.contentService.publish('terms', editorId);
    return { success: true, data: published };
  }

  @Get('privacy')
  @ApiOperation({ summary: 'Get Privacy Policy content' })
  @ApiResponse({ status: 200, description: 'Privacy content' })
  async getPrivacy() {
    const page = await this.contentService.getByKey('privacy');
    return { success: true, data: page };
  }

  @Put('privacy')
  @ApiOperation({ summary: 'Update Privacy Policy (save draft)' })
  @ApiBody({ schema: { properties: { content: { type: 'string' }, editorId: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Draft saved' })
  async updatePrivacy(
    @Body('content') content: string,
    @Body('editorId') editorId?: string,
  ) {
    const updated = await this.contentService.update(
      'privacy',
      content,
      editorId,
    );
    return { success: true, data: updated };
  }

  @Post('privacy/publish')
  @ApiOperation({ summary: 'Publish Privacy Policy' })
  @ApiBody({ schema: { properties: { editorId: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Published' })
  async publishPrivacy(@Body('editorId') editorId?: string) {
    const published = await this.contentService.publish('privacy', editorId);
    return { success: true, data: published };
  }
}
