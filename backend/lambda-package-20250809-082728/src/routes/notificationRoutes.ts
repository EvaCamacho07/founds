import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { validateNotification } from '../utils/validators';

const router = Router();
const notificationController = new NotificationController();

/**
 * @route POST /api/notifications/send
 * @description Send a notification (mock endpoint)
 */
router.post('/send', validateNotification, notificationController.sendNotification);

/**
 * @route GET /api/notifications/health
 * @description Health check for notification service
 */
router.get('/health', notificationController.healthCheck);

export { router as notificationRoutes };
