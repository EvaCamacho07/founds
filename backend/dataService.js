const { docClient, TABLES, isDynamoDBAvailable } = require('./database');
const { v4: uuidv4 } = require('uuid');

// Fallback en memoria cuando DynamoDB no está disponible
let memoryStorage = {
  users: {},
  transactions: {},
  subscriptions: {},
  notifications: {}
};

let useDynamoDB = false;

// Inicializar storage
const initializeStorage = async () => {
  useDynamoDB = await isDynamoDBAvailable();
  console.log(`🗄️ Usando almacenamiento: ${useDynamoDB ? 'DynamoDB' : 'Memoria'}`);
  
  // Si usamos memoria, inicializar usuario por defecto
  if (!useDynamoDB) {
    memoryStorage.users['user123'] = {
      userId: 'user123',
      name: 'Usuario Demo',
      email: 'camachoeva.07@gmail.com',
      phone: '+573001661010',
      balance: 500000,
      notificationPreference: 'email',
      createdAt: new Date().toISOString()
    };
  }
};

// Servicios de Usuario
const UserService = {
  async getUser(userId) {
    if (!useDynamoDB) {
      return memoryStorage.users[userId] || null;
    }

    try {
      const params = {
        TableName: TABLES.USERS,
        Key: { userId }
      };
      const result = await docClient.get(params).promise();
      return result.Item || null;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return null;
    }
  },

  async createUser(userData) {
    const user = {
      userId: userData.userId || uuidv4(),
      name: userData.name || 'Usuario Demo',
      email: userData.email || 'demo@example.com',
      phone: userData.phone || '+573001661010',
      balance: userData.balance || 500000,
      notificationPreference: userData.notificationPreference || 'email',
      createdAt: new Date().toISOString(),
      ...userData
    };

    if (!useDynamoDB) {
      memoryStorage.users[user.userId] = user;
      return user;
    }

    try {
      const params = {
        TableName: TABLES.USERS,
        Item: user
      };
      await docClient.put(params).promise();
      return user;
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw error;
    }
  },

  async updateUser(userId, updates) {
    if (!useDynamoDB) {
      if (memoryStorage.users[userId]) {
        memoryStorage.users[userId] = { ...memoryStorage.users[userId], ...updates };
        return memoryStorage.users[userId];
      }
      return null;
    }

    try {
      const updateExpression = [];
      const expressionAttributeValues = {};
      const expressionAttributeNames = {};

      Object.keys(updates).forEach(key => {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = updates[key];
      });

      const params = {
        TableName: TABLES.USERS,
        Key: { userId },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      };

      const result = await docClient.update(params).promise();
      return result.Attributes;
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw error;
    }
  }
};

// Servicios de Suscripciones
const SubscriptionService = {
  async getUserSubscriptions(userId) {
    if (!useDynamoDB) {
      return Object.values(memoryStorage.subscriptions).filter(sub => sub.userId === userId);
    }

    try {
      const params = {
        TableName: TABLES.SUBSCRIPTIONS,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      };
      const result = await docClient.query(params).promise();
      return result.Items || [];
    } catch (error) {
      console.error('Error obteniendo suscripciones:', error);
      return [];
    }
  },

  async createSubscription(subscriptionData) {
    const subscription = {
      userId: subscriptionData.userId,
      fundId: subscriptionData.fundId,
      fundName: subscriptionData.fundName,
      amount: subscriptionData.amount,
      subscriptionDate: subscriptionData.subscriptionDate || new Date().toISOString(),
      transactionId: subscriptionData.transactionId,
      status: 'ACTIVE'
    };

    if (!useDynamoDB) {
      const key = `${subscription.userId}-${subscription.fundId}`;
      memoryStorage.subscriptions[key] = subscription;
      return subscription;
    }

    try {
      const params = {
        TableName: TABLES.SUBSCRIPTIONS,
        Item: subscription
      };
      await docClient.put(params).promise();
      return subscription;
    } catch (error) {
      console.error('Error creando suscripción:', error);
      throw error;
    }
  },

  async deleteSubscription(userId, fundId) {
    if (!useDynamoDB) {
      const key = `${userId}-${fundId}`;
      const subscription = memoryStorage.subscriptions[key];
      delete memoryStorage.subscriptions[key];
      return subscription;
    }

    try {
      const params = {
        TableName: TABLES.SUBSCRIPTIONS,
        Key: { userId, fundId },
        ReturnValues: 'ALL_OLD'
      };
      const result = await docClient.delete(params).promise();
      return result.Attributes;
    } catch (error) {
      console.error('Error eliminando suscripción:', error);
      throw error;
    }
  }
};

// Servicios de Transacciones
const TransactionService = {
  async createTransaction(transactionData) {
    const transaction = {
      transactionId: transactionData.id || uuidv4(),
      userId: transactionData.userId || 'user123',
      type: transactionData.type,
      fundId: transactionData.fundId,
      fundName: transactionData.fundName,
      amount: transactionData.amount,
      timestamp: transactionData.timestamp || new Date().toISOString(),
      status: transactionData.status || 'COMPLETED'
    };

    if (!useDynamoDB) {
      memoryStorage.transactions[transaction.transactionId] = transaction;
      return transaction;
    }

    try {
      const params = {
        TableName: TABLES.TRANSACTIONS,
        Item: transaction
      };
      await docClient.put(params).promise();
      return transaction;
    } catch (error) {
      console.error('Error creando transacción:', error);
      throw error;
    }
  },

  async getUserTransactions(userId) {
    if (!useDynamoDB) {
      return Object.values(memoryStorage.transactions).filter(tx => tx.userId === userId);
    }

    try {
      const params = {
        TableName: TABLES.TRANSACTIONS,
        IndexName: 'UserIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      };
      const result = await docClient.query(params).promise();
      return result.Items || [];
    } catch (error) {
      console.error('Error obteniendo transacciones:', error);
      return [];
    }
  }
};

module.exports = {
  initializeStorage,
  UserService,
  SubscriptionService,
  TransactionService,
  useDynamoDB: () => useDynamoDB
};
