# BTG Pactual - Script de despliegue simplificado para DynamoDB
# Este script despliega solo las tablas DynamoDB necesarias

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$TablePrefix = "btg-pension",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

Write-Host "🚀 BTG Pactual - Despliegue de Infraestructura" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow  
Write-Host "Table Prefix: $TablePrefix" -ForegroundColor Yellow
Write-Host ""

# Verificar AWS CLI
try {
    $awsVersion = aws --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "AWS CLI no encontrado"
    }
    Write-Host "✅ AWS CLI encontrado: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: AWS CLI no está instalado o configurado" -ForegroundColor Red
    Write-Host "   Por favor instala AWS CLI y ejecuta 'aws configure'" -ForegroundColor Red
    exit 1
}

# Verificar credenciales AWS
try {
    $identity = aws sts get-caller-identity --output json 2>$null | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0) {
        throw "Credenciales AWS no válidas"
    }
    Write-Host "✅ Credenciales AWS válidas para: $($identity.Arn)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Credenciales AWS no configuradas" -ForegroundColor Red
    Write-Host "   Ejecuta 'aws configure' para configurar tus credenciales" -ForegroundColor Red
    exit 1
}

# Nombre del stack
$stackName = "btg-pension-$Environment"

# Parámetros para CloudFormation
$parameters = @(
    "Environment=$Environment",
    "TablePrefix=$TablePrefix"
)

Write-Host "📋 Parámetros de despliegue:" -ForegroundColor Cyan
$parameters | ForEach-Object { Write-Host "   $($_)" -ForegroundColor White }
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 MODO DRY RUN - Solo mostrando lo que se haría:" -ForegroundColor Yellow
    Write-Host "aws cloudformation deploy \"
    Write-Host "  --template-file infrastructure/cloudformation.yaml \"
    Write-Host "  --stack-name $stackName \"
    Write-Host "  --capabilities CAPABILITY_NAMED_IAM \"
    Write-Host "  --region $Region \"
    Write-Host "  --parameter-overrides $($parameters -join ' ')"
    exit 0
}

Write-Host "🚀 Desplegando stack: $stackName" -ForegroundColor Green

try {
    # Ejecutar despliegue
    aws cloudformation deploy `
        --template-file infrastructure/cloudformation.yaml `
        --stack-name $stackName `
        --capabilities CAPABILITY_NAMED_IAM `
        --region $Region `
        --parameter-overrides $parameters

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Despliegue completado exitosamente!" -ForegroundColor Green
        Write-Host ""
        
        # Obtener outputs del stack
        Write-Host "📊 Información del stack desplegado:" -ForegroundColor Cyan
        $outputs = aws cloudformation describe-stacks --stack-name $stackName --region $Region --query 'Stacks[0].Outputs' --output table
        Write-Host $outputs
        
        Write-Host ""
        Write-Host "🔧 Configuración para tu .env:" -ForegroundColor Yellow
        Write-Host "DYNAMODB_TABLE_PREFIX=$TablePrefix" -ForegroundColor White
        Write-Host "AWS_REGION=$Region" -ForegroundColor White
        Write-Host ""
        Write-Host "📚 Tablas creadas:" -ForegroundColor Cyan
        Write-Host "  • $TablePrefix-users" -ForegroundColor White
        Write-Host "  • $TablePrefix-subscriptions" -ForegroundColor White  
        Write-Host "  • $TablePrefix-notifications" -ForegroundColor White
        
    } else {
        throw "Error en el despliegue de CloudFormation"
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Error durante el despliegue:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Consejos para solucionar problemas:" -ForegroundColor Yellow
    Write-Host "  • Verifica que tienes permisos para crear recursos DynamoDB" -ForegroundColor White
    Write-Host "  • Revisa que la región $Region es correcta" -ForegroundColor White
    Write-Host "  • Asegúrate de que no exista ya un stack con el nombre $stackName" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🎉 ¡Infraestructura lista para BTG Pactual!" -ForegroundColor Green
Write-Host "Ahora puedes ejecutar tu backend con: node backend/index-simple.js" -ForegroundColor Yellow
