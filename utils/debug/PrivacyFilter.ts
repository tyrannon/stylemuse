export class PrivacyFilter {
  private sensitivePatterns = [
    // Credit card patterns
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    // Social Security Numbers
    /\b\d{3}-\d{2}-\d{4}\b/g,
    // Email addresses
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    // Phone numbers (various formats)
    /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
    // IP addresses
    /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    // Bearer tokens
    /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/g,
    // API keys (common patterns)
    /\b[A-Za-z0-9]{32,}\b/g,
    // AWS keys
    /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
    // Private keys
    /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]+?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
  ];
  
  private sensitiveKeys = [
    'password',
    'passwd',
    'pwd',
    'token',
    'apikey',
    'api_key',
    'apiKey',
    'secret',
    'auth',
    'authorization',
    'bearer',
    'credential',
    'private',
    'privateKey',
    'private_key',
    'access_token',
    'accessToken',
    'refresh_token',
    'refreshToken',
    'client_secret',
    'clientSecret',
    'session',
    'sessionId',
    'session_id',
    'cookie',
    'ssn',
    'social_security',
    'credit_card',
    'creditCard',
    'card_number',
    'cardNumber',
    'cvv',
    'cvc',
    'pin',
    'bank_account',
    'bankAccount',
    'routing_number',
    'routingNumber'
  ];
  
  private userDataKeys = [
    'email',
    'phone',
    'phoneNumber',
    'phone_number',
    'address',
    'street',
    'city',
    'state',
    'zip',
    'zipCode',
    'zip_code',
    'postal_code',
    'postalCode',
    'firstName',
    'first_name',
    'lastName',
    'last_name',
    'fullName',
    'full_name',
    'name',
    'username',
    'user_name',
    'dob',
    'dateOfBirth',
    'date_of_birth',
    'birthdate',
    'birth_date'
  ];
  
  sanitize(data: any, options?: SanitizeOptions): any {
    const opts = {
      preserveStructure: true,
      maskUserData: true,
      ...options
    };
    
    return this.sanitizeValue(data, opts);
  }
  
  private sanitizeValue(data: any, options: Required<SanitizeOptions>): any {
    // Handle null/undefined
    if (data === null || data === undefined) {
      return data;
    }
    
    // Handle strings
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeValue(item, options));
    }
    
    // Handle objects
    if (typeof data === 'object') {
      const sanitized: any = {};
      
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const lowerKey = key.toLowerCase();
          
          // Check if key is sensitive
          if (this.isSensitiveKey(lowerKey)) {
            sanitized[key] = '[REDACTED]';
          } 
          // Check if key contains user data and should be masked
          else if (options.maskUserData && this.isUserDataKey(lowerKey)) {
            sanitized[key] = this.maskUserData(data[key]);
          }
          // Recursively sanitize the value
          else {
            sanitized[key] = this.sanitizeValue(data[key], options);
          }
        }
      }
      
      return sanitized;
    }
    
    // Return other types as-is
    return data;
  }
  
  private sanitizeString(str: string): string {
    let sanitized = str;
    
    // Apply all sensitive patterns
    this.sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    
    return sanitized;
  }
  
  private isSensitiveKey(key: string): boolean {
    return this.sensitiveKeys.some(sensitiveKey => 
      key.includes(sensitiveKey.toLowerCase())
    );
  }
  
  private isUserDataKey(key: string): boolean {
    return this.userDataKeys.some(userKey => 
      key.includes(userKey.toLowerCase())
    );
  }
  
  private maskUserData(value: any): string {
    if (value === null || value === undefined) {
      return value;
    }
    
    const str = String(value);
    
    // For emails, show partial
    if (str.includes('@')) {
      const [localPart, domain] = str.split('@');
      if (localPart.length > 2) {
        return `${localPart.substring(0, 2)}***@${domain}`;
      }
      return `***@${domain}`;
    }
    
    // For other data, show first and last characters if long enough
    if (str.length > 4) {
      return `${str[0]}${'*'.repeat(str.length - 2)}${str[str.length - 1]}`;
    }
    
    // Short strings are fully masked
    return '*'.repeat(str.length);
  }
  
  // Check if a string contains sensitive data
  containsSensitiveData(str: string): boolean {
    if (typeof str !== 'string') {
      return false;
    }
    
    return this.sensitivePatterns.some(pattern => {
      const regex = new RegExp(pattern.source, pattern.flags.replace('g', ''));
      return regex.test(str);
    });
  }
  
  // Get a summary of what was sanitized (for debugging)
  getSanitizationSummary(original: any, sanitized: any): SanitizationSummary {
    const summary: SanitizationSummary = {
      totalFields: 0,
      sanitizedFields: 0,
      sensitiveKeys: [],
      userDataKeys: []
    };
    
    this.compareSanitization(original, sanitized, summary);
    
    return summary;
  }
  
  private compareSanitization(
    original: any, 
    sanitized: any, 
    summary: SanitizationSummary,
    path: string = ''
  ): void {
    if (typeof original !== 'object' || original === null) {
      return;
    }
    
    for (const key in original) {
      if (original.hasOwnProperty(key)) {
        summary.totalFields++;
        const currentPath = path ? `${path}.${key}` : key;
        
        if (sanitized[key] === '[REDACTED]') {
          summary.sanitizedFields++;
          summary.sensitiveKeys.push(currentPath);
        } else if (typeof sanitized[key] === 'string' && sanitized[key].includes('*')) {
          summary.sanitizedFields++;
          summary.userDataKeys.push(currentPath);
        } else if (typeof original[key] === 'object') {
          this.compareSanitization(original[key], sanitized[key], summary, currentPath);
        }
      }
    }
  }
}

interface SanitizeOptions {
  preserveStructure?: boolean;
  maskUserData?: boolean;
}

interface SanitizationSummary {
  totalFields: number;
  sanitizedFields: number;
  sensitiveKeys: string[];
  userDataKeys: string[];
}

// Export a singleton instance
export const privacyFilter = new PrivacyFilter();