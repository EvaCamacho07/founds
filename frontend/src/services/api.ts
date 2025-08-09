import axios from 'axios';

// Configure axios defaults
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens if needed
api.interceptors.request.use(
  (config) => {
    // Add auth token here if implementing authentication
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Fund API calls
export const fundAPI = {
  // Get all available funds
  getFunds: () => api.get('/funds'),
  
  // Subscribe to a fund
  subscribe: (userId: string, fundId: string, amount: number) =>
    api.post('/funds/subscribe', { userId, fundId, amount }),
  
  // Unsubscribe from a fund
  unsubscribe: (userId: string, fundId: string, amount: number) =>
    api.post('/funds/unsubscribe', { userId, fundId, amount }),
};

// Transaction API calls
export const transactionAPI = {
  // Get user transaction history
  getTransactions: (userId: string) => api.get(`/transactions/${userId}`),
  
  // Get specific transaction details
  getTransaction: (transactionId: string) => api.get(`/transactions/detail/${transactionId}`),
};

// Notification API calls
export const notificationAPI = {
  // Get user notifications
  getNotifications: (userId: string) => api.get(`/notifications/${userId}`),
  
  // Mark notification as read
  markAsRead: (notificationId: string) => api.patch(`/notifications/${notificationId}/read`),
  
  // Mark all notifications as read
  markAllAsRead: (userId: string) => api.patch(`/notifications/${userId}/mark-all-read`),
  
  // Send notification (admin function)
  sendNotification: (userId: string, type: 'email' | 'sms', message: string) =>
    api.post('/notifications/send', { userId, type, message }),
};

// User API calls
export const userAPI = {
  // Get user profile and balance
  getUser: (userId: string) => api.get(`/users/${userId}`),
  
  // Update user balance (for demo purposes)
  updateBalance: (userId: string, balance: number) =>
    api.patch(`/users/${userId}/balance`, { balance }),
};

// Health check
export const healthAPI = {
  // Check if backend is running
  health: () => api.get('/health'),
};

export default api;
