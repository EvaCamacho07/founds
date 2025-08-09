// BTG Pactual Backend - Complete API with DynamoDB
const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');

const app = express();
app.use(cors());
app.use(express.json());

// Configure DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION || 'us-east-1'
});

// Table names
const USERS_TABLE = process.env.USERS_TABLE || 'btg-pension-users';
const TRANSACTIONS_TABLE = process.env.TRANSACTIONS_TABLE || 'btg-pension-transactions';
const SUBSCRIPTIONS_TABLE = process.env.SUBSCRIPTIONS_TABLE || 'btg-pension-subscriptions';
const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE || 'btg-pension-notifications';

// Datos de fondos disponibles
const availableFunds = [
    {
        id: 1,
        name: 'FPV_EL CLIENTE_RECAUDADORA',
        type: 'FPV',
        minimumAmount: 75000,
        currency: 'COP'
    },
    {
        id: 2,
        name: 'FPV_EL CLIENTE_ECOPETROL',
        type: 'FPV',
        minimumAmount: 125000,
        currency: 'COP'
    },
    {
        id: 3,
        name: 'DEUDAPRIVADA',
        type: 'FIC',
        minimumAmount: 50000,
        currency: 'COP'
    },
    {
        id: 4,
        name: 'FDO-ACCIONES',
        type: 'FIC',
        minimumAmount: 250000,
        currency: 'COP'
    },
    {
        id: 5,
        name: 'FPV_EL CLIENTE_DINAMICA',
        type: 'FPV',
        minimumAmount: 100000,
        currency: 'COP'
    }
];

// Utility functions
function generateId(prefix) {
    return `${prefix}_${Date.now()}`;
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'BTG Pactual API funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

// Get available funds
app.get('/api/funds', (req, res) => {
    res.json({
        success: true,
        data: availableFunds,
        count: availableFunds.length,
        message: 'Fondos obtenidos exitosamente'
    });
});

// Create user
app.post('/api/users', async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y email son requeridos'
            });
        }
        
        const userId = generateId('user');
        const user = {
            userId,
            name,
            email,
            phone: phone || '',
            availableBalance: 500000, // Balance inicial COP $500,000
            totalInvested: 0,
            subscriptions: [],
            createdAt: new Date().toISOString()
        };
        
        // Save to DynamoDB
        await dynamodb.put({
            TableName: USERS_TABLE,
            Item: user
        }).promise();
        
        res.status(201).json({
            success: true,
            data: user,
            message: 'Usuario creado exitosamente'
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            error: 'Error creando usuario',
            details: error.message
        });
    }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
        const result = await dynamodb.get({
            TableName: USERS_TABLE,
            Key: { userId }
        }).promise();
        
        if (!result.Item) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: result.Item,
            message: 'Usuario encontrado'
        });
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo usuario',
            details: error.message
        });
    }
});

// Subscribe to fund
app.post('/api/transactions/subscribe', async (req, res) => {
    try {
        const { userId, fundId, amount } = req.body;
        
        if (!userId || !fundId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'userId, fundId y amount son requeridos'
            });
        }
        
        // Get user
        const userResult = await dynamodb.get({
            TableName: USERS_TABLE,
            Key: { userId }
        }).promise();
        
        if (!userResult.Item) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        const user = userResult.Item;
        const fund = availableFunds.find(f => f.id === fundId);
        
        if (!fund) {
            return res.status(404).json({
                success: false,
                message: 'Fondo no encontrado'
            });
        }
        
        // Validations
        if (amount < fund.minimumAmount) {
            return res.status(400).json({
                success: false,
                message: `Monto mínimo para ${fund.name} es ${fund.minimumAmount} COP`
            });
        }
        
        if (user.availableBalance < amount) {
            return res.status(400).json({
                success: false,
                message: 'Saldo insuficiente'
            });
        }
        
        // Create subscription and transaction
        const subscriptionId = generateId('sub');
        const transactionId = generateId('txn');
        const timestamp = new Date().toISOString();
        
        const subscription = {
            subscriptionId,
            userId,
            fundId,
            fundName: fund.name,
            amount,
            status: 'active',
            subscriptionDate: timestamp,
            createdAt: timestamp
        };
        
        const transaction = {
            transactionId,
            userId,
            type: 'subscription',
            fundId,
            fundName: fund.name,
            amount,
            previousBalance: user.availableBalance,
            newBalance: user.availableBalance - amount,
            timestamp
        };
        
        // Update user balance and subscriptions
        const updatedUser = {
            ...user,
            availableBalance: user.availableBalance - amount,
            totalInvested: (user.totalInvested || 0) + amount,
            subscriptions: [...(user.subscriptions || []), subscription]
        };
        
        // Save transaction
        await dynamodb.put({
            TableName: TRANSACTIONS_TABLE,
            Item: transaction
        }).promise();
        
        // Save subscription
        await dynamodb.put({
            TableName: SUBSCRIPTIONS_TABLE,
            Item: subscription
        }).promise();
        
        // Update user
        await dynamodb.put({
            TableName: USERS_TABLE,
            Item: updatedUser
        }).promise();
        
        res.status(201).json({
            success: true,
            message: 'Suscripción creada exitosamente',
            subscription,
            newBalance: updatedUser,
            timestamp
        });
        
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({
            success: false,
            error: 'Error procesando suscripción',
            details: error.message
        });
    }
});

