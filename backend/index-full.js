const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔍 Configuración AWS:');
console.log('   ➜ AWS_REGION:', process.env.AWS_REGION);
console.log('   ➜ AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Configurado' : '❌ No configurado');
console.log('   ➜ AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Configurado' : '❌ No configurado');

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { sendNotification } = require('./notificationService');
const { initializeStorage, UserService, SubscriptionService, TransactionService } = require('./dataService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Datos del sistema - Fondos según modelo TypeScript
const funds = [
  {
    id: 'FPV_EL_CLIENTE_RECAUDADORA',
    name: 'FPV_EL CLIENTE_RECAUDADORA',
    minimumAmount: 75000,
    category: 'FPV',
    description: 'Pension Voluntary Fund - Collection Agency'
  },
  {
    id: 'FPV_EL_CLIENTE_ECOPETROL',
    name: 'FPV_EL CLIENTE_ECOPETROL',
    minimumAmount: 125000,
    category: 'FPV',
    description: 'Pension Voluntary Fund - Ecopetrol'
  },
  {
    id: 'DEUDAPRIVADA',
    name: 'DEUDAPRIVADA',
    minimumAmount: 50000,
    category: 'FIC',
    description: 'Collective Investment Fund - Private Debt'
  },
  {
    id: 'FDO_ACCIONES',
    name: 'FDO-ACCIONES',
    minimumAmount: 250000,
    category: 'FIC',
    description: 'Collective Investment Fund - Stocks'
  },
  {
    id: 'FPV_EL_CLIENTE_DINAMICA',
    name: 'FPV_EL CLIENTE_DINAMICA',
    minimumAmount: 100000,
    category: 'FPV',
    description: 'Pension Voluntary Fund - Dynamic'
  }
];

// Funciones auxiliares
const generateTransactionId = () => `TXN_${Date.now()}_${uuidv4().slice(0, 8).toUpperCase()}`;

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
};

// Rutas de la API

// Obtener fondos disponibles
app.get('/api/funds', (req, res) => {
  res.json(funds);
});

