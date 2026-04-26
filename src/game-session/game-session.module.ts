import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './entities/session.entity';
import { UserAnswer, UserAnswerSchema } from './entities/user-answer.entity';
import {
  QuestionAnswerKey,
  QuestionAnswerKeySchema,
} from './entities/question-answer-key.entity';
import {
  SessionResult,
  SessionResultSchema,
} from './entities/session-result.entity';
import { GameSessionController } from './game-session.controller';
import { GameSessionService } from './game-session.service';
import { UserAnswerService } from './services/user-answer.service';
import { ScoringService } from './services/scoring.service';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: UserAnswer.name, schema: UserAnswerSchema },
      { name: QuestionAnswerKey.name, schema: QuestionAnswerKeySchema },
      { name: SessionResult.name, schema: SessionResultSchema },
    ]),
    GeminiModule,
  ],
  controllers: [GameSessionController],
  providers: [GameSessionService, UserAnswerService, ScoringService],
  exports: [GameSessionService, UserAnswerService],
})
export class GameSessionModule {}
