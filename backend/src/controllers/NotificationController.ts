import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { NotificationRequest } from '../models/Notification';

/**
 * Controller for notification-related operations
 */
export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Send a notification (mock endpoint)
   */
  sendNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const notificationRequest: NotificationRequest = req.body;
      const result = await this.notificationService.sendNotification(notificationRequest);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  /**
   * Health check endpoint for notification service
   */
  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json({
        success: true,
        message: 'Notification service is running',
        timestamp: new Date().toISOString(),
        services: {
          email: 'operational',
          sms: 'operational'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };
}
