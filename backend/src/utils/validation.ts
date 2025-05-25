/**
 * Validation utilities for OSINT Platform
 * Handles input validation for authentication and other endpoints
 * Sprint 1: Registration input validation
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface RegistrationInput {
  username: string;
  email: string;
  password: string;
}

/**
 * Validate registration input data
 * @param input - Registration input data
 * @returns ValidationResult - Validation result with errors
 */
export function validateRegistrationInput(input: RegistrationInput): ValidationResult {
  const errors: string[] = [];

  // Validate username
  const usernameValidation = validateUsername(input.username);
  if (!usernameValidation.isValid) {
    errors.push(...usernameValidation.errors);
  }

  // Validate email
  const emailValidation = validateEmail(input.email);
  if (!emailValidation.isValid) {
    errors.push(...emailValidation.errors);
  }

  // Validate password presence (strength validation is done in controller)
  const passwordValidation = validatePasswordPresence(input.password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate username according to OSINT Platform rules
 * @param username - Username to validate
 * @returns ValidationResult - Validation result with errors
 */
export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];

  // Check if username exists
  if (!username || typeof username !== 'string') {
    errors.push('Username is required');
    return { isValid: false, errors };
  }

  // Trim whitespace
  const trimmedUsername = username.trim();

  // Check minimum length
  if (trimmedUsername.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }

  // Check maximum length
  if (trimmedUsername.length > 50) {
    errors.push('Username must be no more than 50 characters long');
  }

  // Check allowed characters (alphanumeric and underscores only)
  if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }

  // Check that username doesn't start with underscore
  if (trimmedUsername.startsWith('_')) {
    errors.push('Username cannot start with an underscore');
  }

  // Check that username doesn't end with underscore
  if (trimmedUsername.endsWith('_')) {
    errors.push('Username cannot end with an underscore');
  }

  // Check for consecutive underscores
  if (trimmedUsername.includes('__')) {
    errors.push('Username cannot contain consecutive underscores');
  }

  // Check for reserved usernames
  const reservedUsernames = [
    'admin', 'administrator', 'root', 'system', 'api', 'www', 'mail', 'ftp',
    'test', 'guest', 'anonymous', 'null', 'undefined', 'osint', 'platform'
  ];

  if (reservedUsernames.includes(trimmedUsername.toLowerCase())) {
    errors.push('Username is reserved and cannot be used');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate email address format
 * @param email - Email to validate
 * @returns ValidationResult - Validation result with errors
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  // Check if email exists
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  // Trim whitespace
  const trimmedEmail = email.trim();

  // Check basic email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    errors.push('Email must be a valid email address');
  }

  // Check email length
  if (trimmedEmail.length > 255) {
    errors.push('Email must be no more than 255 characters long');
  }

  // Check for valid characters
  const validEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!validEmailRegex.test(trimmedEmail)) {
    errors.push('Email contains invalid characters');
  }

  // Check domain part
  const parts = trimmedEmail.split('@');
  if (parts.length === 2 && parts[1]) {
    const domain = parts[1];
    
    // Check domain length
    if (domain.length > 253) {
      errors.push('Email domain is too long');
    }

    // Check for valid domain format
    if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
      errors.push('Email domain format is invalid');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate password presence (not strength - that's handled by PasswordService)
 * @param password - Password to validate
 * @returns ValidationResult - Validation result with errors
 */
export function validatePasswordPresence(password: string): ValidationResult {
  const errors: string[] = [];

  // Check if password exists
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  // Check if password is not just whitespace
  if (password.trim().length === 0) {
    errors.push('Password cannot be empty');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize string input to prevent XSS and injection attacks
 * @param input - String to sanitize
 * @returns string - Sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes that could break SQL
    .substring(0, 1000); // Limit length to prevent DoS
}

/**
 * Validate and sanitize general text input
 * @param input - Text input to validate
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns ValidationResult - Validation result with errors
 */
export function validateTextInput(input: string, maxLength: number = 1000): ValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'string') {
    errors.push('Input is required');
    return { isValid: false, errors };
  }

  const trimmed = input.trim();

  if (trimmed.length === 0) {
    errors.push('Input cannot be empty');
  }

  if (trimmed.length > maxLength) {
    errors.push(`Input must be no more than ${maxLength} characters long`);
  }

  // Check for potentially dangerous content
  if (/<script|javascript:|data:/i.test(trimmed)) {
    errors.push('Input contains potentially dangerous content');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 