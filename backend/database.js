const AWS = require('aws-sdk');

// Configuración de DynamoDB
const dynamoConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fake-access-key',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fake-secret-key'
};

// Solo usar endpoint local si está específicamente configurado para DynamoDB Local
if (process.env.DYNAMODB_ENDPOINT && process.env.DYNAMODB_ENDPOINT.includes('localhost')) {
  dynamoConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
  console.log('🔧 Usando DynamoDB Local:', process.env.DYNAMODB_ENDPOINT);
} else {
  console.log('🌐 Usando DynamoDB en AWS');
}

AWS.config.update(dynamoConfig);

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

// Nombres de las tablas
const TABLES = {
  USERS: `${process.env.DYNAMODB_TABLE_PREFIX || 'btg-pension'}-users`,
  TRANSACTIONS: `${process.env.DYNAMODB_TABLE_PREFIX || 'btg-pension'}-transactions`,
  SUBSCRIPTIONS: `${process.env.DYNAMODB_TABLE_PREFIX || 'btg-pension'}-subscriptions`,
  NOTIFICATIONS: `${process.env.DYNAMODB_TABLE_PREFIX || 'btg-pension'}-notifications`
};

// Función para crear tablas si no existen
const createTables = async () => {
  try {
    // Tabla de usuarios
    const userTableParams = {
      TableName: TABLES.USERS,
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };

    // Tabla de transacciones
    const transactionTableParams = {
      TableName: TABLES.TRANSACTIONS,
      KeySchema: [
        { AttributeName: 'transactionId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'transactionId', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserIndex',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' }
          ],
          Projection: { ProjectionType: 'ALL' }
        }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };

    // Tabla de suscripciones
    const subscriptionTableParams = {
      TableName: TABLES.SUBSCRIPTIONS,
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'fundId', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'fundId', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };

    // Tabla de notificaciones
    const notificationTableParams = {
      TableName: TABLES.NOTIFICATIONS,
      KeySchema: [
        { AttributeName: 'notificationId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'notificationId', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserIndex',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' }
          ],
          Projection: { ProjectionType: 'ALL' }
        }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };

    // Crear tablas
    const tables = [
      { params: userTableParams, name: 'Users' },
      { params: transactionTableParams, name: 'Transactions' },
      { params: subscriptionTableParams, name: 'Subscriptions' },
      { params: notificationTableParams, name: 'Notifications' }
    ];

    for (const table of tables) {
      try {
        await dynamodb.createTable(table.params).promise();
        console.log(`✅ Tabla ${table.name} creada exitosamente`);
      } catch (error) {
        if (error.code === 'ResourceInUseException') {
          console.log(`ℹ️ Tabla ${table.name} ya existe`);
        } else {
          console.error(`❌ Error creando tabla ${table.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error en configuración de DynamoDB:', error);
  }
};

// Función para verificar si DynamoDB está disponible
const isDynamoDBAvailable = async () => {
  try {
    await dynamodb.listTables().promise();
    return true;
  } catch (error) {
    console.warn('⚠️ DynamoDB no disponible, usando modo memoria:', error.message);
    return false;
  }
};

module.exports = {
  dynamodb,
  docClient,
  TABLES,
  createTables,
  isDynamoDBAvailable
};
