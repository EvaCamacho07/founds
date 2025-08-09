// API Configuration and URL mapping
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api';

// API endpoints mapping
export const API_ENDPOINTS = {
  // Health check
  health: `${API_BASE_URL}/health`,
  
  // Funds
  funds: `${API_BASE_URL}/funds`,
  
  // Users
  createUser: `${API_BASE_URL}/users`,
  getUser: (userId: string) => `${API_BASE_URL}/users/${userId}`,
  
  // Transactions
  subscribe: `${API_BASE_URL}/transactions/subscribe`,
  cancel: `${API_BASE_URL}/transactions/cancel`,
  getTransactions: (userId: string) => `${API_BASE_URL}/transactions/${userId}`,
  
  // Subscriptions
  getSubscriptions: (userId: string) => `${API_BASE_URL}/subscriptions/${userId}`,
  
  // Notifications
  sendNotification: `${API_BASE_URL}/notifications`,
  getNotifications: (userId: string) => `${API_BASE_URL}/notifications/${userId}`,
};

// Default user ID for demo purposes
export const DEFAULT_USER_ID = 'user123';

export { API_BASE_URL };
