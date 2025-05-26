import { 
  sanitizeInput, 
  normalizeUnicode, 
  validateCoordinatePrecision,
  sanitizeLocationName,
  detectSuspiciousContent,
  rateLimitKey
} from '../../src/utils/sanitization';

describe('Advanced Input Sanitization Utilities', () => {
  describe('sanitizeInput', () => {
    it('should remove SQL injection attempts', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'/**/OR/**/1=1#",
        "UNION SELECT * FROM users",
        "1; DELETE FROM posts WHERE 1=1"
      ];

      maliciousInputs.forEach(input => {
        const result = sanitizeInput(input);
        expect(result).not.toContain('DROP');
        expect(result).not.toContain('DELETE');
        expect(result).not.toContain('UNION');
        expect(result).not.toContain('SELECT');
        expect(result).not.toContain('--');
        expect(result).not.toContain('/*');
        expect(result).not.toContain('*/');
      });
    });

    it('should remove NoSQL injection attempts', () => {
      const maliciousInputs = [
        '{"$ne": null}',
        '{"$gt": ""}',
        '{"$where": "this.username == this.password"}',
        '{"$regex": ".*"}',
        '{"$or": [{"username": "admin"}, {"password": ""}]}'
      ];

      maliciousInputs.forEach(input => {
        const result = sanitizeInput(input);
        expect(result).not.toContain('$ne');
        expect(result).not.toContain('$gt');
        expect(result).not.toContain('$where');
        expect(result).not.toContain('$regex');
        expect(result).not.toContain('$or');
      });
    });

    it('should preserve safe content', () => {
      const safeInputs = [
        'This is a normal post about OSINT research',
        'Location: 40.7829, -73.9654',
        'Check out this interesting article: https://example.com',
        'User@domain.com shared valuable insights',
        'Analysis of data from 2023-2024'
      ];

      safeInputs.forEach((input, index) => {
        const result = sanitizeInput(input);
        expect(result.length).toBeGreaterThan(0);
        if (index === 0) {
          expect(result).toContain('OSINT');
        }
      });
    });

    it('should handle Unicode and special characters safely', () => {
      const unicodeInputs = [
        'Café in Paris 🇫🇷',
        'Москва coordinates: 55.7558° N',
        '北京市 location data',
        'São Paulo analysis 📊',
        'Zürich financial district'
      ];

      unicodeInputs.forEach(input => {
        const result = sanitizeInput(input);
        expect(result.length).toBeGreaterThan(0);
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('normalizeUnicode', () => {
    it('should normalize Unicode to NFC form', () => {
      // Decomposed vs composed Unicode
      const decomposed = 'café'; // e + combining acute accent
      const composed = 'café';   // single é character
      
      const normalizedDecomposed = normalizeUnicode(decomposed);
      const normalizedComposed = normalizeUnicode(composed);
      
      expect(normalizedDecomposed).toBe(normalizedComposed);
    });

    it('should handle mixed Unicode scripts', () => {
      const mixedScript = 'Hello мир 世界 🌍';
      const result = normalizeUnicode(mixedScript);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should preserve emoji and symbols', () => {
      const emojiText = 'Great analysis! 👍 📊 🔍';
      const result = normalizeUnicode(emojiText);
      
      expect(result).toContain('👍');
      expect(result).toContain('📊');
      expect(result).toContain('🔍');
    });
  });

  describe('validateCoordinatePrecision', () => {
    it('should limit coordinate precision to reasonable levels', () => {
      const highPrecisionLat = 40.78291234567890123;
      const highPrecisionLng = -73.96541234567890123;
      
      const validatedLat = validateCoordinatePrecision(highPrecisionLat, 'latitude');
      const validatedLng = validateCoordinatePrecision(highPrecisionLng, 'longitude');
      
      // Should limit to ~6 decimal places (meter precision)
      expect(validatedLat.toString().split('.')[1]?.length).toBeLessThanOrEqual(8);
      expect(validatedLng.toString().split('.')[1]?.length).toBeLessThanOrEqual(8);
    });

    it('should preserve valid precision coordinates', () => {
      const validLat = 40.782912;
      const validLng = -73.965412;
      
      const validatedLat = validateCoordinatePrecision(validLat, 'latitude');
      const validatedLng = validateCoordinatePrecision(validLng, 'longitude');
      
      expect(validatedLat).toBeCloseTo(validLat, 6);
      expect(validatedLng).toBeCloseTo(validLng, 6);
    });

    it('should handle edge cases', () => {
      expect(validateCoordinatePrecision(0, 'latitude')).toBe(0);
      expect(validateCoordinatePrecision(90, 'latitude')).toBe(90);
      expect(validateCoordinatePrecision(-90, 'latitude')).toBe(-90);
      expect(validateCoordinatePrecision(180, 'longitude')).toBe(180);
      expect(validateCoordinatePrecision(-180, 'longitude')).toBe(-180);
    });
  });

  describe('sanitizeLocationName', () => {
    it('should clean location names while preserving useful information', () => {
      const locations = [
        'Central Park, New York City',
        'Café de la Paix, Paris',
        'Times Square (42nd St & Broadway)',
        'Golden Gate Bridge - San Francisco',
        'Shibuya Crossing, Tokyo 🇯🇵'
      ];

      locations.forEach(location => {
        const result = sanitizeLocationName(location);
        expect(result.length).toBeGreaterThan(0);
        expect(result.length).toBeLessThanOrEqual(255);
        expect(typeof result).toBe('string');
      });
    });

    it('should remove potentially dangerous content from location names', () => {
      const maliciousLocations = [
        '<script>alert("xss")</script>Central Park',
        'javascript:void(0) Times Square',
        'data:text/html,<h1>XSS</h1> Broadway',
        'vbscript:msgbox("xss") Wall Street'
      ];

      maliciousLocations.forEach(location => {
        const result = sanitizeLocationName(location);
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('javascript:');
        expect(result).not.toContain('data:');
        expect(result).not.toContain('vbscript:');
      });
    });

    it('should handle empty and null inputs', () => {
      expect(sanitizeLocationName('')).toBe('');
      expect(sanitizeLocationName(null as any)).toBe('');
      expect(sanitizeLocationName(undefined as any)).toBe('');
    });
  });

  describe('detectSuspiciousContent', () => {
    it('should detect potential spam patterns', () => {
      const spamContent = [
        'CLICK HERE NOW!!! FREE MONEY!!!',
        'Visit http://suspicious-site.com/malware',
        'Buy now! Limited time offer! Act fast!',
        'Make $1000 per day working from home',
        'You have won $1,000,000! Claim now!'
      ];

      spamContent.forEach(content => {
        const result = detectSuspiciousContent(content);
        expect(result.isSuspicious).toBe(true);
        expect(result.reasons.length).toBeGreaterThan(0);
      });
    });

    it('should detect potential phishing attempts', () => {
      const phishingContent = [
        'Update your password at fake-bank-login.com',
        'Your account will be suspended unless you verify at evil-site.com',
        'Click here to verify your PayPal account',
        'Urgent: Your account has been compromised'
      ];

      phishingContent.forEach(content => {
        const result = detectSuspiciousContent(content);
        expect(result.isSuspicious).toBe(true);
        expect(result.reasons).toContain('potential_phishing');
      });
    });

    it('should allow legitimate OSINT content', () => {
      const legitimateContent = [
        'Analysis of social media trends in cybersecurity',
        'Open source intelligence gathering techniques',
        'Geospatial analysis of public transportation data',
        'Research findings from publicly available datasets',
        'Educational content about digital forensics'
      ];

      legitimateContent.forEach(content => {
        const result = detectSuspiciousContent(content);
        expect(result.isSuspicious).toBe(false);
      });
    });
  });

  describe('rateLimitKey', () => {
    it('should generate consistent keys for the same input', () => {
      const ip = '192.168.1.1';
      const userId = 123;
      const action = 'create_post';
      
      const key1 = rateLimitKey(ip, userId, action);
      const key2 = rateLimitKey(ip, userId, action);
      
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different inputs', () => {
      const baseKey = rateLimitKey('192.168.1.1', 123, 'create_post');
      const differentIp = rateLimitKey('192.168.1.2', 123, 'create_post');
      const differentUser = rateLimitKey('192.168.1.1', 124, 'create_post');
      const differentAction = rateLimitKey('192.168.1.1', 123, 'update_post');
      
      expect(baseKey).not.toBe(differentIp);
      expect(baseKey).not.toBe(differentUser);
      expect(baseKey).not.toBe(differentAction);
    });

    it('should handle optional parameters', () => {
      const ipOnlyKey = rateLimitKey('192.168.1.1');
      const ipActionKey = rateLimitKey('192.168.1.1', undefined, 'create_post');
      
      expect(typeof ipOnlyKey).toBe('string');
      expect(typeof ipActionKey).toBe('string');
      expect(ipOnlyKey).not.toBe(ipActionKey);
    });
  });
}); 