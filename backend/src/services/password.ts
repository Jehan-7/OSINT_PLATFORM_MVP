import bcrypt from 'bcrypt';

/**
 * Password validation result interface
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Password service for OSINT Platform
 * Handles secure password hashing and validation using bcrypt
 * Sprint 1: User authentication security requirements
 */
export class PasswordService {
  private readonly saltRounds: number;

  constructor(saltRounds: number = 12) {
    // Ensure salt rounds meet security requirements (>= 10)
    if (saltRounds < 10) {
      throw new Error('Salt rounds must be at least 10 for security');
    }
    this.saltRounds = saltRounds;
  }

  /**
   * Hash a password using bcrypt with secure salt rounds
   * @param password - Plain text password to hash
   * @returns Promise<string> - Bcrypt hashed password
   */
  async hashPassword(password: string): Promise<string> {
    // Input validation
    if (password === null || password === undefined) {
      throw new Error('Password must be a string');
    }

    if (typeof password !== 'string') {
      throw new Error('Password must be a string');
    }

    if (password.length === 0) {
      throw new Error('Password cannot be empty');
    }

    try {
      const hashedPassword = await bcrypt.hash(password, this.saltRounds);
      return hashedPassword;
    } catch (error) {
      throw new Error(`Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify a password against its hash
   * @param password - Plain text password to verify
   * @param hashedPassword - Bcrypt hashed password to compare against
   * @returns Promise<boolean> - True if password matches hash
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    // Input validation
    if (password === null || password === undefined) {
      throw new Error('Password must be a string');
    }

    if (hashedPassword === null || hashedPassword === undefined) {
      throw new Error('Hashed password must be a string');
    }

    if (typeof password !== 'string' || typeof hashedPassword !== 'string') {
      throw new Error('Both password and hash must be strings');
    }

    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      return isValid;
    } catch (error) {
      throw new Error(`Failed to verify password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate password strength according to OSINT Platform security requirements
   * @param password - Password to validate
   * @returns PasswordValidationResult - Validation result with errors
   */
  validatePasswordStrength(password: string): PasswordValidationResult {
    const errors: string[] = [];

    // Check minimum length
    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check for number
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check for special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get the current salt rounds configuration
   * @returns number - Salt rounds used for hashing
   */
  getSaltRounds(): number {
    return this.saltRounds;
  }

  /**
   * Generate a secure random password
   * @param length - Length of password to generate (default: 16)
   * @returns string - Randomly generated secure password
   */
  generateSecurePassword(length: number = 16): string {
    if (length < 8) {
      throw new Error('Password length must be at least 8 characters');
    }

    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + specialChars;

    let password = '';

    // Ensure at least one character from each required category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
} 