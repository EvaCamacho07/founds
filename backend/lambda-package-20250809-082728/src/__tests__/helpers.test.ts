import { formatCurrency, isPositiveNumber, isValidEmail, isValidPhone, generateTransactionId } from '../utils/helpers';

describe('Utility Helpers', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly for Colombian Peso', () => {
      expect(formatCurrency(500000)).toContain('500.000');
      expect(formatCurrency(1234567)).toContain('1.234.567');
      expect(formatCurrency(0)).toContain('0');
    });

    it('should handle decimal values correctly', () => {
      expect(formatCurrency(500000.50)).toContain('500.000');
      expect(formatCurrency(123456.789)).toContain('123.456');
    });
  });

  describe('isPositiveNumber', () => {
    it('should return true for positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(100.5)).toBe(true);
      expect(isPositiveNumber(0.1)).toBe(true);
    });

    it('should return false for zero and negative numbers', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber(-100.5)).toBe(false);
    });

    it('should return false for non-numeric values', () => {
      expect(isPositiveNumber('123')).toBe(false);
      expect(isPositiveNumber(null)).toBe(false);
      expect(isPositiveNumber(undefined)).toBe(false);
      expect(isPositiveNumber({})).toBe(false);
      expect(isPositiveNumber([])).toBe(false);
    });

    it('should return false for NaN', () => {
      expect(isPositiveNumber(NaN)).toBe(false);
      expect(isPositiveNumber(Number.NaN)).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co')).toBe(true);
      expect(isValidEmail('test+label@example.org')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should return true for valid Colombian phone numbers', () => {
      expect(isValidPhone('+57 300 123 4567')).toBe(true);
      expect(isValidPhone('+573001661010')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(isValidPhone('3001234567')).toBe(false);
      expect(isValidPhone('+1 555 123 4567')).toBe(false);
      expect(isValidPhone('+57 123')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('generateTransactionId', () => {
    it('should generate unique transaction IDs', () => {
      const id1 = generateTransactionId();
      const id2 = generateTransactionId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^TXN_/);
      expect(id2).toMatch(/^TXN_/);
    });

    it('should generate IDs with correct format', () => {
      const id = generateTransactionId();
      expect(id).toMatch(/^TXN_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });
});
