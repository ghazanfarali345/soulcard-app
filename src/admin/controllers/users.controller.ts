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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Admin - Users')
@Controller('admin/users')
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (admin)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or email',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'all'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Results per page',
  })
  async list(@Query() query) {
    const { search, status, page, limit } = query;

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    const result = await this.usersService.findAllAdmin({
      search,
      status,
      page: pageNum,
      limit: limitNum,
    });

    return {
      success: true,
      data: result.data,
      meta: { total: result.total, page: result.page, limit: result.limit },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details (admin)' })
  @ApiResponse({ status: 200, description: 'User details with stats' })
  async get(@Param('id') id: string) {
    const result = await this.usersService.findAdminById(id);
    return { success: true, data: result };
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
  @ApiOperation({ summary: 'Hard delete user (permanent)' })
  @ApiResponse({ status: 200, description: 'User permanently deleted' })
  async remove(@Param('id') id: string) {
    // Hard delete - permanently removes user from database
    await this.usersService.hardDeleteUser(id);
    return { success: true, message: 'User permanently deleted' };
  }
}
