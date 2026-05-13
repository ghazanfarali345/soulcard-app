import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './entities/session.entity';
import { UserAnswer, UserAnswerSchema } from './entities/user-answer.entity';
import {
  Invitation,
  InvitationSchema,
} from './entities/invitation.entity';
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
import { InvitationService } from './services/invitation.service';
import { TwilioService } from './services/twilio.service';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: UserAnswer.name, schema: UserAnswerSchema },
      { name: Invitation.name, schema: InvitationSchema },
      { name: QuestionAnswerKey.name, schema: QuestionAnswerKeySchema },
      { name: SessionResult.name, schema: SessionResultSchema },
    ]),
    GeminiModule,
  ],
  controllers: [GameSessionController],
  providers: [
    GameSessionService,
    UserAnswerService,
    ScoringService,
    InvitationService,
    TwilioService,
  ],
  exports: [GameSessionService, UserAnswerService, InvitationService, TwilioService],
})
export class GameSessionModule {}
