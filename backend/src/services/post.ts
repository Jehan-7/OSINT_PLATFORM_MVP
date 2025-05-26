import { db } from './database';

/**
 * Post creation data interface
 */
export interface CreatePostData {
  author_id: number;
  content: string;
  latitude: number;
  longitude: number;
  location_name?: string;
}

/**
 * Post data interface (database representation)
 */
export interface Post {
  id: number;
  author_id: number;
  content: string;
  latitude: number;
  longitude: number;
  location_name?: string;
  upvotes: number;
  downvotes: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Post with author information interface
 */
export interface PostWithAuthor extends Post {
  author: {
    id: number;
    username: string;
    reputation: number;
  };
}

/**
 * Pagination options interface
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Paginated posts result interface
 */
export interface PaginatedPostsResult {
  posts: PostWithAuthor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Post validation result interface
 */
export interface PostValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Post service for OSINT Platform
 * Handles post CRUD operations with geospatial support
 * Sprint 2: Core post functionality with location-based intelligence
 */
export class PostService {
  private static instance: PostService;

  private constructor() {}

  /**
   * Get singleton instance of PostService
   */
  public static getInstance(): PostService {
    if (!PostService.instance) {
      PostService.instance = new PostService();
    }
    return PostService.instance;
  }

  /**
   * Create a new post with geospatial coordinates
   * @param postData - Post creation data
   * @returns Promise<Post> - Created post
   */
  async createPost(postData: CreatePostData): Promise<Post> {
    // Validate post data
    const validation = this.validatePostData(postData);
    if (!validation.isValid) {
      throw new Error(`Post validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      const result = await db.query(`
        INSERT INTO posts (author_id, content, latitude, longitude, location_name, upvotes, downvotes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, author_id, content, latitude, longitude, location_name, upvotes, downvotes, created_at, updated_at
      `, [
        postData.author_id,
        postData.content,
        postData.latitude,
        postData.longitude,
        postData.location_name || null,
        0, // Initial upvotes
        0  // Initial downvotes
      ]);

      if (result.rows.length === 0) {
        throw new Error('Failed to create post');
      }

      return this.mapRowToPost(result.rows[0]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('foreign key constraint')) {
        throw new Error('Invalid author_id: User does not exist');
      }
      throw new Error(`Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a single post by ID with author information
   * @param postId - Post ID
   * @returns Promise<PostWithAuthor | null> - Post with author info or null if not found
   */
  async getPostById(postId: number): Promise<PostWithAuthor | null> {
    if (!Number.isInteger(postId) || postId <= 0) {
      throw new Error('Post ID must be a positive integer');
    }

    try {
      const result = await db.query(`
        SELECT 
          p.id, p.author_id, p.content, p.latitude, p.longitude, p.location_name,
          p.upvotes, p.downvotes, p.created_at, p.updated_at,
          u.username, u.reputation
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.id = $1
      `, [postId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToPostWithAuthor(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to get post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get paginated list of posts with author information
   * @param options - Pagination options
   * @returns Promise<PaginatedPostsResult> - Paginated posts with metadata
   */
  async getPosts(options: PaginationOptions = {}): Promise<PaginatedPostsResult> {
    const limit = Math.min(options.limit || 20, 100); // Max 100 posts per page
    const offset = Math.max(options.offset || 0, 0);
    const page = Math.floor(offset / limit) + 1;

    try {
      // Get total count
      const countResult = await db.query('SELECT COUNT(*) as total FROM posts');
      const total = parseInt(countResult.rows[0].total, 10);

      // Get posts with author information
      const result = await db.query(`
        SELECT 
          p.id, p.author_id, p.content, p.latitude, p.longitude, p.location_name,
          p.upvotes, p.downvotes, p.created_at, p.updated_at,
          u.username, u.reputation
        FROM posts p
        JOIN users u ON p.author_id = u.id
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      const posts = result.rows.map((row: any) => this.mapRowToPostWithAuthor(row));

      const totalPages = Math.ceil(total / limit);

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to get posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get posts by author ID
   * @param authorId - Author user ID
   * @param options - Pagination options
   * @returns Promise<PaginatedPostsResult> - Paginated posts by author
   */
  async getPostsByAuthor(authorId: number, options: PaginationOptions = {}): Promise<PaginatedPostsResult> {
    if (!Number.isInteger(authorId) || authorId <= 0) {
      throw new Error('Author ID must be a positive integer');
    }

    const limit = Math.min(options.limit || 20, 100);
    const offset = Math.max(options.offset || 0, 0);
    const page = Math.floor(offset / limit) + 1;

    try {
      // Get total count for this author
      const countResult = await db.query('SELECT COUNT(*) as total FROM posts WHERE author_id = $1', [authorId]);
      const total = parseInt(countResult.rows[0].total, 10);

      // Get posts by author
      const result = await db.query(`
        SELECT 
          p.id, p.author_id, p.content, p.latitude, p.longitude, p.location_name,
          p.upvotes, p.downvotes, p.created_at, p.updated_at,
          u.username, u.reputation
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.author_id = $1
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
      `, [authorId, limit, offset]);

      const posts = result.rows.map((row: any) => this.mapRowToPostWithAuthor(row));

      const totalPages = Math.ceil(total / limit);

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to get posts by author: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate post creation data
   * @param postData - Post data to validate
   * @returns PostValidationResult - Validation result with errors
   */
  validatePostData(postData: CreatePostData): PostValidationResult {
    const errors: string[] = [];

    // Validate author_id
    if (!Number.isInteger(postData.author_id) || postData.author_id <= 0) {
      errors.push('Author ID must be a positive integer');
    }

    // Validate content
    if (typeof postData.content !== 'string') {
      errors.push('Content is required and must be a string');
    } else if (postData.content.trim().length === 0) {
      errors.push('Content cannot be empty');
    } else if (postData.content.length > 1000) {
      errors.push('Content must be 1000 characters or less');
    }

    // Validate latitude
    if (typeof postData.latitude !== 'number') {
      errors.push('latitude must be a valid number');
    } else if (isNaN(postData.latitude)) {
      errors.push('latitude must be a valid number');
    } else if (postData.latitude < -90 || postData.latitude > 90) {
      errors.push('latitude must be between -90 and 90 degrees');
    }

    // Validate longitude
    if (typeof postData.longitude !== 'number') {
      errors.push('longitude must be a valid number');
    } else if (isNaN(postData.longitude)) {
      errors.push('longitude must be a valid number');
    } else if (postData.longitude < -180 || postData.longitude > 180) {
      errors.push('longitude must be between -180 and 180 degrees');
    }

    // Validate location_name (optional)
    if (postData.location_name !== undefined) {
      if (typeof postData.location_name !== 'string') {
        errors.push('Location name must be a string');
      } else if (postData.location_name.length > 255) {
        errors.push('Location name must be 255 characters or less');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize post content to prevent XSS attacks
   * @param content - Raw content string
   * @returns string - Sanitized content
   */
  sanitizeContent(content: string): string {
    if (typeof content !== 'string') {
      return '';
    }

    // Basic XSS prevention - remove HTML tags and dangerous characters
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers with quotes
      .replace(/on\w+\s*=\s*[^"'\s>]+/gi, '') // Remove event handlers without quotes
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .trim();
  }

  /**
   * Map database row to Post object
   * @param row - Database row
   * @returns Post - Mapped post object
   */
  private mapRowToPost(row: any): Post {
    return {
      id: row.id,
      author_id: row.author_id,
      content: row.content,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      location_name: row.location_name,
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  /**
   * Map database row to PostWithAuthor object
   * @param row - Database row with author information
   * @returns PostWithAuthor - Mapped post with author object
   */
  private mapRowToPostWithAuthor(row: any): PostWithAuthor {
    return {
      id: row.id,
      author_id: row.author_id,
      content: row.content,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      location_name: row.location_name,
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      author: {
        id: row.author_id,
        username: row.username,
        reputation: row.reputation
      }
    };
  }
}

// Export singleton instance
export const postService = PostService.getInstance(); 