import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from '../../auth/auth.service';
import { UsersService } from '../../users/users.service';
import { AdminLoginDto } from '../dto/login.dto';

@ApiTags('Admin - Auth')
@Controller('admin')
export class AdminAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  @ApiBody({ type: AdminLoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or not admin' })
  async login(@Body() body: AdminLoginDto) {
    const user = await this.usersService.findByEmail(body.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Admin flag must be set directly in DB by you
    if (!(user as any).isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }

    // Delegate password validation and token creation to AuthService
    return this.authService.login(body as any);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Admin logout' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout() {
    // We are not persisting refresh tokens in DB in this implementation.
    // Client should remove stored tokens on logout. Optionally record audit log.
    return {
      success: true,
      message: 'Logged out (client should remove tokens)'
    };
  }
}
