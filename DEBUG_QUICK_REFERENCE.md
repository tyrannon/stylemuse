# Debug System Quick Reference

## 🚀 Quick Start

```typescript
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

// Basic logging
logger.info(LogCategories.USER_ACTION, 'Button clicked', { buttonId: 'generate-outfit' });

// Error logging
logger.error(LogCategories.API_CALLS, 'Request failed', error, { endpoint: '/api/outfit' });

// Performance tracking
const endTracking = logger.startPerformanceTracking('operation-name');
await doOperation();
endTracking(); // Automatically logs duration
```

## 📊 Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `VERBOSE` | Detailed debugging | Variable values, loop iterations |
| `DEBUG` | Development debugging | Function entry/exit, state changes |
| `INFO` | Important events | User actions, successful operations |
| `WARN` | Recoverable issues | Deprecation warnings, fallbacks |
| `ERROR` | Failures | Exceptions, API errors |
| `FATAL` | Critical failures | App crashes, unrecoverable errors |

## 🏷️ Categories Quick Reference

### Core App
- `APP_LIFECYCLE` - App startup/shutdown
- `NAVIGATION` - Screen navigation
- `AUTHENTICATION` - Login/logout

### Features
- `WARDROBE` - Wardrobe operations
- `OUTFIT_GENERATION` - AI outfit creation
- `AI_ANALYSIS` - AI image/text analysis
- `CAMERA` - Camera operations
- `IMAGE_PROCESSING` - Image manipulation

### Data
- `API_CALLS` - External API requests
- `DATABASE` - Database operations
- `STORAGE` - Local storage operations

### UI/UX
- `USER_ACTION` - User interactions
- `PERFORMANCE` - Performance metrics
- `RENDER` - UI rendering

### System
- `NETWORK` - Network connectivity
- `CRASH` - App crashes
- `ERROR_BOUNDARY` - React error boundaries

## 🔧 Common Patterns

### API Call Logging
```typescript
logger.debug(LogCategories.API_CALLS, 'Starting API request', { endpoint, params });
const startTime = logger.startPerformanceTracking('api-request');

try {
  const response = await fetch(endpoint, params);
  logger.info(LogCategories.API_CALLS, 'API request successful', { 
    status: response.status,
    duration: Date.now() - startTime 
  });
  return response;
} catch (error) {
  logger.error(LogCategories.API_CALLS, 'API request failed', error, { endpoint });
  throw error;
} finally {
  endTracking();
}
```

### User Action Logging
```typescript
const handleButtonPress = () => {
  logger.info(LogCategories.USER_ACTION, 'Button pressed', {
    buttonId: 'generate-outfit',
    screen: 'wardrobe',
    context: { itemCount: items.length }
  });
};
```

### Error Boundary Logging
```typescript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  logger.fatal(LogCategories.ERROR_BOUNDARY, 'React component error', error, {
    componentStack: errorInfo.componentStack,
    errorBoundary: this.constructor.name
  });
}
```

### Performance Monitoring
```typescript
// Screen render time
const trackRender = logger.startPerformanceTracking('screen-render');
// Component renders...
trackRender();

// Async operation timing
const trackOperation = logger.startPerformanceTracking('data-load');
await loadData();
trackOperation();
```

## 🔒 Privacy & Security

### Automatically Redacted
- Passwords, tokens, API keys
- Credit cards, SSNs
- Private keys, secrets

### Partially Masked
- Email addresses: `user@domain.com` → `us***@domain.com`
- Names: `John Doe` → `J***e`
- Phone numbers: `(555) 123-4567` → `(***) ***-4567`

### Manual Sanitization
```typescript
// If you need to sanitize custom data
const sanitizedData = logger.sanitizeData(userData);
logger.info(LogCategories.USER_ACTION, 'User data', sanitizedData);
```

## 🛠️ Configuration

### Set Log Level
```typescript
// Development
logger.setLogLevel(LogLevel.DEBUG);

// Production
logger.setLogLevel(LogLevel.WARN);

// Environment-based
logger.setLogLevel(__DEV__ ? LogLevel.DEBUG : LogLevel.ERROR);
```

### Check Current Level
```typescript
const currentLevel = logger.getLogLevel();
console.log('Current log level:', LogLevel[currentLevel]);
```

## 📁 File Management

### Log File Location
```
iOS: /Documents/logs/
Android: /data/data/[package]/files/logs/
```

### File Structure
```
logs/
├── current.log          # Active log file
└── archive/            # Rotated files (max 10)
    ├── log-2024-01-15-10-30-45.log
    └── log-2024-01-15-11-15-20.log
```

### Export Logs
```typescript
const logPath = await logger.exportLogs();
console.log('Logs exported to:', logPath);
```

## 🚨 Troubleshooting

### Logger Not Working?
```typescript
// Check if logger is available
console.log('Logger:', !!logger);
console.log('Log level:', logger.getLogLevel());

// Test basic functionality
logger.info('test', 'Logger test');
```

### File System Issues?
```
Warning: File system not available, logging will be console-only
```
- Expected in web environments
- Logs still work via console
- Check RNFS installation

### Device Info Missing?
```
Warning: DeviceInfo not available, using fallback device info
```
- Uses mock data when react-native-device-info unavailable
- Logging continues normally

## 💡 Best Practices

### ✅ Do
- Use appropriate log levels
- Include relevant context data
- Track performance of key operations
- Log user actions for analytics
- Log API errors with context

### ❌ Don't
- Log sensitive user data directly
- Use DEBUG level in production
- Log in tight loops (use VERBOSE sparingly)
- Include large objects without sanitization
- Ignore error logging

### Example: Good Logging
```typescript
// ✅ Good: Informative with context
logger.info(LogCategories.OUTFIT_GENERATION, 'Outfit generated successfully', {
  itemCount: items.length,
  aiScore: result.styleScore,
  duration: performance.duration,
  context: outfitContext.occasion
});

// ❌ Poor: No context
logger.info(LogCategories.OUTFIT_GENERATION, 'Success');
```

## 📊 Performance Impact

| Environment | Console | File I/O | Memory |
|-------------|---------|----------|---------|
| Development | ~0.1ms | ~1-5ms | ~1MB buffer |
| Production | ~0.05ms | ~1-3ms | ~1MB buffer |

- File operations are asynchronous and non-blocking
- Logs are batched and flushed automatically
- Minimal impact on app performance

---

*For detailed documentation, see `DEBUG_SYSTEM_DOCUMENTATION.md`*