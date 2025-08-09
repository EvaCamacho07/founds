# PowerShell deployment script for BTG Pension Fund Management System
# This script deploys the complete infrastructure and application to AWS

param(
    [string]$Environment = "dev",
    [string]$Region = "us-east-1",
    [string]$StackName = "btg-pension-funds",
    [string]$ApplicationName = "btg-pension-funds",
    [switch]$Help
)

# Show help if requested
if ($Help) {
    Write-Host "Usage: .\deploy.ps1 [OPTIONS]" -ForegroundColor Green
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Environment    Environment name (default: dev)" -ForegroundColor White
    Write-Host "  -Region         AWS region (default: us-east-1)" -ForegroundColor White
    Write-Host "  -StackName      CloudFormation stack name (default: btg-pension-funds)" -ForegroundColor White
    Write-Host "  -Help           Show this help message" -ForegroundColor White
    exit 0
}

# Function to write colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if AWS CLI is installed
function Test-AwsCli {
    try {
        aws --version | Out-Null
        Write-Status "AWS CLI is installed"
        return $true
    }
    catch {
        Write-Error "AWS CLI is not installed. Please install it first."
        return $false
    }
}

# Function to check AWS credentials
function Test-AwsCredentials {
    try {
        aws sts get-caller-identity | Out-Null
        Write-Status "AWS credentials are configured"
        return $true
    }
    catch {
        Write-Error "AWS credentials not configured. Please run 'aws configure' first."
        return $false
    }
}

# Function to validate CloudFormation template
function Test-CloudFormationTemplate {
    Write-Status "Validating CloudFormation template..."
    try {
        aws cloudformation validate-template --template-body file://cloudformation.yaml --region $Region | Out-Null
        Write-Status "CloudFormation template is valid"
        return $true
    }
    catch {
        Write-Error "CloudFormation template validation failed"
        return $false
    }
}

# Function to deploy CloudFormation stack
function Deploy-Infrastructure {
    Write-Status "Deploying infrastructure stack..."
    
    try {
        aws cloudformation deploy `
            --template-file cloudformation.yaml `
            --stack-name "$StackName-$Environment" `
            --parameter-overrides Environment=$Environment ApplicationName=$ApplicationName `
            --capabilities CAPABILITY_NAMED_IAM `
            --region $Region `
            --tags Environment=$Environment Application=$ApplicationName DeployedBy="powershell-script"
        
        Write-Status "Infrastructure deployed successfully"
        return $true
    }
    catch {
        Write-Error "Infrastructure deployment failed"
        return $false
    }
}

# Function to get stack outputs
function Get-StackOutputs {
    Write-Status "Getting stack outputs..."
    
    # Get API Gateway URL
    $script:ApiUrl = aws cloudformation describe-stacks `
        --stack-name "$StackName-$Environment" `
        --region $Region `
        --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' `
        --output text
    
    # Get S3 bucket name
    $script:S3Bucket = aws cloudformation describe-stacks `
        --stack-name "$StackName-$Environment" `
        --region $Region `
        --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' `
        --output text
    
    # Get CloudFront domain
    $script:CloudFrontDomain = aws cloudformation describe-stacks `
        --stack-name "$StackName-$Environment" `
        --region $Region `
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' `
        --output text
    
    Write-Status "API Gateway URL: $ApiUrl"
    Write-Status "S3 Bucket: $S3Bucket"
    Write-Status "CloudFront Domain: $CloudFrontDomain"
}

# Function to build and deploy backend
function Deploy-Backend {
    Write-Status "Building and deploying backend..."
    
    Set-Location "../backend"
    
    # Install dependencies
    npm install
    
    # Run tests
    npm test
    
    # Build the application
    npm run build
    
    # Create deployment package
    Write-Status "Creating deployment package..."
    Compress-Archive -Path "dist/*", "node_modules", "package.json" -DestinationPath "../infrastructure/backend-deployment.zip" -Force
    
    Set-Location "../infrastructure"
    
    # Update Lambda function
    $LambdaFunctionName = aws cloudformation describe-stacks `
        --stack-name "$StackName-$Environment" `
        --region $Region `
        --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' `
        --output text
    
    aws lambda update-function-code `
        --function-name $LambdaFunctionName `
        --zip-file "fileb://backend-deployment.zip" `
        --region $Region
    
    Write-Status "Backend deployed successfully"
}

# Function to build and deploy frontend
function Deploy-Frontend {
    Write-Status "Building and deploying frontend..."
    
    Set-Location "../frontend"
    
    # Install dependencies
    npm install
    
    # Set environment variable for API URL
    "REACT_APP_API_URL=$ApiUrl" | Out-File -FilePath ".env" -Encoding UTF8
    
    # Build the application
    npm run build
    
    # Deploy to S3
    aws s3 sync build/ "s3://$S3Bucket/" --delete --region $Region
    
    # Invalidate CloudFront cache
    $CloudFrontId = aws cloudformation describe-stacks `
        --stack-name "$StackName-$Environment" `
        --region $Region `
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' `
        --output text
    
    aws cloudfront create-invalidation `
        --distribution-id $CloudFrontId `
        --paths "/*" `
        --region $Region
    
    Write-Status "Frontend deployed successfully"
    
    Set-Location "../infrastructure"
}

# Function to display deployment summary
function Show-DeploymentSummary {
    Write-Host "`n=== DEPLOYMENT SUMMARY ===" -ForegroundColor Cyan
    Write-Host "Environment: $Environment" -ForegroundColor White
    Write-Host "Region: $Region" -ForegroundColor White
    Write-Host "Stack Name: $StackName-$Environment" -ForegroundColor White
    Write-Host "API URL: $ApiUrl" -ForegroundColor White
    Write-Host "Frontend URL: https://$CloudFrontDomain" -ForegroundColor White
    Write-Host "==========================" -ForegroundColor Cyan
}

# Main deployment flow
function Main {
    Write-Status "Starting deployment of BTG Pension Fund Management System"
    
    # Pre-flight checks
    if (-not (Test-AwsCli)) { exit 1 }
    if (-not (Test-AwsCredentials)) { exit 1 }
    if (-not (Test-CloudFormationTemplate)) { exit 1 }
    
    # Deploy infrastructure
    if (-not (Deploy-Infrastructure)) { exit 1 }
    
    # Get outputs from stack
    Get-StackOutputs
    
    # Deploy backend
    Deploy-Backend
    
    # Deploy frontend
    Deploy-Frontend
    
    # Show summary
    Show-DeploymentSummary
    
    Write-Status "Deployment completed successfully!"
}

# Set error action preference
$ErrorActionPreference = "Stop"

# Run main function
try {
    Main
}
catch {
    Write-Error "Deployment failed: $_"
    exit 1
}
