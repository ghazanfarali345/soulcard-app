import { Injectable, Logger } from '@nestjs/common';
import * as twilio from 'twilio';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private smsClient: twilio.Twilio;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const sendGridApiKey = process.env.SENDGRID_API_KEY;

    if (accountSid && accountSid.startsWith('AC') && authToken) {
      this.smsClient = twilio(accountSid, authToken);
    } else {
      this.logger.warn(
        'Twilio SMS credentials missing or invalid (must start with AC). SMS will not be sent.',
      );
    }

    if (sendGridApiKey && sendGridApiKey.startsWith('SG.')) {
      sgMail.setApiKey(sendGridApiKey);
    } else {
      this.logger.warn(
        'SendGrid API key missing or invalid (must start with SG.). Emails will not be sent.',
      );
    }
  }

  async sendSms(to: string, body: string): Promise<void> {
    this.logger.log(`[MOCK SMS] To: ${to}, Body: ${body}`);
    
    if (!this.smsClient) {
      this.logger.warn('Twilio client not initialized, skipping actual SMS send');
      return;
    }

    try {
      await this.smsClient.messages.create({
        body,
        from: process.env.TWILIO_SMS_FROM,
        to,
      });
      this.logger.log(`SMS sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error.message}`);
    }
  }

  async sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
    this.logger.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
    
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      this.logger.warn('SendGrid API key missing, skipping actual Email send');
      return;
    }

    const msg = {
      to,
      from: process.env.EMAIL_FROM || 'noreply@soulcard.app',
      subject,
      text,
      html,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
    }
  }
}
