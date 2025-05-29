import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { authService } from '../services/authService';
import type { AuthSuccessResponse } from '../types';

// Mock authService
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    getStoredAuth: vi.fn(),
    storeAuth: vi.fn(),
    clearAuth: vi.fn(),
  },
}));

const mockAuthService = vi.mocked(authService);

// Helper wrapper for testing
const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );
};

describe('AuthContext - Phase 4', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state when no stored auth', () => {
      mockAuthService.getStoredAuth.mockReturnValue({ token: null, user: null });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should initialize from localStorage if auth data exists', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        reputation: 0,
        created_at: '2024-01-01T00:00:00Z',
      };
      const mockToken = 'valid.jwt.token';

      mockAuthService.getStoredAuth.mockReturnValue({
        token: mockToken,
        user: mockUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
    });

    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
    });
  });

  describe('login', () => {
    it('should handle successful login', async () => {
      const mockResponse: AuthSuccessResponse = {
        success: true,
        message: 'Login successful',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          reputation: 0,
          created_at: '2024-01-01T00:00:00Z',
        },
        token: 'valid.jwt.token',
      };

      mockAuthService.getStoredAuth.mockReturnValue({ token: null, user: null });
      mockAuthService.login.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockAuthService.storeAuth).toHaveBeenCalledWith(mockResponse);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.token).toBe(mockResponse.token);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle login error', async () => {
      const errorMessage = 'Invalid email or password';
      mockAuthService.getStoredAuth.mockReturnValue({ token: null, user: null });
      mockAuthService.login.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrongpassword');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });

    it('should set loading state during login', async () => {
      mockAuthService.getStoredAuth.mockReturnValue({ token: null, user: null });
      
      // Create a promise that we can control
      let resolveLogin: (value: AuthSuccessResponse) => void;
      const loginPromise = new Promise<AuthSuccessResponse>((resolve) => {
        resolveLogin = resolve;
      });
      mockAuthService.login.mockReturnValue(loginPromise);

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      // Start login (don't await yet)
      const loginCall = act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      // Check loading state
      expect(result.current.loading).toBe(true);

      // Resolve the login
      const mockResponse: AuthSuccessResponse = {
        success: true,
        message: 'Login successful',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          reputation: 0,
          created_at: '2024-01-01T00:00:00Z',
        },
        token: 'valid.jwt.token',
      };
      resolveLogin!(mockResponse);

      await loginCall;

      expect(result.current.loading).toBe(false);
    });
  });

  describe('register', () => {
    it('should handle successful registration', async () => {
      const mockResponse: AuthSuccessResponse = {
        success: true,
        message: 'User registered successfully',
        user: {
          id: 1,
          username: 'newuser',
          email: 'newuser@example.com',
          reputation: 0,
          created_at: '2024-01-01T00:00:00Z',
        },
        token: 'new.jwt.token',
      };

      mockAuthService.getStoredAuth.mockReturnValue({ token: null, user: null });
      mockAuthService.register.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.register('newuser', 'newuser@example.com', 'SecurePass123!');
      });

      expect(mockAuthService.register).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'SecurePass123!',
      });
      expect(mockAuthService.storeAuth).toHaveBeenCalledWith(mockResponse);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockResponse.user);
    });

    it('should handle registration error', async () => {
      const errorMessage = 'Username already exists';
      mockAuthService.getStoredAuth.mockReturnValue({ token: null, user: null });
      mockAuthService.register.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.register('existinguser', 'test@example.com', 'password123');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('logout', () => {
    it('should clear authentication state and localStorage', () => {
      // Start with authenticated state
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        reputation: 0,
        created_at: '2024-01-01T00:00:00Z',
      };
      mockAuthService.getStoredAuth.mockReturnValue({
        token: 'valid.jwt.token',
        user: mockUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      // Verify initial authenticated state
      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(mockAuthService.clearAuth).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
    });
  });

  describe('error handling', () => {
    it('should clear error when clearError is called', () => {
      mockAuthService.getStoredAuth.mockReturnValue({ token: null, user: null });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      // Set an error first
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });

    it('should clear error on successful login after previous error', async () => {
      mockAuthService.getStoredAuth.mockReturnValue({ token: null, user: null });
      
      // First, simulate a failed login
      mockAuthService.login.mockRejectedValueOnce(new Error('Invalid credentials'));
      
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrongpassword');
        } catch (error) {
          // Expected
        }
      });

      expect(result.current.error).toBe('Invalid credentials');

      // Now simulate successful login
      const mockResponse: AuthSuccessResponse = {
        success: true,
        message: 'Login successful',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          reputation: 0,
          created_at: '2024-01-01T00:00:00Z',
        },
        token: 'valid.jwt.token',
      };
      mockAuthService.login.mockResolvedValue(mockResponse);

      await act(async () => {
        await result.current.login('test@example.com', 'correctpassword');
      });

      expect(result.current.error).toBe(null);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
}); 