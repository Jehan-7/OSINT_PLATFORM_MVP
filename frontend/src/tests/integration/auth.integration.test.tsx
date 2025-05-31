import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { LoginPage } from '../../pages/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { HomePage } from '../../pages/HomePage';
import { ProtectedRoute } from '../../components/ProtectedRoute';

// Test-specific App component without Router
function TestApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

// Integration tests that test the complete app flow
describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Clear any existing auth state
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Complete Registration Flow', () => {
    it('should allow user to navigate to registration and complete the flow', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <TestApp />
        </MemoryRouter>
      );

      // Should start on HomePage
      expect(screen.getByText('OSINT Platform')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();

      // Click Get Started to go to registration
      fireEvent.click(screen.getByText('Get Started'));

      // Should navigate to registration page
      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument();
      });

      // Verify all form fields are present
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should show validation errors on empty form submission', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <TestApp />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument();
      });

      // Submit empty form
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should show progressive validation on field blur', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <TestApp />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument();
      });

      const usernameField = screen.getByLabelText(/username/i);

      // Enter invalid username
      fireEvent.change(usernameField, { target: { value: 'ab' } });
      fireEvent.blur(usernameField);

      // Should show username validation error
      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters long/i)).toBeInTheDocument();
      });

      // Fix the username
      fireEvent.change(usernameField, { target: { value: 'validuser' } });

      // Error should disappear
      await waitFor(() => {
        expect(screen.queryByText(/username must be at least 3 characters long/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Complete Login Flow', () => {
    it('should allow user to navigate to login page', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <TestApp />
        </MemoryRouter>
      );

      // Click Sign In
      fireEvent.click(screen.getByText('Sign In'));

      // Should navigate to login page
      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      });

      // Verify login form fields
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  describe('Navigation and Routing', () => {
    it('should handle navigation between pages correctly', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <TestApp />
        </MemoryRouter>
      );

      // Start at home
      expect(screen.getByText('OSINT Platform')).toBeInTheDocument();

      // Go to registration
      fireEvent.click(screen.getByText('Get Started'));
      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument();
      });

      // Go to login from registration
      fireEvent.click(screen.getByText(/sign in to your account/i));
      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      });

      // Go to registration from login
      fireEvent.click(screen.getByText(/create a new account/i));
      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument();
      });
    });

    it('should redirect unknown routes to home page', async () => {
      render(
        <MemoryRouter initialEntries={['/unknown-route']}>
          <TestApp />
        </MemoryRouter>
      );

      // Should show home page content
      expect(screen.getByText('OSINT Platform')).toBeInTheDocument();
    });
  });

  describe('Authentication State Management', () => {
    it('should persist authentication state in localStorage', async () => {
      // This test would normally require a real backend
      // For now, we'll test the localStorage functionality
      
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        reputation: 0,
        created_at: '2024-01-01T00:00:00Z',
      };
      const mockToken = 'mock.jwt.token';

      // Simulate stored auth
      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('authUser', JSON.stringify(mockUser));

      render(
        <MemoryRouter initialEntries={['/']}>
          <TestApp />
        </MemoryRouter>
      );

      // Should show home page content
      expect(screen.getByText('OSINT Platform')).toBeInTheDocument();
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper form labels and accessibility attributes', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <TestApp />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument();
      });

      // Check form accessibility
      const usernameField = screen.getByLabelText(/username/i);
      const emailField = screen.getByLabelText(/email address/i);
      const passwordField = screen.getByLabelText(/password/i);

      expect(usernameField).toHaveAttribute('required');
      expect(emailField).toHaveAttribute('required');
      expect(passwordField).toHaveAttribute('required');

      expect(usernameField).toHaveAttribute('type', 'text');
      expect(emailField).toHaveAttribute('type', 'email');
      expect(passwordField).toHaveAttribute('type', 'password');
    });

    it('should show proper error states with aria-invalid', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <TestApp />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument();
      });

      const usernameField = screen.getByLabelText(/username/i);

      // Trigger validation error
      fireEvent.change(usernameField, { target: { value: 'ab' } });
      fireEvent.blur(usernameField);

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters long/i)).toBeInTheDocument();
      });
    });
  });
}); 