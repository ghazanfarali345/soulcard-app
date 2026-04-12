import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto, ForgotPasswordDto } from './dto';
import { RefreshTokenDto } from './dto/auth-response.dto';
import { JwtGuard } from './guards/jwt.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   * Login endpoint - returns JWT tokens
   */
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with email and password. Returns access and refresh tokens.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description:
      'Login successful. Returns user data with access and refresh tokens.',
    schema: {
      example: {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: '507f1f77bcf86cd799439011',
            username: 'johndoe',
            email: 'user@example.com',
          },
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expiresIn: 3600,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
    schema: {
      example: {
        success: false,
        message: 'Invalid email or password',
      },
    },
  })
  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * POST /auth/signup
   * Signup endpoint - returns JWT tokens
   */
  @ApiOperation({
    summary: 'User registration',
    description:
      'Create a new user account with email and password. Returns access and refresh tokens.',
  })
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 201,
    description: 'Registration successful. Returns user data with tokens.',
    schema: {
      example: {
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: '507f1f77bcf86cd799439011',
            username: 'johndoe',
            email: 'user@example.com',
          },
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expiresIn: 3600,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or email already registered',
    schema: {
      example: {
        success: false,
        message: 'Email already registered',
      },
    },
  })
  @Post('signup')
  async signup(@Body(ValidationPipe) signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  /**
   * POST /auth/refresh
   * Refresh access token
   */
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate a new access token using a valid refresh token.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'New access token generated successfully.',
    schema: {
      example: {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expiresIn: 3600,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  @Post('refresh')
  async refresh(@Body(ValidationPipe) refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  /**
   * POST /auth/forgot-password
   * Forgot password endpoint
   */
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset link to the provided email address.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent successfully',
    schema: {
      example: {
        success: true,
        message: 'Password reset email sent',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User with provided email not found',
  })
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
  @ApiOperation({
    summary: 'Get current user data',
    description:
      'Retrieve authenticated user information. Requires valid JWT token.',
  })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Current user data retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: '507f1f77bcf86cd799439011',
          username: 'johndoe',
          email: 'user@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@Request() req) {
    return {
      success: true,
      data: req.user,
    };
  }
}
