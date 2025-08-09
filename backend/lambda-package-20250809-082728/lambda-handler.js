// AWS Lambda handler wrapper for BTG Pactual Backend
const serverlessExpress = require('aws-serverless-express');

// Load the main application
const app = require('./index');

// Create serverless express server
const server = serverlessExpress.createServer(app);

// Lambda handler
exports.handler = (event, context) => {
    // Set context for proper Lambda execution
    context.callbackWaitsForEmptyEventLoop = false;
    
    // Handle the event with serverless express
    return serverlessExpress.proxy(server, event, context);
};
