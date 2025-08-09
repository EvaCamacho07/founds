# Backend Deployment Script for BTG Pactual Pension Fund Management System
# This script packages and deploys the        Write-Info "Ejecutando tests..."
        npm test
        if ($LASTEXITCODE -ne 0) { Write-Warning "Algunos tests fallaron, pero continuando..." }
    } else {
        Write-Info "Tests omitidos (-SkipTests especificado)"
    }
    
    Write-Success "Codigo preparado" backend to AWS Lambda

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$TablePrefix = "btg-pension",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 BTG Pactual - Backend Deployment" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Table Prefix: $TablePrefix" -ForegroundColor Yellow
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

function Write-Error {
    param([string]$Message)
    Write-Host "❌ [ERROR] $Message" -ForegroundColor Red
}

function Write-Step {
    param([string]$Step, [string]$Message)
    Write-Host "🔄 [$Step] $Message" -ForegroundColor Magenta
}

try {
    # Step 1: Verify Prerequisites
    Write-Step "1/7" "Verificando prerequisitos..."
    
    # Check if in correct directory
    if (-not (Test-Path "../backend/index-simple.js")) {
        throw "Error: No se encuentra el archivo backend/index-simple.js. Ejecute este script desde el directorio infrastructure/"
    }
    
    # Check AWS CLI
    try {
        $awsVersion = aws --version 2>$null
        if ($LASTEXITCODE -ne 0) { throw "AWS CLI no encontrado" }
        Write-Info "AWS CLI encontrado: $awsVersion"
    } catch {
        throw "AWS CLI no está instalado. Por favor instale AWS CLI y configure sus credenciales."
    }
    
    # Check AWS credentials
    try {
        $identity = aws sts get-caller-identity --output json 2>$null | ConvertFrom-Json
        if ($LASTEXITCODE -ne 0) { throw "Credenciales no válidas" }
        Write-Info "Credenciales AWS válidas para: $($identity.Arn)"
    } catch {
        throw "Credenciales AWS no configuradas. Ejecute 'aws configure'."
    }
    
    Write-Success "Prerequisitos verificados"

    # Step 2: Get Stack Information
    Write-Step "2/7" "Obteniendo información del stack..."
    
    $stackName = "btg-pension-$Environment"
    $lambdaFunctionName = "$TablePrefix-backend-$Environment"
    
    # Verify stack exists
    try {
        $stackInfo = aws cloudformation describe-stacks --stack-name $stackName --region $Region --output json 2>$null | ConvertFrom-Json
        if ($LASTEXITCODE -ne 0) { throw "Stack no encontrado" }
        Write-Info "Stack encontrado: $stackName"
    } catch {
        throw "Stack '$stackName' no existe. Ejecute primero el despliegue de infraestructura con CloudFormation."
    }
    
    Write-Success "Stack encontrado y verificado"

    # Step 3: Prepare Backend Code
    Write-Step "3/7" "Preparando código del backend..."
    
    Set-Location "../backend"
    
    # Install dependencies
    Write-Info "Instalando dependencias de Node.js..."
    npm install --production
    if ($LASTEXITCODE -ne 0) { throw "Error instalando dependencias" }
    
    # Run tests (optional)
    if (-not $SkipTests) {
        Write-Info "Ejecutando tests..."
        npm test
        if ($LASTEXITCODE -ne 0) { Write-Warning "Algunos tests fallaron, pero continuando..." }
    } else {
        Write-Info "Tests omitidos (-SkipTests especificado)"
    }
    
    Write-Success "Codigo preparado"

    # Step 4: Create Lambda-compatible package
    Write-Step "4/7" "Creando paquete Lambda..."
    
    # Create temporary directory for Lambda package
    $tempDir = "lambda-package-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    # Copy main application file
    Copy-Item "index-simple.js" "$tempDir/index.js" -Force
    
    # Create Lambda handler wrapper
    $lambdaWrapper = @"
// AWS Lambda handler wrapper for BTG Pactual Backend
const serverlessExpress = require('aws-serverless-express');

// Load the main application
const app = require('./index-simple');

// Create serverless express server
const server = serverlessExpress.createServer(app);

// Lambda handler
exports.handler = (event, context) => {
    // Set context for proper Lambda execution
    context.callbackWaitsForEmptyEventLoop = false;
    
    // Handle the event with serverless express
    return serverlessExpress.proxy(server, event, context);
};
"@
    
    $lambdaWrapper | Out-File -FilePath "$tempDir/lambda-handler.js" -Encoding UTF8
    
    # Copy package.json with Lambda-specific modifications
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $packageJson.main = "lambda-handler.js"
    $packageJson.scripts = @{
        "start" = "node lambda-handler.js"
    }
    $packageJson | ConvertTo-Json -Depth 10 | Out-File -FilePath "$tempDir/package.json" -Encoding UTF8
    
    # Copy node_modules (only production dependencies)
    Write-Info "Copiando dependencias de producción..."
    if (Test-Path "node_modules") {
        Copy-Item "node_modules" "$tempDir/" -Recurse -Force
    }
    
    # Copy .env.example as template
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" "$tempDir/" -Force
    }
    
    Write-Success "Paquete Lambda creado"

    # Step 5: Create deployment ZIP
    Write-Step "5/7" "Comprimiendo paquete de despliegue..."
    
    $zipFileName = "backend-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
    $zipPath = "../infrastructure/$zipFileName"
    
    # Create ZIP file
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    
    Write-Info "Creando archivo ZIP: $zipFileName"
    Compress-Archive -Path "$tempDir/*" -DestinationPath $zipPath -CompressionLevel Optimal
    
    # Verify ZIP was created and get size
    if (-not (Test-Path $zipPath)) { throw "Error creando archivo ZIP" }
    $zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
    Write-Info "Archivo ZIP creado: $zipSize MB"
    
    # Check Lambda size limits
    if ($zipSize -gt 50) {
        Write-Warning "El paquete ZIP es grande ($zipSize MB). Lambda tiene límites de tamaño."
    }
    
    # Cleanup temp directory
    Remove-Item $tempDir -Recurse -Force
    
    Write-Success "Paquete comprimido creado"

    # Step 6: Deploy to Lambda
    Write-Step "6/7" "Desplegando a AWS Lambda..."
    
    Set-Location "../infrastructure"
    
    Write-Info "Actualizando función Lambda: $lambdaFunctionName"
    
    $updateResult = aws lambda update-function-code `
        --function-name $lambdaFunctionName `
        --zip-file "fileb://$zipFileName" `
        --region $Region `
        --output json 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        throw "Error actualizando función Lambda"
    }
    
    $lambdaInfo = $updateResult | ConvertFrom-Json
    Write-Info "Función actualizada. Versión: $($lambdaInfo.Version)"
    Write-Info "Tamaño del código: $([math]::Round($lambdaInfo.CodeSize / 1MB, 2)) MB"
    
    # Wait for function to be updated
    Write-Info "Esperando que la función esté lista..."
    $retries = 0
    $maxRetries = 30
    
    do {
        Start-Sleep -Seconds 2
        $functionState = aws lambda get-function --function-name $lambdaFunctionName --region $Region --query 'Configuration.State' --output text 2>$null
        $retries++
        
        if ($functionState -eq "Active") {
            break
        }
        
        if ($retries -ge $maxRetries) {
            Write-Warning "Timeout esperando que la función esté activa. Estado actual: $functionState"
            break
        }
    } while ($functionState -ne "Active")
    
    Write-Success "Función Lambda desplegada"

    # Step 7: Verify Deployment
    Write-Step "7/7" "Verificando despliegue..."
    
    # Get API Gateway URL
    $apiUrl = aws cloudformation describe-stacks `
        --stack-name $stackName `
        --region $Region `
        --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' `
        --output text 2>$null
    
    if ($apiUrl -and $apiUrl -ne "None") {
        Write-Info "API Gateway URL: $apiUrl"
        
        # Test health endpoint
        try {
            Write-Info "Probando endpoint de salud..."
            $healthResponse = Invoke-RestMethod -Uri "$apiUrl/api/health" -Method GET -TimeoutSec 10
            Write-Success "Health check exitoso: $($healthResponse.message)"
        } catch {
            Write-Warning "Health check falló: $($_.Exception.Message)"
        }
    } else {
        Write-Warning "No se pudo obtener la URL del API Gateway"
    }
    
    # Cleanup deployment ZIP
    if (Test-Path $zipFileName) {
        Remove-Item $zipFileName -Force
        Write-Info "Archivo temporal eliminado"
    }
    
    Write-Success "Verificación completada"

    # Final Summary
    Write-Host ""
    Write-Host "🎉 ¡DESPLIEGUE DEL BACKEND COMPLETADO!" -ForegroundColor Green
    Write-Host "=======================================" -ForegroundColor Green
    Write-Host "Función Lambda: $lambdaFunctionName" -ForegroundColor White
    Write-Host "Región: $Region" -ForegroundColor White
    Write-Host "Environment: $Environment" -ForegroundColor White
    
    if ($apiUrl) {
        Write-Host "API URL: $apiUrl" -ForegroundColor White
        Write-Host ""
        Write-Host "🧪 Endpoints disponibles:" -ForegroundColor Cyan
        Write-Host "  • Health: $apiUrl/api/health" -ForegroundColor White
        Write-Host "  • Funds: $apiUrl/api/funds" -ForegroundColor White
        Write-Host "  • User Balance: $apiUrl/api/user/balance" -ForegroundColor White
        Write-Host "  • Notifications: $apiUrl/api/notifications/user1" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "✅ El backend está listo para recibir requests del frontend" -ForegroundColor Green

} catch {
    Write-Error "Error durante el despliegue: $($_.Exception.Message)"
    
    # Cleanup on error
    Set-Location $PSScriptRoot
    if ($tempDir -and (Test-Path "../backend/$tempDir")) {
        Remove-Item "../backend/$tempDir" -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    exit 1
}

Write-Host ""
Write-Host "🚀 Despliegue completado exitosamente" -ForegroundColor Green
