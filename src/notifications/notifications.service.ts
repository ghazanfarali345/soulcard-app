import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App;

  onModuleInit() {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountPath) {
      try {
        const serviceAccount = JSON.parse(serviceAccountPath);
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.logger.log('Firebase Admin initialized successfully');
      } catch (error) {
        this.logger.error(`Failed to initialize Firebase Admin: ${error.message}`);
      }
    } else {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON missing. Push notifications will be mocked.');
    }
  }

  async sendPushNotification(token: string, title: string, body: string, data?: any) {
    if (!this.firebaseApp) {
      this.logger.log(`[MOCK PUSH] To: ${token}, Title: ${title}, Body: ${body}`);
      return;
    }

    try {
      const message = {
        notification: { title, body },
        data: data || {},
        token,
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Successfully sent push notification: ${response}`);
    } catch (error) {
      this.logger.error(`Error sending push notification: ${error.message}`);
    }
  }

  /**
   * Send a silent data-only push notification.
   * No visible alert is shown to the user — the frontend receives the data
   * payload and handles UI updates itself (e.g. showing whose turn it is).
   */
  async sendDataNotification(token: string, data: Record<string, string>) {
    if (!this.firebaseApp) {
      this.logger.log(`[MOCK DATA PUSH] To: ${token}, Data: ${JSON.stringify(data)}`);
      return;
    }

    try {
      const message = {
        data,
        token,
        android: {
          priority: 'high' as const,
        },
        apns: {
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'background',
          },
          payload: {
            aps: {
              'content-available': 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Successfully sent data notification: ${response}`);
    } catch (error) {
      this.logger.error(`Error sending data notification: ${error.message}`);
    }
  }
}
