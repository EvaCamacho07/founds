# BTG Pactual - Sistema de Gestión de Fondos de Pensión

## Descripción del Proyecto

Sistema completo de gestión de fondos de pensión desarrollado para BTG Pactual, que permite a los usuarios suscribirse y cancelar inversiones en diferentes fondos de pensión voluntaria (FPV) y fondos de inversión colectiva (FIC) con un saldo inicial de $500,000 COP.

## Características Principales

- **Gestión de Fondos**: 5 fondos predefinidos con montos mínimos y categorías de riesgo
- **Transacciones en Tiempo Real**: Suscripción y cancelación con persistencia en DynamoDB
- **Sistema de Notificaciones**: Email y SMS reales usando SendGrid y Twilio
- **Configuración de Usuario**: Preferencias de notificación editables con validación
- **Interfaz Moderna**: Frontend desarrollado con React y Material-UI
- **API RESTful**: Backend en Node.js con Express y AWS DynamoDB
- **Validaciones Completas**: Email y teléfono con patrones internacionales
- **Historial Completo**: Registro de todas las transacciones (suscripciones y cancelaciones)

## Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   AWS DynamoDB  │
│   (React + MUI) │────│   (Express.js)  │────│   (NoSQL)       │
│   Port 3001     │    │   Port 3000     │    │   us-east-1     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   SendGrid +    │
                       │   Twilio APIs   │
                       │   (Email/SMS)   │
                       └─────────────────┘
```

## Estructura del Proyecto

```
btg-pension-funds/
├── backend/                    # API Backend (Node.js + Express)
│   ├── index-simple.js         # Servidor principal con DynamoDB
│   ├── src/                    # Código TypeScript (opcional)
│   │   ├── controllers/        # Controladores de rutas
│   │   ├── models/            # Modelos de datos
│   │   ├── services/          # Lógica de negocio
│   │   └── __tests__/         # Tests unitarios
│   ├── .env                   # Variables de entorno (SendGrid, Twilio, AWS)
│   └── package.json
├── frontend/                   # Aplicación Web (React + TypeScript)
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   │   ├── FundDashboard.tsx     # Dashboard principal
│   │   │   ├── TransactionHistory.tsx # Historial completo
│   │   │   ├── NotificationCenter.tsx # Centro de notificaciones
│   │   │   ├── NotificationSettings.tsx # Configuración de preferencias
│   │   │   └── UserBalance.tsx       # Saldo del usuario
│   │   ├── services/          # Servicios de API
│   │   └── App.tsx
│   └── package.json
├── infrastructure/             # Infraestructura como código (opcional)
└── README.md
```

## Tecnologías Utilizadas

### Backend
- **Node.js 18.x**: Runtime de JavaScript
- **Express.js**: Framework web
- **AWS SDK v2**: Integración con DynamoDB
- **SendGrid**: Servicio de email (@sendgrid/mail)
- **Twilio**: Servicio de SMS
- **DynamoDB**: Base de datos NoSQL en AWS
- **CORS**: Habilitado para frontend

### Frontend
- **React 18**: Framework de UI
- **TypeScript**: Tipado estático
- **Material-UI (MUI)**: Componentes de interfaz
- **Axios**: Cliente HTTP
- **Emotion**: CSS-in-JS

### Servicios Externos
- **AWS DynamoDB**: Base de datos
- **SendGrid**: Email delivery
- **Twilio**: SMS delivery

## Requisitos del Sistema

- **Node.js**: 18.x o superior
- **npm**: 8.x o superior
- **AWS CLI**: 2.x configurado con credenciales
- **Git**: Para control de versiones

## Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd btg-pension-funds
```

### 2. Configurar Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con las configuraciones necesarias
```

### 3. Configurar Frontend
```bash
cd frontend
npm install
```

### 4. Configurar AWS
```bash
aws configure
# Proporcionar Access Key ID, Secret Access Key, Region (us-east-1)
```

## Ejecución Rápida (Quick Start)

### 🚀 **Iniciar Todo el Sistema**
```powershell
# Terminal 1: Backend
cd backend
node index-simple.js

