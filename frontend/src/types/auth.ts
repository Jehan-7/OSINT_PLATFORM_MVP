// Authentication Response Types (matching backend authController.ts exactly)

// Success Response (from authController.ts)
export interface AuthSuccessResponse {
  success: true;
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
    reputation: number;
    created_at: string;
  };
  token: string;
}

// Validation Errors (from validation.ts patterns)
export interface ValidationErrorResponse {
  success: false;
  message: 'Validation failed';
  errors: string[];
}

// Duplicate User Errors (from authController.ts)
export interface DuplicateErrorResponse {
  success: false;
  message: 'Username already exists' | 'Email already exists';
  error: 'DUPLICATE_USERNAME' | 'DUPLICATE_EMAIL';
}

// Authentication Errors (from authController.ts)
export interface AuthErrorResponse {
  success: false;
  message: 'Invalid email or password';
  error: 'INVALID_CREDENTIALS';
}

// Generic Server Error
export interface ServerErrorResponse {
  success: false;
  message: string;
  error?: string;
}

// Union type for all possible auth error responses
export type AuthApiErrorResponse = 
  | ValidationErrorResponse 
  | DuplicateErrorResponse 
  | AuthErrorResponse 
  | ServerErrorResponse;

// JWT Payload (from jwt.ts)
export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  iat: number;
  exp?: number;
}

// User data structure (for context state)
export interface User {
  id: number;
  username: string;
  email: string;
  reputation: number;
  created_at: string;
}

// Form data types for frontend forms
export interface RegistrationFormData {
  username: string;
  email: string;
  password: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

// Authentication context state
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Authentication context actions
export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  initializeAuth: () => void;
} 