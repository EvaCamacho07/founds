import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errors';
import { validationRules } from '../config/app';
import { isPositiveNumber, isValidEmail } from './helpers';

/**
 * Validation middleware for subscription requests
 */
export const validateSubscription = (req: Request, res: Response, next: NextFunction): void => {
  const { userId, fundId, amount } = req.body;

  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new ValidationError('User ID is required and must be a non-empty string');
  }

  if (!fundId || !Number.isInteger(fundId) || fundId < validationRules.fundId.min || fundId > validationRules.fundId.max) {
    throw new ValidationError(`Fund ID must be an integer between ${validationRules.fundId.min} and ${validationRules.fundId.max}`);
  }

  if (!isPositiveNumber(amount) || amount < validationRules.amount.min || amount > validationRules.amount.max) {
    throw new ValidationError(`Amount must be between ${validationRules.amount.min} and ${validationRules.amount.max}`);
  }

  next();
};

/**
 * Validation middleware for cancellation requests
 */
export const validateCancellation = (req: Request, res: Response, next: NextFunction): void => {
  const { userId, fundId } = req.body;

  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new ValidationError('User ID is required and must be a non-empty string');
  }

  if (!fundId || !Number.isInteger(fundId) || fundId < validationRules.fundId.min || fundId > validationRules.fundId.max) {
    throw new ValidationError(`Fund ID must be an integer between ${validationRules.fundId.min} and ${validationRules.fundId.max}`);
  }

  next();
};

/**
 * Validation middleware for notification requests
 */
export const validateNotification = (req: Request, res: Response, next: NextFunction): void => {
  const { userId, type, recipient, subject, message } = req.body;

  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new ValidationError('User ID is required and must be a non-empty string');
  }

  if (!type || !['email', 'sms'].includes(type)) {
    throw new ValidationError('Notification type must be either "email" or "sms"');
  }

  if (!recipient || typeof recipient !== 'string' || recipient.trim().length === 0) {
    throw new ValidationError('Recipient is required and must be a non-empty string');
  }

  if (type === 'email' && !isValidEmail(recipient)) {
    throw new ValidationError('Invalid email format');
  }

  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    throw new ValidationError('Subject is required and must be a non-empty string');
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new ValidationError('Message is required and must be a non-empty string');
  }

  next();
};
