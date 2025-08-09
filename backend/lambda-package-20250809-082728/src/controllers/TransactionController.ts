import { Request, Response } from 'express';
import { TransactionService } from '../services/TransactionService';

/**
 * Controller for transaction-related operations
 */
export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  /**
   * Get transaction history for a user
   */
  getTransactionHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      const transactions = await this.transactionService.getUserTransactions(userId);
      
      res.json({
        success: true,
        data: transactions,
        message: 'Transaction history retrieved successfully'
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
   * Get specific transaction by ID
   */
  getTransactionById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, transactionId } = req.params;
      
      if (!userId || !transactionId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Transaction ID are required'
        });
        return;
      }

      const transaction = await this.transactionService.getTransactionById(userId, transactionId);
      
      res.json({
        success: true,
        data: transaction,
        message: 'Transaction retrieved successfully'
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
   * Get transaction statistics for a user
   */
  getTransactionStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      const transactions = await this.transactionService.getUserTransactions(userId);
      
      const stats = {
        total: transactions.length,
        subscriptions: transactions.filter(t => t.type === 'subscription').length,
        cancellations: transactions.filter(t => t.type === 'cancellation').length,
        completed: transactions.filter(t => t.status === 'completed').length,
        failed: transactions.filter(t => t.status === 'failed').length,
        pending: transactions.filter(t => t.status === 'pending').length,
        totalSubscriptionAmount: transactions
          .filter(t => t.type === 'subscription' && t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0),
        totalCancellationAmount: transactions
          .filter(t => t.type === 'cancellation' && t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0),
      };
      
      res.json({
        success: true,
        data: stats,
        message: 'Transaction statistics retrieved successfully'
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
