import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto, SignupDto, ForgotPasswordDto } from './dto';
import { RefreshTokenDto, JwtPayload } from './dto/auth-response.dto';
import { EditProfileDto } from './dto/edit-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Generate JWT tokens
   */
  private async generateTokens(
    userId: string,
    email: string,
    username: string,
  ) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      username,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
      secret: process.env.JWT_SECRET,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Hash password with bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare password with hashed password
   */
  private async comparePasswords(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * User Login
   * Validates email and password, returns JWT tokens
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new BadRequestException('Your account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await this.comparePasswords(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user._id.toString(),
      user.email,
      user.username,
    );

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
        accessToken,
        refreshToken,
        expiresIn: 3600, // 1 hour in seconds
      },
    };
  }

  /**
   * User Signup
   * Creates a new user account and returns JWT tokens
   */
  async signup(signupDto: SignupDto) {
    const { username, email, password, confirmPassword, termsAccepted } =
      signupDto;

    // Check if passwords match
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if terms are accepted
    if (!termsAccepted) {
      throw new BadRequestException('You must accept the terms and conditions');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user via UsersService (handles uniqueness checks)
    try {
      const newUser = await this.usersService.createUser({
        username,
        email,
        password: hashedPassword,
        termsAccepted,
      });

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(
        newUser._id.toString(),
        newUser.email,
        newUser.username,
      );

      return {
        success: true,
        message: 'Account created successfully',
        data: {
          user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
          },
          accessToken,
          refreshToken,
          expiresIn: 3600, // 1 hour in seconds
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create account');
    }
  }

  /**
   * Refresh Access Token
   * Takes a refresh token and returns a new access token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      }) as JwtPayload;

      // Get fresh user data
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new access token
      const newAccessToken = this.jwtService.sign(
        {
          sub: payload.sub,
          email: payload.email,
          username: payload.username,
        },
        {
          expiresIn: '1h',
          secret: process.env.JWT_SECRET,
        },
      );

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          expiresIn: 3600, // 1 hour in seconds
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Forgot Password
   * Sends password reset email (mock implementation)
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Check if user exists
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // For security, don't reveal if email exists
      return {
        success: true,
        message:
          'If this email is registered, you will receive a password reset link',
      };
    }

    // Generate a secure reset token (using JWT)
    const resetToken = this.jwtService.sign(
      { sub: user._id, email: user.email },
      {
        expiresIn: '1h',
        secret: process.env.JWT_SECRET, // Could use a separate secret
      },
    );

    // Store reset token with expiration (1 hour)
    await this.usersService.updateResetToken(email, resetToken, 1);

    console.log(`Reset token for ${email}: ${resetToken}`);

    return {
      success: true,
      message: 'Password reset link has been sent to your email',
      // Temporary - for testing only
      resetToken,
    };
  }

  /**
   * Edit User Profile
   * Updates username, email, and/or fullName for authenticated user
   */
  async editProfile(userId: string, editProfileDto: EditProfileDto) {
    try {
      const updatedUser = await this.usersService.updateProfile(
        userId,
        editProfileDto,
      );

      return {
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            fullName: updatedUser.fullName,
          },
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Edit profile error:', error);
      throw new BadRequestException('Failed to update profile');
    }
  }

  /**
   * Change User Password
   * Validates current password and updates to new password
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmNewPassword } =
      changePasswordDto;

    // Validate new password confirmation
    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    // Validate that new password is different from current
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Get user
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify current password
    const isPasswordValid = await this.comparePasswords(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password
    await this.usersService.updatePassword(userId, hashedPassword);

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  /**
   * Delete Account (Soft Delete)
   * Deactivates user account after password verification
   */
  async deleteAccount(userId: string, deleteAccountDto: DeleteAccountDto) {
    const { password } = deleteAccountDto;

    // Get user
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify password
    const isPasswordValid = await this.comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Password is incorrect. Account deletion cancelled.',
      );
    }

    // Deactivate user (soft delete)
    await this.usersService.deactivateUser(userId);

    return {
      success: true,
      message:
        'Your account has been successfully deleted. You can contact support to restore it.',
    };
  }
}
