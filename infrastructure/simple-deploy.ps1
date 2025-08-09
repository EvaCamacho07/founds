# Simple Deployment Script for BTG Pactual Pension Fund Management System
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [string]$SendGridApiKey = "",
    
    [Parameter(Mandatory=$false)]
    [string]$TwilioAccountSid = "",
    
    [Parameter(Mandatory=$false)]
    [string]$TwilioAuthToken = "",
    
    [Parameter(Mandatory=$false)]
    [string]$TwilioPhoneNumber = ""
)

$ErrorActionPreference = "Stop"

Write-Host "=== BTG PACTUAL - DEPLOYMENT ===" -ForegroundColor Magenta
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Region: us-east-1" -ForegroundColor Yellow
Write-Host ""

function Write-Step {
    param([string]$Message)
    Write-Host "[STEP] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

try {
    Write-Step "Verificando prerequisitos..."
    
    # Check current directory
    if (-not (Test-Path "cloudformation.yaml")) {
        throw "cloudformation.yaml no encontrado. Ejecute desde directorio infrastructure/"
    }
    Write-Info "cloudformation.yaml encontrado"
    
    # Check directories
    if (Test-Path "../backend") {
        Write-Info "Directorio backend encontrado"
    } else {
        Write-Warn "Directorio backend no encontrado"
    }
    
    if (Test-Path "../frontend") {
        Write-Info "Directorio frontend encontrado"  
    } else {
        Write-Warn "Directorio frontend no encontrado"
    }
    
    Write-Step "Verificando herramientas..."
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Info "Node.js version: $nodeVersion"
        } else {
            Write-Warn "Node.js no encontrado"
        }
    } catch {
        Write-Warn "Error verificando Node.js"
    }
    
    # Check AWS CLI
    try {
        $awsVersion = aws --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Info "AWS CLI encontrado: $awsVersion"
        } else {
            Write-Warn "AWS CLI no encontrado"
        }
    } catch {
        Write-Warn "Error verificando AWS CLI"
    }
    
    # Check AWS credentials
    Write-Step "Verificando credenciales AWS..."
    try {
        $identity = aws sts get-caller-identity --output json 2>$null | ConvertFrom-Json
        if ($LASTEXITCODE -eq 0) {
            Write-Info "AWS Account: $($identity.Account)"
            Write-Info "AWS User: $($identity.Arn)"
            $awsConfigured = $true
        } else {
            Write-Warn "Credenciales AWS no configuradas"
            $awsConfigured = $false
        }
    } catch {
        Write-Warn "Error verificando credenciales AWS: $($_.Exception.Message)"
        $awsConfigured = $false
    }
    
    Write-Step "Verificando credenciales de notificacion..."
    
    if ($SendGridApiKey) {
        if ($SendGridApiKey.StartsWith("SG.") -and $SendGridApiKey.Length -gt 50) {
            Write-Info "SendGrid API Key provided and looks valid"
        } else {
            Write-Warn "SendGrid API Key may be invalid"
        }
    } else {
        Write-Info "No SendGrid API Key provided"
    }
    
    if ($TwilioAccountSid) {
        if ($TwilioAccountSid.StartsWith("AC") -and $TwilioAccountSid.Length -eq 34) {
            Write-Info "Twilio Account SID provided and looks valid"
        } else {
            Write-Warn "Twilio Account SID may be invalid"
        }
    } else {
        Write-Info "No Twilio credentials provided"
    }
    
    Write-Step "Resumen de configuracion..."
    Write-Host ""
    Write-Host "=== CONFIGURATION SUMMARY ===" -ForegroundColor Cyan
    Write-Host "Environment: $Environment" -ForegroundColor White
    Write-Host "Region: us-east-1" -ForegroundColor White
    Write-Host "AWS Configured: $awsConfigured" -ForegroundColor White
    Write-Host "SendGrid Configured: $($SendGridApiKey -ne '')" -ForegroundColor White
    Write-Host "Twilio Configured: $($TwilioAccountSid -ne '')" -ForegroundColor White
    Write-Host ""
    
    if ($awsConfigured) {
        Write-Success "READY FOR DEPLOYMENT"
        Write-Host ""
        Write-Host "Para desplegar, configure primero las credenciales AWS con 'aws configure'"
        Write-Host "Luego ejecute:"
        Write-Host "aws cloudformation create-stack --stack-name btg-pension-$Environment --template-body file://cloudformation.yaml --region us-east-1 --capabilities CAPABILITY_IAM" -ForegroundColor Gray
    } else {
        Write-Warn "AWS credentials needed for deployment"
        Write-Host ""
        Write-Host "Pasos para configurar AWS:"
        Write-Host "1. aws configure"
        Write-Host "2. Ingresar Access Key ID"
        Write-Host "3. Ingresar Secret Access Key"
        Write-Host "4. Seleccionar region (us-east-1)"
        Write-Host "5. Re-ejecutar este script"
    }
    
    Write-Host ""
    Write-Host "=== CREDENCIALES DISPONIBLES ===" -ForegroundColor Green
    Write-Host "SendGrid API Key: $SendGridApiKey" -ForegroundColor White
    Write-Host "Twilio Account SID: $TwilioAccountSid" -ForegroundColor White  
    Write-Host "Twilio Auth Token: $TwilioAuthToken" -ForegroundColor White
    Write-Host "Twilio Phone: $TwilioPhoneNumber" -ForegroundColor White

} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Success "Script completado exitosamente"
