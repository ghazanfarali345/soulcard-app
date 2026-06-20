import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import { SessionResult } from '../game-session/entities/session-result.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(SessionResult.name)
    private readonly sessionResultModel?: Model<SessionResult>,
  ) {}

  /**
   * Admin-facing user list with search, filters, pagination and gameplay stats
   */
  async findAllAdmin(options: {
    search?: string;
    status?: 'active' | 'inactive' | 'all';
    page?: number;
    limit?: number;
  }) {
    const { search, status = 'all', page = 1, limit = 20 } = options || {};

    const match: any = {};
    if (search) {
      match.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'all') {
      match.isActive = status === 'active';
    }

    const lookupFrom = this.sessionResultModel
      ? this.sessionResultModel.collection.name
      : 'sessionresults';

    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: lookupFrom,
          localField: '_id',
          foreignField: 'userId',
          as: 'results',
        },
      },
      {
        $addFields: {
          gamesPlayed: { $size: '$results' },
          totalScore: { $sum: '$results.finalResults.overallScore' },
          highestScore: { $max: '$results.finalResults.overallScore' },
          lastActivity: { $max: '$results.completedAt' },
        },
      },
      {
        $project: {
          password: 0,
          resetToken: 0,
          resetTokenExpiry: 0,
          results: 0,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const [data, total] = await Promise.all([
      this.userModel.aggregate(pipeline).exec(),
      this.userModel.countDocuments(match).exec(),
    ]);

    // Normalize nulls to zeros where appropriate
    const normalized = data.map((u: any) => ({
      id: u._id,
      username: u.username,
      email: u.email,
      registrationDate: (u as any).createdAt,
      status: u.isActive ? 'active' : 'inactive',
      gamesPlayed: u.gamesPlayed || 0,
      totalScore: u.totalScore || 0,
      highestScore: u.highestScore || 0,
      lastActivityDate: u.lastActivity || null,
    }));

    return { data: normalized, total, page, limit };
  }

  /**
   * Get single user details for admin with limited fields and gameplay stats
   */
  async findAdminById(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('fullName username email createdAt isActive')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!this.sessionResultModel) {
      return {
        fullName: user.fullName || user.username,
        email: user.email,
        registrationDate: (user as any).createdAt,
        status: user.isActive ? 'active' : 'inactive',
        totalGamesPlayed: 0,
        totalScore: 0,
        highestScore: 0,
        averageScore: 0,
        lastPlayedDate: null,
      };
    }

    const agg = await this.sessionResultModel
      .aggregate([
        { $match: { userId: new Types.ObjectId(id) } },
        {
          $group: {
            _id: '$userId',
            gamesPlayed: { $sum: 1 },
            totalScore: { $sum: '$finalResults.overallScore' },
            highestScore: { $max: '$finalResults.overallScore' },
            averageScore: { $avg: '$finalResults.overallScore' },
            lastPlayed: { $max: '$completedAt' },
          },
        },
      ])
      .exec();

    const s = agg && agg.length ? agg[0] : {};

    return {
      fullName: user.fullName || user.username,
      email: user.email,
      registrationDate: (user as any).createdAt,
      status: user.isActive ? 'active' : 'inactive',
      totalGamesPlayed: s.gamesPlayed || 0,
      totalScore: s.totalScore || 0,
      highestScore: s.highestScore || 0,
      averageScore: s.averageScore || 0,
      lastPlayedDate: s.lastPlayed || null,
    };
  }

  /**
   * Create a new user
   */
  async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { username, email, password, termsAccepted, fcmToken, profileImage } =
      createUserDto;

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
      fcmToken,
      profileImage,
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
   * Find users by multiple IDs
   */
  async findByIds(ids: string[]): Promise<UserDocument[]> {
    return this.userModel.find({ _id: { $in: ids } }).exec();
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
    updateData: {
      username?: string;
      email?: string;
      fullName?: string;
      profileImage?: string;
      fcmToken?: string;
    },
  ) {
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

    // Update profileImage if provided
    if (updateData.profileImage !== undefined) {
      user.profileImage = updateData.profileImage || null;
    }

    // Update fcmToken if provided
    if (updateData.fcmToken !== undefined) {
      user.fcmToken = updateData.fcmToken || null;
    }

    return user.save();
  }
}
