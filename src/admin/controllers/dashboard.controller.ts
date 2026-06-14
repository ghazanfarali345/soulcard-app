import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Admin - Dashboard')
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly usersService: UsersService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard stats' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  async stats() {
    const users = await this.usersService.findAll();
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => (u as any).isActive).length;

    // Placeholder counts for content and categories
    const totalCategories = 0;
    const totalContentItems = 0;

    return {
      success: true,
      data: { totalUsers, activeUsers, totalCategories, totalContentItems },
    };
  }

  @Get('growth')
  @ApiOperation({ summary: 'Get user growth time series' })
  @ApiResponse({ status: 200, description: 'Time series data for user growth' })
  async growth(@Query('range') range: string = 'daily') {
    // Simple growth implementation based on user createdAt
    const users = await this.usersService.findAll();
    // Return a trivial time series placeholder
    return { success: true, data: { range, series: [] } };
  }

  @Get('engagement')
  @ApiOperation({ summary: 'Get engagement metrics' })
  @ApiResponse({ status: 200, description: 'Engagement metrics for the requested range' })
  async engagement(@Query('range') range: string = 'daily') {
    // Placeholder engagement metrics
    return { success: true, data: { range, metrics: {} } };
  }
}
