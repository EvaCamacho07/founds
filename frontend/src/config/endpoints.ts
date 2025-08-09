// Environment configuration for frontend API calls
export const config = {
  API_BASE_URL: 'https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api',
  DEFAULT_USER_ID: 'user123'
};

// API endpoints
export const endpoints = {
  // Users
  getUser: (userId: string) => `${config.API_BASE_URL}/users/${userId}`,
  
  // Funds
  getFunds: () => `${config.API_BASE_URL}/funds`,
  
  // Subscriptions
  getSubscriptions: (userId: string) => `${config.API_BASE_URL}/subscriptions/${userId}`,
  subscribe: () => `${config.API_BASE_URL}/transactions/subscribe`,
  cancel: () => `${config.API_BASE_URL}/transactions/cancel`,
  
  // Transactions
  getTransactions: (userId: string) => `${config.API_BASE_URL}/transactions/${userId}`,
  
  // Notifications
  getNotifications: (userId: string) => `${config.API_BASE_URL}/notifications/${userId}`,
  sendNotification: () => `${config.API_BASE_URL}/notifications`,
};

export default config;
