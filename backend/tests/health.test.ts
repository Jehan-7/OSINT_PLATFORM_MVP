import request from 'supertest';
import { app } from '../src/app';

describe('Health Check Endpoint', () => {
  describe('GET /api/health', () => {
    it('should return 200 status with health information', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: process.env.NODE_ENV
      });
    });

    it('should return valid timestamp format', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should return positive uptime', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });
}); 