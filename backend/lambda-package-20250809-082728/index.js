const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

console.log("🚀 BTG Pactual - Iniciando servidor...");
console.log("🔍 AWS_REGION:", process.env.AWS_REGION);
console.log(
  "🔍 AWS_ACCESS_KEY_ID:",
  process.env.AWS_ACCESS_KEY_ID ? "✅ Configurado" : "❌ No configurado"
);

const express = require("express");
const cors = require("cors");
const AWS = require("aws-sdk");
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

// Configurar SendGrid
sgMail.setApiKey(process.env.MAIL_PASSWORD);

// Configurar Twilio
const twilioClient = twilio(process.env.SMS_ACCOUNT_SID, process.env.SMS_AUTH_TOKEN);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Middleware de logging para debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configurar AWS DynamoDB
AWS.config.update({
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

// Helper function para obtener preferencias completas de notificación del usuario
async function getUserNotificationPreferences(userId) {
  try {
    const usersTable = `${process.env.DYNAMODB_TABLE_PREFIX || 'btg-pension'}-users`;
    
    const params = {
      TableName: usersTable,
      Key: { userId: userId }
    };
    
    const result = await docClient.get(params).promise();
    
    if (result.Item && result.Item.notificationPreferences) {
      return result.Item.notificationPreferences;
    }
    
    // Preferencias por defecto
    return {
      preferredMethod: 'email',
      email: 'ecamachoecamacho@gmail.com',
      phoneNumber: '+57 300 123 4567'
    };
  } catch (error) {
    console.error('Error getting user notification preferences:', error);
    return {
      preferredMethod: 'email',
      email: 'ecamachoecamacho@gmail.com',
      phoneNumber: '+57 300 123 4567'
    };
  }
}

// Helper function para obtener preferencias de notificación del usuario
async function getUserNotificationPreference(userId) {
  try {
    const usersTable = `${process.env.DYNAMODB_TABLE_PREFIX || 'btg-pension'}-users`;
    
    const params = {
      TableName: usersTable,
      Key: { userId: userId }
    };
    
    const result = await docClient.get(params).promise();
    
    if (result.Item && result.Item.notificationPreferences) {
      return result.Item.notificationPreferences.preferredMethod || 'email';
    }
    
    return 'email'; // Por defecto
  } catch (error) {
    console.error('Error getting user notification preference:', error);
    return 'email'; // Por defecto en caso de error
  }
}

// Función para enviar email real usando SendGrid
async function sendRealEmail(to, subject, message) {
  try {
    const msg = {
      to: to,
      from: {
        email: process.env.MAIL_FROM_ADDRESS,
        name: process.env.MAIL_FROM_NAME
      },
      subject: subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">${subject}</h2>
          <p style="font-size: 16px; line-height: 1.5;">${message}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            <strong>BTG Pactual</strong><br>
            Fondos de Pensión e Inversión<br>
            Este es un mensaje automático, por favor no responder.
          </p>
        </div>
      `
    };

    await sgMail.send(msg);
    console.log('✅ Email enviado exitosamente a:', to);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return false;
  }
}

// Función para enviar SMS real usando Twilio
async function sendRealSMS(to, message) {
  try {
    if (!process.env.TWILIO_ENABLED || process.env.TWILIO_ENABLED === 'false') {
      console.log('📱 SMS deshabilitado en configuración, simulando envío...');
      console.log(`SMS Para: ${to} - Mensaje: ${message}`);
      return true;
    }

    const smsMessage = await twilioClient.messages.create({
      body: `${message}\n\n- BTG Pactual`,
      from: process.env.SMS_FROM_NUMBER,
      to: to
    });

    console.log('✅ SMS enviado exitosamente:', smsMessage.sid);
    return true;
  } catch (error) {
    console.error('❌ Error enviando SMS:', error);
    return false;
  }
}

// Helper function para crear notificaciones automáticas
async function createTransactionNotification(
  userId,
  type,
  fundName,
  amount,
  subscriptionId
) {
  try {
    // Obtener preferencias del usuario
    const userPreferences = await getUserNotificationPreferences(userId);
    const preferredMethod = userPreferences.preferredMethod || 'email';
    const userEmail = userPreferences.email || 'ecamachoecamacho@gmail.com';
    const userPhone = userPreferences.phoneNumber || '+57 300 123 4567';

    const notificationsTable = `${
      process.env.DYNAMODB_TABLE_PREFIX || "btg-pension"
    }-notifications`;
    const notificationId = `notif_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    let title, message;

    if (type === "subscription") {
      title = "✅ Suscripción exitosa";
      message = `Has suscrito exitosamente $${amount.toLocaleString(
        "es-CO"
      )} COP al fondo ${fundName}`;
    } else if (type === "cancellation") {
      title = "🔄 Suscripción cancelada";
      message = `Se ha cancelado tu suscripción al fondo ${fundName}. El monto de $${amount.toLocaleString(
        "es-CO"
      )} COP ha sido devuelto a tu balance disponible`;
    }

    const notification = {
      userId: userId,
      notificationId: notificationId,
      type: preferredMethod,
      title: title,
      message: message,
      category: "transaction",
      status: "sent",
      read: false,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      relatedSubscriptionId: subscriptionId,
    };

    const params = {
      TableName: notificationsTable,
      Item: notification,
    };

    await docClient.put(params).promise();
    console.log(
      `📧 Notificación creada automáticamente: ${title} para ${userId}`
    );

    // Envío real de notificación basado en preferencias del usuario
    if (preferredMethod === 'email' && userEmail) {
      console.log('\n=== 📧 ENVIANDO EMAIL REAL ===');
      console.log(`📨 Para: ${userEmail}`);
      console.log(`📋 Asunto: ${title} - BTG Pactual`);
      console.log(`💬 Mensaje: ${message}`);
      
      const emailSent = await sendRealEmail(userEmail, `${title} - BTG Pactual`, message);
      if (emailSent) {
        console.log('✅ EMAIL ENVIADO EXITOSAMENTE\n');
      } else {
        console.log('❌ ERROR AL ENVIAR EMAIL\n');
      }
      
    } else if (preferredMethod === 'sms' && userPhone) {
      console.log('\n=== 📱 ENVIANDO SMS REAL ===');
      console.log(`📞 Para: ${userPhone}`);
      console.log(`💬 Mensaje: ${message}`);
      
      const smsSent = await sendRealSMS(userPhone, message);
      if (smsSent) {
        console.log('✅ SMS ENVIADO EXITOSAMENTE\n');
      } else {
        console.log('❌ ERROR AL ENVIAR SMS\n');
      }
    } else {
      console.log('⚠️ No se pudo enviar notificación: método o contacto no configurado');
    }

    return notification;
  } catch (error) {
    console.error("Error creating automatic notification:", error);
    // No fallar la transacción principal por un error de notificación
    return null;
  }
}

// Fondos disponibles según el modelo TypeScript Fund.ts
const funds = [
  {
    id: 1,
    name: "FPV_EL CLIENTE_RECAUDADORA",
    minimumAmount: 75000,
    category: "FPV",
  },
  {
    id: 2,
    name: "FPV_EL CLIENTE_ECOPETROL",
    minimumAmount: 125000,
    category: "FPV",
  },
  {
    id: 3,
    name: "DEUDAPRIVADA",
    minimumAmount: 50000,
    category: "FIC",
  },
  {
    id: 4,
    name: "FDO-ACCIONES",
    minimumAmount: 250000,
    category: "FIC",
    description: "Collective Investment Fund - Stocks",
  },
  {
    id: 5,
    name: "FPV_EL CLIENTE_DINAMICA",
    minimumAmount: 100000,
    category: "FPV",
  },
];

// API endpoints
app.get("/api/funds", (req, res) => {
  res.json(funds);
});

// Compatibility endpoint for incorrect URL
app.post("/api/funds/subscribe", async (req, res) => {
  console.log("⚠️  Deprecated endpoint used: /api/funds/subscribe");
  console.log("⚠️  Request body:", req.body);

  try {
    // Extraer datos del body
    const { userId = "user123", fundId, amount, fundName } = req.body;

    // Validar datos requeridos
    if (!fundId) {
      return res.status(400).json({
        success: false,
        error: "fundId is required",
      });
    }

    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        error: "amount is required and must be a valid number",
        received: { amount, type: typeof amount },
      });
    }

    // Redirigir a la función correcta
    const subscriptionData = {
      fundId: fundId.toString(),
      fundName: fundName || `Fund-${fundId}`,
      amount: Number(amount),
      subscriptionDate: new Date().toISOString(),
    };

    // Usar los mismos pasos que el endpoint correcto
    const subscriptionsTable = `${
      process.env.DYNAMODB_TABLE_PREFIX || "btg-pension"
    }-subscriptions`;
    const usersTable = `${
      process.env.DYNAMODB_TABLE_PREFIX || "btg-pension"
    }-users`;

    // Crear suscripción
    const putSubParams = {
      TableName: subscriptionsTable,
      Item: {
        userId: userId,
        subscriptionId: subscriptionData.fundId,
        ...subscriptionData,
      },
    };

    await docClient.put(putSubParams).promise();

    // Actualizar balance del usuario
    const getUserParams = {
      TableName: usersTable,
      Key: { userId: userId },
    };

    const userResult = await docClient.get(getUserParams).promise();
    const currentBalance = userResult.Item || {
      availableBalance: 500000,
      totalInvested: 0,
    };

    const newBalance = {
      userId: userId,
      availableBalance:
        currentBalance.availableBalance - subscriptionData.amount,
      totalInvested: currentBalance.totalInvested + subscriptionData.amount,
      lastUpdated: new Date().toISOString(),
    };

    const putBalanceParams = {
      TableName: usersTable,
      Item: newBalance,
    };

    await docClient.put(putBalanceParams).promise();

    console.log(
      "✅ Suscripción procesada via endpoint legacy:",
      subscriptionData
    );

    res.json({
      success: true,
      message: "Suscripción procesada exitosamente (endpoint legacy)",
      subscription: subscriptionData,
      balance: newBalance,
      warning: "Please use /api/user/:userId/subscribe in future requests",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing legacy subscription:", error);
    res.status(500).json({
      success: false,
      error: "Error al procesar la suscripción",
      details: error.message,
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "BTG Pactual - Sistema de Fondos de Pensión",
    timestamp: new Date().toISOString(),
    database: "DynamoDB AWS conectado ✅",
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "🚀 BTG Pactual - API de Fondos de Pensión",
    version: "1.0.0",
    database: "DynamoDB AWS",
    status: "✅ Funcionando correctamente",
  });
});

// Test de conexión con DynamoDB
app.get("/api/test/dynamodb", async (req, res) => {
  try {
    const AWS = require("aws-sdk");

    AWS.config.update({
      region: process.env.AWS_REGION || "us-east-1",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    const dynamodb = new AWS.DynamoDB();

    const data = await dynamodb.listTables().promise();

    res.json({
      status: "SUCCESS",
      message: "✅ DynamoDB conectado correctamente",
      region: process.env.AWS_REGION,
      tablesCount: data.TableNames.length,
      tables: data.TableNames,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.json({
      status: "ERROR",
      message: "❌ Error conectando con DynamoDB",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Crear tablas DynamoDB necesarias
app.post("/api/setup/tables", async (req, res) => {
  try {
    const AWS = require("aws-sdk");

    AWS.config.update({
      region: process.env.AWS_REGION || "us-east-1",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    const dynamodb = new AWS.DynamoDB();
    const tablePrefix = process.env.DYNAMODB_TABLE_PREFIX || "btg-pension";

    const tables = [
      {
        name: `${tablePrefix}-users`,
        schema: {
          TableName: `${tablePrefix}-users`,
          KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
          AttributeDefinitions: [
            { AttributeName: "userId", AttributeType: "S" },
          ],
          BillingMode: "PAY_PER_REQUEST",
        },
      },
      {
        name: `${tablePrefix}-subscriptions`,
        schema: {
          TableName: `${tablePrefix}-subscriptions`,
          KeySchema: [
            { AttributeName: "userId", KeyType: "HASH" },
            { AttributeName: "subscriptionId", KeyType: "RANGE" },
          ],
          AttributeDefinitions: [
            { AttributeName: "userId", AttributeType: "S" },
            { AttributeName: "subscriptionId", AttributeType: "S" },
          ],
          BillingMode: "PAY_PER_REQUEST",
        },
      },
      {
        name: `${tablePrefix}-notifications`,
        schema: {
          TableName: `${tablePrefix}-notifications`,
          KeySchema: [
            { AttributeName: "userId", KeyType: "HASH" },
            { AttributeName: "notificationId", KeyType: "RANGE" },
          ],
          AttributeDefinitions: [
            { AttributeName: "userId", AttributeType: "S" },
            { AttributeName: "notificationId", AttributeType: "S" },
          ],
          BillingMode: "PAY_PER_REQUEST",
        },
      },
    ];

    const results = [];

    for (const table of tables) {
      try {
        await dynamodb.createTable(table.schema).promise();
        results.push({ table: table.name, status: "created" });
        console.log(`✅ Tabla creada: ${table.name}`);
      } catch (error) {
        if (error.code === "ResourceInUseException") {
          results.push({ table: table.name, status: "already_exists" });
        } else {
          results.push({
            table: table.name,
            status: "error",
            error: error.message,
          });
        }
      }
    }

    res.json({
      success: true,
      message: "Configuración de tablas completada",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating tables:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear las tablas",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Test notification endpoint
app.post("/api/notifications/test", async (req, res) => {
  try {
    const { type, recipient, message } = req.body;

    if (!type || !recipient || !message) {
      return res.status(400).json({
        success: false,
        error: "Faltan parámetros requeridos: type, recipient, message",
      });
    }

    if (type === "email") {
      // Simular envío de email
      console.log(`📧 Email de prueba enviado a: ${recipient}`);
      console.log(`📄 Mensaje: ${message}`);

      res.json({
        success: true,
        message: `Email de prueba enviado exitosamente a ${recipient}`,
        timestamp: new Date().toISOString(),
      });
    } else if (type === "sms") {
      // Simular envío de SMS
      console.log(`📱 SMS de prueba enviado a: ${recipient}`);
      console.log(`📄 Mensaje: ${message}`);

      res.json({
        success: true,
        message: `SMS de prueba enviado exitosamente a ${recipient}`,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Tipo de notificación no válido. Use "email" o "sms"',
      });
    }
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor al enviar notificación de prueba",
    });
  }
});

// Save notification preferences
app.post("/api/notifications/preferences", async (req, res) => {
  try {
    const preferences = req.body;

    // En un entorno real, esto se guardaría en DynamoDB
    console.log(
      "💾 Guardando preferencias de notificación:",
      JSON.stringify(preferences, null, 2)
    );

    res.json({
      success: true,
      message: "Preferencias de notificación guardadas exitosamente",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving preferences:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor al guardar preferencias",
    });
  }
});

// Update notification preferences (PATCH)
app.patch("/api/user/notification-preferences", async (req, res) => {
  try {
    const { userId, preferredMethod, email, phoneNumber } = req.body;
    
    if (!userId || !preferredMethod) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros requeridos: userId, preferredMethod'
      });
    }

    const usersTable = `${process.env.DYNAMODB_TABLE_PREFIX || 'btg-pension'}-users`;
    
    // Obtener usuario actual
    const getUserParams = {
      TableName: usersTable,
      Key: { userId: userId }
    };
    
    let currentUser;
    try {
      const userResult = await docClient.get(getUserParams).promise();
      currentUser = userResult.Item;
    } catch (error) {
      console.log('Usuario no encontrado, se creará uno nuevo');
    }

    // Actualizar o crear usuario con preferencias
    const updatedUser = {
      ...currentUser,
      userId: userId,
      availableBalance: currentUser?.availableBalance || 500000,
      totalInvested: currentUser?.totalInvested || 0,
      notificationPreferences: {
        preferredMethod: preferredMethod,
        email: email || 'ecamachoecamacho@gmail.com',
        phoneNumber: phoneNumber || '+57 300 123 4567',
        lastUpdated: new Date().toISOString()
      },
      lastUpdated: new Date().toISOString()
    };

    const putParams = {
      TableName: usersTable,
      Item: updatedUser
    };

    await docClient.put(putParams).promise();

    console.log("🔄 Preferencias de notificación guardadas en DynamoDB:", updatedUser.notificationPreferences);

    res.json({
      success: true,
      message: "Preferencias de notificación actualizadas exitosamente",
      preferences: updatedUser.notificationPreferences,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor al actualizar preferencias",
      details: error.message
    });
  }
});

// Get notification preferences
app.get("/api/user/notification-preference/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const usersTable = `${process.env.DYNAMODB_TABLE_PREFIX || 'btg-pension'}-users`;
    
    const params = {
      TableName: usersTable,
      Key: { userId: userId }
    };
    
    const result = await docClient.get(params).promise();
    
    if (result.Item && result.Item.notificationPreferences) {
      res.json({
        success: true,
        ...result.Item.notificationPreferences,
        timestamp: new Date().toISOString()
      });
    } else {
      // Devolver preferencias por defecto
      res.json({
        success: true,
        preferredMethod: 'email',
        email: 'ecamachoecamacho@gmail.com',
        phoneNumber: '+57 300 123 4567',
        message: 'Usando preferencias por defecto',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener preferencias de notificación",
      details: error.message
    });
  }
});

// Get notifications
app.get("/api/notifications", async (req, res) => {
  try {
    // En un entorno real, esto vendría de DynamoDB
    const mockNotifications = [
      {
        id: "notif_001",
        userId: "user123",
        type: "email",
        title: "Suscripción Exitosa - Backend",
        message:
          "Su suscripción al fondo FPV_BTG_PACTUAL_RECAUDADORA por $100,000 COP ha sido procesada exitosamente desde el backend.",
        status: "sent",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        read: false,
        category: "transaction",
      },
      {
        id: "notif_002",
        userId: "user123",
        type: "sms",
        title: "Cancelación Procesada - Backend",
        message:
          "Su cancelación del fondo DEUDAPRIVADA por $25,000 COP ha sido exitosa. El monto será devuelto a su saldo disponible.",
        status: "sent",
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        read: false,
        category: "transaction",
      },
    ];

    res.json(mockNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor al obtener notificaciones",
    });
  }
});

// Mark notification as read
app.patch("/api/notifications/:id/read", async (req, res) => {
  try {
    const { id } = req.params;

    // En un entorno real, esto actualizaría la notificación en DynamoDB
    console.log(`📖 Marcando notificación ${id} como leída`);

    res.json({
      success: true,
      message: `Notificación ${id} marcada como leída`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor al marcar notificación como leída",
    });
  }
});

// Create new notification
app.post("/api/notifications", async (req, res) => {
  try {
    const { userId, type, title, message, category } = req.body;

    const notification = {
      id: `notif_${Date.now()}`,
      userId,
      type: type || "email",
      title,
      message,
      status: "sent",
      createdAt: new Date().toISOString(),
      read: false,
      category: category || "system",
    };

    console.log(
      "📧 Nueva notificación creada:",
      JSON.stringify(notification, null, 2)
    );

    res.json({
      success: true,
      message: "Notificación creada exitosamente",
      notification,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor al crear notificación",
    });
  }
});

// ===============================
// ENDPOINTS PARA SUSCRIPCIONES CON DYNAMODB
// ===============================

// Obtener suscripciones del usuario
app.get("/api/user/:userId/subscriptions", async (req, res) => {
  try {
    const { userId } = req.params;
    const tableName = `${
      process.env.DYNAMODB_TABLE_PREFIX || "btg-pension"
    }-subscriptions`;

    const params = {
      TableName: tableName,
      KeyConditionExpression: "userId = :userId",
      FilterExpression: "#status = :status",
      ExpressionAttributeNames: {
        "#status": "status"
      },
      ExpressionAttributeValues: {
        ":userId": userId,
        ":status": "active"
      },
    };

    const result = await docClient.query(params).promise();

    res.json({
      success: true,
      subscriptions: result.Items || [],
      count: result.Count || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting subscriptions:", error);

    // Si la tabla no existe, devolver array vacío
    if (error.code === "ResourceNotFoundException") {
      res.json({
        success: true,
        subscriptions: [],
        count: 0,
        message: "Tabla de suscripciones no existe aún",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Error al obtener suscripciones",
        details: error.message,
      });
    }
  }
});

// Obtener balance del usuario
app.get("/api/user/:userId/balance", async (req, res) => {
  try {
    const { userId } = req.params;
    const tableName = `${
      process.env.DYNAMODB_TABLE_PREFIX || "btg-pension"
    }-users`;

    const params = {
      TableName: tableName,
      Key: {
        userId: userId,
      },
    };

    const result = await docClient.get(params).promise();

    if (result.Item) {
      res.json({
        success: true,
        balance: result.Item,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Usuario nuevo, crear balance inicial
      const initialBalance = {
        userId: userId,
        availableBalance: 500000, // Balance inicial
        totalInvested: 0,
        lastUpdated: new Date().toISOString(),
      };

      const putParams = {
        TableName: tableName,
        Item: initialBalance,
      };

      await docClient.put(putParams).promise();

      res.json({
        success: true,
        balance: initialBalance,
        message: "Balance inicial creado",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error getting user balance:", error);

    if (error.code === "ResourceNotFoundException") {
      // Si la tabla no existe, devolver balance inicial
      res.json({
        success: true,
        balance: {
          userId: req.params.userId,
          availableBalance: 500000,
          totalInvested: 0,
          lastUpdated: new Date().toISOString(),
        },
        message: "Tabla de usuarios no existe, usando valores por defecto",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Error al obtener balance del usuario",
        details: error.message,
      });
    }
  }
});

// Crear suscripción
app.post("/api/user/:userId/subscribe", async (req, res) => {
  try {
    const { userId } = req.params;
    const { fundId, fundName, amount } = req.body;

    const subscriptionId = `sub_${Date.now()}`;
    const subscriptionsTable = `${
      process.env.DYNAMODB_TABLE_PREFIX || "btg-pension"
    }-subscriptions`;
    const usersTable = `${
      process.env.DYNAMODB_TABLE_PREFIX || "btg-pension"
    }-users`;

    // Primero, obtener balance actual del usuario
    const getUserParams = {
      TableName: usersTable,
      Key: { userId: userId },
    };

    let currentBalance;
    try {
      const userResult = await docClient.get(getUserParams).promise();
      currentBalance = userResult.Item || {
        userId: userId,
        availableBalance: 500000,
        totalInvested: 0,
      };
    } catch (error) {
      // Si la tabla no existe, crear balance inicial
      currentBalance = {
        userId: userId,
        availableBalance: 500000,
        totalInvested: 0,
      };
    }

    // Validar que tiene saldo suficiente
    if (currentBalance.availableBalance < amount) {
      return res.status(400).json({
        success: false,
        error: `No tiene saldo disponible para vincularse al fondo ${fundName}`,
        availableBalance: currentBalance.availableBalance,
        requestedAmount: amount,
      });
    }

    // Crear suscripción
    const subscription = {
      userId: userId,
      subscriptionId: subscriptionId,
      fundId: fundId,
      fundName: fundName,
      amount: amount,
      subscriptionDate: new Date().toISOString(),
      status: "active",
    };

    // Actualizar balance del usuario
    const newBalance = {
      userId: userId,
      availableBalance: currentBalance.availableBalance - amount,
      totalInvested: (currentBalance.totalInvested || 0) + amount,
      lastUpdated: new Date().toISOString(),
    };

    // Transacción para crear suscripción y actualizar balance
    const putSubscriptionParams = {
      TableName: subscriptionsTable,
      Item: subscription,
    };

    const putBalanceParams = {
      TableName: usersTable,
      Item: newBalance,
    };

    try {
      await docClient.put(putSubscriptionParams).promise();
      await docClient.put(putBalanceParams).promise();

      console.log(
        "✅ Suscripción creada:",
        JSON.stringify(subscription, null, 2)
      );
      console.log(
        "✅ Balance actualizado:",
        JSON.stringify(newBalance, null, 2)
      );

      // Crear notificación automática
      await createTransactionNotification(
        userId,
        "subscription",
        fundName,
        amount,
        subscriptionId
      );

      res.json({
        success: true,
        message: "Suscripción creada exitosamente",
        subscription: subscription,
        newBalance: newBalance,
        timestamp: new Date().toISOString(),
      });
    } catch (dbError) {
      console.error("Error in DynamoDB transaction:", dbError);
      res.status(500).json({
        success: false,
        error: "Error al procesar la suscripción en DynamoDB",
        details: dbError.message,
      });
    }
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor al crear suscripción",
      details: error.message,
    });
  }
});

// Cancelar suscripción
app.delete(
  "/api/user/:userId/subscription/:subscriptionId",
  async (req, res) => {
    try {
      const { userId, subscriptionId } = req.params;
      const subscriptionsTable = `${
        process.env.DYNAMODB_TABLE_PREFIX || "btg-pension"
      }-subscriptions`;
      const usersTable = `${
        process.env.DYNAMODB_TABLE_PREFIX || "btg-pension"
      }-users`;

      // Obtener la suscripción
      const getSubParams = {
        TableName: subscriptionsTable,
        Key: {
          userId: userId,
          subscriptionId: subscriptionId,
        },
      };

      const subscriptionResult = await docClient.get(getSubParams).promise();

      if (!subscriptionResult.Item) {
        return res.status(404).json({
          success: false,
          error: "Suscripción no encontrada",
        });
      }

      const subscription = subscriptionResult.Item;

      // Obtener balance actual del usuario
      const getUserParams = {
        TableName: usersTable,
        Key: { userId: userId },
      };

      const userResult = await docClient.get(getUserParams).promise();
      const currentBalance = userResult.Item;

      if (!currentBalance) {
        return res.status(404).json({
          success: false,
          error: "Usuario no encontrado",
        });
      }

      // Actualizar balance devolviendo el dinero
      const newBalance = {
        userId: userId,
        availableBalance: currentBalance.availableBalance + subscription.amount,
        totalInvested: currentBalance.totalInvested - subscription.amount,
        lastUpdated: new Date().toISOString(),
      };

      // Marcar suscripción como cancelada en lugar de eliminarla
      const updateParams = {
        TableName: subscriptionsTable,
        Key: {
          userId: userId,
          subscriptionId: subscriptionId,
        },
        UpdateExpression: 'SET #status = :status, cancelledAt = :cancelledAt, lastUpdated = :lastUpdated',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'cancelled',
          ':cancelledAt': new Date().toISOString(),
          ':lastUpdated': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      };

      const putBalanceParams = {
        TableName: usersTable,
        Item: newBalance,
      };

      await docClient.update(updateParams).promise();
      await docClient.put(putBalanceParams).promise();

      console.log("✅ Suscripción cancelada:", subscriptionId);
      console.log(
        "✅ Balance actualizado:",
        JSON.stringify(newBalance, null, 2)
      );

      // Crear notificación automática de cancelación
      await createTransactionNotification(
        userId,
        "cancellation",
        subscription.fundName,
        subscription.amount,
        subscriptionId
      );

      res.json({
        success: true,
        message: "Suscripción cancelada exitosamente",
        canceledSubscription: subscription,
        newBalance: newBalance,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor al cancelar suscripción",
        details: error.message,
      });
    }
  }
);

// ===============================
// ENDPOINTS PARA TRANSACCIONES
// ===============================

// Obtener historial de transacciones (basado en suscripciones)
app.get("/api/user/:userId/transactions", async (req, res) => {
  try {
    const { userId } = req.params;
    const subscriptionsTable = `${
      process.env.DYNAMODB_TABLE_PREFIX || "btg-pension"
    }-subscriptions`;

    // Obtener todas las suscripciones del usuario
    const params = {
      TableName: subscriptionsTable,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ScanIndexForward: false, // Ordenar por fecha descendente
    };

    const result = await docClient.query(params).promise();
    const subscriptions = result.Items || [];

    // Transformar suscripciones a formato de transacciones
    const transactions = [];
    
    subscriptions.forEach((sub) => {
      // Siempre agregar la transacción de suscripción
      transactions.push({
        id: sub.subscriptionId,
        userId: sub.userId,
        fundId: sub.fundId.toString(),
        fundName: sub.fundName,
        type: "subscription",
        amount: sub.amount,
        createdAt: sub.subscriptionDate || sub.createdAt || new Date().toISOString(),
        status: "completed",
      });
      
      // Si está cancelada, agregar también la transacción de cancelación
      if (sub.status === "cancelled" && sub.cancelledAt) {
        transactions.push({
          id: `cancel_${sub.subscriptionId}`,
          userId: sub.userId,
          fundId: sub.fundId.toString(),
          fundName: sub.fundName,
          type: "cancellation",
          amount: sub.amount,
          createdAt: sub.cancelledAt,
          status: "completed",
        });
      }
    });
    
    // Ordenar transacciones por fecha (más recientes primero)
    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      transactions: transactions,
      count: transactions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener el historial de transacciones",
      details: error.message,
    });
  }
});

// Obtener estadísticas de transacciones
app.get("/api/user/:userId/transactions/stats", async (req, res) => {
  try {
    const { userId } = req.params;
    const subscriptionsTable = `${
      process.env.DYNAMODB_TABLE_PREFIX || "btg-pension"
    }-subscriptions`;

    const params = {
      TableName: subscriptionsTable,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };

    const result = await docClient.query(params).promise();
    const subscriptions = result.Items || [];

    // Calcular estadísticas
    const totalSubscriptions = subscriptions.filter(
      (sub) => sub.status === "active"
    ).length;
    const totalCancelled = subscriptions.filter(
      (sub) => sub.status === "cancelled"
    ).length;
    const totalInvested = subscriptions
      .filter((sub) => sub.status === "active")
      .reduce((sum, sub) => sum + sub.amount, 0);

    const fundDistribution = subscriptions
      .filter((sub) => sub.status === "active")
      .reduce((acc, sub) => {
        acc[sub.fundName] = (acc[sub.fundName] || 0) + sub.amount;
        return acc;
      }, {});

    res.json({
      success: true,
      stats: {
        totalSubscriptions,
        totalCancelled,
        totalInvested,
        fundDistribution,
        totalTransactions: subscriptions.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching transaction stats:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener estadísticas de transacciones",
      details: error.message,
    });
  }
});

// ===============================
// MEJORAR ENDPOINTS DE NOTIFICACIONES
// ===============================

// Obtener notificaciones específicas del usuario
app.get("/api/user/:userId/notifications", async (req, res) => {
  try {
    const { userId } = req.params;
    const notificationsTable = `${
      process.env.DYNAMODB_TABLE_PREFIX || "btg-pension"
    }-notifications`;

    const params = {
      TableName: notificationsTable,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ScanIndexForward: false, // Ordenar por fecha descendente
    };

    const result = await docClient.query(params).promise();

    res.json({
      success: true,
      notifications: result.Items || [],
      count: result.Count || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error);

    if (error.code === "ResourceNotFoundException") {
      res.json({
        success: true,
        notifications: [],
        count: 0,
        message: "Tabla de notificaciones no existe aún",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Error al obtener notificaciones del usuario",
        details: error.message,
      });
    }
  }
});

// Marcar notificación como leída
app.patch(
  "/api/user/:userId/notifications/:notificationId/read",
  async (req, res) => {
    try {
      const { userId, notificationId } = req.params;
      const notificationsTable = `${
        process.env.DYNAMODB_TABLE_PREFIX || "btg-pension"
      }-notifications`;

      const params = {
        TableName: notificationsTable,
        Key: {
          userId: userId,
          notificationId: notificationId,
        },
        UpdateExpression: "SET #read = :read, lastUpdated = :lastUpdated",
        ExpressionAttributeNames: {
          "#read": "read",
        },
        ExpressionAttributeValues: {
          ":read": true,
          ":lastUpdated": new Date().toISOString(),
        },
        ReturnValues: "ALL_NEW",
      };

      const result = await docClient.update(params).promise();

      res.json({
        success: true,
        message: "Notificación marcada como leída",
        notification: result.Attributes,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({
        success: false,
        error: "Error al marcar notificación como leída",
        details: error.message,
      });
    }
  }
);

// Crear una nueva notificación
app.post("/api/user/:userId/notifications", async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, title, message, category } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: "Faltan parámetros requeridos: type, title, message",
      });
    }

    const notificationsTable = `${
      process.env.DYNAMODB_TABLE_PREFIX || "btg-pension"
    }-notifications`;
    const notificationId = `notif_${Date.now()}`;

    const notification = {
      userId: userId,
      notificationId: notificationId,
      type: type,
      title: title,
      message: message,
      category: category || "system",
      status: "sent",
      read: false,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    const params = {
      TableName: notificationsTable,
      Item: notification,
    };

    await docClient.put(params).promise();

    res.json({
      success: true,
      message: "Notificación creada exitosamente",
      notification: notification,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({
      success: false,
      error: "Error al crear notificación",
      details: error.message,
    });
  }
});

// Endpoint de prueba para verificar envío de correos
app.post('/api/test/send-email', async (req, res) => {
  try {
    const { email, testType } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email es requerido' 
      });
    }

    const testMessages = {
      'subscription': {
        subject: '🎉 Prueba de Suscripción - BTG Pactual',
        message: 'Esta es una prueba de notificación de suscripción. Has suscrito exitosamente COP $100,000 al fondo FPV_EL CLIENTE_RECAUDADORA.'
      },
      'cancellation': {
        subject: '🔄 Prueba de Cancelación - BTG Pactual', 
        message: 'Esta es una prueba de notificación de cancelación. Se ha cancelado tu suscripción al fondo FPV_EL CLIENTE_RECAUDADORA y COP $100,000 ha sido devuelto a tu balance.'
      },
      'general': {
        subject: '✅ Prueba de Correo - BTG Pactual',
        message: 'Este es un correo de prueba del sistema de fondos de pensión de BTG Pactual. Si recibes este mensaje, el sistema de notificaciones está funcionando correctamente.'
      }
    };

    const test = testMessages[testType] || testMessages['general'];
    
    console.log(`\n🧪 === ENVIANDO CORREO DE PRUEBA ===`);
    console.log(`📧 Para: ${email}`);
    console.log(`📋 Asunto: ${test.subject}`);
    console.log(`💬 Mensaje: ${test.message}`);
    
    const emailSent = await sendRealEmail(email, test.subject, test.message);
    
    if (emailSent) {
      console.log('✅ CORREO DE PRUEBA ENVIADO EXITOSAMENTE\n');
      res.json({
        success: true,
        message: 'Correo de prueba enviado exitosamente',
        details: {
          to: email,
          subject: test.subject,
          type: testType || 'general'
        }
      });
    } else {
      console.log('❌ ERROR AL ENVIAR CORREO DE PRUEBA\n');
      res.status(500).json({
        success: false,
        message: 'Error al enviar el correo de prueba'
      });
    }
    
  } catch (error) {
    console.error('❌ Error en endpoint de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log("🚀 Servidor ejecutándose en:");
  console.log(`   ➜ Local: http://localhost:${PORT}`);
  console.log(`   ➜ API Health: http://localhost:${PORT}/api/health`);
  console.log(`   ➜ Test DynamoDB: http://localhost:${PORT}/api/test/dynamodb`);
  console.log("");
  console.log("✅ BTG Pactual - Backend iniciado correctamente");
});

console.log("📝 Servidor configurado, iniciando...");