# Terminal 2: Frontend  
cd frontend
npm start
```

### 🌐 **URLs del Sistema**
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **Test DynamoDB**: http://localhost:3000/api/test/dynamodb
- **Test Email**: http://localhost:3000/api/test/send-email

### 📧 **Probar Notificaciones**
```powershell
# Enviar email de prueba
$body = '{"email": "ecamachoecamacho@gmail.com", "testType": "subscription"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/test/send-email" -Method POST -ContentType "application/json" -Body $body
```

## Ejecución en Desarrollo

### Backend (Puerto 3000)
```bash
cd backend
node index-simple.js
```

### Frontend (Puerto 3001)
```bash
cd frontend
npm start
```

### Variables de Entorno Requeridas

Crear archivo `backend/.env`:
```bash
NODE_ENV=development
PORT=3000

# SendGrid Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your_sendgrid_api_key
MAIL_ENCRYPTION=tls
MAIL_FROM_NAME=BTG Pactual
MAIL_FROM_ADDRESS=your_email@gmail.com

# Twilio Configuration
SMS_ACCOUNT_SID=your_twilio_account_sid
SMS_AUTH_TOKEN=your_twilio_auth_token
SMS_FROM_NUMBER=+1234567890
TWILIO_ENABLED=false

# AWS DynamoDB Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
DYNAMODB_TABLE_PREFIX=btg-pension
```

## Despliegue en AWS

### Opción 1: Script Automático (Linux/Mac)
```bash
cd infrastructure
chmod +x deploy.sh
./deploy.sh --environment dev --region us-east-1
```

### Opción 2: Script Automático (Windows)
```powershell
cd infrastructure
.\deploy.ps1 -Environment dev -Region us-east-1
```

### Opción 3: Manual
```bash
# 1. Desplegar infraestructura
aws cloudformation deploy \
  --template-file infrastructure/cloudformation.yaml \
  --stack-name btg-pension-funds-dev \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides Environment=dev

# 2. Compilar y desplegar backend
cd backend
npm run build
# Crear ZIP y subir a Lambda

# 3. Compilar y desplegar frontend
cd frontend
npm run build
aws s3 sync build/ s3://bucket-name/
```

## API Endpoints

### Fondos
- `GET /api/funds` - Obtener fondos disponibles
- `POST /api/funds/subscribe` - Suscribirse a un fondo
- `POST /api/funds/unsubscribe` - Cancelar suscripción

### Transacciones
- `GET /api/transactions/user1` - Historial de transacciones del usuario
- `GET /api/transactions` - Todas las transacciones

### Notificaciones
- `GET /api/notifications/user1` - Obtener notificaciones del usuario
- `POST /api/test/send-email` - Endpoint de prueba para envío de emails

### Usuarios y Preferencias
- `GET /api/user/notification-preferences` - Obtener preferencias de notificación
- `POST /api/user/notification-preferences` - Actualizar preferencias
- `GET /api/user/balance` - Obtener saldo del usuario

### Utilidades
- `GET /api/health` - Health check del servidor
- `GET /api/test/dynamodb` - Prueba de conexión DynamoDB

## Fondos Disponibles

1. **FPV_EL CLIENTE_RECAUDADORA** - 75,000 COP (FPV)
2. **FPV_EL CLIENTE_ECOPETROL** - 125,000 COP (FPV)  
3. **DEUDAPRIVADA** - 50,000 COP (FIC)
4. **FDO-ACCIONES** - 250,000 COP (FIC)
5. **FPV_EL CLIENTE_DINAMICA** - 100,000 COP (FPV)

## Reglas de Negocio

- **Saldo Inicial**: $500,000 COP por usuario
- **Validación de Monto**: Debe cumplir monto mínimo del fondo
- **Validación de Saldo**: No exceder saldo disponible
- **Notificaciones Reales**: Email vía SendGrid y SMS vía Twilio
- **Cancelación**: Solo fondos activos pueden cancelarse
- **Reintegro**: Cancelación devuelve monto completo al saldo
- **Configuración**: Usuario puede editar email y teléfono con validación
- **Historial Completo**: Se registran suscripciones y cancelaciones
- **Persistencia**: Todos los datos se almacenan en DynamoDB

## Tablas DynamoDB

### Tablas Creadas Automáticamente:
- **btg-pension-users**: Información de usuarios y preferencias
- **btg-pension-subscriptions**: Suscripciones activas a fondos
- **btg-pension-notifications**: Historial de notificaciones enviadas

### Estructura de Datos:
```javascript
// Usuario
{
  userId: "user1",
  availableBalance: 500000,
  totalInvested: 0,
  notificationPreferences: {
    preferredMethod: "email",
    email: "ecamachoecamacho@gmail.com",
    phoneNumber: "+57 300 166 1010"
  }
}

