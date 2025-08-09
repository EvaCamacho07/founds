/**
 * Represents a user in the BTG Pactual pension fund system
 */
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  availableBalance: number;
  notificationPreference: 'email' | 'sms';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User data for DynamoDB operations
 */
export interface UserDynamoDBItem {
  PK: string; // USER#{userId}
  SK: string; // USER#{userId}
  GSI1PK: string; // USER
  GSI1SK: string; // EMAIL#{email}
  id: string;
  name: string;
  email: string;
  phone?: string;
  availableBalance: number;
  notificationPreference: 'email' | 'sms';
  createdAt: string;
  updatedAt: string;
  entityType: 'USER';
}

/**
 * Default user with initial balance
 */
export const DEFAULT_USER: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Test User',
  email: 'ecamachoecamacho@gmail.com',
  phone: '+57 300 166 1010',
  availableBalance: 500000, // COP $500,000
  notificationPreference: 'email'
};
