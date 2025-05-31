import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';

// Mock the authService module first
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    getStoredAuth: vi.fn().mockReturnValue({ token: null, user: null }),
    storeAuth: vi.fn(),
    clearAuth: vi.fn(),
  },
}));

import { AuthProvider, useAuth } from './AuthContext';
import { authService } from '../services/authService';

// Get the mocked authService
const mockAuthService = vi.mocked(authService);

// Helper wrapper for testing
const createWrapper = () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );
  return Wrapper;
};

describe('AuthContext - Phase 4', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.getStoredAuth.mockReturnValue({ token: null, user: null });
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state when no stored auth', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      expect(result.current).toBeDefined();
      expect(typeof result.current).toBe('object');
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.register).toBe('function');
      expect(typeof result.current.logout).toBe('function');
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

  describe('basic functionality', () => {
    it('should have all required methods and properties', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      expect(result.current).toBeDefined();
      expect(result.current.isAuthenticated).toBeDefined();
      expect(result.current.user).toBeDefined();
      expect(result.current.token).toBeDefined();
      expect(result.current.loading).toBeDefined();
      expect(result.current.error).toBeDefined();
      expect(result.current.login).toBeDefined();
      expect(result.current.register).toBeDefined();
      expect(result.current.logout).toBeDefined();
      expect(result.current.clearError).toBeDefined();
    });

    it('should handle logout properly', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      act(() => {
        result.current.logout();
      });

      expect(mockAuthService.clearAuth).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
    });

    it('should clear error when clearError is called', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });
}); 