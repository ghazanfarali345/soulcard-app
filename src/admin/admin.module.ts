import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { UsersAdminController } from './controllers/users.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { ContentController } from './controllers/content.controller';
import { ContentService } from './services/content.service';
import { ContentPage, ContentPageSchema } from './entities/content-page.entity';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: ContentPage.name, schema: ContentPageSchema },
    ]),
  ],
  controllers: [
    AdminAuthController,
    UsersAdminController,
    DashboardController,
    ContentController,
  ],
  providers: [ContentService],
})
export class AdminModule {}
