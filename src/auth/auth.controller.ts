import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UseGuards,
  Get,
  Request,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  SignupDto,
  ForgotPasswordDto,
  EditProfileDto,
  ChangePasswordDto,
  DeleteAccountDto,
} from './dto';
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

  /**
   * PATCH /auth/profile
   * Edit user profile (protected route)
   */
  @ApiOperation({
    summary: 'Edit user profile',
    description:
      'Update username and/or email. Requires valid JWT token. Username and email must be unique.',
  })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: EditProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: '507f1f77bcf86cd799439011',
            username: 'johndoe',
            email: 'user@example.com',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Username or email already taken',
    schema: {
      example: {
        success: false,
        message: 'Username already taken',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @UseGuards(JwtGuard)
  @Patch('profile')
  async editProfile(
    @Request() req,
    @Body(ValidationPipe) editProfileDto: EditProfileDto,
  ) {
    return this.authService.editProfile(req.user.userId, editProfileDto);
  }

  /**
   * POST /auth/change-password
   * Change user password (protected route)
   */
  @ApiOperation({
    summary: 'Change user password',
    description:
      'Update user password with verification of current password. Requires valid JWT token.',
  })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      example: {
        success: true,
        message: 'Password changed successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid current password or validation error',
    schema: {
      example: {
        success: false,
        message: 'Current password is incorrect',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @UseGuards(JwtGuard)
  @Post('change-password')
  async changePassword(
    @Request() req,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.userId, changePasswordDto);
  }

  /**
   * DELETE /auth/account
   * Delete user account - soft delete (protected route)
   */
  @ApiOperation({
    summary: 'Delete user account (soft delete)',
    description:
      'Deactivate user account with password verification. Account data is retained but marked as inactive. Requires valid JWT token.',
  })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: DeleteAccountDto })
  @ApiResponse({
    status: 200,
    description: 'Account deleted successfully',
    schema: {
      example: {
        success: true,
        message:
          'Your account has been successfully deleted. You can contact support to restore it.',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid password or missing token',
    schema: {
      example: {
        success: false,
        message: 'Password is incorrect. Account deletion cancelled.',
      },
    },
  })
  @UseGuards(JwtGuard)
  @Delete('account')
  async deleteAccount(
    @Request() req,
    @Body(ValidationPipe) deleteAccountDto: DeleteAccountDto,
  ) {
    return this.authService.deleteAccount(req.user.userId, deleteAccountDto);
  }
}
