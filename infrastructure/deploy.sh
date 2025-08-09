#!/bin/bash

# Deployment script for BTG Pension Fund Management System
# This script deploys the complete infrastructure and application to AWS

set -e

# Configuration
STACK_NAME="btg-pension-funds"
ENVIRONMENT="dev"
REGION="us-east-1"
APPLICATION_NAME="btg-pension-funds"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    print_status "AWS CLI is installed"
}

# Function to check AWS credentials
check_aws_credentials() {
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    print_status "AWS credentials are configured"
}

# Function to validate CloudFormation template
validate_template() {
    print_status "Validating CloudFormation template..."
    if aws cloudformation validate-template --template-body file://cloudformation.yaml --region $REGION; then
        print_status "CloudFormation template is valid"
    else
        print_error "CloudFormation template validation failed"
        exit 1
    fi
}

# Function to deploy CloudFormation stack
deploy_infrastructure() {
    print_status "Deploying infrastructure stack..."
    
    aws cloudformation deploy \
        --template-file cloudformation.yaml \
        --stack-name "$STACK_NAME-$ENVIRONMENT" \
        --parameter-overrides \
            Environment=$ENVIRONMENT \
            ApplicationName=$APPLICATION_NAME \
        --capabilities CAPABILITY_NAMED_IAM \
        --region $REGION \
        --tags \
            Environment=$ENVIRONMENT \
            Application=$APPLICATION_NAME \
            DeployedBy="deployment-script"
    
    if [ $? -eq 0 ]; then
        print_status "Infrastructure deployed successfully"
    else
        print_error "Infrastructure deployment failed"
        exit 1
    fi
}

# Function to get stack outputs
get_stack_outputs() {
    print_status "Getting stack outputs..."
    
    # Get API Gateway URL
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME-$ENVIRONMENT" \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
        --output text)
    
    # Get S3 bucket name
    S3_BUCKET=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME-$ENVIRONMENT" \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
        --output text)
    
    # Get CloudFront domain
    CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME-$ENVIRONMENT" \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
        --output text)
    
    print_status "API Gateway URL: $API_URL"
    print_status "S3 Bucket: $S3_BUCKET"
    print_status "CloudFront Domain: $CLOUDFRONT_DOMAIN"
    
    # Export variables for use in other scripts
    export API_URL
    export S3_BUCKET
    export CLOUDFRONT_DOMAIN
}

# Function to build and deploy backend
deploy_backend() {
    print_status "Building and deploying backend..."
    
    cd ../backend
    
    # Install dependencies
    npm install
    
    # Run tests
    npm test
    
    # Build the application
    npm run build
    
    # Create deployment package
    print_status "Creating deployment package..."
    zip -r ../infrastructure/backend-deployment.zip dist/ node_modules/ package.json
    
    cd ../infrastructure
    
    # Update Lambda function
    LAMBDA_FUNCTION_NAME=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME-$ENVIRONMENT" \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' \
        --output text)
    
    aws lambda update-function-code \
        --function-name $LAMBDA_FUNCTION_NAME \
        --zip-file fileb://backend-deployment.zip \
        --region $REGION
    
    print_status "Backend deployed successfully"
}

# Function to build and deploy frontend
deploy_frontend() {
    print_status "Building and deploying frontend..."
    
    cd ../frontend
    
    # Install dependencies
    npm install
    
    # Set environment variable for API URL
    echo "REACT_APP_API_URL=$API_URL" > .env
    
    # Build the application
    npm run build
    
    # Deploy to S3
    aws s3 sync build/ s3://$S3_BUCKET/ --delete --region $REGION
    
    # Invalidate CloudFront cache
    CLOUDFRONT_ID=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME-$ENVIRONMENT" \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
        --output text)
    
    aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_ID \
        --paths "/*" \
        --region $REGION
    
    print_status "Frontend deployed successfully"
    
    cd ../infrastructure
}

# Function to display deployment summary
deployment_summary() {
    print_status "=== DEPLOYMENT SUMMARY ==="
    print_status "Environment: $ENVIRONMENT"
    print_status "Region: $REGION"
    print_status "Stack Name: $STACK_NAME-$ENVIRONMENT"
    print_status "API URL: $API_URL"
    print_status "Frontend URL: https://$CLOUDFRONT_DOMAIN"
    print_status "=========================="
}

# Main deployment flow
main() {
    print_status "Starting deployment of BTG Pension Fund Management System"
    
    # Pre-flight checks
    check_aws_cli
    check_aws_credentials
    validate_template
    
    # Deploy infrastructure
    deploy_infrastructure
    
    # Get outputs from stack
    get_stack_outputs
    
    # Deploy backend
    deploy_backend
    
    # Deploy frontend
    deploy_frontend
    
    # Show summary
    deployment_summary
    
    print_status "Deployment completed successfully!"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment|-e)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --region|-r)
            REGION="$2"
            shift 2
            ;;
        --stack-name|-s)
            STACK_NAME="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -e, --environment   Environment name (default: dev)"
            echo "  -r, --region        AWS region (default: us-east-1)"
            echo "  -s, --stack-name    CloudFormation stack name (default: btg-pension-funds)"
            echo "  -h, --help          Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main
