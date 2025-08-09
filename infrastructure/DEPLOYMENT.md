# 🚀 Guía de Despliegue - BTG Pactual Pension Fund Management System

## 📋 Descripción General

Esta guía detalla el proceso completo de despliegue del Sistema de Gestión de Fondos de Pensión BTG Pactual en AWS utilizando CloudFormation. El sistema incluye:

- **Frontend**: React + TypeScript + Material-UI (desplegado en S3 + CloudFront)
- **Backend**: Node.js + Express + TypeScript (desplegado en AWS Lambda)
- **Base de Datos**: DynamoDB (NoSQL)
- **Infraestructura**: CloudFormation para Infrastructure as Code
- **Notificaciones**: SendGrid (email) + Twilio (SMS)

## 🏗️ Arquitectura AWS

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │    │   API Gateway   │    │    Lambda       │
│   (Frontend)    │◄───┤   (REST API)    │◄───┤   (Backend)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       │                       ▼
┌─────────────────┐              │            ┌─────────────────┐
│       S3        │              │            │    DynamoDB     │
│   (Static Web)  │              │            │   (Database)    │
└─────────────────┘              │            └─────────────────┘
                                  │
                                  ▼
                        ┌─────────────────┐
                        │  External APIs  │
                        │ SendGrid+Twilio │
                        └─────────────────┘
```

## 📋 Prerequisitos

### Herramientas Requeridas

1. **Node.js 18+**: Para construir el frontend y backend
   ```powershell
   node --version  # Debe ser 18 o superior
   npm --version
   ```

2. **AWS CLI**: Para interactuar con AWS
   ```powershell
   aws --version
   aws configure  # Configurar credenciales
   ```

3. **Git**: Para control de versiones
   ```powershell
   git --version
   ```

### Credenciales AWS

Configure sus credenciales AWS con permisos para:
- CloudFormation (CreateStack, UpdateStack, DeleteStack)
- IAM (CreateRole, AttachRolePolicy)
- S3 (CreateBucket, PutObject, GetObject)
- DynamoDB (CreateTable, PutItem, GetItem)
- Lambda (CreateFunction, UpdateFunction)
- API Gateway (CreateApi, CreateDeployment)
- CloudFront (CreateDistribution)

```powershell
aws configure
# AWS Access Key ID: [Su Access Key]
# AWS Secret Access Key: [Su Secret Key]
# Default region name: us-east-1
# Default output format: json
```

### Credenciales de Servicios Externos

1. **SendGrid** (para email):
   - Registrarse en https://sendgrid.com
   - Obtener API Key desde Dashboard > Settings > API Keys
   - Configurar dominio y autenticación

2. **Twilio** (para SMS) - Opcional:
   - Registrarse en https://twilio.com
   - Obtener Account SID, Auth Token y Phone Number
   - Configurar número de teléfono

## 🚀 Opciones de Despliegue

### Opción 1: Despliegue Completo Automatizado (Recomendado)

Use el script maestro para desplegar todo el sistema:

```powershell
cd infrastructure

# Despliegue básico sin notificaciones
./deploy-master.ps1 -Environment dev

# Despliegue completo con notificaciones
./deploy-master.ps1 `
  -Environment prod `
  -Region us-east-1 `
  -SendGridApiKey "SG.xxxxxxxxxxxxxxxxxxxxx" `
  -TwilioAccountSid "ACxxxxxxxxxxxxxxxxxxxxx" `
  -TwilioAuthToken "xxxxxxxxxxxxxxxxxxxxxxx" `
  -TwilioPhoneNumber "+1234567890"
```

**Parámetros disponibles:**
- `Environment`: dev, staging, prod (default: dev)
- `Region`: Región AWS (default: us-east-1)
- `SendGridApiKey`: API Key de SendGrid
- `TwilioAccountSid`: Account SID de Twilio
- `TwilioAuthToken`: Auth Token de Twilio
- `TwilioPhoneNumber`: Número de teléfono de Twilio
- `SkipInfrastructure`: Omitir despliegue de infraestructura
- `SkipBackend`: Omitir despliegue de backend
- `SkipFrontend`: Omitir despliegue de frontend
- `SkipTests`: Omitir pruebas de integración
- `ForceRedeploy`: Forzar redespliegue de stack existente

### Opción 2: Despliegue Paso a Paso

#### Paso 1: Infraestructura

```powershell
cd infrastructure

