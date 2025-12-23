/**
 * Unit tests for validation utility functions
 * Run with: npm test -- validation.test.ts
 */

import {
  validateEmail,
  validatePhone,
  validatePostcode,
  validateCheckoutForm,
  validateShippingAddress,
} from '../validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('invalid@.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('should handle null/undefined', () => {
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate Vietnamese phone numbers', () => {
      expect(validatePhone('0912345678')).toBe(true);
      expect(validatePhone('0987654321')).toBe(true);
      expect(validatePhone('0123456789')).toBe(true);
      expect(validatePhone('+84912345678')).toBe(true);
      expect(validatePhone('84912345678')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('12345')).toBe(false);
      expect(validatePhone('abc1234567')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });

    it('should handle null/undefined', () => {
      expect(validatePhone(null as any)).toBe(false);
      expect(validatePhone(undefined as any)).toBe(false);
    });
  });

  describe('validatePostcode', () => {
    it('should validate Vietnamese postcodes', () => {
      expect(validatePostcode('100000')).toBe(true);
      expect(validatePostcode('700000')).toBe(true);
      expect(validatePostcode('12345')).toBe(true);
    });

    it('should reject invalid postcodes', () => {
      expect(validatePostcode('1234')).toBe(false); // Too short
      expect(validatePostcode('1234567')).toBe(false); // Too long
      expect(validatePostcode('abc123')).toBe(false); // Contains letters
      expect(validatePostcode('')).toBe(false);
    });

    it('should handle null/undefined', () => {
      expect(validatePostcode(null as any)).toBe(false);
      expect(validatePostcode(undefined as any)).toBe(false);
    });
  });

  describe('validateCheckoutForm', () => {
    it('should validate complete checkout form', () => {
      const formData = {
        firstName: 'Nguyễn',
        lastName: 'Văn A',
        email: 'test@example.com',
        phone: '0912345678',
        billingAddress1: '123 Đường ABC',
        billingCity: 'Hà Nội',
        billingPostcode: '100000',
        billingCountry: 'VN',
      };
      const result = validateCheckoutForm(formData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should detect missing required fields', () => {
      const formData = {
        firstName: '',
        lastName: 'Văn A',
        email: 'test@example.com',
        phone: '0912345678',
        billingAddress1: '123 Đường ABC',
        billingCity: 'Hà Nội',
        billingPostcode: '100000',
        billingCountry: 'VN',
      };
      const result = validateCheckoutForm(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'firstName')).toBe(true);
    });

    it('should validate email format', () => {
      const formData = {
        firstName: 'Nguyễn',
        lastName: 'Văn A',
        email: 'invalid-email',
        phone: '0912345678',
        billingAddress1: '123 Đường ABC',
        billingCity: 'Hà Nội',
        billingPostcode: '100000',
        billingCountry: 'VN',
      };
      const result = validateCheckoutForm(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'email')).toBe(true);
    });

    it('should validate phone format', () => {
      const formData = {
        firstName: 'Nguyễn',
        lastName: 'Văn A',
        email: 'test@example.com',
        phone: '12345',
        billingAddress1: '123 Đường ABC',
        billingCity: 'Hà Nội',
        billingPostcode: '100000',
        billingCountry: 'VN',
      };
      const result = validateCheckoutForm(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'phone')).toBe(true);
    });

    it('should validate postcode format', () => {
      const formData = {
        firstName: 'Nguyễn',
        lastName: 'Văn A',
        email: 'test@example.com',
        phone: '0912345678',
        billingAddress1: '123 Đường ABC',
        billingCity: 'Hà Nội',
        billingPostcode: '1234',
        billingCountry: 'VN',
      };
      const result = validateCheckoutForm(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'billingPostcode')).toBe(true);
    });
  });

  describe('validateShippingAddress', () => {
    it('should validate complete shipping address', () => {
      const address = {
        province: 'Hà Nội',
        district: 'Quận Hoàn Kiếm',
        address: '123 Đường ABC',
      };
      const result = validateShippingAddress(address);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect missing required fields', () => {
      const address = {
        province: '',
        district: 'Quận Hoàn Kiếm',
        address: '123 Đường ABC',
      };
      const result = validateShippingAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'province')).toBe(true);
    });
  });
});

