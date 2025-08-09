import { 
  Notification, 
  NotificationRequest, 
  NotificationResponse, 
  NotificationType 
} from '../models/Notification';
import { generateNotificationId, delay } from '../utils/helpers';

/**
 * Service class for notification operations
 */
export class NotificationService {
  /**
   * Sends a notification (mock implementation)
   */
  async sendNotification(request: NotificationRequest): Promise<NotificationResponse> {
    try {
      const notificationId = generateNotificationId();
      const now = new Date();

      const notification: Notification = {
        id: notificationId,
        userId: request.userId,
        type: request.type,
        recipient: request.recipient,
        subject: request.subject,
        message: request.message,
        status: 'pending',
        createdAt: now,
      };

      // Simulate processing delay
      await delay(100);

      // Mock notification sending logic
      const success = await this.mockSendNotification(notification);

      if (success) {
        notification.status = 'sent';
        notification.sentAt = new Date();
        
        console.log(`[${notification.type.toUpperCase()}] Notification sent successfully:`, {
          id: notification.id,
          recipient: notification.recipient,
          subject: notification.subject,
          message: notification.message,
          sentAt: notification.sentAt,
        });

        return {
          success: true,
          notification,
          message: 'Notification sent successfully',
        };
      } else {
        notification.status = 'failed';
        notification.errorMessage = 'Failed to send notification';
        
        console.error(`[${notification.type.toUpperCase()}] Notification failed:`, {
          id: notification.id,
          recipient: notification.recipient,
          error: notification.errorMessage,
        });

        return {
          success: false,
          notification,
          message: 'Failed to send notification',
        };
      }

    } catch (error) {
      console.error('Error sending notification:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Mock implementation for sending email notifications
   */
  private async mockSendEmail(recipient: string, subject: string, message: string): Promise<boolean> {
    // Simulate email sending
    console.log(`[EMAIL MOCK] Sending email to: ${recipient}`);
    console.log(`[EMAIL MOCK] Subject: ${subject}`);
    console.log(`[EMAIL MOCK] Message: ${message}`);
    
    // Simulate network delay
    await delay(200);
    
    // Mock success rate (95% success)
    return Math.random() > 0.05;
  }

  /**
   * Mock implementation for sending SMS notifications
   */
  private async mockSendSMS(recipient: string, message: string): Promise<boolean> {
    // Simulate SMS sending
    console.log(`[SMS MOCK] Sending SMS to: ${recipient}`);
    console.log(`[SMS MOCK] Message: ${message}`);
    
    // Simulate network delay
    await delay(150);
    
    // Mock success rate (90% success)
    return Math.random() > 0.1;
  }

  /**
   * Mock notification sending based on type
   */
  private async mockSendNotification(notification: Notification): Promise<boolean> {
    try {
      if (notification.type === 'email') {
        return await this.mockSendEmail(
          notification.recipient,
          notification.subject,
          notification.message
        );
      } else if (notification.type === 'sms') {
        return await this.mockSendSMS(
          notification.recipient,
          notification.message
        );
      } else {
        throw new Error(`Unsupported notification type: ${notification.type}`);
      }
    } catch (error) {
      console.error('Error in mock notification sending:', error);
      return false;
    }
  }

  /**
   * Sends notification for successful fund subscription
   */
  async sendSubscriptionNotification(
    userId: string,
    userEmail: string,
    userPhone: string | undefined,
    fundName: string,
    amount: number,
    newBalance: number,
    preferredType: NotificationType
  ): Promise<NotificationResponse> {
    const recipient = preferredType === 'email' ? userEmail : userPhone || userEmail;
    const subject = 'Suscripción Exitosa - Fondos de Inversión';
    const message = `Su suscripción al fondo ${fundName} por $${amount.toLocaleString('es-CO')} COP ha sido exitosa. Su nuevo saldo disponible es $${newBalance.toLocaleString('es-CO')} COP.`;

    return await this.sendNotification({
      userId,
      type: preferredType,
      recipient,
      subject,
      message,
    });
  }

  /**
   * Sends notification for successful fund cancellation
   */
  async sendCancellationNotification(
    userId: string,
    userEmail: string,
    userPhone: string | undefined,
    fundName: string,
    refundAmount: number,
    newBalance: number,
    preferredType: NotificationType
  ): Promise<NotificationResponse> {
    const recipient = preferredType === 'email' ? userEmail : userPhone || userEmail;
    const subject = 'Cancelación Exitosa - Fondos de Inversión';
    const message = `Su cancelación del fondo ${fundName} ha sido exitosa. Se han devuelto $${refundAmount.toLocaleString('es-CO')} COP a su cuenta. Su nuevo saldo disponible es $${newBalance.toLocaleString('es-CO')} COP.`;

    return await this.sendNotification({
      userId,
      type: preferredType,
      recipient,
      subject,
      message,
    });
  }
}
