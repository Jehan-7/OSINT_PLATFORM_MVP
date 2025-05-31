// PostsContext Tests - Following established AuthContext test patterns
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostsProvider, usePosts } from '../../contexts/PostsContext';
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

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <PostsProvider>{children}</PostsProvider>
);

describe('PostsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty posts and loading false', () => {
      const { result } = renderHook(() => usePosts(), { wrapper: TestWrapper });
      
      expect(result.current.posts).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.pagination).toBeNull();
      expect(result.current.lastFetched).toBeNull();
    });

    it('should provide all required context methods', () => {
      const { result } = renderHook(() => usePosts(), { wrapper: TestWrapper });
      
      expect(typeof result.current.fetchPosts).toBe('function');
      expect(typeof result.current.fetchPostById).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.refreshPosts).toBe('function');
      expect(typeof result.current.addPost).toBe('function');
    });
  });

  describe('fetchPosts()', () => {
    it('should handle fetchPosts success', async () => {
      mockPostsService.fetchPosts.mockResolvedValue(mockPostsResponse);
      
      const { result } = renderHook(() => usePosts(), { wrapper: TestWrapper });
      
      await act(async () => {
        await result.current.fetchPosts();
      });
      
      expect(result.current.posts).toEqual(mockPostsResponse.posts);
      expect(result.current.pagination).toEqual(mockPostsResponse.pagination);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastFetched).toBeInstanceOf(Date);
    });

    it('should handle fetchPosts error', async () => {
      const errorMessage = 'Failed to fetch posts';
      mockPostsService.fetchPosts.mockRejectedValue(new Error(errorMessage));
      
      const { result } = renderHook(() => usePosts(), { wrapper: TestWrapper });
      
      await act(async () => {
        await result.current.fetchPosts();
      });
      
      expect(result.current.posts).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.pagination).toBeNull();
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: PostsListResponse) => void;
      const promise = new Promise<PostsListResponse>((resolve) => {
        resolvePromise = resolve;
      });
      
      mockPostsService.fetchPosts.mockReturnValue(promise);
      
      const { result } = renderHook(() => usePosts(), { wrapper: TestWrapper });
      
      act(() => {
        result.current.fetchPosts();
      });
      
      // Should be loading
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      
      await act(async () => {
        resolvePromise!(mockPostsResponse);
      });
      
      // Should finish loading
      expect(result.current.loading).toBe(false);
      expect(result.current.posts).toEqual(mockPostsResponse.posts);
    });

    it('should handle custom pagination parameters', async () => {
      mockPostsService.fetchPosts.mockResolvedValue(mockPostsResponse);
      
      const { result } = renderHook(() => usePosts(), { wrapper: TestWrapper });
      
      await act(async () => {
        await result.current.fetchPosts(2, 10);
      });
      
      expect(mockPostsService.fetchPosts).toHaveBeenCalledWith(2, 10);
      expect(result.current.posts).toEqual(mockPostsResponse.posts);
    });
  });

  describe('fetchPostById()', () => {
    it('should fetch single post by ID', async () => {
      const singlePostResponse = {
        success: true as const,
        post: mockPost1,
      };
      
      mockPostsService.fetchPostById.mockResolvedValue(singlePostResponse);
      
      const { result } = renderHook(() => usePosts(), { wrapper: TestWrapper });
      
      let fetchedPost: Post | null = null;
      await act(async () => {
        fetchedPost = await result.current.fetchPostById(1);
      });
      
      expect(mockPostsService.fetchPostById).toHaveBeenCalledWith(1);
      expect(fetchedPost).toEqual(mockPost1);
    });

    it('should handle fetchPostById error', async () => {
      mockPostsService.fetchPostById.mockRejectedValue(new Error('Post not found'));
      
      const { result } = renderHook(() => usePosts(), { wrapper: TestWrapper });
      
      let fetchedPost: Post | null = null;
      await act(async () => {
        fetchedPost = await result.current.fetchPostById(999);
      });
      
      expect(fetchedPost).toBeNull();
    });
  });

  describe('Error Management', () => {
    it('should clear error state', async () => {
      mockPostsService.fetchPosts.mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => usePosts(), { wrapper: TestWrapper });
      
      // Trigger error
      await act(async () => {
        await result.current.fetchPosts();
      });
      
      expect(result.current.error).toBe('Network error');
      
      // Clear error
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('Cache Management', () => {
    it('should cache posts and avoid redundant API calls', async () => {
      mockPostsService.fetchPosts.mockResolvedValue(mockPostsResponse);
      
      const { result } = renderHook(() => usePosts(), { wrapper: TestWrapper });
      
      // First fetch
      await act(async () => {
        await result.current.fetchPosts();
      });
      
      expect(mockPostsService.fetchPosts).toHaveBeenCalledTimes(1);
      
      // Second fetch (should use cache)
      await act(async () => {
        await result.current.fetchPosts();
      });
      
      expect(mockPostsService.fetchPosts).toHaveBeenCalledTimes(1); // Still only called once
      expect(result.current.posts).toEqual(mockPostsResponse.posts);
    });

    it('should force refresh when requested', async () => {
      mockPostsService.fetchPosts.mockResolvedValue(mockPostsResponse);
      
      const { result } = renderHook(() => usePosts(), { wrapper: TestWrapper });
      
      // First fetch
      await act(async () => {
        await result.current.fetchPosts();
      });
      
      expect(mockPostsService.fetchPosts).toHaveBeenCalledTimes(1);
      
      // Force refresh
      await act(async () => {
        await result.current.fetchPosts(1, 20, true);
      });
      
      expect(mockPostsService.fetchPosts).toHaveBeenCalledTimes(2); // Called twice due to force refresh
    });

    it('should refresh posts using refreshPosts method', async () => {
      mockPostsService.fetchPosts.mockResolvedValue(mockPostsResponse);
      
      const { result } = renderHook(() => usePosts(), { wrapper: TestWrapper });
      
      // Initial fetch
      await act(async () => {
        await result.current.fetchPosts();
      });
      
      expect(mockPostsService.fetchPosts).toHaveBeenCalledTimes(1);
      
      // Refresh
      await act(async () => {
        await result.current.refreshPosts();
      });
      
      expect(mockPostsService.fetchPosts).toHaveBeenCalledTimes(2);
    });
  });

  describe('Post Management', () => {
    it('should add new post to existing posts', () => {
      const { result } = renderHook(() => usePosts(), { wrapper: TestWrapper });
      
      // Set initial posts
      act(() => {
        result.current.addPost(mockPost1);
      });
      
      expect(result.current.posts).toEqual([mockPost1]);
      
      // Add another post
      act(() => {
        result.current.addPost(mockPost2);
      });
      
      expect(result.current.posts).toEqual([mockPost2, mockPost1]); // New posts at beginning
    });
  });

  describe('Hook Usage', () => {
    it('should throw error when used outside PostsProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => usePosts());
      }).toThrow('usePosts must be used within a PostsProvider');
      
      consoleSpy.mockRestore();
    });
  });
}); 