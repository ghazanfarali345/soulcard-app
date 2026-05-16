import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NodemailerService {
  private readonly logger = new Logger(NodemailerService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    this.logger.log(`[GMAIL SMTP] To: ${to}, Subject: ${subject}`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      this.logger.warn('SMTP credentials missing. Email will not be sent.');
      return;
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_NAME || 'Soul Card App'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully via Gmail: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email via Gmail: ${error.message}`);
    }
  }
}
