// FeedPage Tests - Following established page test patterns
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedPage } from '../../pages/FeedPage';
import { PostsProvider } from '../../contexts/PostsContext';
import { postsService } from '../../services/postsService';
import type { PostsListResponse, Post } from '../../types';

// Mock the postsService
vi.mock('../../services/postsService', () => ({
  postsService: {
    fetchPosts: vi.fn(),
    fetchPostById: vi.fn(),
  },
}));

const mockPostsService = vi.mocked(postsService);

// Mock data for testing
const mockPost1: Post = {
  id: 1,
  content: 'Intelligence gathering spotted increased activity in downtown area.',
  author: {
    id: 1,
    username: 'analyst_user',
    reputation: 150,
  },
  latitude: 40.7829,
  longitude: -73.9654,
  location_name: 'Central Park, NYC',
  upvotes: 5,
  downvotes: 1,
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
};

const mockPost2: Post = {
  id: 2,
  content: 'Noticed unusual communication patterns on local frequencies.',
  author: {
    id: 2,
    username: 'field_operator',
    reputation: 89,
  },
  latitude: 40.7580,
  longitude: -73.9855,
  location_name: 'Times Square, NYC',
  upvotes: 8,
  downvotes: 0,
  created_at: '2024-01-15T14:45:00Z',
  updated_at: '2024-01-15T14:45:00Z',
};

const mockPostsResponse: PostsListResponse = {
  success: true,
  posts: [mockPost1, mockPost2],
  pagination: {
    page: 1,
    limit: 20,
    total: 45,
    totalPages: 3,
    hasNext: true,
    hasPrevious: false,
  },
};

const emptyPostsResponse: PostsListResponse = {
  success: true,
  posts: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
};

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <PostsProvider>{children}</PostsProvider>
);

