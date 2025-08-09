import { Router } from 'express';
import { FundController } from '../controllers/FundController';
import { validateSubscription, validateCancellation } from '../utils/validators';

const router = Router();
const fundController = new FundController();

/**
 * @route GET /api/funds
 * @description Get all available funds
 */
router.get('/', fundController.getAllFunds);

/**
 * @route GET /api/funds/:id
 * @description Get fund by ID
 */
router.get('/:id', fundController.getFundById);

/**
 * @route POST /api/funds/subscribe
 * @description Subscribe to a fund
 */
router.post('/subscribe', validateSubscription, fundController.subscribeToFund);

/**
 * @route POST /api/funds/unsubscribe
 * @description Cancel fund subscription
 */
router.post('/unsubscribe', validateCancellation, fundController.unsubscribeFromFund);

/**
 * @route GET /api/funds/user/:userId/overview
 * @description Get user's funds overview including balance and active subscriptions
 */
router.get('/user/:userId/overview', fundController.getUserFundsOverview);

export { router as fundRoutes };
