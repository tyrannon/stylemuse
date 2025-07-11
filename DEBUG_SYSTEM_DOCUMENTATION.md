# StyleMuse Debug System Documentation

## Overview

The StyleMuse debug system provides comprehensive logging, performance tracking, and error monitoring for development and production environments. The system is designed to be privacy-first, production-ready, and gracefully degrade when dependencies are unavailable.

## Architecture

### Core Components

1. **DebugLogger** (`utils/DebugLogger.ts`) - Main logging class
2. **PrivacyFilter** (`utils/debug/PrivacyFilter.ts`) - Data sanitization
3. **LogCategories** (`constants/LogCategories.ts`) - Predefined log categories
4. **File Management** - Automatic log rotation and cleanup

## Features

### 🔧 Core Logging
- **5 Log Levels**: VERBOSE, DEBUG, INFO, WARN, ERROR, FATAL
- **Singleton Pattern**: Single instance across the app
- **Session Tracking**: Each app session gets unique ID
- **Performance Tracking**: Built-in timing helpers

### 📁 File Management
- **Automatic Rotation**: Files rotate at 5MB
- **Cleanup**: Keeps maximum 10 log files
- **Local Storage**: Uses React Native File System
- **Graceful Fallback**: Console-only when file system unavailable

### 🔒 Privacy Protection
- **Automatic Sanitization**: Removes sensitive data patterns
- **Pattern Detection**: Credit cards, SSNs, emails, tokens
- **Key Filtering**: Redacts sensitive object keys
- **User Data Masking**: Partial masking for non-sensitive user data

### 📊 Integration Points
- **API Calls**: All OpenAI/DALL-E requests logged
- **Outfit Generation**: Complete AI workflow tracking
- **Wardrobe Operations**: Data loading, saving, updates
- **Error Handling**: Global crash reporting

## Usage

### Basic Logging

```typescript
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

// Different log levels
logger.verbose(LogCategories.API_CALLS, 'Detailed debug info');
logger.debug(LogCategories.WARDROBE, 'Debug information');
logger.info(LogCategories.OUTFIT_GENERATION, 'Important events');
logger.warn(LogCategories.STORAGE, 'Warning message');
logger.error(LogCategories.AI_ANALYSIS, 'Error occurred', error);
logger.fatal(LogCategories.CRASH, 'Critical failure', error);
```

### Performance Tracking

```typescript
// Start performance tracking
const endTracking = logger.startPerformanceTracking('outfit-generation');

// Your operation here
await generateOutfit();

// End tracking (automatically logs duration)
endTracking();
```

### Error Logging

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error(LogCategories.API_CALLS, 'Operation failed', error, {
    context: 'user_action',
    userId: user.id,
    additionalData: someData
  });
}
```

## Log Categories

The system includes 17 predefined categories:

### Core App
- `APP_LIFECYCLE` - App startup, shutdown, state changes
- `NAVIGATION` - Screen navigation, routing
- `AUTHENTICATION` - Login, logout, auth state

### Features
- `WARDROBE` - Wardrobe data operations
- `OUTFIT_GENERATION` - AI outfit creation
- `AI_ANALYSIS` - AI image/text analysis
- `CAMERA` - Camera operations
- `IMAGE_PROCESSING` - Image manipulation

### Data
- `API_CALLS` - External API requests
- `DATABASE` - Database operations
- `CACHE` - Caching operations
- `STORAGE` - Local storage operations

### UI/UX
- `USER_ACTION` - User interactions
- `PERFORMANCE` - Performance metrics
- `RENDER` - UI rendering events

### System
- `NETWORK` - Network connectivity
- `MEMORY` - Memory usage
- `CRASH` - App crashes
- `ERROR_BOUNDARY` - React error boundaries

### Business
- `MONETIZATION` - Payment, subscription events
- `ANALYTICS` - Analytics events
- `SUBSCRIPTION` - Subscription state changes

## Configuration

### Log Levels

```typescript
// Set minimum log level
logger.setLogLevel(LogLevel.INFO);

// Get current log level
const currentLevel = logger.getLogLevel();
```

### Environment-Based Configuration

```typescript
// Automatic configuration based on environment
const logLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.WARN;
```

## Privacy & Security

### Automatic Data Sanitization

The privacy filter automatically removes or masks:

**Completely Redacted:**
- Credit card numbers
- Social Security Numbers
- API keys and tokens
- Passwords and secrets
- Private keys

**Partially Masked:**
- Email addresses (`user@domain.com` → `us***@domain.com`)
- User names and addresses
- Phone numbers

**Safe Patterns:**
```typescript
// Input
const userData = {
  email: 'user@example.com',
  password: 'secret123',
  apiKey: 'sk-1234567890',
  name: 'John Doe'
};

// Output after sanitization
{
  email: 'us***@example.com',
  password: '[REDACTED]',
  apiKey: '[REDACTED]',
  name: 'J***e'
}
```

## File Structure

### Log Directory Structure
```
/Documents/logs/
├── current.log          # Active log file
└── archive/            # Rotated log files
    ├── log-2024-01-15-10-30-45.log
    ├── log-2024-01-15-11-15-20.log
    └── ...
