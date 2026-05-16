import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SoulSpaceService } from './soul-space.service';
import { SoulSpaceController } from './soul-space.controller';
import { SoulSpace, SoulSpaceSchema } from './entities/soul-space.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SoulSpace.name, schema: SoulSpaceSchema },
    ]),
  ],
  controllers: [SoulSpaceController],
  providers: [SoulSpaceService],
  exports: [SoulSpaceService],
})
export class SoulSpaceModule {}
