// import { Injectable, Logger } from '@nestjs/common';
// import * as nodemailer from 'nodemailer';

// @Injectable()
// export class NodemailerService {
//   private readonly logger = new Logger(NodemailerService.name);
//   private transporter: nodemailer.Transporter;

//   constructor() {
//     this.transporter = nodemailer.createTransport({
//       host: process.env.EMAIL_HOST || 'smtp.gmail.com',
//       port: parseInt(process.env.EMAIL_PORT || '587', 10),
//       secure: false, // true for 465, false for other ports
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASSWORD,
//       },
//     });
//   }

//   async sendEmail(to: string, subject: string, html: string): Promise<void> {
//     this.logger.log(`[GMAIL SMTP] To: ${to}, Subject: ${subject}`);

//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
//       this.logger.warn('SMTP credentials missing. Email will not be sent.');
//       return;
//     }

//     const mailOptions = {
//       from: `"${process.env.EMAIL_NAME || 'Soul Card App'}" <${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       html,
//     };

//     try {
//       const info = await this.transporter.sendMail(mailOptions);
//       this.logger.log(`Email sent successfully via Gmail: ${info.messageId}`);
//     } catch (error) {
//       this.logger.error(`Failed to send email via Gmail: ${error.message}`);
//     }
//   }
// }

import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

// NOTE: Class/file name kept as NodemailerService so no other file in the
// codebase (imports, DI tokens, etc.) needs to change. Internally this now
// sends via Resend's HTTPS API instead of SMTP, which sidesteps
// DigitalOcean's outbound block on ports 25/465/587.
@Injectable()
export class NodemailerService {
  private readonly logger = new Logger(NodemailerService.name);
  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY missing. Email will not be sent.');
      return;
    }

    this.resend = new Resend(apiKey);
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    this.logger.log(`[RESEND] To: ${to}, Subject: ${subject}`);

    if (!process.env.RESEND_API_KEY) {
      this.logger.warn('RESEND_API_KEY missing. Email will not be sent.');
      return;
    }

    // Must be a verified domain in your Resend account, e.g.
    // 'Soul Card App <noreply@yourdomain.com>'. Using an unverified domain
    // (or resend.dev in production) will fail or land in spam.
    const from =
      process.env.EMAIL_FROM ||
      `${process.env.EMAIL_NAME || 'Soul Card App'} <support@soulcard.org>`;

    try {
      const { data, error } = await this.resend.emails.send({
        from,
        to,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send email via Resend: ${error.message}`);
        return;
      }

      this.logger.log(`Email sent successfully via Resend: ${data?.id}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email via Resend: ${error.message}`);
    }
  }
}