# Crear stack de infraestructura
aws cloudformation create-stack `
  --stack-name btg-pension-dev `
  --template-body file://cloudformation.yaml `
  --region us-east-1 `
  --capabilities CAPABILITY_IAM `
  --parameters `
    ParameterKey=Environment,ParameterValue=dev `
    ParameterKey=SendGridApiKey,ParameterValue="tu-sendgrid-key"

# Esperar completación
aws cloudformation wait stack-create-complete `
  --stack-name btg-pension-dev `
  --region us-east-1
```

#### Paso 2: Backend

```powershell
./deploy-backend.ps1 -Environment dev -Region us-east-1
```

#### Paso 3: Frontend

```powershell
./deploy-frontend.ps1 -Environment dev -Region us-east-1
```

## 📊 Estructura de Recursos AWS

### CloudFormation Stack: `btg-pension-{environment}`

**DynamoDB Tables:**
- `btg-pension-users-{environment}`: Datos de usuarios
- `btg-pension-subscriptions-{environment}`: Suscripciones a fondos
- `btg-pension-notifications-{environment}`: Historial de notificaciones

**Lambda Functions:**
- `btg-pension-api-{environment}`: API principal del backend

**API Gateway:**
- `btg-pension-api-{environment}`: REST API pública

**S3 Buckets:**
- `btg-pension-frontend-{environment}-{random}`: Archivos estáticos del frontend
- `btg-pension-lambda-artifacts-{environment}-{random}`: Artefactos de Lambda

**CloudFront Distribution:**
- Distribución para acelerar entrega del frontend

**IAM Roles:**
- `btg-pension-lambda-role-{environment}`: Rol para Lambda con permisos DynamoDB

## 🌐 URLs y Endpoints

Después del despliegue, obtenga las URLs del sistema:

```powershell
aws cloudformation describe-stacks `
  --stack-name btg-pension-dev `
  --region us-east-1 `
  --query 'Stacks[0].Outputs'
```

**Outputs esperados:**
- `ApiGatewayUrl`: URL del API Backend
- `FrontendURL`: URL del Frontend (CloudFront)
- `FrontendBucketName`: Nombre del bucket S3

### Endpoints del API

Base URL: `{ApiGatewayUrl}`

**Fondos:**
- `GET /api/funds` - Listar fondos disponibles
- `GET /api/funds/{id}` - Obtener detalles de un fondo

**Usuarios:**
- `GET /api/users/{id}` - Obtener datos de usuario
- `PUT /api/users/{id}` - Actualizar datos de usuario

**Transacciones:**
- `POST /api/transactions/subscribe` - Suscribirse a fondo
- `POST /api/transactions/cancel` - Cancelar suscripción
- `GET /api/transactions/history/{userId}` - Historial de transacciones

**Notificaciones:**
- `GET /api/notifications/{userId}` - Obtener notificaciones
- `POST /api/notifications/test` - Enviar notificación de prueba

**Utilidades:**
- `GET /api/health` - Health check
- `GET /api/version` - Información de versión

## 🔧 Configuración de Notificaciones

### Configurar SendGrid

1. Verificar dominio en SendGrid:
   ```
   Dashboard > Settings > Sender Authentication > Domain Authentication
   ```

2. Configurar plantillas de email:
   ```
   Dashboard > Email API > Dynamic Templates
   ```

3. Obtener API Key:
   ```
   Dashboard > Settings > API Keys > Create API Key
   ```

### Configurar Twilio (Opcional)

1. Obtener credenciales:
   ```
   Console > Account > Account Info
   - Account SID
   - Auth Token
   ```

2. Configurar número de teléfono:
   ```
   Console > Phone Numbers > Manage > Buy a number
   ```

## 🧪 Pruebas y Verificación

### Pruebas de Health Check

```powershell
# Probar API Backend
$apiUrl = "https://tu-api-url.execute-api.us-east-1.amazonaws.com/prod"
Invoke-RestMethod -Uri "$apiUrl/api/health"

# Probar Frontend
$frontendUrl = "https://tu-cloudfront-url.cloudfront.net"
Invoke-WebRequest -Uri $frontendUrl
```

### Pruebas Funcionales

