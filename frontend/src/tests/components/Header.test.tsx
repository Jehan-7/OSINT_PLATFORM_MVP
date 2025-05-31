// Header Tests - Following established component test patterns
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the useAuth hook
const mockLogout = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

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
    // Default unauthenticated state
    mockUseAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
      loading: false,
      isAuthenticated: false,
    });
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

    it('should always show main navigation links', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByRole('link', { name: /feed/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /map/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create post/i })).toBeInTheDocument();
    });
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockUseAuth.mockReturnValue({
        user: null,
        logout: mockLogout,
        loading: false,
        isAuthenticated: false,
      });
    });

    it('should show login and sign up links when not authenticated', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should not show user welcome message when not authenticated', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument();
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
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        logout: mockLogout,
        loading: false,
        isAuthenticated: true,
      });
    });

    it('should show authenticated navigation when logged in', async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/welcome, testuser/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      });
    });

    it('should not show login/sign up links when authenticated', async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /sign up/i })).not.toBeInTheDocument();
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
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        logout: mockLogout,
        loading: false,
        isAuthenticated: true,
      });
      mockLogout.mockReturnValue(undefined);
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
        expect(mockLogout).toHaveBeenCalled();
      });
    });
  });

  describe('Mobile Navigation', () => {
    it('should show mobile menu button on mobile', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /toggle menu/i })).toBeInTheDocument();
    });

    it('should toggle mobile menu when button is clicked', async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const toggleButton = screen.getByRole('button', { name: /toggle menu/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
      });
    });

    it('should show mobile navigation links when menu is open', async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const toggleButton = screen.getByRole('button', { name: /toggle menu/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText(/map view/i)).toBeInTheDocument();
        expect(screen.getByText(/create post/i)).toBeInTheDocument();
      });
    });
  });

  describe('Create Post Button', () => {
    it('should show create post button for all users', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /create post/i })).toBeInTheDocument();
    });

    it('should handle create post click for authenticated users', async () => {
      const mockAuthData = {
        token: 'mock-jwt-token',
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockAuthData));
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        logout: mockLogout,
        loading: false,
        isAuthenticated: true,
      });

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const createButton = screen.getByRole('button', { name: /create post/i });
      expect(createButton).toBeInTheDocument();
      
      // Button should be clickable
      fireEvent.click(createButton);
      // Navigation would be tested in integration tests
    });
  });
}); 