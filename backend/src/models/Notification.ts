/**
 * Notification types supported by the system
 */
export type NotificationType = 'email' | 'sms';

/**
 * Notification status
 */
export type NotificationStatus = 'pending' | 'sent' | 'failed';

/**
 * Represents a notification in the system
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  recipient: string; // email address or phone number
  subject: string;
  message: string;
  status: NotificationStatus;
  createdAt: Date;
  sentAt?: Date;
  errorMessage?: string;
}

/**
 * Request payload for sending notifications
 */
export interface NotificationRequest {
  userId: string;
  type: NotificationType;
  recipient: string;
  subject: string;
  message: string;
}

/**
 * Response for notification operations
 */
export interface NotificationResponse {
  success: boolean;
  notification?: Notification;
  message: string;
}
