import {
  Controller,
  Get,
  Query,
  Param,
  Patch,
  Body,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Admin - Users')
@Controller('admin/users')
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (admin)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async list(@Query() query) {
    // Basic implementation: return all users with optional simple filtering
    const users = await this.usersService.findAll();
    // TODO: add pagination, search, filters
    return { success: true, data: users };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details (admin)' })
  @ApiResponse({ status: 200, description: 'User details with stats' })
  async get(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    // For admin view include gameplay-related placeholders
    const stats = {
      totalGamesPlayed: 0,
      totalScore: 0,
      highestScore: 0,
      averageScore: 0,
    };
    return { success: true, data: { user, stats } };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user status (activate/deactivate)' })
  @ApiBody({ type: UpdateUserStatusDto })
  @ApiResponse({ status: 200, description: 'User status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateUserStatusDto,
  ) {
    if (body.status === 'inactive') {
      await this.usersService.deactivateUser(id);
    } else {
      await this.usersService.reactivateUser(id);
    }
    return { success: true, message: 'User status updated' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete (deactivate) user' })
  @ApiResponse({ status: 200, description: 'User deactivated (soft delete)' })
  async remove(@Param('id') id: string) {
    // Soft delete via deactivate
    await this.usersService.deactivateUser(id);
    return { success: true, message: 'User deactivated (soft delete)' };
  }
}
