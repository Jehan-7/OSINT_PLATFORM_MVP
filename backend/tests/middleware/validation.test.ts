import { Request, Response, NextFunction } from 'express';
import { validatePostCreation, validatePostUpdate, validatePostQuery } from '../../src/middleware/validation';

// Mock Express request/response objects
const mockRequest = (body: any = {}, params: any = {}, query: any = {}): Partial<Request> => ({
  body,
  params,
  query
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = (): NextFunction => jest.fn();

describe('Post Validation Middleware', () => {
  describe('validatePostCreation', () => {
    it('should pass validation for valid post creation data', () => {
      const req = mockRequest({
        content: 'Valid post content for testing',
        latitude: 40.7829,
        longitude: -73.9654,
        location_name: 'Central Park, NYC'
      });
      const res = mockResponse();
      const next = mockNext();

      validatePostCreation(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject missing content', () => {
      const req = mockRequest({
        latitude: 40.7829,
        longitude: -73.9654
      });
      const res = mockResponse();
      const next = mockNext();

      validatePostCreation(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          'Content cannot be empty'
        ])
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject empty content', () => {
      const req = mockRequest({
        content: '',
        latitude: 40.7829,
        longitude: -73.9654
      });
      const res = mockResponse();
      const next = mockNext();

      validatePostCreation(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          'Content cannot be empty'
        ])
      });
    });

    it('should reject content that is too long', () => {
      const req = mockRequest({
        content: 'a'.repeat(1001),
        latitude: 40.7829,
        longitude: -73.9654
      });
      const res = mockResponse();
      const next = mockNext();

      validatePostCreation(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.stringContaining('1000 characters')
        ])
      });
    });

    it('should reject missing latitude', () => {
      const req = mockRequest({
        content: 'Valid content',
        longitude: -73.9654
      });
      const res = mockResponse();
      const next = mockNext();

      validatePostCreation(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.stringContaining('latitude')
        ])
      });
    });

    it('should reject invalid latitude values', () => {
      const testCases = [
        { lat: 91, desc: 'latitude > 90' },
        { lat: -91, desc: 'latitude < -90' },
        { lat: 'invalid', desc: 'non-numeric latitude' },
        { lat: NaN, desc: 'NaN latitude' }
      ];

      testCases.forEach(({ lat, desc }) => {
        const req = mockRequest({
          content: 'Valid content',
          latitude: lat,
          longitude: -73.9654
        });
        const res = mockResponse();
        const next = mockNext();

        validatePostCreation(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.stringContaining('latitude')
          ])
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    it('should reject invalid longitude values', () => {
      const testCases = [
        { lng: 181, desc: 'longitude > 180' },
        { lng: -181, desc: 'longitude < -180' },
        { lng: 'invalid', desc: 'non-numeric longitude' },
        { lng: NaN, desc: 'NaN longitude' }
      ];

      testCases.forEach(({ lng, desc }) => {
        const req = mockRequest({
          content: 'Valid content',
          latitude: 40.7829,
          longitude: lng
        });
        const res = mockResponse();
        const next = mockNext();

        validatePostCreation(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.stringContaining('longitude')
          ])
        });
      });
    });

    it('should accept boundary coordinate values', () => {
      const boundaryTests = [
        { lat: 90, lng: 180, desc: 'maximum values' },
        { lat: -90, lng: -180, desc: 'minimum values' },
        { lat: 0, lng: 0, desc: 'zero values' }
      ];

      boundaryTests.forEach(({ lat, lng, desc }) => {
        const req = mockRequest({
          content: 'Valid content',
          latitude: lat,
          longitude: lng
        });
        const res = mockResponse();
        const next = mockNext();

        validatePostCreation(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    it('should reject location_name that is too long', () => {
      const req = mockRequest({
        content: 'Valid content',
        latitude: 40.7829,
        longitude: -73.9654,
        location_name: 'a'.repeat(256)
      });
      const res = mockResponse();
      const next = mockNext();

      validatePostCreation(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.stringContaining('255 characters')
        ])
      });
    });

    it('should sanitize content and remove dangerous elements', () => {
      const req = mockRequest({
        content: '<script>alert("xss")</script>Hello <b>world</b> onclick="malicious()"',
        latitude: 40.7829,
        longitude: -73.9654
      });
      const res = mockResponse();
      const next = mockNext();

      validatePostCreation(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      // Content should be sanitized in the request body
      expect(req.body.content).not.toContain('<script>');
      expect(req.body.content).not.toContain('onclick');
      expect(req.body.content).toContain('Hello');
      expect(req.body.content).toContain('world');
    });

    it('should return multiple validation errors', () => {
      const req = mockRequest({
        content: '',
        latitude: 91,
        longitude: 181,
        location_name: 'a'.repeat(256)
      });
      const res = mockResponse();
      const next = mockNext();

      validatePostCreation(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          'Content cannot be empty',
          expect.stringContaining('latitude'),
          expect.stringContaining('longitude'),
          expect.stringContaining('255 characters')
        ])
      });
    });
  });

  describe('validatePostUpdate', () => {
    it('should pass validation for valid post update data', () => {
      const req = mockRequest({
        content: 'Updated post content'
      }, { id: '123' });
      const res = mockResponse();
      const next = mockNext();

      validatePostUpdate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid post ID', () => {
      const req = mockRequest({
        content: 'Updated content'
      }, { id: 'invalid' });
      const res = mockResponse();
      const next = mockNext();

      validatePostUpdate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.stringContaining('valid post ID')
        ])
      });
    });

    it('should allow partial updates', () => {
      const req = mockRequest({
        location_name: 'Updated location'
      }, { id: '123' });
      const res = mockResponse();
      const next = mockNext();

      validatePostUpdate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject empty update body', () => {
      const req = mockRequest({}, { id: '123' });
      const res = mockResponse();
      const next = mockNext();

      validatePostUpdate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.stringContaining('at least one field')
        ])
      });
    });
  });

  describe('validatePostQuery', () => {
    it('should pass validation for valid query parameters', () => {
      const req = mockRequest({}, {}, {
        page: '1',
        limit: '20',
        author_id: '123'
      });
      const res = mockResponse();
      const next = mockNext();

      validatePostQuery(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid page number', () => {
      const req = mockRequest({}, {}, {
        page: '0'
      });
      const res = mockResponse();
      const next = mockNext();

      validatePostQuery(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.stringContaining('page')
        ])
      });
    });

    it('should reject limit exceeding maximum', () => {
      const req = mockRequest({}, {}, {
        limit: '101'
      });
      const res = mockResponse();
      const next = mockNext();

      validatePostQuery(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.stringContaining('100')
        ])
      });
    });

    it('should set default values for missing parameters', () => {
      const req = mockRequest({}, {}, {});
      const res = mockResponse();
      const next = mockNext();

      validatePostQuery(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(req.query?.page).toBe('1');
      expect(req.query?.limit).toBe('20');
    });
  });
}); 