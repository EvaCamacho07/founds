import { Router } from 'express';
import { fundRoutes } from './fundRoutes';
import { transactionRoutes } from './transactionRoutes';
import { notificationRoutes } from './notificationRoutes';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'FPV-FIC Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * API Routes
 */
router.use('/funds', fundRoutes);
router.use('/transactions', transactionRoutes);
router.use('/notifications', notificationRoutes);

export { router as apiRoutes };
