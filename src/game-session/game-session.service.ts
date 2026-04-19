import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session } from './entities/session.entity';
import { SessionDetailsDto } from './dto/session-details.dto';

@Injectable()
export class GameSessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
  ) {}

  async createSessionDetails(
    userId: string,
    dto: SessionDetailsDto,
  ): Promise<Session> {
    const newSession = new this.sessionModel({
      userId: new Types.ObjectId(userId),
      ...dto,
    });
    return await newSession.save();
  }
}
