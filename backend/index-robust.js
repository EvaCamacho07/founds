// BTG Pactual Backend - Complete Lambda Handler (Robust Version)
const express = require('express');
const cors = require('cors');

// Configuración básica de Express
const app = express();
app.use(cors());
app.use(express.json());

// Middleware de logging básico
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Configuración de AWS (solo si se necesita)
let AWS, docClient;
try {
    AWS = require('aws-sdk');
    AWS.config.update({
        region: process.env.AWS_REGION || 'us-east-1'
    });
    docClient = new AWS.DynamoDB.DocumentClient();
    console.log('AWS SDK configurado exitosamente');
} catch (error) {
    console.log('AWS SDK no disponible, usando datos mock');
}

const tablePrefix = process.env.DYNAMODB_TABLE_PREFIX || 'btg-pension';

// Datos de fondos disponibles
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

// Mock data para desarrollo
const mockUsers = {};
const mockTransactions = [];

// Funciones helper
const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const successResponse = (data, message = '', statusCode = 200) => ({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
});

const errorResponse = (message = 'Error interno del servidor', statusCode = 500) => ({
    success: false,
    message,
    timestamp: new Date().toISOString()
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    try {
        res.json({
            status: 'ok',
            message: 'BTG Pactual Backend is running',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            environment: process.env.NODE_ENV || 'production',
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
    } catch (error) {
        console.error('Error in health check:', error);
        res.status(500).json(errorResponse('Error en health check'));
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'BTG Pactual API',
        status: 'active',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

// Get all available funds
app.get('/api/funds', (req, res) => {
    try {
        res.json(successResponse(availableFunds, 'Fondos obtenidos exitosamente'));
    } catch (error) {
        console.error('Error getting funds:', error);
        res.status(500).json(errorResponse());
    }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
        if (!userId) {
            return res.status(400).json(errorResponse('userId es requerido', 400));
        }

        // Intentar DynamoDB primero, luego fallback a mock
        if (docClient) {
            try {
                const params = {
                    TableName: `${tablePrefix}-users`,
                    Key: { userId }
                };
                
                const result = await docClient.get(params).promise();
                
                if (!result.Item) {
                    return res.status(404).json(errorResponse('Usuario no encontrado', 404));
                }
                
                res.json(successResponse(result.Item, 'Usuario encontrado'));
                return;
            } catch (dbError) {
                console.log('DynamoDB error, using mock data:', dbError.message);
            }
        }

        // Fallback a mock data
        const user = mockUsers[userId];
        if (!user) {
            return res.status(404).json(errorResponse('Usuario no encontrado', 404));
        }
        
        res.json(successResponse(user, 'Usuario encontrado (mock)'));
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json(errorResponse());
    }
});

// Create new user
app.post('/api/users', async (req, res) => {
    try {
        const { name, email, phone, notificationPreference } = req.body;
        
        if (!name || !email) {
            return res.status(400).json(errorResponse('Nombre y email son requeridos', 400));
        }
        
        const userId = generateId('user');
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
        
        // Intentar DynamoDB primero, luego fallback a mock
        if (docClient) {
            try {
                const params = {
                    TableName: `${tablePrefix}-users`,
                    Item: user
                };
                
                await docClient.put(params).promise();
                res.status(201).json(successResponse(user, 'Usuario creado exitosamente'));
                return;
            } catch (dbError) {
                console.log('DynamoDB error, using mock data:', dbError.message);
            }
        }

        // Fallback a mock data
        mockUsers[userId] = user;
        res.status(201).json(successResponse(user, 'Usuario creado exitosamente (mock)'));
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json(errorResponse());
    }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const updates = req.body;
        
        if (!userId) {
            return res.status(400).json(errorResponse('userId es requerido', 400));
        }
        
        // Intentar DynamoDB primero, luego fallback a mock
        if (docClient) {
            try {
                let updateExpression = 'SET updatedAt = :updatedAt';
                let expressionAttributeValues = {
                    ':updatedAt': new Date().toISOString()
                };
                let expressionAttributeNames = {};
                
                Object.keys(updates).forEach(key => {
                    if (key !== 'userId') {
                        updateExpression += `, #${key} = :${key}`;
                        expressionAttributeValues[`:${key}`] = updates[key];
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
                res.json(successResponse(result.Attributes, 'Usuario actualizado exitosamente'));
                return;
            } catch (dbError) {
                console.log('DynamoDB error, using mock data:', dbError.message);
            }
        }

        // Fallback a mock data
        if (!mockUsers[userId]) {
            return res.status(404).json(errorResponse('Usuario no encontrado', 404));
        }
        
        mockUsers[userId] = { ...mockUsers[userId], ...updates, updatedAt: new Date().toISOString() };
        res.json(successResponse(mockUsers[userId], 'Usuario actualizado exitosamente (mock)'));
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json(errorResponse());
    }
});

// Subscribe to fund
app.post('/api/transactions/subscribe', async (req, res) => {
    try {
        const { userId, fundId, amount } = req.body;
        
        if (!userId || !fundId || !amount) {
            return res.status(400).json(errorResponse('userId, fundId y amount son requeridos', 400));
        }
        
        // Verificar que el fondo existe
        const fund = availableFunds.find(f => f.id === fundId);
        if (!fund) {
            return res.status(404).json(errorResponse('Fondo no encontrado', 404));
        }
        
        // Verificar monto mínimo
        if (amount < fund.minimumAmount) {
            return res.status(400).json(errorResponse(`El monto mínimo para ${fund.name} es ${fund.minimumAmount} COP`, 400));
        }
        
        // Obtener usuario (mock para simplicidad)
        const user = mockUsers[userId] || {
            userId,
            balance: 500000,
            subscriptions: []
        };
        
        // Verificar saldo disponible
        if (user.balance < amount) {
            return res.status(400).json(errorResponse('Saldo insuficiente', 400));
        }
        
        // Crear suscripción
        const subscription = {
            subscriptionId: generateId('sub'),
            fundId,
            fundName: fund.name,
            amount,
            subscriptionDate: new Date().toISOString(),
            status: 'active'
        };
        
        // Crear transacción
        const transaction = {
            transactionId: generateId('txn'),
            userId,
            type: 'subscription',
            fundId,
            fundName: fund.name,
            amount,
            previousBalance: user.balance,
            newBalance: user.balance - amount,
            subscriptionId: subscription.subscriptionId,
            timestamp: new Date().toISOString(),
            status: 'completed'
        };
        
        // Actualizar usuario
        user.balance -= amount;
        user.subscriptions = [...(user.subscriptions || []), subscription];
        user.updatedAt = new Date().toISOString();
        mockUsers[userId] = user;
        
        // Guardar transacción
        mockTransactions.push(transaction);
        
        res.status(201).json(successResponse({
            transaction,
            subscription,
            newBalance: user.balance
        }, 'Suscripción realizada exitosamente'));
        
    } catch (error) {
        console.error('Error in subscription:', error);
        res.status(500).json(errorResponse());
    }
});

// Cancel subscription
app.post('/api/transactions/cancel', async (req, res) => {
    try {
        const { userId, subscriptionId } = req.body;
        
        if (!userId || !subscriptionId) {
            return res.status(400).json(errorResponse('userId y subscriptionId son requeridos', 400));
        }
        
        // Obtener usuario
        const user = mockUsers[userId];
        if (!user) {
            return res.status(404).json(errorResponse('Usuario no encontrado', 404));
        }
        
        const subscriptions = user.subscriptions || [];
        
        // Encontrar la suscripción
        const subscriptionIndex = subscriptions.findIndex(sub => sub.subscriptionId === subscriptionId);
        if (subscriptionIndex === -1) {
            return res.status(404).json(errorResponse('Suscripción no encontrada', 404));
        }
        
        const subscription = subscriptions[subscriptionIndex];
        if (subscription.status === 'cancelled') {
            return res.status(400).json(errorResponse('La suscripción ya está cancelada', 400));
        }
        
        // Cancelar suscripción y devolver dinero
        const refundAmount = subscription.amount;
        user.balance += refundAmount;
        
        subscriptions[subscriptionIndex].status = 'cancelled';
        subscriptions[subscriptionIndex].cancelledAt = new Date().toISOString();
        user.updatedAt = new Date().toISOString();
        
        // Crear transacción de cancelación
        const transaction = {
            transactionId: generateId('txn'),
            userId,
            type: 'cancellation',
            fundId: subscription.fundId,
            fundName: subscription.fundName,
            amount: refundAmount,
            previousBalance: user.balance - refundAmount,
            newBalance: user.balance,
            subscriptionId,
            timestamp: new Date().toISOString(),
            status: 'completed'
        };
        
        mockTransactions.push(transaction);
        
        res.json(successResponse({
            transaction,
            refundAmount,
            newBalance: user.balance
        }, 'Suscripción cancelada exitosamente'));
        
    } catch (error) {
        console.error('Error in cancellation:', error);
        res.status(500).json(errorResponse());
    }
});

// Get user transactions
app.get('/api/transactions/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        if (!userId) {
            return res.status(400).json(errorResponse('userId es requerido', 400));
        }
        
        // Filtrar transacciones por usuario
        const userTransactions = mockTransactions
            .filter(tx => tx.userId === userId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json(successResponse(userTransactions, 'Transacciones obtenidas exitosamente'));
        
    } catch (error) {
        console.error('Error getting transactions:', error);
        res.status(500).json(errorResponse());
    }
});

// Send notification
app.post('/api/notifications', async (req, res) => {
    try {
        const { userId, type, message, channel } = req.body;
        
        if (!userId || !message) {
            return res.status(400).json(errorResponse('userId y message son requeridos', 400));
        }
        
        const notification = {
            notificationId: generateId('notif'),
            userId,
            type: type || 'info',
            message,
            channel: channel || 'email',
            status: 'sent',
            sentAt: new Date().toISOString()
        };
        
        res.status(201).json(successResponse(notification, 'Notificación enviada exitosamente'));
        
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json(errorResponse());
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json(errorResponse('Error interno del servidor'));
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// Lambda handler
try {
    const serverlessExpress = require('aws-serverless-express');
    const server = serverlessExpress.createServer(app);
    
    exports.handler = (event, context) => {
        context.callbackWaitsForEmptyEventLoop = false;
        return serverlessExpress.proxy(server, event, context);
    };
} catch (error) {
    console.log('Serverless Express not available, using local mode');
}

module.exports = app;
