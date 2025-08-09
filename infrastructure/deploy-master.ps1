# Master Deployment Script for BTG Pactual Pension Fund Management System
# This script orchestrates the complete deployment of infrastructure, backend, and frontend

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$SendGridApiKey = "",
    
    [Parameter(Mandatory=$false)]
    [string]$TwilioAccountSid = "",
    
    [Parameter(Mandatory=$false)]
    [string]$TwilioAuthToken = "",
    
    [Parameter(Mandatory=$false)]
    [string]$TwilioPhoneNumber = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipInfrastructure = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBackend = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipFrontend = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$ForceRedeploy = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 BTG PACTUAL - DESPLIEGUE MAESTRO" -ForegroundColor Magenta
Write-Host "====================================" -ForegroundColor Magenta
Write-Host "Sistema completo de gestión de fondos de pensión" -ForegroundColor White
Write-Host ""
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host ""

# Function to write colored output
function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  [INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ [SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  [WARNING] $Message" -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "❌ [ERROR] $Message" -ForegroundColor Red
}

function Write-Phase {
    param([string]$Phase, [string]$Message)
    Write-Host ""
    Write-Host "🔥 [$Phase] $Message" -ForegroundColor Magenta
    Write-Host "$(('=' * 50))" -ForegroundColor Magenta
}

function Write-Step {
    param([string]$Step, [string]$Message)
    Write-Host "🔄 [$Step] $Message" -ForegroundColor Blue
}

$deploymentStartTime = Get-Date

try {
    # Pre-flight checks
    Write-Phase "PREFLIGHT" "Verificando prerequisitos del sistema"
    
    # Check if in correct directory
    if (-not (Test-Path "cloudformation.yaml")) {
        throw "Error: No se encuentra cloudformation.yaml. Ejecute este script desde el directorio infrastructure/"
    }
    
    # Check required directories
    if (-not (Test-Path "../backend")) { throw "Directorio backend no encontrado" }
    if (-not (Test-Path "../frontend")) { throw "Directorio frontend no encontrado" }
    
    # Check credentials if provided
    if ($SendGridApiKey -and $SendGridApiKey.Length -lt 50) {
        Write-Warning "SendGrid API Key parece incompleta (menos de 50 caracteres)"
    }
    
    # Check AWS CLI
    try {
        $awsVersion = aws --version 2>$null
        Write-Info "AWS CLI: $awsVersion"
    } catch {
        throw "AWS CLI no está instalado"
    }
    
    # Check AWS credentials
    try {
        $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
        Write-Info "AWS Account: $($identity.Account)"
        Write-Info "AWS User: $($identity.Arn)"
    } catch {
        throw "Credenciales AWS no configuradas"
    }
    
    Write-Success "Prerequisitos verificados"

    # PHASE 1: Infrastructure Deployment
    if (-not $SkipInfrastructure) {
        Write-Phase "FASE 1" "Desplegando infraestructura AWS"
        
        $stackName = "btg-pension-$Environment"
        
        # Check if stack exists
        $stackExists = $false
        try {
            aws cloudformation describe-stacks --stack-name $stackName --region $Region > $null 2>&1
            if ($LASTEXITCODE -eq 0) {
                $stackExists = $true
                Write-Info "Stack existente encontrado: $stackName"
            }
        } catch {
            Write-Info "Creando nuevo stack: $stackName"
        }
        
        # Prepare parameters
        $params = @()
        $params += "ParameterKey=Environment,ParameterValue=$Environment"
        
        if ($SendGridApiKey) {
            $params += "ParameterKey=SendGridApiKey,ParameterValue=$SendGridApiKey"
        }
        
        if ($TwilioAccountSid) {
            $params += "ParameterKey=TwilioAccountSid,ParameterValue=$TwilioAccountSid"
        }
        
        if ($TwilioAuthToken) {
            $params += "ParameterKey=TwilioAuthToken,ParameterValue=$TwilioAuthToken"
        }
        
        if ($TwilioPhoneNumber) {
            $params += "ParameterKey=TwilioPhoneNumber,ParameterValue=$TwilioPhoneNumber"
        }
        
        # Deploy or update stack
        $cfOperation = if ($stackExists -and -not $ForceRedeploy) { "update-stack" } else { "create-stack" }
        
        Write-Step "1.1" "Ejecutando $cfOperation para infraestructura..."
        
        $cfCommand = "aws cloudformation $cfOperation --stack-name $stackName --template-body file://cloudformation.yaml --region $Region --capabilities CAPABILITY_IAM"
        
        if ($params.Count -gt 0) {
            $cfCommand += " --parameters " + ($params -join " ")
        }
        
        # Execute CloudFormation
        Invoke-Expression $cfCommand
        if ($LASTEXITCODE -ne 0) { throw "Error ejecutando CloudFormation" }
        
        # Wait for stack completion
        Write-Step "1.2" "Esperando completación del stack (esto puede tomar varios minutos)..."
        
        $waitCommand = if ($cfOperation -eq "create-stack") { "stack-create-complete" } else { "stack-update-complete" }
        
        aws cloudformation wait $waitCommand --stack-name $stackName --region $Region
        if ($LASTEXITCODE -ne 0) { throw "Stack deployment failed" }
        
        Write-Success "Infraestructura desplegada exitosamente"
        
        # Get stack outputs
        $stackOutputs = aws cloudformation describe-stacks --stack-name $stackName --region $Region --query 'Stacks[0].Outputs' --output json | ConvertFrom-Json
        
        Write-Info "Recursos creados:"
        foreach ($output in $stackOutputs) {
            Write-Host "  • $($output.OutputKey): $($output.OutputValue)" -ForegroundColor White
        }
    } else {
        Write-Info "Fase de infraestructura omitida"
    }

    # PHASE 2: Backend Deployment
    if (-not $SkipBackend) {
        Write-Phase "FASE 2" "Desplegando backend (AWS Lambda)"
        
        Write-Step "2.1" "Ejecutando script de backend..."
        
        $backendParams = @(
            "-Environment", $Environment,
            "-Region", $Region
        )
        
        & "./deploy-backend.ps1" @backendParams
        if ($LASTEXITCODE -ne 0) { throw "Error desplegando backend" }
        
        Write-Success "Backend desplegado exitosamente"
    } else {
        Write-Info "Fase de backend omitida"
    }

    # PHASE 3: Frontend Deployment
    if (-not $SkipFrontend) {
        Write-Phase "FASE 3" "Desplegando frontend (S3 + CloudFront)"
        
        Write-Step "3.1" "Ejecutando script de frontend..."
        
        $frontendParams = @(
            "-Environment", $Environment,
            "-Region", $Region
        )
        
        & "./deploy-frontend.ps1" @frontendParams
        if ($LASTEXITCODE -ne 0) { throw "Error desplegando frontend" }
        
        Write-Success "Frontend desplegado exitosamente"
    } else {
        Write-Info "Fase de frontend omitida"
    }

    # PHASE 4: Integration Testing
    if (-not $SkipTests) {
        Write-Phase "FASE 4" "Ejecutando pruebas de integración"
        
        Write-Step "4.1" "Obteniendo URLs del sistema..."
        
        $stackName = "btg-pension-$Environment"
        $stackOutputs = aws cloudformation describe-stacks --stack-name $stackName --region $Region --query 'Stacks[0].Outputs' --output json | ConvertFrom-Json
        
        $apiUrl = ($stackOutputs | Where-Object { $_.OutputKey -eq "ApiGatewayUrl" }).OutputValue
        $frontendUrl = ($stackOutputs | Where-Object { $_.OutputKey -eq "FrontendURL" }).OutputValue
        
        if ($apiUrl) {
            Write-Step "4.2" "Probando API Backend..."
            try {
                $healthResponse = Invoke-WebRequest -Uri "$apiUrl/health" -TimeoutSec 30 -UseBasicParsing
                if ($healthResponse.StatusCode -eq 200) {
                    Write-Success "API Backend responde correctamente"
                    $healthData = $healthResponse.Content | ConvertFrom-Json
                    Write-Info "Versión API: $($healthData.version)"
                    Write-Info "Environment: $($healthData.environment)"
                } else {
                    Write-Warning "API Backend respondió con código: $($healthResponse.StatusCode)"
                }
            } catch {
                Write-Warning "No se pudo conectar al API Backend: $($_.Exception.Message)"
            }
        }
        
        if ($frontendUrl) {
            Write-Step "4.3" "Probando Frontend..."
            try {
                $frontendResponse = Invoke-WebRequest -Uri $frontendUrl -TimeoutSec 30 -UseBasicParsing
                if ($frontendResponse.StatusCode -eq 200) {
                    Write-Success "Frontend accesible correctamente"
                } else {
                    Write-Warning "Frontend respondió con código: $($frontendResponse.StatusCode)"
                }
            } catch {
                Write-Warning "No se pudo conectar al Frontend: $($_.Exception.Message)"
            }
        }
        
        Write-Success "Pruebas de integración completadas"
    } else {
        Write-Info "Pruebas omitidas"
    }

    # Final Summary
    $deploymentEndTime = Get-Date
    $deploymentDuration = $deploymentEndTime - $deploymentStartTime
    
    Write-Host ""
    Write-Host "🎉 ¡DESPLIEGUE MAESTRO COMPLETADO!" -ForegroundColor Green
    Write-Host "==================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Resumen del despliegue:" -ForegroundColor Cyan
    Write-Host "  • Environment: $Environment" -ForegroundColor White
    Write-Host "  • Región AWS: $Region" -ForegroundColor White
    Write-Host "  • Duración: $($deploymentDuration.ToString('mm\:ss'))" -ForegroundColor White
    Write-Host "  • Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
    
    # Get final URLs
    try {
        $stackName = "btg-pension-$Environment"
        $stackOutputs = aws cloudformation describe-stacks --stack-name $stackName --region $Region --query 'Stacks[0].Outputs' --output json 2>$null | ConvertFrom-Json
        
        $apiUrl = ($stackOutputs | Where-Object { $_.OutputKey -eq "ApiGatewayUrl" }).OutputValue
        $frontendUrl = ($stackOutputs | Where-Object { $_.OutputKey -eq "FrontendURL" }).OutputValue
        
        Write-Host ""
        Write-Host "🌐 URLs del sistema:" -ForegroundColor Cyan
        if ($apiUrl) {
            Write-Host "  • API Backend: $apiUrl" -ForegroundColor White
        }
        if ($frontendUrl) {
            Write-Host "  • Frontend: $frontendUrl" -ForegroundColor White
        }
    } catch {
        Write-Info "No se pudieron obtener las URLs finales"
    }
    
    Write-Host ""
    Write-Host "🔧 Componentes desplegados:" -ForegroundColor Cyan
    if (-not $SkipInfrastructure) { Write-Host "  ✅ Infraestructura AWS (DynamoDB, Lambda, API Gateway, S3, CloudFront)" -ForegroundColor Green }
    if (-not $SkipBackend) { Write-Host "  ✅ Backend API (Node.js + TypeScript en AWS Lambda)" -ForegroundColor Green }
    if (-not $SkipFrontend) { Write-Host "  ✅ Frontend (React + TypeScript en S3/CloudFront)" -ForegroundColor Green }
    if (-not $SkipTests) { Write-Host "  ✅ Pruebas de integración" -ForegroundColor Green }
    
    Write-Host ""
    Write-Host "💡 Próximos pasos:" -ForegroundColor Yellow
    Write-Host "  1. Configura las credenciales de SendGrid y Twilio en AWS Systems Manager Parameter Store" -ForegroundColor White
    Write-Host "  2. Actualiza el stack con las credenciales reales usando:" -ForegroundColor White
    Write-Host "     ./deploy-master.ps1 -Environment $Environment -SendGridApiKey 'tu-key' -TwilioAccountSid 'tu-sid'" -ForegroundColor Gray
    Write-Host "  3. Prueba las funcionalidades de notificación" -ForegroundColor White
    Write-Host "  4. Configura monitoreo y alertas en CloudWatch" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🚀 ¡El sistema BTG Pactual está listo para usar!" -ForegroundColor Green

} catch {
    Write-Host "❌ [ERROR] Error durante el despliegue maestro: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host ""
    Write-Host "🔧 Información de debugging:" -ForegroundColor Red
    Write-Host "  • Environment: $Environment" -ForegroundColor White
    Write-Host "  • Región: $Region" -ForegroundColor White
    Write-Host "  • Tiempo transcurrido: $((Get-Date) - $deploymentStartTime)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "📝 Comandos para debugging:" -ForegroundColor Yellow
    Write-Host "  • Ver logs de CloudFormation:" -ForegroundColor White
    Write-Host "    aws cloudformation describe-stack-events --stack-name btg-pension-$Environment --region $Region" -ForegroundColor Gray
    Write-Host "  • Ver estado del stack:" -ForegroundColor White
    Write-Host "    aws cloudformation describe-stacks --stack-name btg-pension-$Environment --region $Region" -ForegroundColor Gray
    
    exit 1
}

Write-Host ""
Write-Host "✨ Despliegue maestro finalizado con éxito" -ForegroundColor Green
