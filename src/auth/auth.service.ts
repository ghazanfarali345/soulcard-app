import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginDto, SignupDto, ForgotPasswordDto, VerifyEmailDto, ResendOtpDto } from './dto';
import { RefreshTokenDto, JwtPayload } from './dto/auth-response.dto';
import { EditProfileDto } from './dto/edit-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UsersService } from '../users/users.service';
import { PendingUser, PendingUserDocument } from './entities/pending-user.entity';
import { NodemailerService } from '../email/nodemailer.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectModel(PendingUser.name)
    private readonly pendingUserModel: Model<PendingUserDocument>,
    private readonly emailService: NodemailerService,
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
    const { email, password, fcmToken } = loginDto;

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

    // Update fcmToken if provided
    if (fcmToken && fcmToken !== user.fcmToken) {
      await this.usersService.updateProfile(user._id.toString(), { fcmToken });
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
    const { username, email, password, confirmPassword, termsAccepted, fcmToken } =
      signupDto;

    // Check if passwords match
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if terms are accepted
    if (!termsAccepted) {
      throw new BadRequestException('You must accept the terms and conditions');
    }

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const existingUsername = await this.usersService.findByUsername(username);
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

    // Store in PendingUser
    await this.pendingUserModel.findOneAndUpdate(
      { email },
      {
        username,
        email,
        password: hashedPassword,
        otp,
        otpExpiresAt,
        termsAccepted,
        fcmToken,
      },
      { upsert: true, new: true },
    );

    // Mock email sending
    console.log(`Verification code for ${email}: ${otp}`);
    
    // Send actual email via Gmail SMTP
    await this.emailService.sendEmail(
      email,
      'Verify your Soul Card account',
      `<p>Your verification code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`,
    );

    return {
      success: true,
      message: 'Verification code has been sent to your email',
    };
  }

  /**
   * Verify Email and Create Account
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, code } = verifyEmailDto;

    const pendingUser = await this.pendingUserModel.findOne({ email });

    if (!pendingUser) {
      throw new BadRequestException('No pending registration found for this email');
    }

    if (pendingUser.otp !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (new Date() > pendingUser.otpExpiresAt) {
      throw new BadRequestException('Verification code has expired');
    }

    // Create the actual user
    const newUser = await this.usersService.createUser({
      username: pendingUser.username,
      email: pendingUser.email,
      password: pendingUser.password,
      termsAccepted: pendingUser.termsAccepted,
      fcmToken: pendingUser.fcmToken,
    });

    // Delete pending registration
    await this.pendingUserModel.deleteOne({ email });

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      newUser._id.toString(),
      newUser.email,
      newUser.username,
    );

    return {
      success: true,
      message: 'Email verified and account created successfully',
      data: {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
        },
        accessToken,
        refreshToken,
        expiresIn: 3600,
      },
    };
  }

  /**
   * Resend Verification OTP
   */
  async resendOtp(resendOtpDto: ResendOtpDto) {
    const { email } = resendOtpDto;

    const pendingUser = await this.pendingUserModel.findOne({ email });

    if (!pendingUser) {
      throw new BadRequestException(
        'No pending registration found or it has expired. Please sign up again.',
      );
    }

    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

    // Update pending user
    pendingUser.otp = otp;
    pendingUser.otpExpiresAt = otpExpiresAt;
    await pendingUser.save();

    // Send email
    await this.emailService.sendEmail(
      email,
      'Your New Verification Code',
      `<p>Your new verification code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`,
    );

    return {
      success: true,
      message: 'New verification code has been sent to your email',
    };
  }

  /**
   * Get Current User Profile
   */
  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        createdAt: (user as any).createdAt,
      },
    };
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
            profileImage: updatedUser.profileImage,
            fcmToken: updatedUser.fcmToken,
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
    const isPasswordValid = await this.comparePasswords(
      password,
      user.password,
    );
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
