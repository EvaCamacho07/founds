/**
 * TypeScript type definitions for the pension fund management system
 */

// User related types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  balance: number;
  createdAt: string;
  updatedAt?: string;
}

// Fund related types
export interface Fund {
  id: string;
  name: string;
  category: 'Conservador' | 'Moderado' | 'Agresivo';
  minAmount: number;
  description?: string;
  riskLevel?: number;
  expectedReturn?: number;
  createdAt?: string;
}

// Transaction related types
export interface Transaction {
  id: string;
  userId: string;
  fundId: string;
  fundName: string;
  type: 'subscription' | 'cancellation';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  processedAt?: string;
  errorMessage?: string;
}

// Notification related types
export interface Notification {
  id: string;
  userId: string;
  type: 'email' | 'sms';
  title: string;
  message: string;
  status: 'sent' | 'failed';
  category: 'transaction' | 'fund' | 'system' | 'promotion';
  read: boolean;
  createdAt: string;
  sentAt?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Fund subscription/cancellation request types
export interface FundSubscriptionRequest {
  userId: string;
  fundId: string;
  amount: number;
}

export interface FundCancellationRequest {
  userId: string;
  fundId: string;
  amount: number;
}

// Notification request types
export interface NotificationRequest {
  userId: string;
  type: 'email' | 'sms';
  message: string;
  title?: string;
  category?: 'transaction' | 'fund' | 'system' | 'promotion';
}

// Component prop types
export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export interface FundCardProps {
  fund: Fund;
  onSubscribe: (fund: Fund) => void;
}

export interface TransactionRowProps {
  transaction: Transaction;
  onView: (transaction: Transaction) => void;
  onCancel?: (transaction: Transaction) => void;
}

export interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (notificationId: string) => void;
  onView: (notification: Notification) => void;
}

// Dialog state types
export interface SubscriptionDialogState {
  open: boolean;
  fund: Fund | null;
  amount: string;
}

export interface CancelDialogState {
  open: boolean;
  transaction: Transaction | null;
}

export interface NotificationDialogState {
  open: boolean;
  notification: Notification | null;
}

// Snackbar state types
export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

// Form validation types
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface SubscriptionFormData {
  fundId: string;
  amount: number;
}

// Theme and styling types
export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

// Local storage types
export interface LocalStorageData {
  user?: User;
  preferences?: UserPreferences;
  lastActivity?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'es' | 'en';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

// Filter and search types
export interface TransactionFilters {
  type?: 'subscription' | 'cancellation' | 'all';
  status?: 'completed' | 'pending' | 'failed' | 'all';
  dateFrom?: string;
  dateTo?: string;
  fundId?: string;
}

export interface NotificationFilters {
  type?: 'email' | 'sms' | 'all';
  category?: 'transaction' | 'fund' | 'system' | 'promotion' | 'all';
  read?: boolean;
}

// Dashboard statistics types
export interface DashboardStats {
  totalBalance: number;
  totalInvestments: number;
  activeSubscriptions: number;
  totalReturns: number;
  monthlyGrowth: number;
}

// Fund performance types
export interface FundPerformance {
  fundId: string;
  fundName: string;
  currentValue: number;
  initialInvestment: number;
  returns: number;
  returnsPercentage: number;
  lastUpdated: string;
}

// Application state types
export interface AppState {
  user: User | null;
  funds: Fund[];
  transactions: Transaction[];
  notifications: Notification[];
  loading: {
    funds: boolean;
    transactions: boolean;
    notifications: boolean;
    user: boolean;
  };
  errors: {
    funds: string | null;
    transactions: string | null;
    notifications: string | null;
    user: string | null;
  };
}

// Hook return types
export interface UseFundsReturn {
  funds: Fund[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  subscribe: (fundId: string, amount: number) => Promise<void>;
  unsubscribe: (fundId: string, amount: number) => Promise<void>;
}

export interface UseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

// Constants types
export interface AppConstants {
  INITIAL_BALANCE: number;
  FUND_CATEGORIES: {
    CONSERVATIVE: string;
    MODERATE: string;
    AGGRESSIVE: string;
  };
  TRANSACTION_TYPES: {
    SUBSCRIPTION: string;
    CANCELLATION: string;
  };
  NOTIFICATION_TYPES: {
    EMAIL: string;
    SMS: string;
  };
  STATUS_TYPES: {
    COMPLETED: string;
    PENDING: string;
    FAILED: string;
    SENT: string;
  };
}