```

### Log Entry Format

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": 2,
  "category": "outfit.generation",
  "message": "AI outfit generated successfully",
  "data": {
    "styleScore": 85,
    "confidence": 92,
    "duration": 1250
  },
  "sessionId": "1642248645123-a1b2c3",
  "appVersion": "1.0.0",
  "platform": "ios",
  "deviceInfo": {
    "brand": "Apple",
    "model": "iPhone 13",
    "systemVersion": "17.0"
  }
}
```

## Integration Examples

### API Call Logging

```typescript
export async function apiCall(endpoint: string, params: any) {
  logger.debug(LogCategories.API_CALLS, `Calling ${endpoint}`, { params });
  
  const startTime = logger.startPerformanceTracking('api-call');
  
  try {
    const response = await fetch(endpoint, params);
    const data = await response.json();
    
    logger.info(LogCategories.API_CALLS, `API call successful`, {
      endpoint,
      status: response.status,
      dataSize: JSON.stringify(data).length
    });
    
    startTime();
    return data;
  } catch (error) {
    logger.error(LogCategories.API_CALLS, `API call failed`, error, {
      endpoint,
      params: logger.sanitizeData(params)
    });
    startTime();
    throw error;
  }
}
```

### User Action Logging

```typescript
const handleButtonPress = async () => {
  logger.info(LogCategories.USER_ACTION, 'Generate outfit button pressed', {
    screen: 'wardrobe',
    itemCount: selectedItems.length,
    context: outfitContext
  });
  
  try {
    await generateOutfit();
    logger.info(LogCategories.USER_ACTION, 'Outfit generation completed');
  } catch (error) {
    logger.error(LogCategories.USER_ACTION, 'Outfit generation failed', error);
  }
};
```

## Troubleshooting

### Common Issues

**1. File System Not Available**
```
Warning: File system not available, logging will be console-only
```
- Expected in web environments or when RNFS is not installed
- Logs will still work via console output

**2. Device Info Not Available**
```
Warning: DeviceInfo not available, using fallback device info
```
- Uses mock device info when react-native-device-info is unavailable
- Logging continues normally

**3. Log Files Not Rotating**
- Check available disk space
- Verify app has write permissions to Documents directory
- Check for RNFS installation issues

### Debugging the Debug System

```typescript
// Check if logger is working
console.log('Logger available:', !!logger);
console.log('Current log level:', logger.getLogLevel());

// Test basic logging
logger.debug('test', 'Debug system test');

// Check file system availability
logger.info('test', 'File system test', { 
  hasRNFS: !!require('react-native-fs'),
  hasDeviceInfo: !!require('react-native-device-info')
});
```

## Performance Impact

### Development Mode
- **Minimal Impact**: Console logging is fast
- **File I/O**: Asynchronous, non-blocking
- **Memory Usage**: ~1MB buffer before flushing

### Production Mode
- **Reduced Logging**: Higher log level threshold
- **Optimized Performance**: Less verbose output
- **Background Processing**: File operations don't block UI

### Best Practices

1. **Use Appropriate Log Levels**
   - DEBUG: Development debugging only
   - INFO: Important user actions
   - WARN: Recoverable issues
   - ERROR: Exceptions and failures

2. **Include Context**
   ```typescript
   // Good
   logger.error('api', 'Request failed', error, {
     endpoint: '/generate-outfit',
     userId: user.id,
     retryCount: 3
   });
   
   // Less helpful
   logger.error('api', 'Request failed', error);
   ```

3. **Performance Tracking**
   ```typescript
   // Track important operations
   const endTracking = logger.startPerformanceTracking('image-analysis');
   await analyzeImage(image);
   endTracking();
   ```

## Monitoring & Analytics

### Key Metrics to Track

1. **API Performance**
   - Request duration
   - Success/failure rates
   - Error patterns

2. **User Behavior**
   - Feature usage
   - Navigation patterns
   - Error frequency

3. **App Performance**
   - Screen load times
   - Memory usage
   - Crash frequency

### Log Analysis

```bash
# Example log analysis queries
# (when logs are exported and analyzed)

# Find all API errors
grep '"level":4' logs/*.log | grep 'api'

# Track outfit generation performance
grep 'outfit.generation' logs/*.log | grep 'duration'

# Monitor crash patterns
grep '"level":5' logs/*.log
```

## Future Enhancements

### Planned Features
- 🌐 Remote log shipping for production
- 📊 Built-in analytics dashboard
- 🔍 Advanced log filtering UI
- 📱 Debug panel with 3-finger gesture
- 📈 Performance monitoring charts
- 🚨 Real-time error alerts

### Extension Points
- Custom log processors
- Additional privacy filters
- Integration with external services
- Custom log formatters

## Dependencies

### Required
- `react-native-fs` (^2.20.0) - File system operations
- `react-native-device-info` (^14.0.4) - Device information

### Optional
- Works without dependencies with console-only fallback
- Graceful degradation in all environments

## Conclusion

The StyleMuse debug system provides comprehensive, production-ready logging with privacy protection and graceful fallback capabilities. It's designed to help developers debug issues, monitor performance, and understand user behavior while maintaining user privacy and app performance.

For questions or improvements, see the implementation files or contact the development team.

---

*Last updated: January 2024*