// BTG Pactual Backend - Complete Lambda Handler
const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');

const app = express();
app.use(cors());
app.use(express.json());

// Configurar AWS DynamoDB
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1'
});

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();
const tablePrefix = process.env.DYNAMODB_TABLE_PREFIX || 'btg-pension';

// Fondos disponibles con datos de muestra
const availableFunds = [
    {
        id: 'fpv-recaudadora',
        name: 'FPV_EL CLIENTE_RECAUDADORA',
        type: 'FPV',
        minimumAmount: 75000,
        currency: 'COP',
        description: 'Fondo de Pensión Voluntaria Recaudadora'
    },
    {
        id: 'fpv-ecopetrol',
        name: 'FPV_EL CLIENTE_ECOPETROL',
        type: 'FPV',
        minimumAmount: 125000,
        currency: 'COP',
        description: 'Fondo de Pensión Voluntaria Ecopetrol'
    },
    {
        id: 'deuda-privada',
        name: 'DEUDAPRIVADA',
        type: 'FIC',
        minimumAmount: 50000,
        currency: 'COP',
        description: 'Fondo de Inversión Colectiva - Deuda Privada'
    },
    {
        id: 'fdo-acciones',
        name: 'FDO-ACCIONES',
        type: 'FIC',
        minimumAmount: 250000,
        currency: 'COP',
        description: 'Fondo de Inversión Colectiva - Acciones'
    },
    {
        id: 'fpv-dinamica',
        name: 'FPV_EL CLIENTE_DINAMICA',
        type: 'FPV',
        minimumAmount: 100000,
        currency: 'COP',
        description: 'Fondo de Pensión Voluntaria Dinámica'
    }
];

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'BTG Pactual Backend is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'production'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'BTG Pactual API',
        status: 'active',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /api/health',
            'GET /api/funds',
            'GET /api/users/:id',
            'POST /api/users',
            'PUT /api/users/:id',
            'POST /api/transactions/subscribe',
            'POST /api/transactions/cancel',
            'GET /api/transactions/:userId',
            'POST /api/notifications'
        ]
    });
});

// Get all available funds
app.get('/api/funds', (req, res) => {
    res.json({
        success: true,
        data: availableFunds,
        count: availableFunds.length,
        timestamp: new Date().toISOString()
    });
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
        const params = {
            TableName: `${tablePrefix}-users`,
            Key: { userId }
        };
        
        const result = await docClient.get(params).promise();
        
        if (!result.Item) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado',
                timestamp: new Date().toISOString()
            });
        }
        
        res.json({
            success: true,
            data: result.Item,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            timestamp: new Date().toISOString()
        });
    }
});

