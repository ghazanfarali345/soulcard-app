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
import * as nodemailer from 'nodemailer';
import SMTPTransport = require('nodemailer/lib/smtp-transport');
import * as dns from 'dns';

// Force IPv4 resolution process-wide — fixes ENETUNREACH on hosts with
// broken/unrouted IPv6 (e.g. connecting to smtp.gmail.com over IPv6 fails
// while IPv4 works fine). Safe to keep even after networking is fixed.
dns.setDefaultResultOrder('ipv4first');

@Injectable()
export class NodemailerService {
  private readonly logger = new Logger(NodemailerService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    // `family` is a valid nodemailer/net.connect option at runtime, but
    // @types/nodemailer doesn't declare it on SMTPTransport.Options — so we
    // extend the type locally rather than using `as any`.
    const transportOptions: SMTPTransport.Options & { family?: number } = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      family: 4, // force IPv4 for this transporter specifically
      connectionTimeout: 15000, // 15s to establish connection (default can hang far longer)
      greetingTimeout: 10000, // 10s to wait for SMTP greeting
      socketTimeout: 15000, // 15s of inactivity before giving up
    };

    this.transporter = nodemailer.createTransport(transportOptions);
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
    } catch (error: any) {
      this.logger.error(`Failed to send email via Gmail: ${error.message}`);
    }
  }
}
