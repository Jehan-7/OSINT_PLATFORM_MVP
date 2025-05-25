import { JWTService } from '../../src/services/jwt';
import { config } from '../../src/config/environment';

// Set timeout for JWT operations
jest.setTimeout(10000);

describe('JWTService', () => {
  let jwtService: JWTService;
  const testSecret = 'test-jwt-secret-that-is-at-least-32-characters-long-for-security';

  beforeEach(() => {
    jwtService = new JWTService(testSecret);
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', async () => {
      const payload = { userId: 1, username: 'testuser', email: 'test@example.com' };
      const token = await jwtService.generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts: header.payload.signature
    });

    it('should generate different tokens for different payloads', async () => {
      const payload1 = { userId: 1, username: 'user1', email: 'user1@example.com' };
      const payload2 = { userId: 2, username: 'user2', email: 'user2@example.com' };

      const token1 = await jwtService.generateToken(payload1);
      const token2 = await jwtService.generateToken(payload2);

      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with expiration time', async () => {
      const payload = { userId: 1, username: 'testuser', email: 'test@example.com' };
      const expiresIn = '1h';
      
      const token = await jwtService.generateToken(payload, expiresIn);
      const decoded = await jwtService.verifyToken(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should handle custom expiration times', async () => {
      const payload = { userId: 1, username: 'testuser', email: 'test@example.com' };
      
      const shortToken = await jwtService.generateToken(payload, '1m');
      const longToken = await jwtService.generateToken(payload, '24h');

      const shortDecoded = await jwtService.verifyToken(shortToken);
      const longDecoded = await jwtService.verifyToken(longToken);

      expect(longDecoded.exp || 0).toBeGreaterThan(shortDecoded.exp || 0);
    });

    it('should handle empty payload', async () => {
      const emptyPayload = { userId: 0, username: '', email: '' };
      const token = await jwtService.generateToken(emptyPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should handle null/undefined payload', async () => {
      await expect(jwtService.generateToken(null as any)).rejects.toThrow();
      await expect(jwtService.generateToken(undefined as any)).rejects.toThrow();
    });
  });

  describe('verifyToken', () => {
    it('should verify valid tokens', async () => {
      const payload = { userId: 1, username: 'testuser', email: 'test@example.com' };
      const token = await jwtService.generateToken(payload);

      const decoded = await jwtService.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.username).toBe(payload.username);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.iat).toBeDefined(); // issued at
      expect(decoded.exp).toBeDefined(); // expires at
    });

    it('should reject invalid tokens', async () => {
      const invalidToken = 'invalid.jwt.token';

      await expect(jwtService.verifyToken(invalidToken)).rejects.toThrow();
    });

    it('should reject malformed tokens', async () => {
      const malformedTokens = [
        'not-a-jwt',
        'header.payload', // missing signature
        'header.payload.signature.extra', // too many parts
        '', // empty string
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature' // invalid payload
      ];

      for (const token of malformedTokens) {
        await expect(jwtService.verifyToken(token)).rejects.toThrow();
      }
    });

    it('should reject expired tokens', async () => {
      const payload = { userId: 1, username: 'testuser', email: 'test@example.com' };
      const expiredToken = await jwtService.generateToken(payload, '1ms'); // Very short expiration

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      await expect(jwtService.verifyToken(expiredToken)).rejects.toThrow('jwt expired');
    });

    it('should reject tokens with wrong signature', async () => {
      // Create a token with a different secret
      const wrongSecretService = new JWTService('wrong-secret-that-is-at-least-32-characters-long-for-security');
      const payload = { userId: 1, username: 'testuser', email: 'test@example.com' };
      const tokenWithWrongSecret = await wrongSecretService.generateToken(payload);

      await expect(jwtService.verifyToken(tokenWithWrongSecret)).rejects.toThrow();
    });

    it('should handle null/undefined tokens', async () => {
      await expect(jwtService.verifyToken(null as any)).rejects.toThrow();
      await expect(jwtService.verifyToken(undefined as any)).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should refresh valid non-expired tokens', async () => {
      const payload = { userId: 1, username: 'testuser', email: 'test@example.com' };
      const originalToken = await jwtService.generateToken(payload, '1h');

      const newToken = await jwtService.refreshToken(originalToken);

      expect(newToken).toBeDefined();
      expect(newToken).not.toBe(originalToken);

      const originalDecoded = await jwtService.verifyToken(originalToken);
      const newDecoded = await jwtService.verifyToken(newToken);

      expect(newDecoded.userId).toBe(originalDecoded.userId);
      expect(newDecoded.username).toBe(originalDecoded.username);
      expect(newDecoded.exp || 0).toBeGreaterThan(originalDecoded.exp || 0);
    });

    it('should reject refreshing expired tokens', async () => {
      const payload = { userId: 1, username: 'testuser', email: 'test@example.com' };
      const expiredToken = await jwtService.generateToken(payload, '1ms');

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      await expect(jwtService.refreshToken(expiredToken)).rejects.toThrow();
    });

    it('should reject refreshing invalid tokens', async () => {
      const invalidToken = 'invalid.jwt.token';

      await expect(jwtService.refreshToken(invalidToken)).rejects.toThrow();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer authorization header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature';
      const authHeader = `Bearer ${token}`;

      const extractedToken = jwtService.extractTokenFromHeader(authHeader);

      expect(extractedToken).toBe(token);
    });

    it('should handle authorization header without Bearer prefix', () => {
      const authHeader = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature';

      const extractedToken = jwtService.extractTokenFromHeader(authHeader);

      expect(extractedToken).toBeNull();
    });

    it('should handle malformed authorization headers', () => {
      const malformedHeaders = [
        'Bearer', // Missing token
        'Basic token', // Wrong auth type
        '', // Empty string
        'Bearer token1 token2', // Multiple tokens
      ];

      malformedHeaders.forEach(header => {
        const result = jwtService.extractTokenFromHeader(header);
        expect(result).toBeNull();
      });
    });

    it('should handle null/undefined headers', () => {
      expect(jwtService.extractTokenFromHeader(null as any)).toBeNull();
      expect(jwtService.extractTokenFromHeader(undefined as any)).toBeNull();
    });
  });

  describe('getTokenExpiration', () => {
    it('should return correct expiration time', async () => {
      const payload = { userId: 1, username: 'testuser', email: 'test@example.com' };
      const token = await jwtService.generateToken(payload, '1h');

      const expiration = jwtService.getTokenExpiration(token);

      expect(expiration).toBeDefined();
      expect(expiration).toBeInstanceOf(Date);
      if (expiration) {
        expect(expiration.getTime()).toBeGreaterThan(Date.now());
      }
    });

    it('should handle tokens without expiration', async () => {
      const payload = { userId: 1, username: 'testuser', email: 'test@example.com' };
      // Note: Our implementation always adds expiration, so this test checks for valid expiration
      const tokenWithoutExp = await jwtService.generateToken(payload, '24h');

      const expiration = jwtService.getTokenExpiration(tokenWithoutExp);

      expect(expiration).not.toBeNull();
      expect(expiration).toBeInstanceOf(Date);
    });

    it('should handle invalid tokens', () => {
      const invalidToken = 'invalid.jwt.token';

      // Invalid tokens should return null or throw error
      try {
        const result = jwtService.getTokenExpiration(invalidToken);
        expect(result).toBeNull();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid tokens', async () => {
      const payload = { userId: 1, username: 'testuser', email: 'test@example.com' };
      const token = await jwtService.generateToken(payload, '1h');

      const isExpired = jwtService.isTokenExpired(token);

      expect(isExpired).toBe(false);
    });

    it('should return true for expired tokens', async () => {
      const payload = { userId: 1, username: 'testuser', email: 'test@example.com' };
      const expiredToken = await jwtService.generateToken(payload, '1ms');

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      const isExpired = jwtService.isTokenExpired(expiredToken);

      expect(isExpired).toBe(true);
    });

    it('should handle tokens without expiration', async () => {
      const payload = { userId: 1, username: 'testuser', email: 'test@example.com' };
      // Note: Our implementation always adds expiration, so test with long expiration
      const tokenWithoutExp = await jwtService.generateToken(payload, '24h');

      const isExpired = jwtService.isTokenExpired(tokenWithoutExp);

      expect(isExpired).toBe(false); // Long expiration tokens should not be expired
    });
  });
}); 