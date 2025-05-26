import { PostService, CreatePostData, PostValidationResult } from '../../src/services/post';
import { db } from '../../src/services/database';

// Mock the database service
jest.mock('../../src/services/database');
const mockDb = db as jest.Mocked<typeof db>;

describe('PostService', () => {
  let postService: PostService;

  beforeEach(() => {
    postService = PostService.getInstance();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PostService.getInstance();
      const instance2 = PostService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('validatePostData', () => {
    it('should validate correct post data', () => {
      const validPostData: CreatePostData = {
        author_id: 1,
        content: 'Valid post content',
        latitude: 40.7829,
        longitude: -73.9654,
        location_name: 'Central Park, NYC'
      };

      const result = postService.validatePostData(validPostData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid author_id', () => {
      const invalidPostData: CreatePostData = {
        author_id: -1,
        content: 'Valid content',
        latitude: 40.7829,
        longitude: -73.9654
      };

      const result = postService.validatePostData(invalidPostData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Author ID must be a positive integer');
    });

    it('should reject non-integer author_id', () => {
      const invalidPostData: CreatePostData = {
        author_id: 1.5,
        content: 'Valid content',
        latitude: 40.7829,
        longitude: -73.9654
      };

      const result = postService.validatePostData(invalidPostData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Author ID must be a positive integer');
    });

    it('should reject empty content', () => {
      const invalidPostData: CreatePostData = {
        author_id: 1,
        content: '',
        latitude: 40.7829,
        longitude: -73.9654
      };

      const result = postService.validatePostData(invalidPostData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content cannot be empty');
    });

    it('should reject content that is too long', () => {
      const invalidPostData: CreatePostData = {
        author_id: 1,
        content: 'a'.repeat(1001),
        latitude: 40.7829,
        longitude: -73.9654
      };

      const result = postService.validatePostData(invalidPostData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content must be 1000 characters or less');
    });

    it('should accept content at maximum length', () => {
      const validPostData: CreatePostData = {
        author_id: 1,
        content: 'a'.repeat(1000),
        latitude: 40.7829,
        longitude: -73.9654
      };

      const result = postService.validatePostData(validPostData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid latitude values', () => {
      const testCases = [
        { lat: 91, desc: 'latitude > 90' },
        { lat: -91, desc: 'latitude < -90' },
        { lat: NaN, desc: 'NaN latitude' }
      ];

      testCases.forEach(({ lat, desc }) => {
        const invalidPostData: CreatePostData = {
          author_id: 1,
          content: 'Valid content',
          latitude: lat,
          longitude: -73.9654
        };

        const result = postService.validatePostData(invalidPostData);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('latitude'))).toBe(true);
      });
    });

    it('should reject invalid longitude values', () => {
      const testCases = [
        { lng: 181, desc: 'longitude > 180' },
        { lng: -181, desc: 'longitude < -180' },
        { lng: NaN, desc: 'NaN longitude' }
      ];

      testCases.forEach(({ lng, desc }) => {
        const invalidPostData: CreatePostData = {
          author_id: 1,
          content: 'Valid content',
          latitude: 40.7829,
          longitude: lng
        };

        const result = postService.validatePostData(invalidPostData);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('longitude'))).toBe(true);
      });
    });

    it('should accept boundary coordinate values', () => {
      const boundaryTests = [
        { lat: 90, lng: 180, desc: 'maximum values' },
        { lat: -90, lng: -180, desc: 'minimum values' },
        { lat: 0, lng: 0, desc: 'zero values' }
      ];

      boundaryTests.forEach(({ lat, lng, desc }) => {
        const validPostData: CreatePostData = {
          author_id: 1,
          content: 'Valid content',
          latitude: lat,
          longitude: lng
        };

        const result = postService.validatePostData(validPostData);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject location_name that is too long', () => {
      const invalidPostData: CreatePostData = {
        author_id: 1,
        content: 'Valid content',
        latitude: 40.7829,
        longitude: -73.9654,
        location_name: 'a'.repeat(256)
      };

      const result = postService.validatePostData(invalidPostData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Location name must be 255 characters or less');
    });

    it('should accept optional location_name', () => {
      const validPostData: CreatePostData = {
        author_id: 1,
        content: 'Valid content',
        latitude: 40.7829,
        longitude: -73.9654
      };

      const result = postService.validatePostData(validPostData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return multiple validation errors', () => {
      const invalidPostData: CreatePostData = {
        author_id: -1,
        content: '',
        latitude: 91,
        longitude: 181
      };

      const result = postService.validatePostData(invalidPostData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Author ID must be a positive integer');
      expect(result.errors).toContain('Content cannot be empty');
      expect(result.errors.some(error => error.includes('latitude'))).toBe(true);
      expect(result.errors.some(error => error.includes('longitude'))).toBe(true);
    });
  });

  describe('sanitizeContent', () => {
    it('should remove HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const result = postService.sanitizeContent(input);
      expect(result).toBe('Hello world');
    });

    it('should remove script tags', () => {
      const input = 'Hello <script>alert("xss")</script> world';
      const result = postService.sanitizeContent(input);
      expect(result).toBe('Hello  world');
    });

    it('should remove javascript protocol', () => {
      const input = 'Click javascript:alert("xss") here';
      const result = postService.sanitizeContent(input);
      expect(result).toBe('Click alert("xss") here');
    });

    it('should remove event handlers', () => {
      const input = 'Hello onclick="alert()" world';
      const result = postService.sanitizeContent(input);
      expect(result).toBe('Hello  world');
    });

    it('should handle non-string input', () => {
      const result = postService.sanitizeContent(null as any);
      expect(result).toBe('');
    });

    it('should trim whitespace', () => {
      const input = '  Hello world  ';
      const result = postService.sanitizeContent(input);
      expect(result).toBe('Hello world');
    });
  });

  describe('createPost', () => {
    it('should create a post successfully', async () => {
      const postData: CreatePostData = {
        author_id: 1,
        content: 'Test post content',
        latitude: 40.7829,
        longitude: -73.9654,
        location_name: 'Central Park'
      };

      const mockResult = {
        rows: [{
          id: 1,
          author_id: 1,
          content: 'Test post content',
          latitude: '40.78290000',
          longitude: '-73.96540000',
          location_name: 'Central Park',
          upvotes: 0,
          downvotes: 0,
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await postService.createPost(postData);

      expect(result.id).toBe(1);
      expect(result.author_id).toBe(1);
      expect(result.content).toBe('Test post content');
      expect(result.latitude).toBe(40.7829);
      expect(result.longitude).toBe(-73.9654);
      expect(result.location_name).toBe('Central Park');
      expect(result.upvotes).toBe(0);
      expect(result.downvotes).toBe(0);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO posts'),
        [1, 'Test post content', 40.7829, -73.9654, 'Central Park', 0, 0]
      );
    });

    it('should handle null location_name', async () => {
      const postData: CreatePostData = {
        author_id: 1,
        content: 'Test post content',
        latitude: 40.7829,
        longitude: -73.9654
      };

      const mockResult = {
        rows: [{
          id: 1,
          author_id: 1,
          content: 'Test post content',
          latitude: '40.78290000',
          longitude: '-73.96540000',
          location_name: null,
          upvotes: 0,
          downvotes: 0,
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await postService.createPost(postData);

      expect(result.location_name).toBeNull();
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO posts'),
        [1, 'Test post content', 40.7829, -73.9654, null, 0, 0]
      );
    });

    it('should reject invalid post data', async () => {
      const invalidPostData: CreatePostData = {
        author_id: -1,
        content: '',
        latitude: 91,
        longitude: 181
      };

      await expect(postService.createPost(invalidPostData)).rejects.toThrow('Post validation failed');
      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it('should handle foreign key constraint error', async () => {
      const postData: CreatePostData = {
        author_id: 999,
        content: 'Test post content',
        latitude: 40.7829,
        longitude: -73.9654
      };

      const foreignKeyError = new Error('foreign key constraint violation');
      mockDb.query.mockRejectedValue(foreignKeyError);

      await expect(postService.createPost(postData)).rejects.toThrow('Invalid author_id: User does not exist');
    });

    it('should handle database errors', async () => {
      const postData: CreatePostData = {
        author_id: 1,
        content: 'Test post content',
        latitude: 40.7829,
        longitude: -73.9654
      };

      const dbError = new Error('Database connection failed');
      mockDb.query.mockRejectedValue(dbError);

      await expect(postService.createPost(postData)).rejects.toThrow('Failed to create post: Database connection failed');
    });

    it('should handle empty result from database', async () => {
      const postData: CreatePostData = {
        author_id: 1,
        content: 'Test post content',
        latitude: 40.7829,
        longitude: -73.9654
      };

      mockDb.query.mockResolvedValue({ rows: [] });

      await expect(postService.createPost(postData)).rejects.toThrow('Failed to create post');
    });
  });

  describe('getPostById', () => {
    it('should get a post by ID with author information', async () => {
      const mockResult = {
        rows: [{
          id: 1,
          author_id: 1,
          content: 'Test post content',
          latitude: '40.78290000',
          longitude: '-73.96540000',
          location_name: 'Central Park',
          upvotes: 5,
          downvotes: 1,
          created_at: new Date(),
          updated_at: new Date(),
          username: 'testuser',
          reputation: 150
        }]
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await postService.getPostById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.author.username).toBe('testuser');
      expect(result!.author.reputation).toBe(150);
      expect(result!.latitude).toBe(40.7829);
      expect(result!.longitude).toBe(-73.9654);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
    });

    it('should return null for non-existent post', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await postService.getPostById(999);

      expect(result).toBeNull();
    });

    it('should reject invalid post ID', async () => {
      await expect(postService.getPostById(-1)).rejects.toThrow('Post ID must be a positive integer');
      await expect(postService.getPostById(0)).rejects.toThrow('Post ID must be a positive integer');
      await expect(postService.getPostById(1.5)).rejects.toThrow('Post ID must be a positive integer');
      
      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockDb.query.mockRejectedValue(dbError);

      await expect(postService.getPostById(1)).rejects.toThrow('Failed to get post: Database connection failed');
    });
  });

  describe('getPosts', () => {
    it('should get paginated posts with default options', async () => {
      const mockCountResult = { rows: [{ total: '25' }] };
      const mockPostsResult = {
        rows: [
          {
            id: 2,
            author_id: 1,
            content: 'Second post',
            latitude: '40.78290000',
            longitude: '-73.96540000',
            location_name: 'Central Park',
            upvotes: 3,
            downvotes: 0,
            created_at: new Date(),
            updated_at: new Date(),
            username: 'testuser',
            reputation: 150
          },
          {
            id: 1,
            author_id: 1,
            content: 'First post',
            latitude: '40.78290000',
            longitude: '-73.96540000',
            location_name: 'Central Park',
            upvotes: 5,
            downvotes: 1,
            created_at: new Date(),
            updated_at: new Date(),
            username: 'testuser',
            reputation: 150
          }
        ]
      };

      mockDb.query
        .mockResolvedValueOnce(mockCountResult)
        .mockResolvedValueOnce(mockPostsResult);

      const result = await postService.getPosts();

      expect(result.posts).toHaveLength(2);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrevious).toBe(false);

      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });

    it('should handle custom pagination options', async () => {
      const mockCountResult = { rows: [{ total: '100' }] };
      const mockPostsResult = { rows: [] };

      mockDb.query
        .mockResolvedValueOnce(mockCountResult)
        .mockResolvedValueOnce(mockPostsResult);

      const result = await postService.getPosts({ limit: 10, offset: 20 });

      expect(result.pagination.page).toBe(3);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.totalPages).toBe(10);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrevious).toBe(true);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $1 OFFSET $2'),
        [10, 20]
      );
    });

    it('should enforce maximum limit', async () => {
      const mockCountResult = { rows: [{ total: '50' }] };
      const mockPostsResult = { rows: [] };

      mockDb.query
        .mockResolvedValueOnce(mockCountResult)
        .mockResolvedValueOnce(mockPostsResult);

      const result = await postService.getPosts({ limit: 200 });

      expect(result.pagination.limit).toBe(100); // Should be capped at 100

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $1 OFFSET $2'),
        [100, 0]
      );
    });

    it('should handle negative offset', async () => {
      const mockCountResult = { rows: [{ total: '50' }] };
      const mockPostsResult = { rows: [] };

      mockDb.query
        .mockResolvedValueOnce(mockCountResult)
        .mockResolvedValueOnce(mockPostsResult);

      const result = await postService.getPosts({ offset: -10 });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $1 OFFSET $2'),
        [20, 0] // Offset should be 0
      );
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockDb.query.mockRejectedValue(dbError);

      await expect(postService.getPosts()).rejects.toThrow('Failed to get posts: Database connection failed');
    });
  });

  describe('getPostsByAuthor', () => {
    it('should get posts by author with pagination', async () => {
      const mockCountResult = { rows: [{ total: '15' }] };
      const mockPostsResult = {
        rows: [{
          id: 1,
          author_id: 1,
          content: 'Author post',
          latitude: '40.78290000',
          longitude: '-73.96540000',
          location_name: 'Central Park',
          upvotes: 5,
          downvotes: 1,
          created_at: new Date(),
          updated_at: new Date(),
          username: 'testuser',
          reputation: 150
        }]
      };

      mockDb.query
        .mockResolvedValueOnce(mockCountResult)
        .mockResolvedValueOnce(mockPostsResult);

      const result = await postService.getPostsByAuthor(1);

      expect(result.posts).toHaveLength(1);
      expect(result.pagination.total).toBe(15);
      expect(result.posts[0]?.author_id).toBe(1);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.author_id = $1'),
        [1, 20, 0]
      );
    });

    it('should reject invalid author ID', async () => {
      await expect(postService.getPostsByAuthor(-1)).rejects.toThrow('Author ID must be a positive integer');
      await expect(postService.getPostsByAuthor(0)).rejects.toThrow('Author ID must be a positive integer');
      await expect(postService.getPostsByAuthor(1.5)).rejects.toThrow('Author ID must be a positive integer');
      
      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockDb.query.mockRejectedValue(dbError);

      await expect(postService.getPostsByAuthor(1)).rejects.toThrow('Failed to get posts by author: Database connection failed');
    });
  });
}); 