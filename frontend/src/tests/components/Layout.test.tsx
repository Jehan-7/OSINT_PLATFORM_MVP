// Layout Tests - Following established component test patterns
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { AuthProvider } from '../../contexts/AuthContext';
import { PostsProvider } from '../../contexts/PostsContext';

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

// Test wrapper component with all required providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <PostsProvider>
        {children}
      </PostsProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default unauthenticated state
    mockUseAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
      loading: false,
      isAuthenticated: false,
    });
  });

  describe('Basic Structure', () => {
    it('should render header and main content area', () => {
      render(
        <TestWrapper>
          <Layout>
            <div data-testid="test-content">Test Content</div>
          </Layout>
        </TestWrapper>
      );

      // Should have header
      expect(screen.getByRole('banner')).toBeInTheDocument();
      
      // Should have main content area
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Should render children
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('should have proper semantic HTML structure', () => {
      render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      // Should have proper landmark roles
      const header = screen.getByRole('banner');
      const main = screen.getByRole('main');
      
      expect(header).toBeInTheDocument();
      expect(main).toBeInTheDocument();
      
      // Header should come before main
      expect(header.compareDocumentPosition(main)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('should apply proper CSS classes for responsive design', () => {
      render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      const main = screen.getByRole('main');
      
      // Should have responsive container classes
      expect(main).toHaveClass('min-h-screen');
    });
  });

  describe('Content Rendering', () => {
    it('should render multiple children correctly', () => {
      render(
        <TestWrapper>
          <Layout>
            <div data-testid="child-1">First Child</div>
            <div data-testid="child-2">Second Child</div>
          </Layout>
        </TestWrapper>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('should handle empty children gracefully', () => {
      render(
        <TestWrapper>
          <Layout>
            {null}
          </Layout>
        </TestWrapper>
      );

      // Should still render header and main
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should render complex nested content', () => {
      render(
        <TestWrapper>
          <Layout>
            <div>
              <h1>Page Title</h1>
              <section>
                <p>Page content</p>
              </section>
            </div>
          </Layout>
        </TestWrapper>
      );

      expect(screen.getByText('Page Title')).toBeInTheDocument();
      expect(screen.getByText('Page content')).toBeInTheDocument();
    });
  });

  describe('Header Integration', () => {
    it('should include Header component', () => {
      render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      // Should have navigation (part of Header)
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should have OSINT Platform branding in header', () => {
      render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      expect(screen.getByText(/OSINT Platform/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have mobile-first responsive classes', () => {
      render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      const layout = screen.getByRole('main').parentElement;
      
      // Should have responsive layout classes
      expect(layout).toHaveClass('min-h-screen');
    });

    it('should provide proper spacing for content', () => {
      render(
        <TestWrapper>
          <Layout>
            <div data-testid="content">Content</div>
          </Layout>
        </TestWrapper>
      );

      const main = screen.getByRole('main');
      
      // Should have proper padding/margin classes
      expect(main).toHaveClass('flex-1');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA landmarks', () => {
      render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      // Should have banner (header) and main landmarks
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should maintain focus management', () => {
      render(
        <TestWrapper>
          <Layout>
            <button data-testid="test-button">Test Button</button>
          </Layout>
        </TestWrapper>
      );

      const button = screen.getByTestId('test-button');
      button.focus();
      
      expect(button).toHaveFocus();
    });
  });

  describe('Layout Consistency', () => {
    it('should provide consistent structure across different content', () => {
      const { rerender } = render(
        <TestWrapper>
          <Layout>
            <div data-testid="page-1">Page 1 Content</div>
          </Layout>
        </TestWrapper>
      );

      expect(screen.getByTestId('page-1')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <Layout>
            <div data-testid="page-2">Page 2 Content</div>
          </Layout>
        </TestWrapper>
      );

      expect(screen.getByTestId('page-2')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });
}); 