import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique transaction ID
 */
export const generateTransactionId = (): string => {
  return `TXN_${uuidv4()}`;
};

/**
 * Generates a unique user ID
 */
export const generateUserId = (): string => {
  return `USER_${uuidv4()}`;
};

/**
 * Generates a unique notification ID
 */
export const generateNotificationId = (): string => {
  return `NOTIF_${uuidv4()}`;
};

/**
 * Formats currency amount to Colombian Peso format
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Validates if a value is a positive number
 */
export const isPositiveNumber = (value: any): boolean => {
  return typeof value === 'number' && value > 0 && !isNaN(value);
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format (Colombian format)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+57\s?[0-9]{3}\s?[0-9]{3}\s?[0-9]{4}$/;
  return phoneRegex.test(phone);
};

/**
 * Creates a delay for testing purposes
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Safely parses JSON string
 */
export const safeJsonParse = (jsonString: string, defaultValue: any = null): any => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
};
