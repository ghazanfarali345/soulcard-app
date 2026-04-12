import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto, ForgotPasswordDto } from './dto';
import { RefreshTokenDto } from './dto/auth-response.dto';
import { JwtGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   * Login endpoint - returns JWT tokens
   */
  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * POST /auth/signup
   * Signup endpoint - returns JWT tokens
   */
  @Post('signup')
  async signup(@Body(ValidationPipe) signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  /**
   * POST /auth/refresh
   * Refresh access token
   */
  @Post('refresh')
  async refresh(@Body(ValidationPipe) refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  /**
   * POST /auth/forgot-password
   * Forgot password endpoint
   */
  @Post('forgot-password')
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  /**
   * GET /auth/me
   * Get current user (protected route)
   */
  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@Request() req) {
    return {
      success: true,
      data: req.user,
    };
  }
}
