const nodemailer = require('nodemailer');
const twilio = require('twilio');

/**
 * Configuración del transportador de email (SendGrid)
 */
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT),
    secure: false, // true para puerto 465, false para otros puertos
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Configuración del cliente SMS (Twilio)
 */
const createSMSClient = () => {
  console.log('🔍 Debug SMS - SMS_ACCOUNT_SID:', process.env.SMS_ACCOUNT_SID);
  console.log('🔍 Debug SMS - SMS_AUTH_TOKEN:', process.env.SMS_AUTH_TOKEN ? 'Configurado' : 'No configurado');
  console.log('🔍 Debug SMS - SMS_FROM_NUMBER:', process.env.SMS_FROM_NUMBER);
  console.log('🔍 Debug SMS - TWILIO_ENABLED:', process.env.TWILIO_ENABLED);
  
  if (!process.env.SMS_ACCOUNT_SID || !process.env.SMS_AUTH_TOKEN) {
    console.warn('⚠️ Credenciales de SMS no configuradas. SMS será simulado.');
    return null;
  }
  
  if (process.env.TWILIO_ENABLED !== 'true') {
    console.warn('⚠️ Twilio deshabilitado por configuración. SMS será simulado.');
    return null;
  }
  
  return twilio(process.env.SMS_ACCOUNT_SID, process.env.SMS_AUTH_TOKEN);
};

/**
 * Servicio de notificaciones por email
 */
const sendEmailNotification = async (to, subject, message, transactionDetails = null) => {
  try {
    const transporter = createEmailTransporter();
    
    // Crear contenido HTML del email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 30px; text-align: center;">
          <h1>🏦 BTG Pactual</h1>
          <p>Sistema de Fondos de Pensión</p>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #1976d2;">${subject}</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">${message}</p>
          
          ${transactionDetails ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2;">
              <h3 style="color: #1976d2; margin-top: 0;">Detalles de la Transacción</h3>
              <p><strong>ID de Transacción:</strong> ${transactionDetails.id}</p>
              <p><strong>Tipo:</strong> ${transactionDetails.type}</p>
              <p><strong>Fondo:</strong> ${transactionDetails.fundName}</p>
              <p><strong>Monto:</strong> ${new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
              }).format(transactionDetails.amount)}</p>
              <p><strong>Fecha:</strong> ${new Date(transactionDetails.timestamp).toLocaleString('es-CO')}</p>
              <p><strong>Estado:</strong> <span style="color: #2e7d32; font-weight: bold;">${transactionDetails.status}</span></p>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
            <p>Este es un email automático del sistema BTG Pactual.</p>
            <p>Si tienes alguna pregunta, contacta a nuestro equipo de soporte.</p>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
          <p>&copy; 2025 BTG Pactual. Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: to,
      subject: `[BTG Pactual] ${subject}`,
      text: message,
      html: htmlContent
    };

    console.log('🔍 Debug Email - Configuración del email:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      mailFrom: process.env.MAIL_FROM_ADDRESS,
      mailFromName: process.env.MAIL_FROM_NAME
    });

    const info = await transporter.sendMail(mailOptions);
    
    console.log('📧 Email enviado exitosamente:', {
      to: to,
      subject: subject,
      messageId: info.messageId
    });

    return {
      success: true,
      messageId: info.messageId,
      to: to,
      subject: subject
    };

  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return {
      success: false,
      error: error.message,
      to: to,
      subject: subject
    };
  }
};

/**
 * Servicio de notificaciones por SMS
 */
const sendSMSNotification = async (to, message, transactionDetails = null) => {
  try {
    const client = createSMSClient();
    
    if (!client) {
      // Simulación de SMS cuando no hay credenciales configuradas
      console.log('📱 SMS simulado enviado a:', to);
      console.log('📱 Mensaje:', message);
      return {
        success: true,
        simulated: true,
        to: to,
        message: message
      };
    }

    // Crear mensaje SMS más conciso
    let smsText = `🏦 BTG Pactual: ${message}`;
    
    if (transactionDetails) {
      smsText += `\nID: ${transactionDetails.id}\nMonto: ${new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(transactionDetails.amount)}`;
    }

    const smsMessage = await client.messages.create({
      body: smsText,
      from: process.env.SMS_FROM_NUMBER,
      to: to
    });

    console.log('📱 SMS enviado exitosamente:', {
      to: to,
      sid: smsMessage.sid,
      status: smsMessage.status
    });

    return {
      success: true,
      sid: smsMessage.sid,
      to: to,
      status: smsMessage.status
    };

  } catch (error) {
    console.error('❌ Error enviando SMS:', error);
    
    // Si el error es relacionado con números de Twilio no válidos, activar modo simulación
    if (error.code === 21659 || error.code === 21266) {
      console.log('🔄 Activando modo simulación debido a error de número Twilio...');
      console.log('📱 SMS simulado enviado a:', to);
      console.log('📱 Mensaje:', `🏦 BTG Pactual: ${message}`);
      
      return {
        success: true,
        simulated: true,
        to: to,
        message: message,
        note: 'Modo simulación activado - número Twilio no válido'
      };
    }
    
    return {
      success: false,
      error: error.message,
      to: to
    };
  }
};

/**
 * Función principal para enviar notificaciones
 */
const sendNotification = async (type, message, preference, userContact, transactionDetails = null) => {
  const timestamp = new Date().toISOString();
  
  try {
    let result;
    
    if (preference === 'email') {
      const subject = type === 'subscription' ? 'Suscripción a Fondo Exitosa' : 
                    type === 'cancellation' ? 'Cancelación de Fondo Exitosa' : 
                    'Notificación de BTG Pactual';
      
      result = await sendEmailNotification(userContact, subject, message, transactionDetails);
    } else if (preference === 'sms') {
      result = await sendSMSNotification(userContact, message, transactionDetails);
    } else {
      throw new Error('Tipo de notificación no válido');
    }

    return {
      id: `NOTIF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: preference,
      message: message,
      timestamp: timestamp,
      status: result.success ? 'sent' : 'failed',
      recipient: userContact,
      details: result,
      transactionDetails: transactionDetails
    };

  } catch (error) {
    console.error('❌ Error en servicio de notificaciones:', error);
    return {
      id: `NOTIF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: preference,
      message: message,
      timestamp: timestamp,
      status: 'failed',
      recipient: userContact,
      error: error.message
    };
  }
};

module.exports = {
  sendNotification,
  sendEmailNotification,
  sendSMSNotification
};
