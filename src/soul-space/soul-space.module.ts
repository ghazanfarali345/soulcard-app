import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SoulSpaceService } from './soul-space.service';
import { SoulSpaceController } from './soul-space.controller';
import { SoulSpace, SoulSpaceSchema } from './entities/soul-space.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: SoulSpace.name, schema: SoulSpaceSchema },
    ]),
  ],
  controllers: [SoulSpaceController],
  providers: [SoulSpaceService],
  exports: [SoulSpaceService],
})
export class SoulSpaceModule {}
