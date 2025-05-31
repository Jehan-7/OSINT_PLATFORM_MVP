// PostsService Tests - Following established authService test patterns
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PostsService } from '../../services/postsService';
import { apiClient } from '../../services/api';
import type { 
  PostsListResponse, 
  SinglePostResponse, 
  Post,
  PostApiErrorResponse 
} from '../../types';

// Mock the API client
vi.mock('../../services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApiClient = vi.mocked(apiClient);

// Mock data matching backend response structure
const mockPost1: Post = {
  id: 1,
  content: 'Intelligence gathering spotted increased activity in downtown area. Multiple unmarked vehicles observed.',
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
  content: 'Noticed unusual communication patterns on local frequencies. Requires further investigation.',
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

const mockSinglePostResponse: SinglePostResponse = {
  success: true,
  post: mockPost1,
};

describe('PostsService', () => {
  let postsService: PostsService;

  beforeEach(() => {
    vi.clearAllMocks();
    postsService = new PostsService();
  });

  describe('fetchPosts()', () => {
    it('should return paginated posts list with default parameters', async () => {
      mockApiClient.get.mockResolvedValue(mockPostsResponse);

      const result = await postsService.fetchPosts();
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/posts?page=1&limit=20');
      expect(result).toEqual(mockPostsResponse);
      expect(result.posts).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should handle custom pagination parameters', async () => {
      const customResponse: PostsListResponse = {
        ...mockPostsResponse,
        pagination: { ...mockPostsResponse.pagination, page: 2, limit: 10 },
      };

      mockApiClient.get.mockResolvedValue(customResponse);

      const result = await postsService.fetchPosts(2, 10);
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/posts?page=2&limit=10');
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
    });

    it('should handle network errors gracefully', async () => {
      mockApiClient.get.mockRejectedValue({
        message: 'Network error: No response from server',
        code: 'NETWORK_ERROR',
      });

      await expect(postsService.fetchPosts()).rejects.toThrow('Network error: No response from server');
    });

    it('should handle 500 server errors', async () => {
      const errorResponse = {
        message: 'Internal server error',
        status: 500,
        code: 'SERVER_ERROR',
      };

      mockApiClient.get.mockRejectedValue(errorResponse);

      await expect(postsService.fetchPosts()).rejects.toThrow('Internal server error');
    });

    it('should handle API error responses', async () => {
      const apiError = {
        message: 'Validation failed',
        status: 400,
        code: 'VALIDATION_ERROR',
      };

      mockApiClient.get.mockRejectedValue(apiError);

      await expect(postsService.fetchPosts()).rejects.toThrow('Validation failed');
    });
  });

  describe('fetchPostById()', () => {
    it('should return single post by ID', async () => {
      mockApiClient.get.mockResolvedValue(mockSinglePostResponse);

      const result = await postsService.fetchPostById(1);
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/posts/1');
      expect(result.post).toMatchObject(mockPost1);
      expect(result.post.id).toBe(1);
    });

    it('should handle 404 for non-existent post', async () => {
      const notFoundError = {
        message: 'Post not found',
        status: 404,
        code: 'POST_NOT_FOUND',
      };

      mockApiClient.get.mockRejectedValue(notFoundError);

      await expect(postsService.fetchPostById(999)).rejects.toThrow('Post not found');
    });

    it('should validate post ID parameter', async () => {
      await expect(postsService.fetchPostById(-1)).rejects.toThrow('Invalid post ID');
      await expect(postsService.fetchPostById(0)).rejects.toThrow('Invalid post ID');
      
      // Should not make API call for invalid IDs
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('should handle network errors for single post fetch', async () => {
      mockApiClient.get.mockRejectedValue({
        message: 'Network error: No response from server',
        code: 'NETWORK_ERROR',
      });

      await expect(postsService.fetchPostById(1)).rejects.toThrow('Network error: No response from server');
    });
  });

  describe('Error Handling', () => {
    it('should categorize different error types correctly', async () => {
      const validationError = {
        message: 'Validation failed',
        status: 400,
        code: 'VALIDATION_ERROR',
        details: { errors: ['Invalid pagination parameters'] },
      };

      mockApiClient.get.mockRejectedValue(validationError);

      await expect(postsService.fetchPosts()).rejects.toThrow('Validation failed');
    });

    it('should provide meaningful error messages for authentication required', async () => {
      const authError = {
        message: 'Authentication required',
        status: 401,
        code: 'AUTH_REQUIRED',
      };

      mockApiClient.get.mockRejectedValue(authError);

      await expect(postsService.fetchPosts()).rejects.toThrow('Authentication required');
    });

    it('should handle unknown errors gracefully', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Unknown error'));

      await expect(postsService.fetchPosts()).rejects.toThrow('Unknown error');
    });
  });

  describe('Service Configuration', () => {
    it('should use correct API endpoints', async () => {
      mockApiClient.get.mockResolvedValue(mockPostsResponse);

      await postsService.fetchPosts();
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/posts?page=1&limit=20');

      await postsService.fetchPostById(1);
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/posts/1');
    });

    it('should handle default parameter values correctly', async () => {
      mockApiClient.get.mockResolvedValue(mockPostsResponse);

      // Test with no parameters
      await postsService.fetchPosts();
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/posts?page=1&limit=20');

      // Test with partial parameters
      await postsService.fetchPosts(3);
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/posts?page=3&limit=20');
    });
  });
}); 