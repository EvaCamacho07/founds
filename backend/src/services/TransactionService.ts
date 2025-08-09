import { dynamoClient, TABLE_NAME } from '../config/database';
import { 
  Transaction, 
  TransactionDynamoDBItem, 
  TransactionType, 
  SubscriptionRequest,
  CancellationRequest,
  TransactionResponse 
} from '../models/Transaction';
import { UserService } from './UserService';
import { FundService } from './FundService';
import { NotificationService } from './NotificationService';
import { generateTransactionId, formatCurrency } from '../utils/helpers';
import { NotFoundError, InsufficientFundsError, BusinessRuleError } from '../utils/errors';

/**
 * Service class for transaction operations
 */
export class TransactionService {
  private userService: UserService;
  private fundService: FundService;
  private notificationService: NotificationService;

  constructor() {
    this.userService = new UserService();
    this.fundService = new FundService();
    this.notificationService = new NotificationService();
  }

  /**
   * Creates a new transaction record
   */
  private async createTransaction(
    userId: string,
    fundId: number,
    fundName: string,
    type: TransactionType,
    amount: number
  ): Promise<Transaction> {
    const transactionId = generateTransactionId();
    const now = new Date();

    const transaction: Transaction = {
      id: transactionId,
      userId,
      fundId,
      fundName,
      type,
      amount,
      status: 'pending',
      createdAt: now,
    };

    const dynamoItem: TransactionDynamoDBItem = {
      PK: `USER#${userId}`,
      SK: `TRANSACTION#${transactionId}`,
      GSI1PK: `TRANSACTION#${type}`,
      GSI1SK: now.toISOString(),
      id: transaction.id,
      userId: transaction.userId,
      fundId: transaction.fundId,
      fundName: transaction.fundName,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      createdAt: transaction.createdAt.toISOString(),
      entityType: 'TRANSACTION',
    };

    try {
      await dynamoClient.put({
        TableName: TABLE_NAME,
        Item: dynamoItem,
      }).promise();

      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error('Failed to create transaction');
    }
  }

  /**
   * Updates transaction status
   */
  private async updateTransactionStatus(
    userId: string,
    transactionId: string,
    status: 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    const updateExpression = status === 'completed' 
      ? 'SET #status = :status, completedAt = :completedAt'
      : 'SET #status = :status, errorMessage = :errorMessage';

    const expressionAttributeValues = status === 'completed'
      ? { ':status': status, ':completedAt': new Date().toISOString() }
      : { ':status': status, ':errorMessage': errorMessage };

    try {
      await dynamoClient.update({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `TRANSACTION#${transactionId}`,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: expressionAttributeValues,
      }).promise();
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw new Error('Failed to update transaction status');
    }
  }

