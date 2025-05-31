import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { RegisterPage } from './RegisterPage';
import { authService } from '../services/authService';
import type { AuthSuccessResponse } from '../types';

// Mock authService
vi.mock('../services/authService', () => ({
  authService: {
    register: vi.fn(),
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

describe('RegisterPage - Phase 5', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.getStoredAuth.mockReturnValue({ token: null, user: null });
  });

  describe('form rendering', () => {
    it('should render registration form with all required fields', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      expect(screen.getByText(/create your account/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });

    it('should have proper form field attributes', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      const usernameField = screen.getByLabelText(/username/i);
      const emailField = screen.getByLabelText(/email address/i);
      const passwordField = screen.getByLabelText(/password/i);

      expect(usernameField).toHaveAttribute('type', 'text');
      expect(usernameField).toHaveAttribute('required');
      expect(emailField).toHaveAttribute('type', 'email');
      expect(emailField).toHaveAttribute('required');
      expect(passwordField).toHaveAttribute('type', 'password');
      expect(passwordField).toHaveAttribute('required');
    });
  });

  describe('form validation', () => {
    it('should show validation errors for invalid username', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      const usernameField = screen.getByLabelText(/username/i);
      
      // Test too short username
      fireEvent.change(usernameField, { target: { value: 'ab' } });
      fireEvent.blur(usernameField);

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters long/i)).toBeInTheDocument();
      });

      // Test invalid characters
      fireEvent.change(usernameField, { target: { value: 'user@name' } });
      fireEvent.blur(usernameField);

      await waitFor(() => {
        expect(screen.getByText(/username can only contain letters, numbers, and underscores/i)).toBeInTheDocument();
      });
    });

    it('should show validation errors for invalid email', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email address/i);
      
      fireEvent.change(emailField, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailField);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should show validation errors for weak password', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      const passwordField = screen.getByLabelText(/password/i);
      
      // Test too short password
      fireEvent.change(passwordField, { target: { value: 'weak' } });
      fireEvent.blur(passwordField);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
      });

      // Test password without uppercase
      fireEvent.change(passwordField, { target: { value: 'password123!' } });
      fireEvent.blur(passwordField);

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
      });
    });

    it('should clear validation errors when user starts typing', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      const usernameField = screen.getByLabelText(/username/i);
      
      // Trigger validation error
      fireEvent.change(usernameField, { target: { value: 'ab' } });
      fireEvent.blur(usernameField);

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters long/i)).toBeInTheDocument();
      });

      // Start typing to clear error
      fireEvent.change(usernameField, { target: { value: 'abc' } });

      await waitFor(() => {
        expect(screen.queryByText(/username must be at least 3 characters long/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('should handle successful registration', async () => {
      const mockResponse: AuthSuccessResponse = {
        success: true,
        message: 'User registered successfully',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          reputation: 0,
          created_at: '2024-01-01T00:00:00Z',
        },
        token: 'valid.jwt.token',
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      // Fill out the form
      fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'SecurePass123!' } });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalledWith({
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123!',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should handle registration errors', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Username already exists'));

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      // Fill out the form
      fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'existinguser' } });
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'SecurePass123!' } });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        // Look for the error message specifically in the username input area
        const usernameField = screen.getByLabelText(/username/i);
        const usernameContainer = usernameField.closest('.space-y-1');
        expect(usernameContainer).toHaveTextContent(/username already exists/i);
      });
    });

    it('should prevent submission with invalid form data', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      // Try to submit with empty form
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      // Create a promise that we can control
      let resolveRegister: (value: AuthSuccessResponse) => void;
      const registerPromise = new Promise<AuthSuccessResponse>((resolve) => {
        resolveRegister = resolve;
      });
      mockAuthService.register.mockReturnValue(registerPromise);

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      // Fill out the form
      fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'SecurePass123!' } });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
      });

      // Resolve the registration
      const mockResponse: AuthSuccessResponse = {
        success: true,
        message: 'User registered successfully',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          reputation: 0,
          created_at: '2024-01-01T00:00:00Z',
        },
        token: 'valid.jwt.token',
      };
      resolveRegister!(mockResponse);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('navigation', () => {
    it('should have link to login page', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      const loginLink = screen.getByText(/sign in to your account/i);
      expect(loginLink).toBeInTheDocument();
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    });
  });
}); 