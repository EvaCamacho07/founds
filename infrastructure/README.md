# 🏗️ Infrastructure - BTG Pactual Pension Fund Management System

Este directorio contiene toda la infraestructura como código y scripts de despliegue para el Sistema de Gestión de Fondos de Pensión BTG Pactual.

## 📁 Estructura de Archivos

```
infrastructure/
├── cloudformation.yaml      # Definición completa de infraestructura AWS
├── deploy-master.ps1        # Script maestro de despliegue automatizado
├── deploy-backend.ps1       # Script específico para desplegar backend
├── deploy-frontend.ps1      # Script específico para desplegar frontend
├── DEPLOYMENT.md           # Guía completa de despliegue
└── README.md               # Este archivo
```

## 🚀 Inicio Rápido

### Despliegue Completo (Recomendado)

```powershell
# Despliegue básico para desarrollo
./deploy-master.ps1 -Environment dev

# Despliegue completo para producción con notificaciones
./deploy-master.ps1 `
  -Environment prod `
  -SendGridApiKey "SG.your-sendgrid-key" `
  -TwilioAccountSid "AC.your-twilio-sid" `
  -TwilioAuthToken "your-twilio-token" `
  -TwilioPhoneNumber "+1234567890"
```

### Verificar Despliegue

```powershell
# Obtener URLs del sistema desplegado
aws cloudformation describe-stacks `
  --stack-name btg-pension-dev `
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendURL` || OutputKey==`ApiGatewayUrl`]'
```

## 📋 Scripts de Despliegue

### `deploy-master.ps1` - Despliegue Maestro

Orquesta el despliegue completo del sistema en el siguiente orden:
1. **Infraestructura**: CloudFormation stack con todos los recursos AWS
2. **Backend**: API Lambda con DynamoDB y notificaciones
3. **Frontend**: React app en S3 + CloudFront
4. **Pruebas**: Verificación de endpoints y conectividad

**Uso:**
```powershell
./deploy-master.ps1 [parámetros]
```

**Parámetros principales:**
- `-Environment`: dev, staging, prod (default: dev)
- `-Region`: Región AWS (default: us-east-1)
- `-SendGridApiKey`: Clave API de SendGrid para emails
- `-TwilioAccountSid`: Account SID de Twilio para SMS
- `-SkipInfrastructure`: Omitir despliegue de infraestructura
- `-SkipBackend`: Omitir despliegue de backend  
- `-SkipFrontend`: Omitir despliegue de frontend
- `-ForceRedeploy`: Forzar recreación del stack

### `deploy-backend.ps1` - Despliegue de Backend

Despliega específicamente el backend Node.js en AWS Lambda:
- Instala dependencias del backend
- Crea paquete ZIP con el código y dependencias
- Actualiza función Lambda existente
- Verifica que la API responda correctamente

**Uso:**
```powershell
./deploy-backend.ps1 -Environment prod -Region us-east-1
```

### `deploy-frontend.ps1` - Despliegue de Frontend

Despliega específicamente el frontend React en S3 + CloudFront:
- Instala dependencias del frontend
- Ejecuta build de producción con optimizaciones
- Configura variables de entorno automáticamente
- Sube archivos a S3 con configuración de cache optimizada
- Invalida cache de CloudFront

**Uso:**
```powershell
./deploy-frontend.ps1 -Environment prod -SkipCacheInvalidation
```

## ☁️ CloudFormation Template

### `cloudformation.yaml` - Infraestructura Completa

Define todos los recursos AWS necesarios:

**Compute & API:**
- AWS Lambda para backend API
- API Gateway REST para endpoints públicos
- IAM roles con permisos mínimos necesarios

**Storage:**
- DynamoDB tables para datos de usuarios, suscripciones y notificaciones
- S3 buckets para frontend y artefactos de Lambda

**CDN & Security:**
- CloudFront distribution para entrega global del frontend
- Configuración CORS automática
- Políticas de seguridad para buckets S3

**Parámetros configurables:**
- `Environment`: Sufijo para nombres de recursos
- `SendGridApiKey`: Credencial para envío de emails
- `TwilioAccountSid`, `TwilioAuthToken`, `TwilioPhoneNumber`: Credenciales SMS

**Outputs importantes:**
- `ApiGatewayUrl`: URL base del API
- `FrontendURL`: URL del frontend (CloudFront)
- `FrontendBucketName`: Nombre del bucket S3

