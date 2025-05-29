// Authentication Service - Direct integration with Sprint 1 auth APIs
import type { 
  AuthSuccessResponse, 
  RegistrationFormData, 
  LoginFormData,
  AuthApiErrorResponse 
} from '../types';
import { apiClient } from './api';

export class AuthService {
  
  /**
   * Register new user
   * POST /api/auth/register
   * Matches authController.js exactly
   */
  async register(userData: RegistrationFormData): Promise<AuthSuccessResponse> {
    try {
      const response = await apiClient.post<AuthSuccessResponse>(
        '/api/auth/register',
        userData
      );
      
      return response;
    } catch (error: any) {
      // Type-safe error handling matching backend responses
      const apiError = error as AuthApiErrorResponse;
      throw new Error(apiError.message || 'Registration failed');
    }
  }

  /**
   * Login user
   * POST /api/auth/login  
   * Matches authController.js exactly
   */
  async login(credentials: LoginFormData): Promise<AuthSuccessResponse> {
    try {
      const response = await apiClient.post<AuthSuccessResponse>(
        '/api/auth/login',
        credentials
      );
      
      return response;
    } catch (error: any) {
      // Type-safe error handling matching backend responses
      const apiError = error as AuthApiErrorResponse;
      throw new Error(apiError.message || 'Login failed');
    }
  }

  /**
   * Verify JWT token validity
   * GET /api/auth/verify
   * Matches authController.js exactly
   */
  async verifyToken(): Promise<{ valid: boolean; user?: any }> {
    try {
      const response = await apiClient.get<{ 
        success: boolean; 
        message: string; 
        user: any 
      }>('/api/auth/verify');
      
      return {
        valid: response.success,
        user: response.user,
      };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Store authentication data in localStorage
   * Follows Sprint 3 specifications for state persistence
   */
  storeAuth(authData: AuthSuccessResponse): void {
    const storageKeys = {
      token: import.meta.env.VITE_JWT_STORAGE_KEY || 'osint_auth_token',
      user: import.meta.env.VITE_USER_STORAGE_KEY || 'osint_auth_user',
    };

    localStorage.setItem(storageKeys.token, authData.token);
    localStorage.setItem(storageKeys.user, JSON.stringify(authData.user));
  }

  /**
   * Retrieve authentication data from localStorage
   */
  getStoredAuth(): { token: string | null; user: any | null } {
    const storageKeys = {
      token: import.meta.env.VITE_JWT_STORAGE_KEY || 'osint_auth_token',
      user: import.meta.env.VITE_USER_STORAGE_KEY || 'osint_auth_user',
    };

    const token = localStorage.getItem(storageKeys.token);
    const userStr = localStorage.getItem(storageKeys.user);
    
    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
    };
  }

  /**
   * Clear authentication data from localStorage
   */
  clearAuth(): void {
    const storageKeys = {
      token: import.meta.env.VITE_JWT_STORAGE_KEY || 'osint_auth_token',
      user: import.meta.env.VITE_USER_STORAGE_KEY || 'osint_auth_user',
    };

    localStorage.removeItem(storageKeys.token);
    localStorage.removeItem(storageKeys.user);
  }

  /**
   * Check if user is authenticated based on stored token
   */
  isAuthenticated(): boolean {
    const { token } = this.getStoredAuth();
    return !!token;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService; 