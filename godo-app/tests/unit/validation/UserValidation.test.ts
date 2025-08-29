/**
 * @fileoverview Unit tests for User Data Validation and Sanitization
 * @author Testing Team
 * @testtype Unit
 * @description Tests for user data validation, sanitization, and security measures
 */

import { jest } from '@jest/globals';
import { 
  createMockUserCreate, 
  createMockUserUpdate,
  invalidUserData 
} from '../../mocks/userMocks';

// User validation utilities
class UserValidator {
  // Email validation
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }

    if (typeof email !== 'string') {
      return { isValid: false, error: 'Email must be a string' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    if (email.length > 254) {
      return { isValid: false, error: 'Email too long' };
    }

    return { isValid: true };
  }

  // Password validation
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    if (typeof password !== 'string') {
      errors.push('Password must be a string');
      return { isValid: false, errors };
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one digit');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak patterns
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain repeated characters');
    }

    const commonPasswords = [
      'password', '12345678', 'qwerty', 'abc123', 'password123'
    ];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('Password cannot contain common patterns');
    }

    return { isValid: errors.length === 0, errors };
  }

  // Age validation
  static validateAge(age: number): { isValid: boolean; error?: string } {
    if (age === undefined || age === null) {
      return { isValid: true }; // Age is optional
    }

    if (typeof age !== 'number' || isNaN(age)) {
      return { isValid: false, error: 'Age must be a number' };
    }

    if (!Number.isInteger(age)) {
      return { isValid: false, error: 'Age must be a whole number' };
    }

    if (age < 18) {
      return { isValid: false, error: 'Must be at least 18 years old' };
    }

    if (age > 50) {
      return { isValid: false, error: 'Age cannot exceed 50' };
    }

    return { isValid: true };
  }

  // Name validation
  static validateName(name: string): { isValid: boolean; error?: string } {
    if (name === undefined || name === null) {
      return { isValid: true }; // Name is optional in updates
    }

    if (typeof name !== 'string') {
      return { isValid: false, error: 'Name must be a string' };
    }

    if (name.trim().length === 0) {
      return { isValid: false, error: 'Name cannot be empty' };
    }

    if (name.length > 255) {
      return { isValid: false, error: 'Name must be less than 255 characters' };
    }

    // Check for invalid characters
    if (!/^[a-zA-Z\s\-'\.]+$/.test(name)) {
      return { isValid: false, error: 'Name contains invalid characters' };
    }

    // Check for excessive special characters
    const specialCharCount = (name.match(/[\-'\.]/g) || []).length;
    if (specialCharCount > name.length * 0.3) {
      return { isValid: false, error: 'Name contains too many special characters' };
    }

    return { isValid: true };
  }

  // Phone number validation
  static validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
    if (!phone) {
      return { isValid: true }; // Phone is optional
    }

    if (typeof phone !== 'string') {
      return { isValid: false, error: 'Phone number must be a string' };
    }

    // US phone number format
    const phoneRegex = /^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');

    if (!phoneRegex.test(cleanPhone)) {
      return { isValid: false, error: 'Invalid phone number format' };
    }

    return { isValid: true };
  }

  // Privacy level validation
  static validatePrivacyLevel(level: string): { isValid: boolean; error?: string } {
    if (!level) {
      return { isValid: false, error: 'Privacy level is required' };
    }

    const validLevels = ['PRIVATE', 'FRIENDS_ONLY', 'PUBLIC'];
    if (!validLevels.includes(level)) {
      return { isValid: false, error: 'Invalid privacy level' };
    }

    return { isValid: true };
  }

  // Neighborhood validation
  static validateNeighborhood(neighborhood: string): { isValid: boolean; error?: string } {
    if (!neighborhood) {
      return { isValid: true }; // Optional field
    }

    if (typeof neighborhood !== 'string') {
      return { isValid: false, error: 'Neighborhood must be a string' };
    }

    if (neighborhood.length > 100) {
      return { isValid: false, error: 'Neighborhood name too long' };
    }

    // Basic sanitization check
    if (/<[^>]*>/g.test(neighborhood)) {
      return { isValid: false, error: 'Neighborhood cannot contain HTML tags' };
    }

    return { isValid: true };
  }

  // Comprehensive user creation validation
  static validateUserCreate(userData: any): { isValid: boolean; errors: Record<string, string[]> } {
    const errors: Record<string, string[]> = {};

    // Email validation
    const emailResult = this.validateEmail(userData.email);
    if (!emailResult.isValid) {
      errors.email = [emailResult.error!];
    }

    // Password validation
    const passwordResult = this.validatePassword(userData.password);
    if (!passwordResult.isValid) {
      errors.password = passwordResult.errors;
    }

    // Name validation
    const nameResult = this.validateName(userData.full_name);
    if (!nameResult.isValid) {
      errors.full_name = [nameResult.error!];
    }

    // Age validation
    const ageResult = this.validateAge(userData.age);
    if (!ageResult.isValid) {
      errors.age = [ageResult.error!];
    }

    // Phone validation
    const phoneResult = this.validatePhoneNumber(userData.phone_number);
    if (!phoneResult.isValid) {
      errors.phone_number = [phoneResult.error!];
    }

    // Privacy level validation
    const privacyResult = this.validatePrivacyLevel(userData.privacy_level);
    if (!privacyResult.isValid) {
      errors.privacy_level = [privacyResult.error!];
    }

    // Neighborhood validation
    const neighborhoodResult = this.validateNeighborhood(userData.location_neighborhood);
    if (!neighborhoodResult.isValid) {
      errors.location_neighborhood = [neighborhoodResult.error!];
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // User update validation (more lenient, fields are optional)
  static validateUserUpdate(userData: any): { isValid: boolean; errors: Record<string, string[]> } {
    const errors: Record<string, string[]> = {};

    // Only validate fields that are present
    if (userData.full_name !== undefined) {
      const nameResult = this.validateName(userData.full_name);
      if (!nameResult.isValid) {
        errors.full_name = [nameResult.error!];
      }
    }

    if (userData.age !== undefined) {
      const ageResult = this.validateAge(userData.age);
      if (!ageResult.isValid) {
        errors.age = [ageResult.error!];
      }
    }

    if (userData.location_neighborhood !== undefined) {
      const neighborhoodResult = this.validateNeighborhood(userData.location_neighborhood);
      if (!neighborhoodResult.isValid) {
        errors.location_neighborhood = [neighborhoodResult.error!];
      }
    }

    if (userData.privacy_level !== undefined) {
      const privacyResult = this.validatePrivacyLevel(userData.privacy_level);
      if (!privacyResult.isValid) {
        errors.privacy_level = [privacyResult.error!];
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

// Data sanitization utilities
class UserSanitizer {
  // Sanitize string input
  static sanitizeString(input: string, maxLength?: number): string {
    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input
      .trim()
      .replace(/\0/g, '') // Remove null bytes
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[^\x20-\x7E\u00A0-\u017F\u0100-\u024F]/g, ''); // Keep printable ASCII and Latin extended

    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  // Sanitize email
  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') {
      return '';
    }

    return email
      .trim()
      .toLowerCase()
      .replace(/[^\w@\.\-]/g, '');
  }

  // Sanitize phone number
  static sanitizePhoneNumber(phone: string): string {
    if (typeof phone !== 'string') {
      return '';
    }

    // Keep only digits and + sign
    return phone.replace(/[^\d\+]/g, '');
  }

  // Sanitize user creation data
  static sanitizeUserCreate(userData: any): any {
    return {
      email: this.sanitizeEmail(userData.email || ''),
      password: userData.password || '', // Don't sanitize password
      full_name: this.sanitizeString(userData.full_name || '', 255),
      age: typeof userData.age === 'number' ? userData.age : undefined,
      location_neighborhood: this.sanitizeString(userData.location_neighborhood || '', 100),
      privacy_level: userData.privacy_level || 'PRIVATE',
      phone_number: this.sanitizePhoneNumber(userData.phone_number || ''),
    };
  }

  // Sanitize user update data
  static sanitizeUserUpdate(userData: any): any {
    const sanitized: any = {};

    if (userData.full_name !== undefined) {
      sanitized.full_name = this.sanitizeString(userData.full_name, 255);
    }

    if (userData.location_neighborhood !== undefined) {
      sanitized.location_neighborhood = this.sanitizeString(userData.location_neighborhood, 100);
    }

    if (userData.age !== undefined) {
      sanitized.age = typeof userData.age === 'number' ? userData.age : undefined;
    }

    if (userData.privacy_level !== undefined) {
      sanitized.privacy_level = userData.privacy_level;
    }

    if (userData.preferences !== undefined) {
      sanitized.preferences = userData.preferences;
    }

    if (userData.profile_image_url !== undefined) {
      sanitized.profile_image_url = this.sanitizeString(userData.profile_image_url, 500);
    }

    return sanitized;
  }
}

describe('UserValidator', () => {
  describe('Email Validation', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'a@b.co',
      ];

      validEmails.forEach(email => {
        const result = UserValidator.validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        'not-an-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        'user@example',
        'a'.repeat(250) + '@example.com', // Too long
      ];

      invalidEmails.forEach(email => {
        const result = UserValidator.validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should require email to be provided', () => {
      const result = UserValidator.validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject non-string email values', () => {
      const result = UserValidator.validateEmail(123 as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email must be a string');
    });
  });

  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'Password123!',
        'MySecure@Pass1',
        'C0mpl3x&Strong',
        'Valid123#Password',
      ];

      strongPasswords.forEach(password => {
        const result = UserValidator.validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        { pwd: '', expectedErrors: ['Password is required'] },
        { pwd: '123', expectedErrors: ['Password must be at least 8 characters long'] },
        { pwd: 'password', expectedErrors: expect.arrayContaining(['Password must contain at least one uppercase letter', 'Password must contain at least one digit']) },
        { pwd: 'PASSWORD123', expectedErrors: ['Password must contain at least one lowercase letter'] },
        { pwd: 'Password', expectedErrors: expect.arrayContaining(['Password must contain at least one digit', 'Password must contain at least one special character']) },
        { pwd: 'aaaaaaa1A!', expectedErrors: ['Password cannot contain repeated characters'] },
      ];

      weakPasswords.forEach(({ pwd, expectedErrors }) => {
        const result = UserValidator.validatePassword(pwd);
        expect(result.isValid).toBe(false);
        if (Array.isArray(expectedErrors)) {
          expectedErrors.forEach(error => {
            expect(result.errors).toContain(error);
          });
        } else {
          expect(result.errors).toEqual(expect.arrayContaining(expectedErrors));
        }
      });
    });

    it('should reject common passwords', () => {
      const commonPasswords = ['Password123!', 'Qwerty123!', 'Abc123!@#'];
      
      commonPasswords.forEach(password => {
        const result = UserValidator.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password cannot contain common patterns');
      });
    });

    it('should enforce password length limits', () => {
      const tooLong = 'A'.repeat(130) + '1!';
      const result = UserValidator.validatePassword(tooLong);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be less than 128 characters');
    });
  });

  describe('Age Validation', () => {
    it('should validate valid ages', () => {
      const validAges = [18, 25, 35, 50];
      
      validAges.forEach(age => {
        const result = UserValidator.validateAge(age);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid ages', () => {
      const invalidAges = [
        { age: 17, error: 'Must be at least 18 years old' },
        { age: 51, error: 'Age cannot exceed 50' },
        { age: 25.5, error: 'Age must be a whole number' },
        { age: NaN, error: 'Age must be a number' },
        { age: 'not-a-number' as any, error: 'Age must be a number' },
      ];

      invalidAges.forEach(({ age, error }) => {
        const result = UserValidator.validateAge(age);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(error);
      });
    });

    it('should allow undefined age (optional field)', () => {
      const result = UserValidator.validateAge(undefined as any);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Name Validation', () => {
    it('should validate valid names', () => {
      const validNames = [
        'John Doe',
        'Mary-Jane Smith',
        'José García',
        "O'Connor",
        'Dr. Smith Jr.',
      ];

      validNames.forEach(name => {
        const result = UserValidator.validateName(name);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid names', () => {
      const invalidNames = [
        { name: '', error: 'Name cannot be empty' },
        { name: '   ', error: 'Name cannot be empty' },
        { name: 'John123', error: 'Name contains invalid characters' },
        { name: 'John@Doe', error: 'Name contains invalid characters' },
        { name: 'A'.repeat(300), error: 'Name must be less than 255 characters' },
        { name: "---'''..", error: 'Name contains too many special characters' },
        { name: 123 as any, error: 'Name must be a string' },
      ];

      invalidNames.forEach(({ name, error }) => {
        const result = UserValidator.validateName(name);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(error);
      });
    });
  });

  describe('Phone Number Validation', () => {
    it('should validate US phone numbers', () => {
      const validPhones = [
        '+12125551234',
        '12125551234',
        '2125551234',
        '+1 212 555 1234',
        '212-555-1234',
        '(212) 555-1234',
      ];

      validPhones.forEach(phone => {
        const result = UserValidator.validatePhoneNumber(phone);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123456789', // Too short
        '1234567890123', // Too long
        '1125551234', // Invalid area code
        '2121551234', // Invalid exchange code
        'not-a-phone',
        '++12125551234',
      ];

      invalidPhones.forEach(phone => {
        const result = UserValidator.validatePhoneNumber(phone);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid phone number format');
      });
    });

    it('should allow empty phone number (optional)', () => {
      const result = UserValidator.validatePhoneNumber('');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Comprehensive User Validation', () => {
    it('should validate valid user creation data', () => {
      const validUserData = createMockUserCreate();
      
      const result = UserValidator.validateUserCreate(validUserData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should collect multiple validation errors', () => {
      const invalidUserData = {
        email: 'invalid-email',
        password: '123',
        full_name: '',
        age: 17,
        phone_number: '123',
        privacy_level: 'INVALID',
        location_neighborhood: 'A'.repeat(150),
      };

      const result = UserValidator.validateUserCreate(invalidUserData);
      expect(result.isValid).toBe(false);
      
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeDefined();
      expect(result.errors.full_name).toBeDefined();
      expect(result.errors.age).toBeDefined();
      expect(result.errors.phone_number).toBeDefined();
      expect(result.errors.privacy_level).toBeDefined();
      expect(result.errors.location_neighborhood).toBeDefined();
    });

    it('should validate user update data (optional fields)', () => {
      const updateData = {
        full_name: 'Updated Name',
        age: 30,
      };

      const result = UserValidator.validateUserUpdate(updateData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });
});

describe('UserSanitizer', () => {
  describe('String Sanitization', () => {
    it('should sanitize dangerous input', () => {
      const dangerousInputs = [
        { input: '  John Doe  ', expected: 'John Doe' },
        { input: 'John<script>alert("xss")</script>', expected: 'Johnalert("xss")' },
        { input: 'John\0Doe', expected: 'JohnDoe' },
        { input: 'A'.repeat(300), expected: 'A'.repeat(255), maxLength: 255 },
      ];

      dangerousInputs.forEach(({ input, expected, maxLength }) => {
        const result = UserSanitizer.sanitizeString(input, maxLength);
        expect(result).toBe(expected);
      });
    });

    it('should handle non-string input', () => {
      const result = UserSanitizer.sanitizeString(123 as any);
      expect(result).toBe('');
    });
  });

  describe('Email Sanitization', () => {
    it('should sanitize email addresses', () => {
      const emailTests = [
        { input: '  TEST@EXAMPLE.COM  ', expected: 'test@example.com' },
        { input: 'User<>@domain.com', expected: 'user@domain.com' },
        { input: 'user@domain.com!@#', expected: 'user@domain.com' },
      ];

      emailTests.forEach(({ input, expected }) => {
        const result = UserSanitizer.sanitizeEmail(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Phone Sanitization', () => {
    it('should sanitize phone numbers', () => {
      const phoneTests = [
        { input: '(212) 555-1234', expected: '2125551234' },
        { input: '+1 212.555.1234', expected: '+12125551234' },
        { input: '212 555 1234 ext 123', expected: '2125551234123' },
      ];

      phoneTests.forEach(({ input, expected }) => {
        const result = UserSanitizer.sanitizePhoneNumber(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('User Data Sanitization', () => {
    it('should sanitize user creation data', () => {
      const dirtyData = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'Password123!',
        full_name: '  <script>John</script> Doe  ',
        age: 25,
        location_neighborhood: '  Manhattan<>  ',
        phone_number: '(212) 555-1234',
      };

      const sanitized = UserSanitizer.sanitizeUserCreate(dirtyData);

      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.password).toBe('Password123!'); // Unchanged
      expect(sanitized.full_name).toBe('John Doe');
      expect(sanitized.age).toBe(25);
      expect(sanitized.location_neighborhood).toBe('Manhattan');
      expect(sanitized.phone_number).toBe('2125551234');
    });

    it('should sanitize user update data', () => {
      const dirtyUpdateData = {
        full_name: '  Updated Name  ',
        location_neighborhood: '<b>Brooklyn</b>',
        age: 30,
      };

      const sanitized = UserSanitizer.sanitizeUserUpdate(dirtyUpdateData);

      expect(sanitized.full_name).toBe('Updated Name');
      expect(sanitized.location_neighborhood).toBe('Brooklyn');
      expect(sanitized.age).toBe(30);
    });

    it('should handle partial update data', () => {
      const partialData = { full_name: '  New Name  ' };
      
      const sanitized = UserSanitizer.sanitizeUserUpdate(partialData);
      
      expect(sanitized.full_name).toBe('New Name');
      expect(sanitized.location_neighborhood).toBeUndefined();
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle null byte injection attempts', () => {
      const maliciousInput = 'John\x00Doe';
      const result = UserSanitizer.sanitizeString(maliciousInput);
      expect(result).toBe('JohnDoe');
    });

    it('should handle Unicode normalization attacks', () => {
      const unicodeInput = 'Jôhn Döe'; // Contains non-ASCII characters
      const result = UserSanitizer.sanitizeString(unicodeInput);
      expect(result).toBe('Jôhn Döe'); // Should preserve valid unicode
    });

    it('should handle extremely long input', () => {
      const longInput = 'A'.repeat(10000);
      const result = UserSanitizer.sanitizeString(longInput, 100);
      expect(result).toHaveLength(100);
    });
  });
});