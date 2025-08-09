// AWS Lambda handler wrapper for BTG Pactual Backend
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'BTG Pactual Backend is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'BTG Pactual API Gateway',
        timestamp: new Date().toISOString()
    });
});

// Export for Lambda
if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const awsServerlessExpress = require('aws-serverless-express');
    const server = awsServerlessExpress.createServer(app);
    
    exports.handler = (event, context) => {
        context.callbackWaitsForEmptyEventLoop = false;
        return awsServerlessExpress.proxy(server, event, context);
    };
} else {
    // Local development
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
