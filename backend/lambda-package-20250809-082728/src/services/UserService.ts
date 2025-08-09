import { dynamoClient, TABLE_NAME } from '../config/database';
import { User, UserDynamoDBItem, DEFAULT_USER } from '../models/User';
import { generateUserId } from '../utils/helpers';
import { NotFoundError, ValidationError } from '../utils/errors';

/**
 * Service class for user operations
 */
export class UserService {
  /**
   * Creates a new user with default values
   */
  async createUser(userData?: Partial<User>): Promise<User> {
    const userId = generateUserId();
    const now = new Date();
    
    const user: User = {
      id: userId,
      ...DEFAULT_USER,
      ...userData,
      createdAt: now,
      updatedAt: now,
    };

    const dynamoItem: UserDynamoDBItem = {
      PK: `USER#${userId}`,
      SK: `USER#${userId}`,
      GSI1PK: 'USER',
      GSI1SK: `EMAIL#${user.email}`,
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      availableBalance: user.availableBalance,
      notificationPreference: user.notificationPreference,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      entityType: 'USER',
    };

    try {
      await dynamoClient.put({
        TableName: TABLE_NAME,
        Item: dynamoItem,
      }).promise();

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Gets a user by ID
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const result = await dynamoClient.get({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `USER#${userId}`,
        },
      }).promise();

      if (!result.Item) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      const item = result.Item as UserDynamoDBItem;
      
      return {
        id: item.id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        availableBalance: item.availableBalance,
        notificationPreference: item.notificationPreference,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error getting user:', error);
      throw new Error('Failed to get user');
    }
  }

  /**
   * Updates user's available balance
   */
  async updateUserBalance(userId: string, newBalance: number): Promise<User> {
    if (newBalance < 0) {
      throw new ValidationError('Balance cannot be negative');
    }

    try {
      const result = await dynamoClient.update({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `USER#${userId}`,
        },
        UpdateExpression: 'SET availableBalance = :balance, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':balance': newBalance,
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      }).promise();

      if (!result.Attributes) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      const item = result.Attributes as UserDynamoDBItem;
      
      return {
        id: item.id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        availableBalance: item.availableBalance,
        notificationPreference: item.notificationPreference,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Error updating user balance:', error);
      throw new Error('Failed to update user balance');
    }
  }

  /**
   * Gets or creates a default user for demo purposes
   */
  async getOrCreateDefaultUser(): Promise<User> {
    const defaultUserId = 'default-user';
    
    try {
      return await this.getUserById(defaultUserId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return await this.createUser({ id: defaultUserId });
      }
      throw error;
    }
  }
}
