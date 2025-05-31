// Header Tests - Following established component test patterns
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { AuthProvider } from '../../contexts/AuthContext';
import { authService } from '../../services/api';

// Mock the auth service
vi.mock('../../services/api', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
  },
}));

const mockAuthService = vi.mocked(authService);

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Basic Structure', () => {
    it('should render header with proper semantic HTML', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      expect(header.tagName).toBe('HEADER');
    });

    it('should have navigation element', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should display OSINT Platform branding', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByText(/OSINT Platform/i)).toBeInTheDocument();
    });
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(null);
    });

    it('should show login and register links when not authenticated', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    });

    it('should not show authenticated user navigation', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.queryByRole('link', { name: /feed/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    beforeEach(() => {
      const mockAuthData = {
        token: 'mock-jwt-token',
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockAuthData));
    });

    it('should show authenticated navigation when logged in', async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /feed/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      });
    });

    it('should not show login/register links when authenticated', async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      const mockAuthData = {
        token: 'mock-jwt-token',
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockAuthData));
      mockAuthService.logout.mockResolvedValue();
    });

    it('should handle logout when logout button is clicked', async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      await waitFor(() => {
        const logoutButton = screen.getByRole('button', { name: /logout/i });
        expect(logoutButton).toBeInTheDocument();
      });

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockAuthService.logout).toHaveBeenCalled();
      });
    });
  });

  describe('Mobile Navigation', () => {
    it('should have mobile menu toggle button', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const menuButton = screen.getByRole('button', { name: /menu/i });
      expect(menuButton).toBeInTheDocument();
    });

    it('should toggle mobile menu when button is clicked', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const menuButton = screen.getByRole('button', { name: /menu/i });
      
      // Click to open
      fireEvent.click(menuButton);
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();

      // Click to close
      fireEvent.click(menuButton);
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    });
  });
}); 