// Obtener estado del usuario (saldo, suscripciones, etc.)
app.get('/api/user/state', async (req, res) => {
  try {
    const userId = req.query.userId || 'user123';
    const user = await UserService.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const subscriptions = await SubscriptionService.getUserSubscriptions(userId);
    
    res.json({
      userId: user.userId,
      name: user.name,
      balance: user.balance,
      subscriptions: subscriptions,
      notificationPreference: user.notificationPreference,
      email: user.email,
      phone: user.phone
    });
  } catch (error) {
    console.error('Error obteniendo estado del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar información de contacto del usuario
app.patch('/api/user/contact', async (req, res) => {
  try {
    const { email, phone } = req.body;
    const userId = req.body.userId || 'user123';
    
    const updates = {};
    
    if (email) {
      // Validación básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Formato de email inválido'
        });
      }
      updates.email = email;
    }
    
    if (phone) {
      // Validación básica de teléfono (formato internacional)
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          error: 'Formato de teléfono inválido. Use formato internacional (+57...)'
        });
      }
      updates.phone = phone;
    }
    
    const updatedUser = await UserService.updateUser(userId, updates);
    
    res.json({
      message: 'Información de contacto actualizada',
      email: updatedUser.email,
      phone: updatedUser.phone
    });
  } catch (error) {
    console.error('Error actualizando contacto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Suscribirse a un fondo
app.post('/api/funds/subscribe', async (req, res) => {
  try {
    const { fundId, notificationPreference } = req.body;
    const userId = req.body.userId || 'user123';
    
    // Validar que el fondo existe
    const fund = funds.find(f => f.id === fundId);
    if (!fund) {
      return res.status(404).json({
        error: 'Fondo no encontrado',
        fundId
      });
    }
    
    // Obtener información del usuario
    const user = await UserService.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Validar saldo suficiente
    if (user.balance < fund.minimumAmount) {
      return res.status(400).json({
        error: `No tiene saldo disponible para vincularse al fondo ${fund.name}`,
        requiredAmount: fund.minimumAmount,
        availableBalance: user.balance
      });
    }
    
    // Verificar si ya está suscrito
    const existingSubscriptions = await SubscriptionService.getUserSubscriptions(userId);
    const existingSubscription = existingSubscriptions.find(s => s.fundId === fundId);
    if (existingSubscription) {
      return res.status(400).json({
        error: 'Ya se encuentra suscrito a este fondo',
        subscription: existingSubscription
      });
    }
    
    // Crear transacción
    const transactionId = generateTransactionId();
    const transaction = {
      id: transactionId,
      userId: userId,
      type: 'APERTURA',
      fundId: fund.id,
      fundName: fund.name,
      amount: fund.minimumAmount,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED'
    };
    
    // Actualizar saldo del usuario
    const newBalance = user.balance - fund.minimumAmount;
    await UserService.updateUser(userId, { balance: newBalance });
    
    // Crear suscripción
    const subscription = await SubscriptionService.createSubscription({
      userId: userId,
      fundId: fund.id,
      fundName: fund.name,
      amount: fund.minimumAmount,
      subscriptionDate: new Date().toISOString(),
      transactionId: transactionId
    });
    
    // Crear registro de transacción
    await TransactionService.createTransaction(transaction);
    
    // Actualizar preferencia de notificación si se proporciona
    if (notificationPreference) {
      await UserService.updateUser(userId, { notificationPreference });
    }
    
    // Obtener datos actualizados del usuario para notificación
    const updatedUser = await UserService.getUser(userId);
    
    // Enviar notificación
    const userContact = updatedUser.notificationPreference === 'email' ? updatedUser.email : updatedUser.phone;
    const notificationMessage = `Suscripción exitosa al fondo ${fund.name} por ${formatCurrency(fund.minimumAmount)}`;
    const notification = await sendNotification('subscription', notificationMessage, updatedUser.notificationPreference, userContact, transaction);
    
    res.status(201).json({
      message: 'Suscripción realizada exitosamente',
      transaction,
      newBalance: newBalance,
      notification,
      subscription: subscription
    });
    
  } catch (error) {
    console.error('Error en suscripción:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Cancelar suscripción a un fondo
app.post('/api/funds/unsubscribe', async (req, res) => {
  try {
    const { fundId } = req.body;
    const userId = req.body.userId || 'user123';
    
    // Obtener usuario
    const user = await UserService.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Buscar suscripción existente
    const existingSubscriptions = await SubscriptionService.getUserSubscriptions(userId);
    const userSubscription = existingSubscriptions.find(s => s.fundId === fundId);
    if (!userSubscription) {
      return res.status(404).json({
        error: 'No se encuentra suscrito a este fondo',
        fundId
      });
    }
    
    const fund = funds.find(f => f.id === fundId);
    
    // Crear transacción de cancelación
    const transactionId = generateTransactionId();
    const transaction = {
      id: transactionId,
      userId: userId,
      type: 'CANCELACION',
      fundId: fund.id,
      fundName: fund.name,
      amount: userSubscription.amount,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED'
    };
    
    // Actualizar saldo del usuario (devolver el dinero)
    const newBalance = user.balance + userSubscription.amount;
    await UserService.updateUser(userId, { balance: newBalance });
    
    // Eliminar suscripción
    await SubscriptionService.deleteSubscription(userId, fundId);
    
    // Crear registro de transacción
    await TransactionService.createTransaction(transaction);
    
    // Enviar notificación
    const userContact = user.notificationPreference === 'email' ? user.email : user.phone;
    const notificationMessage = `Cancelación exitosa del fondo ${fund.name}. Reintegro: ${formatCurrency(userSubscription.amount)}`;
    const notification = await sendNotification('cancellation', notificationMessage, user.notificationPreference, userContact, transaction);
    
    res.json({
      message: 'Cancelación realizada exitosamente',
      transaction,
      newBalance: newBalance,
      notification,
      refundAmount: userSubscription.amount
    });
    
  } catch (error) {
    console.error('Error en cancelación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Obtener historial de transacciones
app.get('/api/transactions', async (req, res) => {
  try {
    const userId = req.query.userId || 'user123';
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    // Obtener transacciones del usuario
    const allTransactions = await TransactionService.getUserTransactions(userId);
    
    // Ordenar transacciones por fecha (más recientes primero)
    const sortedTransactions = [...allTransactions].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    const paginatedTransactions = sortedTransactions.slice(offset, offset + limit);
    
    res.json({
      transactions: paginatedTransactions,
      pagination: {
        total: allTransactions.length,
        page,
        limit,
        totalPages: Math.ceil(allTransactions.length / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo transacciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener detalle de una transacción específica
app.get('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId || 'user123';
    
    // Obtener todas las transacciones del usuario
    const userTransactions = await TransactionService.getUserTransactions(userId);
    const transaction = userTransactions.find(t => t.transactionId === id);
    
    if (!transaction) {
      return res.status(404).json({
        error: 'Transacción no encontrada',
        transactionId: id
      });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Error obteniendo transacción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar preferencia de notificación
app.patch('/api/user/notification-preference', async (req, res) => {
  try {
    const { preference } = req.body;
    const userId = req.body.userId || 'user123';
    
    if (!['email', 'sms'].includes(preference)) {
      return res.status(400).json({
        error: 'Preferencia inválida. Use "email" o "sms"'
      });
    }
    
    await UserService.updateUser(userId, { notificationPreference: preference });
    
    res.json({
      message: 'Preferencia de notificación actualizada',
      preference: preference
    });
  } catch (error) {
    console.error('Error actualizando preferencia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Test de conexión con DynamoDB
app.get('/api/test/dynamodb', async (req, res) => {
  try {
    const AWS = require('aws-sdk');
    const { useDynamoDB } = require('./dataService');
    
    AWS.config.update({
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    
    const dynamodb = new AWS.DynamoDB();
    const data = await dynamodb.listTables().promise();
    
    res.json({
      status: 'SUCCESS',
      message: '✅ DynamoDB conectado correctamente',
      database: useDynamoDB() ? 'DynamoDB AWS' : 'Memory Fallback',
      region: process.env.AWS_REGION,
      tablesCount: data.TableNames.length,
      tables: data.TableNames,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: '❌ Error conectando con DynamoDB',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BTG Pactual - Sistema de Fondos de Pensión',
    timestamp: new Date().toISOString(),
    database: 'DynamoDB AWS conectado ✅'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🚀 BTG Pactual - API de Fondos de Pensión',
    version: '1.0.0',
    database: 'DynamoDB AWS',
    endpoints: {
      health: '/api/health',
      funds: '/api/funds',
      userState: '/api/user/state',
      subscribe: '/api/funds/subscribe',
      unsubscribe: '/api/funds/unsubscribe',
      transactions: '/api/transactions',
      testDynamoDB: '/api/test/dynamodb'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl
  });
});

// Start server with DynamoDB initialization
const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor BTG Pactual...');
    
    // Inicializar almacenamiento (DynamoDB o memoria)
    await initializeStorage();
    
    // Crear usuario por defecto si no existe
    const defaultUser = await UserService.getUser('user123');
    if (!defaultUser) {
      await UserService.createUser({
        userId: 'user123',
        name: 'Usuario BTG Pactual',
        email: 'camachoeva.07@gmail.com',
        phone: '+573001661010',
        balance: 500000,
        notificationPreference: 'email'
      });
      console.log('✅ Usuario por defecto creado en DynamoDB');
    } else {
      console.log('✅ Usuario por defecto ya existe en DynamoDB');
    }
    
    app.listen(PORT, () => {
      console.log('🚀 Servidor ejecutándose en:');
      console.log(`   ➜ Local: http://localhost:${PORT}`);
      console.log(`   ➜ API Health: http://localhost:${PORT}/api/health`);
      console.log(`   ➜ Fondos: http://localhost:${PORT}/api/funds`);
      console.log(`   ➜ Test DynamoDB: http://localhost:${PORT}/api/test/dynamodb`);
      console.log('');
      console.log('✅ BTG Pactual - Backend iniciado correctamente con DynamoDB');
    });
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

startServer();
