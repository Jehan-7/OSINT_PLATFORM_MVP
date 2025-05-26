import crypto from 'crypto';

/**
 * Advanced input sanitization for comprehensive security
 * Protects against SQL injection, NoSQL injection, XSS, and other attacks
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove SQL injection patterns
  const sqlPatterns = [
    /(\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/gi,
    /(--|\/\*|\*\/|;)/g,
    /(\bOR\b\s+\b\d+\s*=\s*\d+)/gi,
    /(\bAND\b\s+\b\d+\s*=\s*\d+)/gi,
    /('|\"|`)(.*?)(\1)/g // Remove quoted strings that could be injection
  ];

  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove NoSQL injection patterns
  const nosqlPatterns = [
    /\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$exists|\$regex|\$where|\$or|\$and/gi,
    /\{\s*['"]\$\w+['"]\s*:/g
  ];

  nosqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Enhanced XSS protection
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^>]*>/gi,
    /<link\b[^>]*>/gi,
    /<meta\b[^>]*>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /on\w+\s*=\s*[^"'\s>]+/gi
  ];

  xssPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove potentially dangerous protocols
  const dangerousProtocols = [
    /file:\/\//gi,
    /ftp:\/\//gi,
    /ldap:\/\//gi,
    /gopher:\/\//gi
  ];

  dangerousProtocols.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Normalize Unicode and trim
  sanitized = normalizeUnicode(sanitized).trim();

  return sanitized;
};

/**
 * Normalize Unicode strings to prevent Unicode-based attacks
 */
export const normalizeUnicode = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  // Normalize to NFC (Canonical Decomposition followed by Canonical Composition)
  return input.normalize('NFC');
};

/**
 * Validate and limit coordinate precision to prevent excessive precision attacks
 */
export const validateCoordinatePrecision = (
  coordinate: number, 
  type: 'latitude' | 'longitude'
): number => {
  if (typeof coordinate !== 'number' || isNaN(coordinate)) {
    return 0;
  }

  // Limit precision to 8 decimal places (about 1mm accuracy)
  // This prevents excessive precision that could be used for fingerprinting
  const limited = Math.round(coordinate * 100000000) / 100000000;

  // Validate ranges
  if (type === 'latitude') {
    return Math.max(-90, Math.min(90, limited));
  } else {
    return Math.max(-180, Math.min(180, limited));
  }
};

/**
 * Sanitize location names while preserving useful geographic information
 */
export const sanitizeLocationName = (locationName: any): string => {
  if (!locationName || typeof locationName !== 'string') {
    return '';
  }

  let sanitized = locationName;

  // Remove dangerous content but preserve geographic characters
  sanitized = sanitizeInput(sanitized);

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255).trim();
  }

  return sanitized;
};

/**
 * Detect suspicious content patterns that might indicate spam or malicious intent
 */
export const detectSuspiciousContent = (content: string): {
  isSuspicious: boolean;
  reasons: string[];
} => {
  const reasons: string[] = [];

  if (typeof content !== 'string') {
    return { isSuspicious: false, reasons: [] };
  }

  const lowerContent = content.toLowerCase();

  // Spam patterns
  const spamPatterns = [
    { pattern: /click here|click now|act fast|limited time|free money|make \$\d+/i, reason: 'spam_language' },
    { pattern: /!!!.*!!!|FREE.*FREE|NOW.*NOW/i, reason: 'excessive_caps_punctuation' },
    { pattern: /make \$\d{1,3}(,\d{3})*(\.\d{2})?\s*(per|\/)\s*(day|hour|week)/i, reason: 'money_making_claims' },
    { pattern: /buy now|limited time|act fast|free money|won.*\$|claim now/i, reason: 'spam_language' },
    { pattern: /visit.*http.*malware|suspicious.*site/i, reason: 'malicious_links' }
  ];

  // Phishing patterns
  const phishingPatterns = [
    { pattern: /verify.*account|account.*suspended|urgent.*action|click.*verify/i, reason: 'potential_phishing' },
    { pattern: /update.*password|confirm.*identity|security.*alert/i, reason: 'potential_phishing' },
    { pattern: /(paypal|bank|amazon|microsoft|google).*verify/i, reason: 'brand_impersonation' },
    { pattern: /account.*compromised|suspended.*verify|verify.*paypal/i, reason: 'potential_phishing' }
  ];

  // Suspicious URL patterns
  const suspiciousUrlPatterns = [
    { pattern: /http:\/\/[^\/]*\.(tk|ml|ga|cf)\//i, reason: 'suspicious_domain' },
    { pattern: /bit\.ly|tinyurl|t\.co|goo\.gl/i, reason: 'url_shortener' },
    { pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i, reason: 'ip_address_url' }
  ];

  // Check all patterns
  [...spamPatterns, ...phishingPatterns, ...suspiciousUrlPatterns].forEach(({ pattern, reason }) => {
    if (pattern.test(content)) {
      reasons.push(reason);
    }
  });

  // Check for excessive repetition
  const words = content.split(/\s+/);
  const wordCounts = words.reduce((acc, word) => {
    acc[word.toLowerCase()] = (acc[word.toLowerCase()] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxWordCount = Math.max(...Object.values(wordCounts));
  if (maxWordCount > 5 && words.length > 10) {
    reasons.push('excessive_repetition');
  }

  // Check for excessive special characters
  const specialCharCount = (content.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
  if (specialCharCount > content.length * 0.3) {
    reasons.push('excessive_special_chars');
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons: [...new Set(reasons)] // Remove duplicates
  };
};

/**
 * Generate rate limiting keys for consistent rate limiting across the application
 */
export const rateLimitKey = (
  ip: string, 
  userId?: number, 
  action?: string
): string => {
  const components = [ip];
  
  if (userId !== undefined) {
    components.push(`user:${userId}`);
  }
  
  if (action) {
    components.push(`action:${action}`);
  }

  // Create a hash for consistent key generation
  const keyString = components.join('|');
  return crypto.createHash('sha256').update(keyString).digest('hex').substring(0, 16);
}; 