import { Request, Response } from 'express';
import { PostService } from '../services/post';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * PostController handles HTTP requests for post-related operations.
 * Implements RESTful endpoints for creating, reading, and managing posts.
 * Follows consistent error handling and response formatting patterns.
 */
export class PostController {
  private postService: PostService;

  constructor() {
    this.postService = PostService.getInstance();
  }

  /**
   * Create a new post (requires authentication)
   * POST /api/v1/posts
   */
  public async createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { content, latitude, longitude, location_name } = req.body;
      const author_id = req.user!.userId;

      // Create post data object
      const postData = {
        author_id,
        content,
        latitude,
        longitude,
        location_name
      };

      // Create the post
      const newPost = await this.postService.createPost(postData);

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: newPost
      });
    } catch (error: any) {
      // Handle specific database errors
      if (error.code === '23503') {
        res.status(400).json({
          success: false,
          message: 'Invalid author reference'
        });
        return;
      }

      // Handle validation errors from service layer
      if (error.message && error.message.includes('validation')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      // Generic server error
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get a post by ID (public endpoint)
   * GET /api/v1/posts/:id
   */
  public async getPostById(req: Request, res: Response): Promise<void> {
    try {
      const postId = parseInt(req.params.id || '0');

      // Validate post ID format
      if (isNaN(postId) || postId <= 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid post ID format'
        });
        return;
      }

      // Get the post
      const post = await this.postService.getPostById(postId);

      if (!post) {
        res.status(404).json({
          success: false,
          message: 'Post not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: post
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get paginated list of posts (public endpoint)
   * GET /api/v1/posts
   */
  public async getPosts(req: Request, res: Response): Promise<void> {
    try {
      // Pagination parameters should already be validated by middleware
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const paginationOptions = { page, limit };

      // Get paginated posts
      const result = await this.postService.getPosts(paginationOptions);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get posts by a specific author (public endpoint)
   * GET /api/v1/users/:userId/posts
   */
  public async getPostsByAuthor(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId || '0');

      // Validate user ID format
      if (isNaN(userId) || userId <= 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
        return;
      }

      // Pagination parameters should already be validated by middleware
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const paginationOptions = { page, limit };

      // Get posts by author
      const result = await this.postService.getPostsByAuthor(userId, paginationOptions);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
} 