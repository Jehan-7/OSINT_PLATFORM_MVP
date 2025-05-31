import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { LoginPage } from './LoginPage';
import { authService } from '../services/authService';
import type { AuthSuccessResponse } from '../types';

// Mock authService
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    getStoredAuth: vi.fn(),
    storeAuth: vi.fn(),
    clearAuth: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockAuthService = vi.mocked(authService);

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('LoginPage - Complete Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.getStoredAuth.mockReturnValue({ token: null, user: null });
  });

  describe('form rendering', () => {
    it('should render login form with all required fields', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/create a new account/i)).toBeInTheDocument();
    });

    it('should have proper form field attributes', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);

      expect(emailField).toHaveAttribute('type', 'email');
      expect(emailField).toHaveAttribute('required');
      expect(passwordField).toHaveAttribute('type', 'password');
      expect(passwordField).toHaveAttribute('required');
    });
  });

  describe('form validation', () => {
    it('should show validation errors for empty fields', async () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Try to submit with empty form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should show validation error for invalid email', async () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email/i);
      
      fireEvent.change(emailField, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailField);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should clear validation errors when user starts typing', async () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email/i);
      
      // Trigger validation error
      fireEvent.change(emailField, { target: { value: 'invalid' } });
      fireEvent.blur(emailField);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      // Start typing to clear error
      fireEvent.change(emailField, { target: { value: 'valid@email.com' } });

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
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

      mockAuthService.login.mockResolvedValue(mockResponse);

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Fill out the form
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should handle login errors', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Invalid email or password'));

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Fill out the form
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      // Create a promise that we can control
      let resolveLogin: (value: AuthSuccessResponse) => void;
      const loginPromise = new Promise<AuthSuccessResponse>((resolve) => {
        resolveLogin = resolve;
      });
      mockAuthService.login.mockReturnValue(loginPromise);

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Fill out the form
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
      });

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

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('navigation', () => {
    it('should have link to registration page', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const registerLink = screen.getByText(/create a new account/i);
      expect(registerLink).toBeInTheDocument();
      expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
    });
  });

  describe('accessibility', () => {
    it('should have proper form labels and attributes', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);

      expect(emailField).toHaveAccessibleName();
      expect(passwordField).toHaveAccessibleName();
      expect(emailField).toHaveAttribute('type', 'email');
      expect(passwordField).toHaveAttribute('type', 'password');
    });
  });
}); 