describe('FeedPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Load', () => {
    it('should fetch posts on initial load', async () => {
      mockPostsService.fetchPosts.mockResolvedValue(mockPostsResponse);
      
      render(
        <TestWrapper>
          <FeedPage />
        </TestWrapper>
      );
      
      // Should show loading initially
      expect(screen.getByText(/loading posts/i)).toBeInTheDocument();
      
      // Should fetch posts
      await waitFor(() => {
        expect(mockPostsService.fetchPosts).toHaveBeenCalledWith(1, 20, false);
      });
      
      // Should display posts after loading
      await waitFor(() => {
        expect(screen.getByText(mockPost1.content)).toBeInTheDocument();
        expect(screen.getByText(mockPost2.content)).toBeInTheDocument();
      });
      
      // Loading should be gone
      expect(screen.queryByText(/loading posts/i)).not.toBeInTheDocument();
    });

    it('should not fetch posts if already loaded', async () => {
      // Mock posts already in context
      mockPostsService.fetchPosts.mockResolvedValue(mockPostsResponse);
      
      // First render
      const { rerender } = render(
        <TestWrapper>
          <FeedPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(mockPostsService.fetchPosts).toHaveBeenCalledTimes(1);
      });
      
      // Re-render should not trigger another fetch
      rerender(
        <TestWrapper>
          <FeedPage />
        </TestWrapper>
      );
      
      // Should still only be called once
      expect(mockPostsService.fetchPosts).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading States', () => {
    it('should display skeleton loading during fetch', async () => {
      let resolvePromise: (value: PostsListResponse) => void;
      const promise = new Promise<PostsListResponse>((resolve) => {
        resolvePromise = resolve;
      });
      
      mockPostsService.fetchPosts.mockReturnValue(promise);
      
      render(
        <TestWrapper>
          <FeedPage />
        </TestWrapper>
      );
      
      // Should show loading skeleton
      expect(screen.getByText(/loading posts/i)).toBeInTheDocument();
      
      // Should show skeleton cards
      const skeletons = screen.getAllByTestId('post-skeleton');
      expect(skeletons).toHaveLength(5); // Default skeleton count
      
      // Resolve the promise
      await waitFor(async () => {
        resolvePromise!(mockPostsResponse);
      });
      
      // Loading should be gone
      await waitFor(() => {
        expect(screen.queryByText(/loading posts/i)).not.toBeInTheDocument();
      });
    });

    it('should show proper loading text', () => {
      mockPostsService.fetchPosts.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(
        <TestWrapper>
          <FeedPage />
        </TestWrapper>
      );
      
      expect(screen.getByText('Loading posts...')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should display error state when fetch fails', async () => {
      const errorMessage = 'Failed to fetch posts';
      mockPostsService.fetchPosts.mockRejectedValue(new Error(errorMessage));
      
      render(
        <TestWrapper>
          <FeedPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load posts/i)).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('should handle retry functionality', async () => {
      let callCount = 0;
      mockPostsService.fetchPosts.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(mockPostsResponse);
      });
      
      render(
        <TestWrapper>
          <FeedPage />
        </TestWrapper>
      );
      
      // Should show error first
      await waitFor(() => {
        expect(screen.getByText(/failed to load posts/i)).toBeInTheDocument();
      });
      
      // Click retry
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      
      // Should show loading again
      expect(screen.getByText(/loading posts/i)).toBeInTheDocument();
      
      // Should eventually show posts
      await waitFor(() => {
        expect(screen.getByText(mockPost1.content)).toBeInTheDocument();
      });
      
      expect(mockPostsService.fetchPosts).toHaveBeenCalledTimes(2);
    });

    it('should show proper error message with icon', async () => {
      mockPostsService.fetchPosts.mockRejectedValue(new Error('Network error'));
      
      render(
        <TestWrapper>
          <FeedPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load posts')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
        
        // Should have error icon
        const errorIcon = screen.getByTestId('error-icon');
        expect(errorIcon).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no posts exist', async () => {
      mockPostsService.fetchPosts.mockResolvedValue(emptyPostsResponse);
      
      render(
        <TestWrapper>
          <FeedPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/no posts yet/i)).toBeInTheDocument();
        expect(screen.getByText(/be the first to share some intelligence/i)).toBeInTheDocument();
      });
      
      // Should have empty state icon
      const emptyIcon = screen.getByTestId('empty-icon');
      expect(emptyIcon).toBeInTheDocument();
    });

    it('should show encouraging message in empty state', async () => {
      mockPostsService.fetchPosts.mockResolvedValue(emptyPostsResponse);
      
      render(
        <TestWrapper>
          <FeedPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('No posts yet')).toBeInTheDocument();
        expect(screen.getByText('Be the first to share some intelligence! Posts will appear here once created.')).toBeInTheDocument();
      });
    });
  });

  describe('Posts Display', () => {
    it('should display posts in a list format', async () => {
      mockPostsService.fetchPosts.mockResolvedValue(mockPostsResponse);
      
      render(
        <TestWrapper>
          <FeedPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(mockPost1.content)).toBeInTheDocument();
        expect(screen.getByText(mockPost2.content)).toBeInTheDocument();
      });
      
      // Should have proper spacing between posts
      const postsList = screen.getByTestId('posts-list');
      expect(postsList).toHaveClass('space-y-6');
    });

    it('should handle post click interactions', async () => {
      mockPostsService.fetchPosts.mockResolvedValue(mockPostsResponse);
      
      render(
        <TestWrapper>
          <FeedPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(mockPost1.content)).toBeInTheDocument();
      });
      
      // Posts should be clickable (for future navigation)
      const postCards = screen.getAllByRole('article');
      expect(postCards).toHaveLength(2);
    });
  });

  describe('Refresh Functionality', () => {
    it('should provide refresh capability', async () => {
      mockPostsService.fetchPosts.mockResolvedValue(mockPostsResponse);
      
      render(
        <TestWrapper>
          <FeedPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(mockPost1.content)).toBeInTheDocument();
      });
      
      // Should have refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
      
      // Click refresh
      fireEvent.click(refreshButton);
      
      // Should trigger another fetch
      await waitFor(() => {
        expect(mockPostsService.fetchPosts).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper page structure and landmarks', async () => {
      mockPostsService.fetchPosts.mockResolvedValue(mockPostsResponse);
      
      render(
        <TestWrapper>
          <FeedPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(mockPost1.content)).toBeInTheDocument();
      });
      
      // Should have main content area
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Should have proper heading structure
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should announce loading state to screen readers', () => {
      mockPostsService.fetchPosts.mockImplementation(() => new Promise(() => {}));
      
      render(
        <TestWrapper>
          <FeedPage />
        </TestWrapper>
      );
      
      // Should have aria-live region for loading
      const loadingRegion = screen.getByText(/loading posts/i);
      expect(loadingRegion.closest('[aria-live]')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-fetch posts unnecessarily', async () => {
      mockPostsService.fetchPosts.mockResolvedValue(mockPostsResponse);
      
      const { rerender } = render(
        <TestWrapper>
          <FeedPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(mockPostsService.fetchPosts).toHaveBeenCalledTimes(1);
      });
      
      // Re-render multiple times
      rerender(<TestWrapper><FeedPage /></TestWrapper>);
      rerender(<TestWrapper><FeedPage /></TestWrapper>);
      
      // Should still only be called once
      expect(mockPostsService.fetchPosts).toHaveBeenCalledTimes(1);
    });
  });
}); 