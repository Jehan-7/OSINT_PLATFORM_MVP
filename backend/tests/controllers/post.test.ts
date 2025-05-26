import request from 'supertest';
import express from 'express';
import { PostController } from '../../src/controllers/post';
import { PostService, postService } from '../../src/services/post';
import { JWTService } from '../../src/services/jwt';
import { authenticateToken } from '../../src/middleware/auth';
import { validatePostCreation, validatePostQuery } from '../../src/middleware/validation';

// Mock the services
jest.mock('../../src/services/post', () => ({
  PostService: {
    getInstance: jest.fn()
  },
  postService: {
    validatePostData: jest.fn(),
    sanitizeContent: jest.fn(),
    createPost: jest.fn(),
    getPostById: jest.fn(),
    getPosts: jest.fn(),
    getPostsByAuthor: jest.fn()
  }
}));
jest.mock('../../src/services/jwt');

describe('PostController', () => {
  let app: express.Application;
  let postController: PostController;
  let mockPostService: jest.Mocked<PostService>;
  let mockJWTService: jest.Mocked<JWTService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockPostService = {
      createPost: jest.fn(),
      getPostById: jest.fn(),
      getPosts: jest.fn(),
      getPostsByAuthor: jest.fn(),
      validatePostData: jest.fn(),
      sanitizeContent: jest.fn(),
    } as any;

    mockJWTService = {
      verifyToken: jest.fn(),
      extractTokenFromHeader: jest.fn(),
    } as any;

    // Mock the service getInstance methods
    (PostService.getInstance as jest.Mock) = jest.fn().mockReturnValue(mockPostService);
    (JWTService as any).prototype.extractTokenFromHeader = mockJWTService.extractTokenFromHeader;
    (JWTService as any).prototype.verifyToken = mockJWTService.verifyToken;

    // Create controller instance
    postController = new PostController();

    // Setup Express app with routes
    app = express();
    app.use(express.json());
    
    // Setup routes
    app.post('/api/v1/posts', authenticateToken, validatePostCreation, postController.createPost.bind(postController));
    app.get('/api/v1/posts/:id', postController.getPostById.bind(postController));
    app.get('/api/v1/posts', validatePostQuery, postController.getPosts.bind(postController));
    app.get('/api/v1/users/:userId/posts', validatePostQuery, postController.getPostsByAuthor.bind(postController));
  });

  describe('POST /api/v1/posts - createPost', () => {
    const validPostData = {
      content: 'Test post content',
      latitude: 40.7128,
      longitude: -74.0060,
      location_name: 'New York, NY'
    };

    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com'
    };

    const mockCreatedPost = {
      id: 1,
      author_id: 1,
      content: 'Test post content',
      latitude: 40.7128,
      longitude: -74.0060,
      location_name: 'New York, NY',
      upvotes: 0,
      downvotes: 0,
      created_at: new Date(),
      updated_at: new Date(),
      author: {
        id: 1,
        username: 'testuser',
        reputation: 0
      }
    };

    beforeEach(() => {
      // Mock authentication middleware
      mockJWTService.extractTokenFromHeader.mockReturnValue('valid-token');
      mockJWTService.verifyToken.mockResolvedValue({ userId: 1, username: 'testuser', email: 'test@example.com', iat: Date.now(), exp: Date.now() + 3600 } as any);
      
      // Mock validation methods for middleware (both instances)
      mockPostService.validatePostData.mockReturnValue({ isValid: true, errors: [] });
      mockPostService.sanitizeContent.mockImplementation((content: string) => content);
      (postService.validatePostData as jest.Mock).mockReturnValue({ isValid: true, errors: [] });
      (postService.sanitizeContent as jest.Mock).mockImplementation((content: string) => content);
      
      // Mock post creation
      mockPostService.createPost.mockResolvedValue(mockCreatedPost);
    });

    it('should create a post successfully with authentication', async () => {
      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer valid-token')
        .send(validPostData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        message: 'Post created successfully',
        data: expect.objectContaining({
          id: mockCreatedPost.id,
          author_id: mockCreatedPost.author_id,
          content: mockCreatedPost.content,
          latitude: mockCreatedPost.latitude,
          longitude: mockCreatedPost.longitude,
          location_name: mockCreatedPost.location_name,
          upvotes: mockCreatedPost.upvotes,
          downvotes: mockCreatedPost.downvotes,
          created_at: expect.any(String),
          updated_at: expect.any(String),
          author: mockCreatedPost.author
        })
      });

      expect(mockPostService.createPost).toHaveBeenCalledWith({
        author_id: 1,
        content: 'Test post content',
        latitude: 40.7128,
        longitude: -74.0060,
        location_name: 'New York, NY'
      });
    });

    it('should create a post without location_name', async () => {
      const postDataWithoutLocation = {
        content: 'Test post content',
        latitude: 40.7128,
        longitude: -74.0060
      };

              const { location_name, ...mockCreatedPostNoLocation } = mockCreatedPost;

      mockPostService.createPost.mockResolvedValue(mockCreatedPostNoLocation);

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer valid-token')
        .send(postDataWithoutLocation);

      expect(response.status).toBe(201);
      expect(mockPostService.createPost).toHaveBeenCalledWith({
        author_id: 1,
        content: 'Test post content',
        latitude: 40.7128,
        longitude: -74.0060,
        location_name: undefined
      });
    });

    it('should reject post creation without authentication', async () => {
      mockJWTService.extractTokenFromHeader.mockReturnValue(null);

      const response = await request(app)
        .post('/api/v1/posts')
        .send(validPostData);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Access token is required'
      });
    });

    it('should reject post creation with invalid token', async () => {
      mockJWTService.extractTokenFromHeader.mockReturnValue('invalid-token');
      mockJWTService.verifyToken.mockResolvedValue(null as any);

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer invalid-token')
        .send(validPostData);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired token'
      });
    });

    it('should handle validation errors', async () => {
      // Override the validation mock for this test to return validation errors
      (postService.validatePostData as jest.Mock).mockReturnValue({ 
        isValid: false, 
        errors: ['Content cannot be empty'] 
      });

      const invalidPostData = {
        content: '', // Empty content should fail validation
        latitude: 40.7128,
        longitude: -74.0060
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidPostData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Content cannot be empty');
    });

    it('should handle service layer errors', async () => {
      mockPostService.createPost.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer valid-token')
        .send(validPostData);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error'
      });
    });

    it('should handle foreign key constraint errors', async () => {
      const foreignKeyError = new Error('Foreign key constraint violation');
      (foreignKeyError as any).code = '23503';
      mockPostService.createPost.mockRejectedValue(foreignKeyError);

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer valid-token')
        .send(validPostData);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid author reference'
      });
    });
  });

  describe('GET /api/v1/posts/:id - getPostById', () => {
    const mockPost = {
      id: 1,
      author_id: 1,
      content: 'Test post content',
      latitude: 40.7128,
      longitude: -74.0060,
      location_name: 'New York, NY',
      upvotes: 0,
      downvotes: 0,
      created_at: new Date(),
      updated_at: new Date(),
      author: {
        id: 1,
        username: 'testuser',
        reputation: 0
      }
    };

    it('should get a post by ID successfully', async () => {
      mockPostService.getPostById.mockResolvedValue(mockPost);

      const response = await request(app)
        .get('/api/v1/posts/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: mockPost.id,
          author_id: mockPost.author_id,
          content: mockPost.content,
          latitude: mockPost.latitude,
          longitude: mockPost.longitude,
          location_name: mockPost.location_name,
          upvotes: mockPost.upvotes,
          downvotes: mockPost.downvotes,
          created_at: expect.any(String),
          updated_at: expect.any(String),
          author: mockPost.author
        })
      });

      expect(mockPostService.getPostById).toHaveBeenCalledWith(1);
    });

    it('should return 404 for non-existent post', async () => {
      mockPostService.getPostById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/posts/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: 'Post not found'
      });
    });

    it('should handle invalid post ID format', async () => {
      const response = await request(app)
        .get('/api/v1/posts/invalid');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid post ID format'
      });
    });

    it('should handle service layer errors', async () => {
      mockPostService.getPostById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/posts/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error'
      });
    });
  });

  describe('GET /api/v1/posts - getPosts', () => {
    const mockPaginatedPosts = {
      posts: [
        {
          id: 1,
          author_id: 1,
          content: 'Test post 1',
          latitude: 40.7128,
          longitude: -74.0060,
          location_name: 'New York, NY',
          upvotes: 5,
          downvotes: 1,
          created_at: new Date(),
          updated_at: new Date(),
          author: { id: 1, username: 'user1', reputation: 10 }
        },
        {
          id: 2,
          author_id: 2,
          content: 'Test post 2',
          latitude: 34.0522,
          longitude: -118.2437,
          location_name: 'Los Angeles, CA',
          upvotes: 3,
          downvotes: 0,
          created_at: new Date(),
          updated_at: new Date(),
          author: { id: 2, username: 'user2', reputation: 5 }
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false
      }
    };

    it('should get posts with default pagination', async () => {
      mockPostService.getPosts.mockResolvedValue(mockPaginatedPosts);

      const response = await request(app)
        .get('/api/v1/posts');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(mockPaginatedPosts.posts.length);
      expect(response.body.data.pagination).toEqual(mockPaginatedPosts.pagination);
      // Check posts structure with date strings
      response.body.data.posts.forEach((post: any, index: number) => {
        const expectedPost = mockPaginatedPosts.posts[index];
        expect(expectedPost).toBeDefined();
        expect(post).toMatchObject({
          id: expectedPost!.id,
          author_id: expectedPost!.author_id,
          content: expectedPost!.content,
          latitude: expectedPost!.latitude,
          longitude: expectedPost!.longitude,
          location_name: expectedPost!.location_name,
          upvotes: expectedPost!.upvotes,
          downvotes: expectedPost!.downvotes,
          author: expectedPost!.author
        });
        expect(typeof post.created_at).toBe('string');
        expect(typeof post.updated_at).toBe('string');
      });

      expect(mockPostService.getPosts).toHaveBeenCalledWith({
        page: 1,
        limit: 20
      });
    });

    it('should get posts with custom pagination', async () => {
      const customPaginatedPosts = {
        ...mockPaginatedPosts,
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasNext: true,
          hasPrevious: true
        }
      };

      mockPostService.getPosts.mockResolvedValue(customPaginatedPosts);

      const response = await request(app)
        .get('/api/v1/posts?page=2&limit=10');

      expect(response.status).toBe(200);
      expect(mockPostService.getPosts).toHaveBeenCalledWith({
        page: 2,
        limit: 10
      });
    });

    it('should handle validation errors for invalid pagination', async () => {
      const response = await request(app)
        .get('/api/v1/posts?page=0&limit=200');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle service layer errors', async () => {
      mockPostService.getPosts.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/posts');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error'
      });
    });
  });

  describe('GET /api/v1/users/:userId/posts - getPostsByAuthor', () => {
    const mockAuthorPosts = {
      posts: [
        {
          id: 1,
          author_id: 1,
          content: 'Author post 1',
          latitude: 40.7128,
          longitude: -74.0060,
          location_name: 'New York, NY',
          upvotes: 5,
          downvotes: 1,
          created_at: new Date(),
          updated_at: new Date(),
          author: { id: 1, username: 'testuser', reputation: 0 }
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false
      }
    };

    it('should get posts by author successfully', async () => {
      mockPostService.getPostsByAuthor.mockResolvedValue(mockAuthorPosts);

      const response = await request(app)
        .get('/api/v1/users/1/posts');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(mockAuthorPosts.posts.length);
      expect(response.body.data.pagination).toEqual(mockAuthorPosts.pagination);
      // Check post structure with date strings
      const post = response.body.data.posts[0];
      const expectedPost = mockAuthorPosts.posts[0];
      expect(expectedPost).toBeDefined();
      expect(post).toMatchObject({
        id: expectedPost!.id,
        author_id: expectedPost!.author_id,
        content: expectedPost!.content,
        latitude: expectedPost!.latitude,
        longitude: expectedPost!.longitude,
        location_name: expectedPost!.location_name,
        upvotes: expectedPost!.upvotes,
        downvotes: expectedPost!.downvotes,
        author: expectedPost!.author
      });
      expect(typeof post.created_at).toBe('string');
      expect(typeof post.updated_at).toBe('string');

      expect(mockPostService.getPostsByAuthor).toHaveBeenCalledWith(1, {
        page: 1,
        limit: 20
      });
    });

    it('should handle invalid user ID format', async () => {
      const response = await request(app)
        .get('/api/v1/users/invalid/posts');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid user ID format'
      });
    });

    it('should get posts by author with custom pagination', async () => {
      mockPostService.getPostsByAuthor.mockResolvedValue(mockAuthorPosts);

      const response = await request(app)
        .get('/api/v1/users/1/posts?page=2&limit=5');

      expect(response.status).toBe(200);
      expect(mockPostService.getPostsByAuthor).toHaveBeenCalledWith(1, {
        page: 2,
        limit: 5
      });
    });

    it('should handle service layer errors', async () => {
      mockPostService.getPostsByAuthor.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/users/1/posts');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      mockJWTService.extractTokenFromHeader.mockReturnValue('valid-token');
      mockJWTService.verifyToken.mockResolvedValue({ userId: 1, username: 'testuser', email: 'test@example.com', iat: Date.now(), exp: Date.now() + 3600 } as any);

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer valid-token')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
      // Express handles malformed JSON and returns 400 status
      // The exact error format can vary, but status 400 is the important check
    });

    it('should handle missing request body', async () => {
      // Override validation to return error for missing content
      (postService.validatePostData as jest.Mock).mockReturnValue({ 
        isValid: false, 
        errors: ['Content is required and must be a string'] 
      });

      mockJWTService.extractTokenFromHeader.mockReturnValue('valid-token');
      mockJWTService.verifyToken.mockResolvedValue({ userId: 1, username: 'testuser', email: 'test@example.com', iat: Date.now(), exp: Date.now() + 3600 } as any);

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer valid-token')
        .send();

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Response Format Consistency', () => {
    it('should always return consistent success response format', async () => {
      const mockPost = {
        id: 1,
        author_id: 1,
        content: 'Test post',
        latitude: 40.7128,
        longitude: -74.0060,
        location_name: 'New York, NY',
        upvotes: 0,
        downvotes: 0,
        created_at: new Date(),
        updated_at: new Date(),
        author: { id: 1, username: 'testuser', reputation: 0 }
      };

      mockPostService.getPostById.mockResolvedValue(mockPost);

      const response = await request(app)
        .get('/api/v1/posts/1');

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).not.toHaveProperty('error');
    });

    it('should always return consistent error response format', async () => {
      mockPostService.getPostById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/posts/999');

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).not.toHaveProperty('data');
    });
  });
}); 