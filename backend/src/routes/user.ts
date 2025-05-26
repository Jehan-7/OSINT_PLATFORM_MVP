import { Router } from 'express';
import { PostController } from '../controllers/post';
import { validatePostQuery } from '../middleware/validation';

/**
 * User routes for OSINT Platform
 * Handles user-specific operations like retrieving user's posts
 * Sprint 2 Phase 5: User-specific routes
 */

const router = Router();
const postController = new PostController();

/**
 * GET /api/v1/users/:userId/posts
 * Retrieve posts by a specific author (public endpoint)
 * 
 * Path Parameters:
 * - userId: number (required, user ID)
 * 
 * Query Parameters:
 * - page: number (optional, default: 1, min: 1)
 * - limit: number (optional, default: 20, max: 100)
 * 
 * Returns:
 * - 200: Posts retrieved successfully with pagination info
 * - 400: Invalid user ID format or query parameters
 * - 500: Internal server error
 */
router.get('/:userId/posts', validatePostQuery, async (req, res) => {
  await postController.getPostsByAuthor(req, res);
});

export default router; 