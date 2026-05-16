import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtGuard } from './guards/jwt.guard';
import { UsersModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { PendingUser, PendingUserSchema } from './entities/pending-user.entity';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    MongooseModule.forFeature([
      { name: PendingUser.name, schema: PendingUserSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_secret_key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtGuard],
  exports: [AuthService, JwtGuard],
})
export class AuthModule {}