## 🔧 Configuración de Ambientes

### Desarrollo (dev)
```powershell
./deploy-master.ps1 -Environment dev
```
- Recursos con menor capacidad
- Logs detallados habilitados
- Configuración de desarrollo en frontend

### Staging (staging)
```powershell
./deploy-master.ps1 -Environment staging -SendGridApiKey "key"
```
- Configuración similar a producción
- Notificaciones habilitadas para pruebas
- Datos de prueba

### Producción (prod)
```powershell
./deploy-master.ps1 -Environment prod -SendGridApiKey "key" -TwilioAccountSid "sid"
```
- Máxima capacidad y rendimiento
- Todas las notificaciones habilitadas
- Monitoreo y alertas configuradas

## 📊 Recursos AWS Creados

### Por Environment

**Stack name:** `btg-pension-{environment}`

**DynamoDB Tables:**
- `btg-pension-users-{env}`: Datos y balances de usuarios
- `btg-pension-subscriptions-{env}`: Suscripciones activas
- `btg-pension-notifications-{env}`: Historial de notificaciones

**Lambda Functions:**
- `btg-pension-api-{env}`: API principal del sistema

**S3 Buckets:**
- `btg-pension-frontend-{env}-{random}`: Archivos estáticos
- `btg-pension-lambda-artifacts-{env}-{random}`: Código Lambda

**Otros:**
- API Gateway: `btg-pension-api-{env}`
- CloudFront Distribution para CDN global
- IAM Role: `btg-pension-lambda-role-{env}`

## 🔍 Monitoreo y Logs

### CloudWatch Logs
```powershell
# Ver logs del backend
aws logs tail /aws/lambda/btg-pension-api-dev --follow
```

### Métricas Importantes
- **Lambda**: Duration, Errors, Throttles, Memory utilization
- **API Gateway**: Request count, Latency, 4XX/5XX errors  
- **DynamoDB**: Read/Write capacity utilization, Throttles
- **CloudFront**: Cache hit ratio, Origin response time

### Comandos de Debugging
```powershell
# Estado del stack
aws cloudformation describe-stacks --stack-name btg-pension-dev

# Eventos del stack (para errores)
aws cloudformation describe-stack-events --stack-name btg-pension-dev

# Logs de Lambda
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/btg-pension"
```

## 🗑️ Limpieza

### Eliminar Stack Completo
```powershell
# ⚠️ CUIDADO: Elimina todos los datos
aws cloudformation delete-stack --stack-name btg-pension-dev
```

### Limpiar Solo Frontend
```powershell
# Vaciar bucket S3 manualmente si es necesario
aws s3 rm s3://btg-pension-frontend-dev-xxxxx --recursive
```

## 🚨 Troubleshooting

### Errores Comunes

1. **"Stack already exists"**
   - Use `update-stack` en lugar de `create-stack`
   - O use `ForceRedeploy` en deploy-master.ps1

2. **"Insufficient permissions"**
   - Verificar que AWS CLI tenga permisos de admin
   - Revisar IAM policies del usuario

3. **"SendGrid/Twilio authentication failed"**
   - Verificar que las API keys sean válidas
   - Confirmar que SendGrid domain esté verificado

4. **"Frontend not loading"**
   - Verificar que CloudFront distribution esté deployed
   - Revisar configuración CORS en API Gateway

### Comandos de Diagnóstico
```powershell
# Verificar conectividad API
Invoke-RestMethod -Uri "https://your-api-url/api/health"

# Verificar frontend
Invoke-WebRequest -Uri "https://your-cloudfront-url"

# Ver todos los stacks
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE
```

## 📚 Documentación Adicional

- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: Guía detallada de despliegue
- **[../README.md](../README.md)**: Documentación general del proyecto
- **[../backend/README.md](../backend/README.md)**: Documentación del backend
- **[../frontend/README.md](../frontend/README.md)**: Documentación del frontend

## 🆘 Soporte

Para problemas con la infraestructura:
1. Revisar logs de CloudWatch
2. Verificar eventos de CloudFormation
3. Contactar: ecamachoecamacho@gmail.com

---

**Nota**: Estos scripts están optimizados para Windows PowerShell. Para otros sistemas operativos, adapte los comandos según sea necesario.
