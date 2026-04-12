import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({
    summary: 'Health check',
    description: 'Verify that the API server is running and operational.',
  })
  @ApiResponse({
    status: 200,
    description: 'Server is running',
    schema: {
      example: 'Welcome to Soul Card API! Server is running.',
    },
  })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