// Suscripción
{
  subscriptionId: "sub_123456",
  userId: "user1", 
  fundId: 1,
  fundName: "FPV_EL CLIENTE_RECAUDADORA",
  amount: 75000,
  subscriptionDate: "2025-08-08T10:30:00.000Z",
  status: "active"
}

// Notificación
{
  notificationId: "notif_123456",
  userId: "user1",
  type: "subscription",
  title: "✅ Suscripción exitosa",
  message: "Has suscrito exitosamente $75,000 COP al fondo FPV_EL CLIENTE_RECAUDADORA",
  category: "transaction",
  status: "sent",
  read: false,
  createdAt: "2025-08-08T10:30:00.000Z"
}
```

## Estado Actual del Sistema

### ✅ **Completamente Funcional**
- **Backend**: Ejecutándose en puerto 3000 con DynamoDB
- **Frontend**: Ejecutándose en puerto 3001 con React + Material-UI
- **Email**: SendGrid configurado y enviando correos reales
- **SMS**: Twilio configurado (deshabilitado por defecto)
- **Base de Datos**: AWS DynamoDB con 3 tablas activas
- **Notificaciones**: Sistema completo de preferencias y envío

### 🔧 **Configuración Actual**
- **Email por defecto**: `ecamachoecamacho@gmail.com`
- **Teléfono por defecto**: `+57 300 166 1010`
- **Región AWS**: `us-east-1`
- **Prefijo de tablas**: `btg-pension`

### 📊 **Métricas del Sistema**
- **Fondos disponibles**: 5 fondos activos
- **Saldo inicial**: COP $500,000
- **Notificaciones**: Email y SMS con validación
- **Transacciones**: Historial completo persistente

## Funcionalidades Implementadas

### ✅ Sistema de Fondos
- Dashboard con 5 fondos disponibles
- Suscripción con validación de monto mínimo
- Cancelación de suscripciones activas
- Actualización de saldo en tiempo real

### ✅ Sistema de Notificaciones
- Envío real de emails vía SendGrid
- Envío de SMS vía Twilio (configurable)
- Centro de notificaciones en el frontend
- Configuración de preferencias del usuario

### ✅ Gestión de Usuario
- Configuración editable de email y teléfono
- Validación de email con regex
- Validación de teléfono internacional
- Persistencia de preferencias en DynamoDB

### ✅ Historial de Transacciones
- Registro completo de suscripciones
- Registro completo de cancelaciones
- Formateo de fechas y montos
- Datos en tiempo real desde DynamoDB

## Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Troubleshooting

### Error: Port 3000/3001 already in use
```powershell
# Matar procesos Node.js
taskkill /F /IM node.exe
```

### Error: AWS credentials not configured  
```bash
# Configurar credenciales en .env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

### Error: SendGrid email not received
- Verificar MAIL_PASSWORD en .env (API Key de SendGrid válida)
- Revisar carpeta de spam/promociones en Gmail
- Verificar email configurado en notificationPreferences: `ecamachoecamacho@gmail.com`
- Probar endpoint de test: `/api/test/send-email`

### Error: DynamoDB table not found
- Verificar AWS_REGION=us-east-1 en .env
- Las tablas se crean automáticamente en la primera ejecución
- Verificar credenciales AWS válidas y permisos DynamoDB
- Revisar logs del servidor para errores de conexión

### Error: Frontend can't connect to backend
- Verificar que el backend esté corriendo en puerto 3000
- Verificar CORS habilitado en backend (ya configurado)
- Revisar consola del navegador para errores específicos
- Verificar que ambos servidores estén activos

### Error: Notification preferences reset
- Problema solucionado: emails hardcodeados reemplazados
- Verificar que las preferencias se guarden en DynamoDB
- Revisar endpoint `/api/user/notification-preferences`

## Contacto y Soporte

- **Desarrollo**: [Información del desarrollador]
- **Documentación**: Este README y comentarios en código
- **Issues**: GitHub Issues para reportar problemas

## Licencia

Este proyecto es privado y confidencial para BTG Pactual.

---

**Desarrollado con ❤️ para BTG Pactual**
