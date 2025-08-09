import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';

const router = Router();
const transactionController = new TransactionController();

/**
 * @route GET /api/transactions/history/:userId
 * @description Get transaction history for a user
 */
router.get('/history/:userId', transactionController.getTransactionHistory);

/**
 * @route GET /api/transactions/:userId/:transactionId
 * @description Get specific transaction by ID
 */
router.get('/:userId/:transactionId', transactionController.getTransactionById);

/**
 * @route GET /api/transactions/stats/:userId
 * @description Get transaction statistics for a user
 */
router.get('/stats/:userId', transactionController.getTransactionStats);

export { router as transactionRoutes };
