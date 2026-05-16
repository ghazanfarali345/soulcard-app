import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly apiKey = process.env.RESEND_API_KEY;
  private readonly apiUrl = 'https://api.resend.com/emails';

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    this.logger.log(`[RESEND EMAIL] To: ${to}, Subject: ${subject}`);

    if (!this.apiKey) {
      this.logger.warn('RESEND_API_KEY is missing. Email will not be sent.');
      return;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
          to,
          subject,
          html,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        this.logger.log(`Email sent successfully via Resend: ${data.id}`);
      } else {
        this.logger.error(`Resend API Error: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send email via Resend: ${error.message}`);
    }
  }
}