// Create new user
app.post('/api/users', async (req, res) => {
    try {
        const { name, email, phone, notificationPreference } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y email son requeridos',
                timestamp: new Date().toISOString()
            });
        }
        
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const initialBalance = 500000; // COP $500,000 inicial
        
        const user = {
            userId,
            name,
            email,
            phone: phone || '',
            notificationPreference: notificationPreference || 'email',
            balance: initialBalance,
            subscriptions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const params = {
            TableName: `${tablePrefix}-users`,
            Item: user
        };
        
        await docClient.put(params).promise();
        
        res.status(201).json({
            success: true,
            data: user,
            message: 'Usuario creado exitosamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            timestamp: new Date().toISOString()
        });
    }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const updates = req.body;
        
        // Construir expression de actualización
        let updateExpression = 'SET updatedAt = :updatedAt';
        let expressionAttributeValues = {
            ':updatedAt': new Date().toISOString()
        };
        
        Object.keys(updates).forEach(key => {
            if (key !== 'userId') {
                updateExpression += `, #${key} = :${key}`;
                expressionAttributeValues[`:${key}`] = updates[key];
            }
        });
        
        const expressionAttributeNames = {};
        Object.keys(updates).forEach(key => {
            if (key !== 'userId') {
                expressionAttributeNames[`#${key}`] = key;
            }
        });
        
        const params = {
            TableName: `${tablePrefix}-users`,
            Key: { userId },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames,
            ReturnValues: 'ALL_NEW'
        };
        
        const result = await docClient.update(params).promise();
        
        res.json({
            success: true,
            data: result.Attributes,
            message: 'Usuario actualizado exitosamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            timestamp: new Date().toISOString()
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
                message: 'userId, fundId y amount son requeridos',
                timestamp: new Date().toISOString()
            });
        }
        
        // Verificar que el fondo existe
        const fund = availableFunds.find(f => f.id === fundId);
        if (!fund) {
            return res.status(404).json({
                success: false,
                message: 'Fondo no encontrado',
                timestamp: new Date().toISOString()
            });
        }
        
        // Verificar monto mínimo
        if (amount < fund.minimumAmount) {
            return res.status(400).json({
                success: false,
                message: `El monto mínimo para ${fund.name} es ${fund.minimumAmount} COP`,
                timestamp: new Date().toISOString()
            });
        }
        
        // Obtener usuario
        const userParams = {
            TableName: `${tablePrefix}-users`,
            Key: { userId }
        };
        
        const userResult = await docClient.get(userParams).promise();
        if (!userResult.Item) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado',
                timestamp: new Date().toISOString()
            });
        }
        
        const user = userResult.Item;
        
        // Verificar saldo disponible
        if (user.balance < amount) {
            return res.status(400).json({
                success: false,
                message: 'Saldo insuficiente',
                timestamp: new Date().toISOString()
            });
        }
        
        // Crear transacción
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const subscription = {
            subscriptionId: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fundId,
            fundName: fund.name,
            amount,
            subscriptionDate: new Date().toISOString(),
            status: 'active'
        };
        
        // Actualizar usuario
        const newBalance = user.balance - amount;
        const updatedSubscriptions = [...(user.subscriptions || []), subscription];
        
        const updateUserParams = {
            TableName: `${tablePrefix}-users`,
            Key: { userId },
            UpdateExpression: 'SET balance = :balance, subscriptions = :subscriptions, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':balance': newBalance,
                ':subscriptions': updatedSubscriptions,
                ':updatedAt': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        };
        
        await docClient.update(updateUserParams).promise();
        
        // Guardar transacción
        const transaction = {
            transactionId,
            userId,
            type: 'subscription',
            fundId,
            fundName: fund.name,
            amount,
            previousBalance: user.balance,
            newBalance,
            subscriptionId: subscription.subscriptionId,
            timestamp: new Date().toISOString(),
            status: 'completed'
        };
        
        const transactionParams = {
            TableName: `${tablePrefix}-subscriptions`,
            Item: transaction
        };
        
        await docClient.put(transactionParams).promise();
        
        res.status(201).json({
            success: true,
            data: {
                transaction,
                subscription,
                newBalance
            },
            message: 'Suscripción realizada exitosamente',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error in subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            timestamp: new Date().toISOString()
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
                message: 'userId y subscriptionId son requeridos',
                timestamp: new Date().toISOString()
            });
        }
        
        // Obtener usuario
        const userParams = {
            TableName: `${tablePrefix}-users`,
            Key: { userId }
        };
        
        const userResult = await docClient.get(userParams).promise();
        if (!userResult.Item) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado',
                timestamp: new Date().toISOString()
            });
        }
        
        const user = userResult.Item;
        const subscriptions = user.subscriptions || [];
        
        // Encontrar la suscripción
        const subscriptionIndex = subscriptions.findIndex(sub => sub.subscriptionId === subscriptionId);
        if (subscriptionIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Suscripción no encontrada',
                timestamp: new Date().toISOString()
            });
        }
        
        const subscription = subscriptions[subscriptionIndex];
        if (subscription.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'La suscripción ya está cancelada',
                timestamp: new Date().toISOString()
            });
        }
        
        // Cancelar suscripción y devolver dinero
        const refundAmount = subscription.amount;
        const newBalance = user.balance + refundAmount;
        
        subscriptions[subscriptionIndex].status = 'cancelled';
        subscriptions[subscriptionIndex].cancelledAt = new Date().toISOString();
        
        // Actualizar usuario
        const updateUserParams = {
            TableName: `${tablePrefix}-users`,
            Key: { userId },
            UpdateExpression: 'SET balance = :balance, subscriptions = :subscriptions, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':balance': newBalance,
                ':subscriptions': subscriptions,
                ':updatedAt': new Date().toISOString()
            }
        };
        
        await docClient.update(updateUserParams).promise();
        
        // Guardar transacción de cancelación
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const transaction = {
            transactionId,
            userId,
            type: 'cancellation',
            fundId: subscription.fundId,
            fundName: subscription.fundName,
            amount: refundAmount,
            previousBalance: user.balance,
            newBalance,
            subscriptionId,
            timestamp: new Date().toISOString(),
            status: 'completed'
        };
        
        const transactionParams = {
            TableName: `${tablePrefix}-subscriptions`,
            Item: transaction
        };
        
        await docClient.put(transactionParams).promise();
        
        res.json({
            success: true,
            data: {
                transaction,
                refundAmount,
                newBalance
            },
            message: 'Suscripción cancelada exitosamente',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error in cancellation:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            timestamp: new Date().toISOString()
        });
    }
});

// Get user transactions
app.get('/api/transactions/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const params = {
            TableName: `${tablePrefix}-subscriptions`,
            FilterExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        };
        
        const result = await docClient.scan(params).promise();
        
        // Ordenar por timestamp descendente
        const transactions = result.Items.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        res.json({
            success: true,
            data: transactions,
            count: transactions.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error getting transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            timestamp: new Date().toISOString()
        });
    }
});

// Send notification
app.post('/api/notifications', async (req, res) => {
    try {
        const { userId, type, message, channel } = req.body;
        
        if (!userId || !message) {
            return res.status(400).json({
                success: false,
                message: 'userId y message son requeridos',
                timestamp: new Date().toISOString()
            });
        }
        
        // Guardar notificación en la base de datos
        const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const notification = {
            notificationId,
            userId,
            type: type || 'info',
            message,
            channel: channel || 'email',
            status: 'sent',
            sentAt: new Date().toISOString()
        };
        
        const params = {
            TableName: `${tablePrefix}-notifications`,
            Item: notification
        };
        
        await docClient.put(params).promise();
        
        res.status(201).json({
            success: true,
            data: notification,
            message: 'Notificación enviada exitosamente',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        timestamp: new Date().toISOString()
    });
});

// Lambda handler
const serverlessExpress = require('aws-serverless-express');
const server = serverlessExpress.createServer(app);

exports.handler = (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    return serverlessExpress.proxy(server, event, context);
};

module.exports = app;
