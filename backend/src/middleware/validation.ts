import { Request, Response, NextFunction } from 'express';
import { postService } from '../services/post';

/**
 * Validation middleware for post creation requests
 * Validates and sanitizes post creation data from HTTP requests
 */
export const validatePostCreation = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { content, latitude, longitude, location_name } = req.body;

    // Prepare data for validation
    const postData = {
      author_id: 1, // Will be set from JWT token in actual implementation
      content: content || '',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      location_name
    };

    // Use PostService validation
    const validationResult = postService.validatePostData(postData);

    if (!validationResult.isValid) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.errors
      });
      return;
    }

    // Sanitize content and update request body
    if (content && typeof content === 'string') {
      req.body.content = postService.sanitizeContent(content);
    }

    // Convert coordinates to numbers
    req.body.latitude = postData.latitude;
    req.body.longitude = postData.longitude;

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: ['Invalid request data format']
    });
  }
};

/**
 * Validation middleware for post update requests
 * Validates post ID and update data
 */
export const validatePostUpdate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate post ID
    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Post ID is required']
      });
      return;
    }
    
    const postId = parseInt(id, 10);
    if (!Number.isInteger(postId) || postId <= 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Post ID must be a valid post ID']
      });
      return;
    }

    // Check if at least one field is provided for update
    const allowedFields = ['content', 'latitude', 'longitude', 'location_name'];
    const providedFields = Object.keys(updateData).filter(key => allowedFields.includes(key));
    
    if (providedFields.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Update request must include at least one field to update']
      });
      return;
    }

    // Validate provided fields using PostService validation
    if (updateData.content !== undefined || updateData.latitude !== undefined || 
        updateData.longitude !== undefined || updateData.location_name !== undefined) {
      
      // Create a complete validation object with current values or defaults
      const validationData = {
        author_id: 1, // Will be validated separately
        content: updateData.content || 'Valid content', // Use provided or placeholder
        latitude: updateData.latitude !== undefined ? parseFloat(updateData.latitude) : 0,
        longitude: updateData.longitude !== undefined ? parseFloat(updateData.longitude) : 0,
        location_name: updateData.location_name
      };

      // Only validate fields that are being updated
      const errors: string[] = [];

      if (updateData.content !== undefined) {
        if (typeof updateData.content !== 'string') {
          errors.push('Content must be a string');
        } else if (updateData.content.trim().length === 0) {
          errors.push('Content cannot be empty');
        } else if (updateData.content.length > 1000) {
          errors.push('Content must be 1000 characters or less');
        }
      }

      if (updateData.latitude !== undefined) {
        const lat = parseFloat(updateData.latitude);
        if (typeof updateData.latitude !== 'number' && isNaN(lat)) {
          errors.push('latitude must be a valid number');
        } else if (lat < -90 || lat > 90) {
          errors.push('latitude must be between -90 and 90 degrees');
        }
      }

      if (updateData.longitude !== undefined) {
        const lng = parseFloat(updateData.longitude);
        if (typeof updateData.longitude !== 'number' && isNaN(lng)) {
          errors.push('longitude must be a valid number');
        } else if (lng < -180 || lng > 180) {
          errors.push('longitude must be between -180 and 180 degrees');
        }
      }

      if (updateData.location_name !== undefined) {
        if (typeof updateData.location_name !== 'string') {
          errors.push('Location name must be a string');
        } else if (updateData.location_name.length > 255) {
          errors.push('Location name must be 255 characters or less');
        }
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
        return;
      }

      // Sanitize content if provided
      if (updateData.content && typeof updateData.content === 'string') {
        req.body.content = postService.sanitizeContent(updateData.content);
      }

      // Convert coordinates to numbers if provided
      if (updateData.latitude !== undefined) {
        req.body.latitude = parseFloat(updateData.latitude);
      }
      if (updateData.longitude !== undefined) {
        req.body.longitude = parseFloat(updateData.longitude);
      }
    }

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: ['Invalid request data format']
    });
  }
};

/**
 * Validation middleware for post query parameters
 * Validates and sets defaults for pagination and filtering
 */
export const validatePostQuery = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { page, limit, author_id } = req.query;
    const errors: string[] = [];

    // Validate and set page
    let pageNum = 1;
    if (page !== undefined) {
      pageNum = parseInt(page as string, 10);
      if (!Number.isInteger(pageNum) || pageNum < 1) {
        errors.push('page must be a positive integer');
      }
    }

    // Validate and set limit
    let limitNum = 20;
    if (limit !== undefined) {
      limitNum = parseInt(limit as string, 10);
      if (!Number.isInteger(limitNum) || limitNum < 1) {
        errors.push('limit must be a positive integer');
      } else if (limitNum > 100) {
        errors.push('limit cannot exceed 100');
      }
    }

    // Validate author_id if provided
    if (author_id !== undefined) {
      const authorIdNum = parseInt(author_id as string, 10);
      if (!Number.isInteger(authorIdNum) || authorIdNum < 1) {
        errors.push('author_id must be a positive integer');
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
      return;
    }

    // Set validated values back to query
    req.query.page = pageNum.toString();
    req.query.limit = limitNum.toString();

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: ['Invalid query parameters']
    });
  }
}; 