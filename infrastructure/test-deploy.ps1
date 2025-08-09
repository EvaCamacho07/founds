# Simple test deployment script
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"

# Functions
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

try {
    Write-Host "🚀 BTG PACTUAL - TEST DESPLIEGUE" -ForegroundColor Magenta
    Write-Host "=================================" -ForegroundColor Magenta
    Write-Host "Environment: $Environment" -ForegroundColor Yellow
    Write-Host ""

    Write-Phase "TEST" "Probando funciones del script"
    
    Write-Step "1/3" "Verificando directorios..."
    
    # Check if in correct directory
    if (-not (Test-Path "cloudformation.yaml")) {
        throw "Error: No se encuentra cloudformation.yaml. Ejecute este script desde el directorio infrastructure/"
    }
    Write-Info "cloudformation.yaml encontrado"
    
    # Check required directories
    if (-not (Test-Path "../backend")) { 
        Write-Warning "Directorio backend no encontrado"
    } else {
        Write-Info "Directorio backend encontrado"
    }
    
    if (-not (Test-Path "../frontend")) { 
        Write-Warning "Directorio frontend no encontrado"
    } else {
        Write-Info "Directorio frontend encontrado"
    }
    
    Write-Step "2/3" "Verificando Node.js..."
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Info "Node.js: $nodeVersion"
        } else {
            Write-Warning "Node.js no está instalado"
        }
    } catch {
        Write-Warning "Error verificando Node.js: $($_.Exception.Message)"
    }
    
    Write-Step "3/3" "Verificando AWS CLI..."
    try {
        $awsVersion = aws --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Info "AWS CLI: $awsVersion"
        } else {
            Write-Warning "AWS CLI no está instalado"
        }
    } catch {
        Write-Warning "Error verificando AWS CLI: $($_.Exception.Message)"
    }
    
    Write-Success "Test completado exitosamente"
    
    Write-Host ""
    Write-Host "🎉 ¡TEST FINALIZADO!" -ForegroundColor Green
    Write-Host "Environment: $Environment" -ForegroundColor White
    Write-Host "Las funciones del script funcionan correctamente" -ForegroundColor White

} catch {
    Write-Host "❌ [ERROR] Error durante el test: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✨ Test finalizado con éxito" -ForegroundColor Green
