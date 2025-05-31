// Posts Service - Following established authService patterns
import type { 
  PostsListResponse, 
  SinglePostResponse, 
  PostApiErrorResponse 
} from '../types';
import { apiClient } from './api';

export class PostsService {
  
  /**
   * Fetch paginated posts list
   * GET /api/v1/posts
   * Matches backend post controller exactly
   */
  async fetchPosts(page: number = 1, limit: number = 20): Promise<PostsListResponse> {
    try {
      const response = await apiClient.get<PostsListResponse>(
        `/api/v1/posts?page=${page}&limit=${limit}`
      );
      
      return response;
    } catch (error: any) {
      // Type-safe error handling matching backend responses
      const apiError = error as PostApiErrorResponse;
      throw new Error(apiError.message || 'Failed to fetch posts');
    }
  }

  /**
   * Fetch single post by ID
   * GET /api/v1/posts/:id
   * Matches backend post controller exactly
   */
  async fetchPostById(id: number): Promise<SinglePostResponse> {
    // Validate post ID parameter
    if (!id || id <= 0) {
      throw new Error('Invalid post ID');
    }

    try {
      const response = await apiClient.get<SinglePostResponse>(
        `/api/v1/posts/${id}`
      );
      
      return response;
    } catch (error: any) {
      // Type-safe error handling matching backend responses
      const apiError = error as PostApiErrorResponse;
      throw new Error(apiError.message || 'Failed to fetch post');
    }
  }

  /**
   * Create new post (for future use)
   * POST /api/v1/posts
   * Matches backend post controller exactly
   */
  async createPost(postData: {
    content: string;
    latitude: number;
    longitude: number;
    location_name?: string;
  }): Promise<SinglePostResponse> {
    try {
      const response = await apiClient.post<SinglePostResponse>(
        '/api/v1/posts',
        postData
      );
      
      return response;
    } catch (error: any) {
      // Type-safe error handling matching backend responses
      const apiError = error as PostApiErrorResponse;
      throw new Error(apiError.message || 'Failed to create post');
    }
  }
}

// Export singleton instance
export const postsService = new PostsService();
export default postsService; 