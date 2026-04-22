import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Create a new user
   */
  async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { username, email, password, termsAccepted } = createUserDto;

    // Check if email already exists
    const existingEmail = await this.userModel.findOne({ email });

    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    // Check if username already exists
    const existingUsername = await this.userModel.findOne({ username });

    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    // Create new user
    const user = new this.userModel({
      username,
      email,
      password,
      termsAccepted,
      isActive: true,
    });

    return user.save();
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  /**
   * Get all users (for admin purposes)
   */
  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-password').exec();
  }

  /**
   * Update reset token for password recovery
   */
  async updateResetToken(
    email: string,
    resetToken: string,
    expiryHours: number = 1,
  ): Promise<UserDocument> {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + expiryHours * 3600000);

    return user.save();
  }

  /**
   * Clear reset token after successful password reset
   */
  async clearResetToken(resetToken: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ resetToken });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.resetToken = null;
    user.resetTokenExpiry = null;

    return user.save();
  }

  /**
   * Verify reset token
   */
  async verifyResetToken(resetToken: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ resetToken });

    if (!user) {
      throw new NotFoundException('Invalid reset token');
    }

    if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();
      throw new NotFoundException('Reset token expired');
    }

    return user;
  }

  /**
   * Update user password
   */
  async updatePassword(
    userId: string,
    newPassword: string,
  ): Promise<UserDocument> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.password = newPassword;
    return user.save();
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<UserDocument> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = false;
    return user.save();
  }

  /**
   * Reactivate user account
   */
  async reactivateUser(userId: string): Promise<UserDocument> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = true;
    return user.save();
  }

  /**
   * Update user profile (username, email, and/or fullName)
   */
  async updateProfile(
    userId: string,
    updateData: { username?: string; email?: string; fullName?: string },
  ): Promise<UserDocument> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if new username is already taken
    if (updateData.username && updateData.username !== user.username) {
      const existingUsername = await this.userModel.findOne({
        username: updateData.username,
      });

      if (existingUsername) {
        throw new ConflictException('Username already taken');
      }

      user.username = updateData.username;
    }

    // Check if new email is already taken
    if (updateData.email && updateData.email !== user.email) {
      const existingEmail = await this.userModel.findOne({
        email: updateData.email,
      });

      if (existingEmail) {
        throw new ConflictException('Email already registered');
      }

      user.email = updateData.email;
    }

    // Update fullName if provided
    if (updateData.fullName !== undefined) {
      user.fullName = updateData.fullName || null;
    }

    return user.save();
  }
}
