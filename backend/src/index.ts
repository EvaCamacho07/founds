import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { serverConfig } from './config/app';
import { apiRoutes } from './routes';
import { errorHandler } from './utils/errors';

/**
 * Create Express application
 */
const app = express();

/**
 * Security middleware
 */
app.use(helmet());

/**
 * CORS configuration
 */
app.use(cors({
  origin: serverConfig.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

/**
 * Logging middleware
 */
if (serverConfig.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

/**
 * Body parsing middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * API Routes
 */
app.use('/api', apiRoutes);

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    message: 'FPV-FIC Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      funds: '/api/funds',
      transactions: '/api/transactions',
      notifications: '/api/notifications'
    }
  });
});

/**
 * 404 handler
 */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

/**
 * Global error handler
 */
app.use(errorHandler);

/**
 * Start server
 */
if (require.main === module) {
  app.listen(serverConfig.port, serverConfig.host, () => {
    console.log(`🚀 Server running on http://${serverConfig.host}:${serverConfig.port}`);
    console.log(`📚 API Documentation available at http://${serverConfig.host}:${serverConfig.port}/api/health`);
    console.log(`🌍 Environment: ${serverConfig.nodeEnv}`);
  });
}

export { app };
