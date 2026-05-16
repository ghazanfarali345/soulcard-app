import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GameSessionModule } from './game-session/game-session.module';
import { GeminiModule } from './gemini/gemini.module';
import { SoulSpaceModule } from './soul-space/soul-space.module';
import { EmailModule } from './email/email.module';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri:
          process.env.MONGODB_URI || 'mongodb://localhost:27017/soul_card_db',
      }),
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10, // General limit, we will override specifically if needed
    }]),
    AuthModule,
    UsersModule,
    GameSessionModule,
    GeminiModule,
    SoulSpaceModule,
    EmailModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply rate limiting middleware globally
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}