// Cancel subscription
app.post('/api/transactions/cancel', async (req, res) => {
    try {
        const { userId, subscriptionId } = req.body;
        
        if (!userId || !subscriptionId) {
            return res.status(400).json({
                success: false,
                message: 'userId y subscriptionId son requeridos'
            });
        }
        
        // Get user
        const userResult = await dynamodb.get({
            TableName: USERS_TABLE,
            Key: { userId }
        }).promise();
        
        if (!userResult.Item) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        const user = userResult.Item;
        const subscription = user.subscriptions?.find(s => s.subscriptionId === subscriptionId);
        
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Suscripción no encontrada'
            });
        }
        
        if (subscription.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'La suscripción ya está cancelada'
            });
        }
        
        // Create cancellation transaction
        const transactionId = generateId('txn');
        const timestamp = new Date().toISOString();
        const refundAmount = subscription.amount;
        
        const transaction = {
            userId,
            transactionId,
            type: 'cancellation',
            fundId: subscription.fundId,
            fundName: subscription.fundName,
            amount: refundAmount,
            previousBalance: user.availableBalance,
            newBalance: user.availableBalance + refundAmount,
            timestamp
        };
        
        // Update user: mark subscription as cancelled and update balance
        const updatedSubscriptions = user.subscriptions.map(s => 
            s.subscriptionId === subscriptionId 
                ? { ...s, status: 'cancelled', cancelledAt: timestamp }
                : s
        );
        
        const updatedUser = {
            ...user,
            availableBalance: user.availableBalance + refundAmount,
            totalInvested: (user.totalInvested || 0) - refundAmount,
            subscriptions: updatedSubscriptions
        };
        
        // Save transaction
        await dynamodb.put({
            TableName: TRANSACTIONS_TABLE,
            Item: transaction
        }).promise();
        
        // Update user
        await dynamodb.put({
            TableName: USERS_TABLE,
            Item: updatedUser
        }).promise();
        
        res.json({
            success: true,
            message: 'Suscripción cancelada exitosamente',
            transaction,
            refundAmount,
            newBalance: updatedUser.availableBalance
        });
        
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({
            success: false,
            error: 'Error cancelando suscripción',
            details: error.message
        });
    }
});

// Get user transactions - Using GSI for efficient query
app.get('/api/transactions/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Use GSI to query transactions by userId
        const result = await dynamodb.query({
            TableName: TRANSACTIONS_TABLE,
            IndexName: 'UserTransactionsIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false // Sort by timestamp descending (newest first)
        }).promise();
        
        res.json({
            success: true,
            data: result.Items,
            count: result.Items.length,
            message: 'Historial de transacciones obtenido exitosamente'
        });
    } catch (error) {
        console.error('Error getting transactions:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener el historial de transacciones',
            details: error.message
        });
    }
});

// Get user subscriptions - Using GSI for efficient query
app.get('/api/subscriptions/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Use GSI to query subscriptions by userId
        const result = await dynamodb.query({
            TableName: SUBSCRIPTIONS_TABLE,
            IndexName: 'UserSubscriptionsIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false // Sort by subscriptionDate descending (newest first)
        }).promise();
        
        res.json({
            success: true,
            data: result.Items,
            count: result.Items.length,
            message: 'Suscripciones obtenidas exitosamente'
        });
    } catch (error) {
        console.error('Error getting subscriptions:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener suscripciones',
            details: error.message
        });
    }
});

// Send notification
app.post('/api/notifications', async (req, res) => {
    try {
        const { userId, message, type } = req.body;
        
        if (!userId || !message) {
            return res.status(400).json({
                success: false,
                message: 'userId y message son requeridos'
            });
        }
        
        const notificationId = generateId('notif');
        const notification = {
            userId,
            notificationId,
            message,
            type: type || 'info',
            status: 'sent',
            sentAt: new Date().toISOString()
        };
        
        // Save notification to DynamoDB
        await dynamodb.put({
            TableName: NOTIFICATIONS_TABLE,
            Item: notification
        }).promise();
        
        res.status(201).json({
            success: true,
            data: notification,
            message: 'Notificación enviada exitosamente'
        });
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({
            success: false,
            error: 'Error enviando notificación',
            details: error.message
        });
    }
});

// Get user notifications - Using scan with filter
app.get('/api/notifications/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Use scan with filter since notifications table doesn't have GSI by userId
        const result = await dynamodb.scan({
            TableName: NOTIFICATIONS_TABLE,
            FilterExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise();
        
        // Sort by sentAt (newest first)
        const notifications = result.Items.sort((a, b) => 
            new Date(b.sentAt) - new Date(a.sentAt)
        );
        
        res.json({
            success: true,
            data: notifications,
            count: notifications.length,
            message: 'Notificaciones obtenidas exitosamente'
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener notificaciones del usuario',
            details: error.message
        });
    }
});

// Lambda handler
const serverlessExpress = require('aws-serverless-express');
const server = serverlessExpress.createServer(app);

exports.handler = (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    return serverlessExpress.proxy(server, event, context);
};
