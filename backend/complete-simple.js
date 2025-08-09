// BTG Pactual Backend - Complete API with Gradual Build
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Datos simulados para el sistema de fondos
const availableFunds = [
    {
        id: 'fpv-recaudadora',
        name: 'FPV_EL CLIENTE_RECAUDADORA',
        type: 'FPV',
        minimumAmount: 75000,
        currency: 'COP'
    },
    {
        id: 'fpv-ecopetrol',
        name: 'FPV_EL CLIENTE_ECOPETROL',
        type: 'FPV',
        minimumAmount: 125000,
        currency: 'COP'
    },
    {
        id: 'deuda-privada',
        name: 'DEUDAPRIVADA',
        type: 'FIC',
        minimumAmount: 50000,
        currency: 'COP'
    },
    {
        id: 'fdo-acciones',
        name: 'FDO-ACCIONES',
        type: 'FIC',
        minimumAmount: 250000,
        currency: 'COP'
    },
    {
        id: 'fpv-dinamica',
        name: 'FPV_EL CLIENTE_DINAMICA',
        type: 'FPV',
        minimumAmount: 100000,
        currency: 'COP'
    }
];

// Storage temporal en memoria
const users = {};
const transactions = [];

// Utility functions
const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

// Health Check (que sabemos que funciona)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'BTG Pactual Backend is running',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        endpoints: ['health', 'funds', 'users', 'transactions', 'notifications']
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'BTG Pactual API',
        status: 'active',
        timestamp: new Date().toISOString(),
        availableEndpoints: [
            'GET /api/health',
            'GET /api/funds',
            'POST /api/users',
            'GET /api/users/:id',
            'POST /api/transactions/subscribe',
            'POST /api/transactions/cancel',
            'GET /api/transactions/:userId'
        ]
    });
});

// Get available funds
app.get('/api/funds', (req, res) => {
    res.json({
        success: true,
        data: availableFunds,
        message: 'Fondos disponibles obtenidos exitosamente'
    });
});

// Create user
app.post('/api/users', (req, res) => {
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
            balance: 500000, // Balance inicial COP $500,000
            subscriptions: [],
            createdAt: new Date().toISOString()
        };
        
        users[userId] = user;
        
        res.status(201).json({
            success: true,
            data: user,
            message: 'Usuario creado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creando usuario'
        });
    }
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
    try {
        const userId = req.params.id;
        const user = users[userId];
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: user,
            message: 'Usuario encontrado'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error obteniendo usuario'
        });
    }
});

// Subscribe to fund
app.post('/api/transactions/subscribe', (req, res) => {
    try {
        const { userId, fundId, amount } = req.body;
        
        if (!userId || !fundId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'userId, fundId y amount son requeridos'
            });
        }
        
        const user = users[userId];
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        const fund = availableFunds.find(f => f.id === fundId);
        if (!fund) {
            return res.status(404).json({
                success: false,
                message: 'Fondo no encontrado'
            });
        }
        
        if (amount < fund.minimumAmount) {
            return res.status(400).json({
                success: false,
                message: `Monto mínimo: ${fund.minimumAmount} COP`
            });
        }
        
        if (user.balance < amount) {
            return res.status(400).json({
                success: false,
                message: 'Saldo insuficiente'
            });
        }
        
        // Process subscription
        const subscription = {
            subscriptionId: generateId('sub'),
            fundId: fund.id,
            fundName: fund.name,
            amount: amount,
            date: new Date().toISOString(),
            status: 'active'
        };
        
        const transaction = {
            transactionId: generateId('txn'),
            userId: userId,
            type: 'subscription',
            fundId: fund.id,
            fundName: fund.name,
            amount: amount,
            previousBalance: user.balance,
            newBalance: user.balance - amount,
            timestamp: new Date().toISOString()
        };
        
        // Update user
        user.balance -= amount;
        user.subscriptions.push(subscription);
        
        // Save transaction
        transactions.push(transaction);
        
        res.status(201).json({
            success: true,
            data: {
                transaction: transaction,
                subscription: subscription,
                newBalance: user.balance
            },
            message: 'Suscripción realizada exitosamente'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error procesando suscripción'
        });
    }
});

// Cancel subscription
app.post('/api/transactions/cancel', (req, res) => {
    try {
        const { userId, subscriptionId } = req.body;
        
        if (!userId || !subscriptionId) {
            return res.status(400).json({
                success: false,
                message: 'userId y subscriptionId son requeridos'
            });
        }
        
        const user = users[userId];
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        const subscription = user.subscriptions.find(s => s.subscriptionId === subscriptionId);
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Suscripción no encontrada'
            });
        }
        
        if (subscription.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Suscripción ya cancelada'
            });
        }
        
        // Process cancellation
        const refundAmount = subscription.amount;
        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date().toISOString();
        user.balance += refundAmount;
        
        const transaction = {
            transactionId: generateId('txn'),
            userId: userId,
            type: 'cancellation',
            fundId: subscription.fundId,
            fundName: subscription.fundName,
            amount: refundAmount,
            previousBalance: user.balance - refundAmount,
            newBalance: user.balance,
            timestamp: new Date().toISOString()
        };
        
        transactions.push(transaction);
        
        res.json({
            success: true,
            data: {
                transaction: transaction,
                refundAmount: refundAmount,
                newBalance: user.balance
            },
            message: 'Suscripción cancelada exitosamente'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelando suscripción'
        });
    }
});

// Get user transactions
app.get('/api/transactions/:userId', (req, res) => {
    try {
        const userId = req.params.userId;
        const userTransactions = transactions
            .filter(t => t.userId === userId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json({
            success: true,
            data: userTransactions,
            message: 'Transacciones obtenidas exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error obteniendo transacciones'
        });
    }
});

// Send notification
app.post('/api/notifications', (req, res) => {
    try {
        const { userId, message, type } = req.body;
        
        if (!userId || !message) {
            return res.status(400).json({
                success: false,
                message: 'userId y message son requeridos'
            });
        }
        
        const notification = {
            notificationId: generateId('notif'),
            userId: userId,
            message: message,
            type: type || 'info',
            status: 'sent',
            sentAt: new Date().toISOString()
        };
        
        res.status(201).json({
            success: true,
            data: notification,
            message: 'Notificación enviada'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error enviando notificación'
        });
    }
});

// Lambda handler (same as working version)
const serverlessExpress = require('aws-serverless-express');
const server = serverlessExpress.createServer(app);

exports.handler = (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    return serverlessExpress.proxy(server, event, context);
};