1. **Crear usuario de prueba:**
   ```powershell
   $body = @{
       email = "test@example.com"
       name = "Usuario Test"
       initialBalance = 500000
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "$apiUrl/api/users/test-user" -Method PUT -Body $body -ContentType "application/json"
   ```

2. **Suscribirse a fondo:**
   ```powershell
   $body = @{
       userId = "test-user"
       fundId = "FPV_EL CLIENTE_RECAUDADORA"
       amount = 75000
       notificationMethod = "email"
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "$apiUrl/api/transactions/subscribe" -Method POST -Body $body -ContentType "application/json"
   ```

3. **Verificar notificación:**
   ```powershell
   Invoke-RestMethod -Uri "$apiUrl/api/notifications/test-user"
   ```

## 🔄 Actualizaciones y Mantenimiento

### Actualizar Backend

```powershell
cd infrastructure
./deploy-backend.ps1 -Environment prod
```

### Actualizar Frontend

```powershell
cd infrastructure
./deploy-frontend.ps1 -Environment prod
```

### Actualizar Infraestructura

```powershell
cd infrastructure
aws cloudformation update-stack `
  --stack-name btg-pension-prod `
  --template-body file://cloudformation.yaml `
  --region us-east-1 `
  --capabilities CAPABILITY_IAM
```

### Monitoreo

**CloudWatch Logs:**
- `/aws/lambda/btg-pension-api-{environment}`: Logs del backend

**CloudWatch Metrics:**
- Lambda: Duration, Errors, Invocations
- API Gateway: Count, Latency, Errors
- DynamoDB: ConsumedReadCapacityUnits, ConsumedWriteCapacityUnits

**Alertas recomendadas:**
- Errores de Lambda > 5% en 5 minutos
- Latencia API Gateway > 5 segundos
- Errores DynamoDB > 1% en 5 minutos

## 🗑️ Limpieza de Recursos

### Eliminar Stack Completo

```powershell
# ⚠️ CUIDADO: Esto eliminará todos los recursos y datos
aws cloudformation delete-stack `
  --stack-name btg-pension-dev `
  --region us-east-1

# Esperar eliminación completa
aws cloudformation wait stack-delete-complete `
  --stack-name btg-pension-dev `
  --region us-east-1
```

### Limpiar Buckets S3 (si es necesario)

```powershell
# Listar buckets del proyecto
aws s3 ls | grep btg-pension

# Vaciar bucket antes de eliminar stack
aws s3 rm s3://btg-pension-frontend-dev-xxxxxxxxxxxx --recursive
aws s3 rm s3://btg-pension-lambda-artifacts-dev-xxxxxxxxxxxx --recursive
```

## 🚨 Solución de Problemas

### Error: Stack Already Exists

```powershell
# Actualizar stack existente en lugar de crear
aws cloudformation update-stack --stack-name btg-pension-dev ...
```

### Error: Insufficient Permissions

Verificar que su usuario AWS tenga permisos para:
- CloudFormation: Full access
- IAM: CreateRole, AttachRolePolicy
- Lambda: Full access
- DynamoDB: Full access
- S3: Full access
- API Gateway: Full access

### Error: SendGrid/Twilio Authentication

1. Verificar API keys en AWS Systems Manager Parameter Store
2. Probar credenciales directamente:
   ```powershell
   # Probar SendGrid
   curl -X POST "https://api.sendgrid.com/v3/mail/send" `
     -H "Authorization: Bearer $sendgridKey" `
     -H "Content-Type: application/json"
   ```

### Error: CORS en Frontend

Verificar que API Gateway tenga configurado CORS apropiadamente. El CloudFormation template incluye configuración automática.

### Error: DynamoDB Capacity

Si hay errores de capacidad, considerar:
1. Aumentar capacidad provisionada
2. Cambiar a modo bajo demanda
3. Implementar auto-scaling

## 📞 Soporte

Para soporte técnico:
- Email: ecamachoecamacho@gmail.com
- Documentación: Ver README.md del proyecto
- Logs: CloudWatch Logs en AWS Console

## 📝 Changelog

### v1.0.0 (2024-01-XX)
- Despliegue inicial del sistema
- Infraestructura CloudFormation completa
- Scripts de automatización de despliegue
- Configuración de notificaciones SendGrid/Twilio
- Documentación completa
