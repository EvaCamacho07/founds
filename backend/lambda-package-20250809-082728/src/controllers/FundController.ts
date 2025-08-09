import { Request, Response } from 'express';
import { FundService } from '../services/FundService';
import { TransactionService } from '../services/TransactionService';
import { UserService } from '../services/UserService';
import { SubscriptionRequest, CancellationRequest } from '../models/Transaction';

/**
 * Controller for fund-related operations
 */
export class FundController {
  private fundService: FundService;
  private transactionService: TransactionService;
  private userService: UserService;

  constructor() {
    this.fundService = new FundService();
    this.transactionService = new TransactionService();
    this.userService = new UserService();
  }

  /**
   * Get all available funds
   */
  getAllFunds = async (req: Request, res: Response): Promise<void> => {
    try {
      const funds = await this.fundService.getAllFunds();
      
      res.json({
        success: true,
        data: funds,
        message: 'Funds retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  /**
   * Get fund by ID
   */
  getFundById = async (req: Request, res: Response): Promise<void> => {
    try {
      const fundId = parseInt(req.params.id, 10);
      
      if (isNaN(fundId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid fund ID'
        });
        return;
      }

      const fund = await this.fundService.getFundById(fundId);
      
      res.json({
        success: true,
        data: fund,
        message: 'Fund retrieved successfully'
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  /**
   * Subscribe to a fund
   */
  subscribeToFund = async (req: Request, res: Response): Promise<void> => {
    try {
      const subscriptionRequest: SubscriptionRequest = req.body;
      const result = await this.transactionService.subscribeToFund(subscriptionRequest);
      
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
   * Cancel fund subscription
   */
  unsubscribeFromFund = async (req: Request, res: Response): Promise<void> => {
    try {
      const cancellationRequest: CancellationRequest = req.body;
      const result = await this.transactionService.cancelFundSubscription(cancellationRequest);
      
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
   * Get user's available balance and funds overview
   */
  getUserFundsOverview = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      // Get or create default user for demo
      const user = userId === 'default-user' 
        ? await this.userService.getOrCreateDefaultUser()
        : await this.userService.getUserById(userId);

      const funds = await this.fundService.getAllFunds();
      const transactions = await this.transactionService.getUserTransactions(user.id);
      
      // Get active subscriptions
      const activeSubscriptions = transactions
        .filter(t => t.type === 'subscription' && t.status === 'completed')
        .map(t => ({
          fundId: t.fundId,
          fundName: t.fundName,
          amount: t.amount,
          subscribedAt: t.completedAt
        }));

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            availableBalance: user.availableBalance,
            notificationPreference: user.notificationPreference
          },
          availableFunds: funds,
          activeSubscriptions,
          transactionCount: transactions.length
        },
        message: 'User funds overview retrieved successfully'
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };
}
