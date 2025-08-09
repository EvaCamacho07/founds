// BTG Pactual Backend - Lambda Handler
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'BTG Pactual Backend is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.get('/', (req, res) => {
    res.json({
        service: 'BTG Pactual API',
        status: 'active',
        timestamp: new Date().toISOString()
    });
});

const serverlessExpress = require('aws-serverless-express');
const server = serverlessExpress.createServer(app);

exports.handler = (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    return serverlessExpress.proxy(server, event, context);
};
