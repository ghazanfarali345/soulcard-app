import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invitation } from '../entities/invitation.entity';
import { Session } from '../entities/session.entity';
import { GameSessionService } from '../game-session.service';
import { TwilioService } from './twilio.service';
import { NodemailerService } from '../../email/nodemailer.service';
import { UsersService } from '../../users/users.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class InvitationService {
  constructor(
    @InjectModel(Invitation.name) private invitationModel: Model<Invitation>,
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    private gameSessionService: GameSessionService,
    private twilioService: TwilioService,
    private emailService: NodemailerService,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  async createInvitation(
    sessionId: string,
    hostId: string,
    email?: string,
    phone?: string,
  ): Promise<Invitation> {
    // Verify session exists and requester is host
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    if (session.hostId.toString() !== hostId) {
      throw new HttpException('Only the host can invite players', HttpStatus.FORBIDDEN);
    }

    // Generate or get existing valid join code
    const code = await this.gameSessionService.generateJoinCode(sessionId);
    const ttl = parseInt(process.env.JOIN_CODE_TTL_MINUTES || '15', 10);
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

    const invitation = new this.invitationModel({
      sessionId: new Types.ObjectId(sessionId),
      code,
      expiresAt,
      email,
      phone,
      status: 'PENDING',
    });

    await invitation.save();

    // Send invitation
    const messageBody = `You are invited to join a Soul Card session. Use code ${code} in the app to join. (Expires in ${ttl} minutes)`;
    
    if (phone) {
      await this.twilioService.sendSms(phone, messageBody);
    }

    if (email) {
      const subject = 'Soul Card Session Invitation';
      const html = `<p>You are invited to join a Soul Card session.</p><p>Use code <strong>${code}</strong> in the app to join.</p><p>This code expires in ${ttl} minutes.</p>`;
      await this.emailService.sendEmail(email, subject, html);
    }

    return invitation;
  }

  async acceptInvitation(
    code: string,
    userId: string,
    displayName: string,
  ): Promise<Session> {
    // Validate join code and get session
    const session = await this.gameSessionService.validateJoinCode(code);
    const userObjectId = new Types.ObjectId(userId);

    // Check if user is already a participant
    const isParticipant = session.participants.some(
      (p) => p.toString() === userId,
    );

    if (!isParticipant) {
      session.participants.push(userObjectId);
      session.participantsInfo.push({
        userId: userObjectId,
        displayName,
        answersSubmitted: 0,
        skippedQuestions: [],
        isCompleted: false,
      });
      await session.save();
    } else {
      // Update display name if already participant
      const info = session.participantsInfo.find((p) => p.userId.toString() === userId);
      if (info) {
        info.displayName = displayName;
      } else {
        session.participantsInfo.push({
          userId: userObjectId,
          displayName,
          answersSubmitted: 0,
          skippedQuestions: [],
          isCompleted: false,
        });
      }
      await session.save();
    }

    // Mark invitation as USED for this code (if applicable to this user/session)
    await this.invitationModel.updateMany(
      { code, status: 'PENDING' },
      { status: 'USED' },
    );

    // Send push notification to host
    try {
      const host = await this.usersService.findById(session.hostId.toString());
      if (host && host.fcmToken) {
        const joiningUser = await this.usersService.findById(userId);
        const title = 'Someone joined your session!';
        const body = `${displayName} (${joiningUser?.username || 'New Player'}) has joined your Soul Card session.`;
        
        await this.notificationsService.sendPushNotification(
          host.fcmToken,
          title,
          body,
          {
            sessionId: session._id.toString(),
            joiningUserId: userId,
            displayName: displayName,
          }
        );
      }
    } catch (error) {
      // Don't fail the join process if notification fails
      console.error('Failed to send join notification to host:', error.message);
    }

    return session;
  }
}
