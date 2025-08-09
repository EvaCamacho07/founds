/**
 * Server configuration
 */
export const serverConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  nodeEnv: process.env.NODE_ENV || 'development',
};

/**
 * Application constants
 */
export const appConstants = {
  INITIAL_BALANCE: 500000, // COP $500,000
  MAX_TRANSACTION_AMOUNT: 10000000, // COP $10,000,000
  MIN_TRANSACTION_AMOUNT: 1000, // COP $1,000
};

/**
 * Validation rules
 */
export const validationRules = {
  userId: {
    minLength: 1,
    maxLength: 100,
  },
  amount: {
    min: appConstants.MIN_TRANSACTION_AMOUNT,
    max: appConstants.MAX_TRANSACTION_AMOUNT,
  },
  fundId: {
    min: 1,
    max: 100,
  },
};
