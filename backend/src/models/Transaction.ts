/**
 * Transaction types for fund operations
 */
export type TransactionType = 'subscription' | 'cancellation';

/**
 * Transaction status types
 */
export type TransactionStatus = 'pending' | 'completed' | 'failed';

/**
 * Represents a transaction in the system
 */
export interface Transaction {
  id: string;
  userId: string;
  fundId: number;
  fundName: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  : Date;
  completedAt?: Date;
  errorMessage?: string;
}

/**
 * Transaction data for DynamoDB operations
 */
export interface TransactionDynamoDBItem {
  PK: string; // USER#{userId}
  SK: string; // TRANSACTION#{transactionId}
  GSI1PK: string; // TRANSACTION#{type}
  GSI1SK: string; // {createdAt}
  id: string;
  userId: string;
  fundId: number;
  fundName: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  entityType: 'TRANSACTION';
}

/**
 * Request payload for fund subscription
 */
export interface SubscriptionRequest {
  userId: string;
  fundId: number;
  amount: number;
}

/**
 * Request payload for fund cancellation
 */
export interface CancellationRequest {
  userId: string;
  fundId: number;
}

/**
 * Response for transaction operations
 */
export interface TransactionResponse {
  success: boolean;
  transaction?: Transaction;
  message: string;
  availableBalance?: number;
}
