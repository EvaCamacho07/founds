/**
 * Utility functions for the pension fund management application
 */

/**
 * Format currency in Colombian Pesos
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date for Colombian locale
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format date for display (short format)
 */
export const formatDateShort = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-CO', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Validate fund subscription amount
 */
export const validateFundAmount = (amount: number, minAmount: number, maxBalance: number): string | null => {
  if (amount < minAmount) {
    return `El monto mínimo para este fondo es ${formatCurrency(minAmount)}`;
  }
  
  if (amount > maxBalance) {
    return `No tiene suficiente saldo disponible. Saldo actual: ${formatCurrency(maxBalance)}`;
  }
  
  if (amount <= 0) {
    return 'El monto debe ser mayor a cero';
  }
  
  return null; // No validation error
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Colombian phone number format
 */
export const validatePhoneNumber = (phone: string): boolean => {
  // Colombian phone number format: +57 followed by 10 digits
  const phoneRegex = /^(\+57)?[3][0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Generate a random transaction ID
 */
export const generateTransactionId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `txn_${timestamp}_${randomStr}`;
};

/**
 * Calculate time ago from a date
 */
export const timeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Hace un momento';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  }
  
  return formatDate(dateString);
};

/**
 * Constants for the application
 */
export const CONSTANTS = {
  // Minimum initial balance as per requirements
  INITIAL_BALANCE: 500000,
  
  // Fund categories
  FUND_CATEGORIES: {
    CONSERVATIVE: 'Conservador',
    MODERATE: 'Moderado',
    AGGRESSIVE: 'Agresivo'
  },
  
  // Transaction types
  TRANSACTION_TYPES: {
    SUBSCRIPTION: 'subscription',
    CANCELLATION: 'cancellation'
  },
  
  // Notification types
  NOTIFICATION_TYPES: {
    EMAIL: 'email',
    SMS: 'sms'
  },
  
  // Status types
  STATUS_TYPES: {
    COMPLETED: 'completed',
    PENDING: 'pending',
    FAILED: 'failed',
    SENT: 'sent'
  }
};

/**
 * Get fund category color for Material-UI components
 */
export const getFundCategoryColor = (category: string): 'success' | 'warning' | 'error' | 'default' => {
  switch (category) {
    case CONSTANTS.FUND_CATEGORIES.CONSERVATIVE:
      return 'success';
    case CONSTANTS.FUND_CATEGORIES.MODERATE:
      return 'warning';
    case CONSTANTS.FUND_CATEGORIES.AGGRESSIVE:
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Get status color for Material-UI components
 */
export const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case CONSTANTS.STATUS_TYPES.COMPLETED:
    case CONSTANTS.STATUS_TYPES.SENT:
      return 'success';
    case CONSTANTS.STATUS_TYPES.PENDING:
      return 'warning';
    case CONSTANTS.STATUS_TYPES.FAILED:
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Local storage helpers
 */
export const storage = {
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};
