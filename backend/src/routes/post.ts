import { Router } from 'express';
import { PostController } from '../controllers/post';
import { authenticateToken } from '../middleware/auth';
import { validatePostCreation, validatePostQuery } from '../middleware/validation';

/**
 * Post routes for OSINT Platform
 * Handles post creation, retrieval, and management endpoints
 * Sprint 2 Phase 5: Routes layer connecting controllers to HTTP endpoints
 */

const router = Router();
const postController = new PostController();

/**
 * POST /api/v1/posts
 * Create a new post (requires authentication)
 * 
 * Headers:
 * - Authorization: Bearer <JWT_TOKEN>
 * 
 * Body:
 * - content: string (required, max 1000 chars)
 * - latitude: number (required, -90 to 90)
 * - longitude: number (required, -180 to 180)
 * - location_name: string (optional, max 255 chars)
 * 
 * Returns:
 * - 201: Post created successfully with post data
 * - 400: Validation failed
 * - 401: Authentication required or invalid token
 * - 500: Internal server error
 */
router.post('/', authenticateToken, validatePostCreation, async (req, res) => {
  await postController.createPost(req, res);
});

/**
 * GET /api/v1/posts
 * Retrieve paginated list of posts (public endpoint)
 * 
 * Query Parameters:
 * - page: number (optional, default: 1, min: 1)
 * - limit: number (optional, default: 20, max: 100)
 * 
 * Returns:
 * - 200: Posts retrieved successfully with pagination info
 * - 400: Invalid query parameters
 * - 500: Internal server error
 */
router.get('/', validatePostQuery, async (req, res) => {
  await postController.getPosts(req, res);
});

/**
 * GET /api/v1/posts/:id
 * Retrieve a single post by ID (public endpoint)
 * 
 * Path Parameters:
 * - id: number (required, post ID)
 * 
 * Returns:
 * - 200: Post retrieved successfully
 * - 400: Invalid post ID format
 * - 404: Post not found
 * - 500: Internal server error
 */
router.get('/:id', async (req, res) => {
  await postController.getPostById(req, res);
});



export default router; 