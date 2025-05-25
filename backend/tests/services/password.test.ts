import { PasswordService } from '../../src/services/password';

// Set timeout for bcrypt operations
jest.setTimeout(10000);

describe('PasswordService', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe('hashPassword', () => {
    it('should hash a password with bcrypt', async () => {
      const password = 'testPassword123!';
      const hashedPassword = await passwordService.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 characters
    });

    it('should use salt rounds >= 10 for security', async () => {
      const password = 'testPassword123!';
      const hashedPassword = await passwordService.hashPassword(password);

      // bcrypt hash format: $2b$rounds$salt+hash
      const rounds = parseInt(hashedPassword.split('$')[2] || '0');
      expect(rounds).toBeGreaterThanOrEqual(10);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123!';
      const hash1 = await passwordService.hashPassword(password);
      const hash2 = await passwordService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      await expect(passwordService.hashPassword('')).rejects.toThrow('Password cannot be empty');
    });

    it('should handle null/undefined password', async () => {
      await expect(passwordService.hashPassword(null as any)).rejects.toThrow('Password must be a string');
      await expect(passwordService.hashPassword(undefined as any)).rejects.toThrow('Password must be a string');
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const hashedPassword = await passwordService.hashPassword(longPassword);
      
      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123!';
      const hashedPassword = await passwordService.hashPassword(password);
      
      const isValid = await passwordService.verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123!';
      const wrongPassword = 'wrongPassword456!';
      const hashedPassword = await passwordService.hashPassword(password);
      
      const isValid = await passwordService.verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should handle empty password verification', async () => {
      const hashedPassword = await passwordService.hashPassword('testPassword123!');
      
      const isValid = await passwordService.verifyPassword('', hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should handle invalid hash format', async () => {
      const password = 'testPassword123!';
      const invalidHash = 'invalid-hash-format';
      
      // bcrypt returns false for invalid hash format instead of throwing
      const isValid = await passwordService.verifyPassword(password, invalidHash);
      expect(isValid).toBe(false);
    });

    it('should handle null/undefined inputs', async () => {
      const hashedPassword = await passwordService.hashPassword('testPassword123!');
      
      await expect(passwordService.verifyPassword(null as any, hashedPassword)).rejects.toThrow();
      await expect(passwordService.verifyPassword('password', null as any)).rejects.toThrow();
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'StrongPass123!',
        'MySecure@Password2024',
        'Complex#Pass1',
        'Secure$123Password'
      ];

      strongPasswords.forEach(password => {
        const result = passwordService.validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject passwords that are too short', () => {
      const shortPassword = '1234567';
      const result = passwordService.validatePasswordStrength(shortPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject passwords without uppercase letters', () => {
      const password = 'lowercase123!';
      const result = passwordService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without lowercase letters', () => {
      const password = 'UPPERCASE123!';
      const result = passwordService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const password = 'NoNumbers!';
      const result = passwordService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject passwords without special characters', () => {
      const password = 'NoSpecialChars123';
      const result = passwordService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should return multiple errors for weak passwords', () => {
      const weakPassword = 'weak';
      const result = passwordService.validatePasswordStrength(weakPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('getSaltRounds', () => {
    it('should return salt rounds >= 10', () => {
      const saltRounds = passwordService.getSaltRounds();
      expect(saltRounds).toBeGreaterThanOrEqual(10);
      expect(typeof saltRounds).toBe('number');
    });
  });
}); 