  /**
   * Subscribes a user to a fund
   */
  async subscribeToFund(request: SubscriptionRequest): Promise<TransactionResponse> {
    try {
      // Get user and fund information
      const user = await this.userService.getUserById(request.userId);
      const fund = await this.fundService.getFundById(request.fundId);

      // Validate minimum amount
      const isValidAmount = await this.fundService.validateMinimumAmount(request.fundId, request.amount);
      if (!isValidAmount) {
        throw new BusinessRuleError(
          `El monto mínimo para el fondo ${fund.name} es ${formatCurrency(fund.minimumAmount)}`
        );
      }

      // Check if user has sufficient balance
      if (user.availableBalance < request.amount) {
        throw new InsufficientFundsError(fund.name);
      }

      // Create transaction record
      const transaction = await this.createTransaction(
        request.userId,
        request.fundId,
        fund.name,
        'subscription',
        request.amount
      );

      try {
        // Update user balance
        const newBalance = user.availableBalance - request.amount;
        const updatedUser = await this.userService.updateUserBalance(request.userId, newBalance);

        // Mark transaction as completed
        await this.updateTransactionStatus(request.userId, transaction.id, 'completed');

        // Send notification
        const notificationMessage = `Su suscripción al fondo ${fund.name} por ${formatCurrency(request.amount)} ha sido exitosa. Su saldo disponible es ${formatCurrency(newBalance)}.`;
        
        await this.notificationService.sendNotification({
          userId: request.userId,
          type: user.notificationPreference,
          recipient: user.notificationPreference === 'email' ? user.email : user.phone || '',
          subject: 'Suscripción Exitosa',
          message: notificationMessage,
        });

        return {
          success: true,
          transaction: {
            ...transaction,
            status: 'completed',
            completedAt: new Date(),
          },
          message: 'Suscripción realizada exitosamente',
          availableBalance: updatedUser.availableBalance,
        };

      } catch (error) {
        // Mark transaction as failed
        await this.updateTransactionStatus(
          request.userId, 
          transaction.id, 
          'failed', 
          error instanceof Error ? error.message : 'Unknown error'
        );
        throw error;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Cancels a user's subscription to a fund
   */
  async cancelFundSubscription(request: CancellationRequest): Promise<TransactionResponse> {
    try {
      // Get user and fund information
      const user = await this.userService.getUserById(request.userId);
      const fund = await this.fundService.getFundById(request.fundId);

      // Check if user has an active subscription to this fund
      const userTransactions = await this.getUserTransactions(request.userId);
      const activeSubscription = userTransactions.find(t => 
        t.fundId === request.fundId && 
        t.type === 'subscription' && 
        t.status === 'completed'
      );

      if (!activeSubscription) {
        throw new BusinessRuleError(`No se encontró una suscripción activa al fondo ${fund.name}`);
      }

      // Create cancellation transaction
      const transaction = await this.createTransaction(
        request.userId,
        request.fundId,
        fund.name,
        'cancellation',
        activeSubscription.amount
      );

      try {
        // Return the subscription amount to user's balance
        const newBalance = user.availableBalance + activeSubscription.amount;
        const updatedUser = await this.userService.updateUserBalance(request.userId, newBalance);

        // Mark transaction as completed
        await this.updateTransactionStatus(request.userId, transaction.id, 'completed');

        // Send notification
        const notificationMessage = `Su cancelación del fondo ${fund.name} ha sido exitosa. Se han devuelto ${formatCurrency(activeSubscription.amount)} a su cuenta. Su saldo disponible es ${formatCurrency(newBalance)}.`;
        
        await this.notificationService.sendNotification({
          userId: request.userId,
          type: user.notificationPreference,
          recipient: user.notificationPreference === 'email' ? user.email : user.phone || '',
          subject: 'Cancelación Exitosa',
          message: notificationMessage,
        });

        return {
          success: true,
          transaction: {
            ...transaction,
            status: 'completed',
            completedAt: new Date(),
          },
          message: 'Cancelación realizada exitosamente',
          availableBalance: updatedUser.availableBalance,
        };

      } catch (error) {
        // Mark transaction as failed
        await this.updateTransactionStatus(
          request.userId, 
          transaction.id, 
          'failed', 
          error instanceof Error ? error.message : 'Unknown error'
        );
        throw error;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Gets transaction history for a user
   */
  async getUserTransactions(userId: string): Promise<Transaction[]> {
    try {
      const result = await dynamoClient.query({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'TRANSACTION#',
        },
        ScanIndexForward: false, // Sort by SK in descending order (newest first)
      }).promise();

      if (!result.Items || result.Items.length === 0) {
        return [];
      }

      return result.Items.map(item => {
        const dynamoItem = item as TransactionDynamoDBItem;
        return {
          id: dynamoItem.id,
          userId: dynamoItem.userId,
          fundId: dynamoItem.fundId,
          fundName: dynamoItem.fundName,
          type: dynamoItem.type,
          amount: dynamoItem.amount,
          status: dynamoItem.status,
          createdAt: new Date(dynamoItem.createdAt),
          completedAt: dynamoItem.completedAt ? new Date(dynamoItem.completedAt) : undefined,
          errorMessage: dynamoItem.errorMessage,
        };
      });

    } catch (error) {
      console.error('Error getting user transactions:', error);
      throw new Error('Failed to get transaction history');
    }
  }

  /**
   * Gets a specific transaction by ID
   */
  async getTransactionById(userId: string, transactionId: string): Promise<Transaction> {
    try {
      const result = await dynamoClient.get({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `TRANSACTION#${transactionId}`,
        },
      }).promise();

      if (!result.Item) {
        throw new NotFoundError(`Transaction with ID ${transactionId} not found`);
      }

      const item = result.Item as TransactionDynamoDBItem;
      
      return {
        id: item.id,
        userId: item.userId,
        fundId: item.fundId,
        fundName: item.fundName,
        type: item.type,
        amount: item.amount,
        status: item.status,
        createdAt: new Date(item.createdAt),
        completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
        errorMessage: item.errorMessage,
      };

    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error getting transaction:', error);
      throw new Error('Failed to get transaction');
    }
  }
}
