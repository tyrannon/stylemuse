# StyleMuse Debug System Implementation Plan

## Overview

A comprehensive debugging system for StyleMuse that captures, stores, and manages debug logs for development and production troubleshooting.

## Architecture

### 1. Core Debug Logger

```typescript
// utils/DebugLogger.ts
export enum LogLevel {
  VERBOSE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  stackTrace?: string;
  userId?: string;
  sessionId: string;
  appVersion: string;
  platform: string;
  deviceInfo?: DeviceInfo;
}

export class DebugLogger {
  private static instance: DebugLogger;
  private logBuffer: LogEntry[] = [];
  private fileWriter: FileWriter;
  private currentLogLevel: LogLevel = LogLevel.DEBUG;
  private maxBufferSize = 1000;
  private sessionId: string;
  
  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }
  
  constructor() {
    this.sessionId = generateSessionId();
    this.fileWriter = new FileWriter();
    this.setupCrashHandling();
    this.loadConfiguration();
  }
  
  // Main logging methods
  verbose(category: string, message: string, data?: any) {
    this.log(LogLevel.VERBOSE, category, message, data);
  }
  
  debug(category: string, message: string, data?: any) {
    this.log(LogLevel.DEBUG, category, message, data);
  }
  
  info(category: string, message: string, data?: any) {
    this.log(LogLevel.INFO, category, message, data);
  }
  
  warn(category: string, message: string, data?: any) {
    this.log(LogLevel.WARN, category, message, data);
  }
  
  error(category: string, message: string, error?: Error, data?: any) {
    this.log(LogLevel.ERROR, category, message, {
      ...data,
      error: error?.message,
      stack: error?.stack
    });
  }
  
  fatal(category: string, message: string, error?: Error, data?: any) {
    this.log(LogLevel.FATAL, category, message, {
      ...data,
      error: error?.message,
      stack: error?.stack
    });
    // Immediately flush on fatal errors
    this.flush();
  }
}
```

### 2. File Management System

```typescript
// utils/debug/FileWriter.ts
import RNFS from 'react-native-fs';
import { zip } from 'react-native-zip-archive';

export class FileWriter {
  private logDirectory: string;
  private currentLogFile: string;
  private maxFileSize = 5 * 1024 * 1024; // 5MB
  private maxLogFiles = 10;
  
  constructor() {
    this.logDirectory = `${RNFS.DocumentDirectoryPath}/logs`;
    this.ensureLogDirectory();
    this.currentLogFile = this.getLogFileName();
  }
  
  async writeLog(entry: LogEntry): Promise<void> {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      
      // Check file size and rotate if needed
      const fileInfo = await RNFS.stat(this.currentLogFile).catch(() => null);
      if (fileInfo && fileInfo.size > this.maxFileSize) {
        await this.rotateLogFile();
      }
      
      // Append to current log file
      await RNFS.appendFile(this.currentLogFile, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }
  
  async rotateLogFile(): Promise<void> {
    // Archive current log
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveName = `${this.logDirectory}/archive/log-${timestamp}.json`;
    await RNFS.moveFile(this.currentLogFile, archiveName);
    
    // Create new log file
    this.currentLogFile = this.getLogFileName();
    
    // Clean old logs
    await this.cleanOldLogs();
  }
  
  async exportLogs(): Promise<string> {
    // Zip all log files
    const exportPath = `${RNFS.CachesDirectoryPath}/debug-logs-${Date.now()}.zip`;
    const files = await RNFS.readDir(this.logDirectory);
    const logFiles = files.filter(f => f.name.endsWith('.json')).map(f => f.path);
    
    await zip(logFiles, exportPath);
    return exportPath;
  }
}
```

### 3. Log Categories

```typescript
// constants/LogCategories.ts
export const LogCategories = {
  // Core App
  APP_LIFECYCLE: 'app.lifecycle',
  NAVIGATION: 'navigation',
  AUTHENTICATION: 'auth',
  
  // Features
  WARDROBE: 'wardrobe',
  OUTFIT_GENERATION: 'outfit.generation',
  AI_ANALYSIS: 'ai.analysis',
  CAMERA: 'camera',
  IMAGE_PROCESSING: 'image.processing',
  
  // Data
  API_CALLS: 'api',
  DATABASE: 'database',
  CACHE: 'cache',
  STORAGE: 'storage',
  
  // UI/UX
  USER_ACTION: 'user.action',
  PERFORMANCE: 'performance',
  RENDER: 'render',
  
  // System
  NETWORK: 'network',
  MEMORY: 'memory',
  CRASH: 'crash',
  ERROR_BOUNDARY: 'error.boundary',
  
  // Business
  MONETIZATION: 'monetization',
  ANALYTICS: 'analytics',
  SUBSCRIPTION: 'subscription'
} as const;
```

### 4. Debug UI Component

```typescript
// components/debug/DebugPanel.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Share } from 'react-native';
import { DebugLogger, LogLevel, LogEntry } from '../../utils/DebugLogger';

export const DebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState({
    level: LogLevel.DEBUG,
    category: 'all',
    searchText: ''
  });
  const [isVisible, setIsVisible] = useState(false);
  
  // Three-finger tap to show/hide debug panel
  useEffect(() => {
    const gestureHandler = (event: any) => {
      if (event.touches.length === 3) {
        setIsVisible(prev => !prev);
      }
    };
    
    // Add gesture listener
    return () => {
      // Cleanup
    };
  }, []);
  
  const exportAndShare = async () => {
    const logger = DebugLogger.getInstance();
    const exportPath = await logger.exportLogs();
    
    await Share.share({
      title: 'StyleMuse Debug Logs',
      url: `file://${exportPath}`,
      message: 'Debug logs from StyleMuse'
    });
  };
  
  const clearLogs = () => {
    DebugLogger.getInstance().clearLogs();
    setLogs([]);
  };
  
  if (!isVisible) return null;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Console</Text>
        <TouchableOpacity onPress={() => setIsVisible(false)}>
          <Text>✕</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.controls}>
        <LogLevelPicker value={filter.level} onChange={setFilter} />
        <CategoryPicker value={filter.category} onChange={setFilter} />
        <SearchBar value={filter.searchText} onChange={setFilter} />
      </View>
      
      <ScrollView style={styles.logContainer}>
        {logs
          .filter(log => log.level >= filter.level)
          .filter(log => filter.category === 'all' || log.category === filter.category)
          .filter(log => log.message.includes(filter.searchText))
          .map((log, index) => (
            <LogEntryView key={index} log={log} />
          ))}
      </ScrollView>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={exportAndShare}>
          <Text>Export Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={clearLogs}>
          <Text>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

### 5. Integration Points

```typescript
// Example usage throughout the app

// In API calls
import { DebugLogger, LogCategories } from '@/utils/DebugLogger';

const logger = DebugLogger.getInstance();

export const apiCall = async (endpoint: string, params: any) => {
  logger.debug(LogCategories.API_CALLS, `Calling ${endpoint}`, { params });
  
  try {
    const response = await fetch(endpoint, params);
    const data = await response.json();
    
    logger.debug(LogCategories.API_CALLS, `Response from ${endpoint}`, {
      status: response.status,
      dataSize: JSON.stringify(data).length
    });
    
    return data;
  } catch (error) {
    logger.error(LogCategories.API_CALLS, `Failed ${endpoint}`, error as Error);
    throw error;
  }
};

// In outfit generation
export const generateOutfit = async (items: WardrobeItem[]) => {
  logger.info(LogCategories.OUTFIT_GENERATION, 'Starting outfit generation', {
    itemCount: items.length,
    categories: items.map(i => i.category)
  });
  
  const startTime = Date.now();
  
  try {
    const outfit = await aiGenerateOutfit(items);
    
    logger.info(LogCategories.OUTFIT_GENERATION, 'Outfit generated successfully', {
      duration: Date.now() - startTime,
      pieceCount: outfit.pieces.length
    });
    
    return outfit;
  } catch (error) {
    logger.error(LogCategories.OUTFIT_GENERATION, 'Generation failed', error as Error);
    throw error;
  }
};

// Performance tracking
export const trackScreenRender = (screenName: string) => {
  const startTime = Date.now();
  
  return () => {
    logger.debug(LogCategories.PERFORMANCE, `Screen rendered: ${screenName}`, {
      duration: Date.now() - startTime
    });
  };
};
```

### 6. Configuration

```typescript
// config/debugConfig.ts
export interface DebugConfig {
  enabled: boolean;
  logLevel: LogLevel;
  enabledCategories: string[];
  maxFileSize: number;
  maxLogFiles: number;
  uploadCrashLogs: boolean;
  remoteLogging: {
    enabled: boolean;
    endpoint?: string;
    apiKey?: string;
  };
}

export const debugConfig: DebugConfig = {
  enabled: __DEV__,
  logLevel: __DEV__ ? LogLevel.DEBUG : LogLevel.WARN,
  enabledCategories: ['all'],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxLogFiles: 10,
  uploadCrashLogs: true,
  remoteLogging: {
    enabled: false,
    // endpoint: 'https://api.stylemuse.com/logs',
    // apiKey: process.env.LOGGING_API_KEY
  }
};
```

### 7. Privacy Considerations

```typescript
// utils/debug/PrivacyFilter.ts
export class PrivacyFilter {
  private sensitivePatterns = [
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/g, // Auth tokens
  ];
  
  sanitize(data: any): any {
    if (typeof data === 'string') {
      let sanitized = data;
      this.sensitivePatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      });
      return sanitized;
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = Array.isArray(data) ? [] : {};
      for (const key in data) {
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitize(data[key]);
        }
      }
      return sanitized;
    }
    
    return data;
  }
  
  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'auth'];
    return sensitiveKeys.some(k => key.toLowerCase().includes(k));
  }
}
```

### 8. Production Features

```typescript
// Remote log shipping for production
export class RemoteLogger {
  private batchSize = 100;
  private batchInterval = 60000; // 1 minute
  private logQueue: LogEntry[] = [];
  
  async shipLogs(logs: LogEntry[]): Promise<void> {
    if (!debugConfig.remoteLogging.enabled) return;
    
    const sanitizedLogs = logs.map(log => ({
      ...log,
      data: new PrivacyFilter().sanitize(log.data)
    }));
    
    try {
      await fetch(debugConfig.remoteLogging.endpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${debugConfig.remoteLogging.apiKey}`
        },
        body: JSON.stringify({ logs: sanitizedLogs })
      });
    } catch (error) {
      // Fail silently in production
    }
  }
}
```

## Implementation Checklist

### Phase 1: Core Logger (Day 1)
- [ ] Create DebugLogger class
- [ ] Implement file writing system
- [ ] Set up log rotation
- [ ] Add privacy filtering
- [ ] Create log categories

### Phase 2: Integration (Day 2)
- [ ] Add logging to API calls
- [ ] Add logging to AI features
- [ ] Add logging to navigation
- [ ] Add performance tracking
- [ ] Add error boundaries

### Phase 3: Debug UI (Day 3)
- [ ] Create debug panel component
- [ ] Add gesture activation
- [ ] Implement log filtering
- [ ] Add export functionality
- [ ] Add search capability

### Phase 4: Production Ready (Day 4)
- [ ] Add remote logging
- [ ] Implement crash reporting
- [ ] Add user consent for logs
- [ ] Create admin dashboard
- [ ] Add log analytics

## Usage Examples

```typescript
// Simple logging
logger.debug('wardrobe', 'Loading wardrobe items');

// With data
logger.info('outfit', 'Generated outfit', {
  itemCount: 5,
  occasion: 'casual',
  weather: 'sunny'
});

// Error logging
try {
  await riskyOperation();
} catch (error) {
  logger.error('operation', 'Operation failed', error, {
    context: 'user_action'
  });
}

// Performance tracking
const endTracking = logger.startPerformanceTracking('screen_load');
// ... render screen
endTracking(); // Automatically logs duration

// User actions
logger.info('user_action', 'Button clicked', {
  button: 'generate_outfit',
  screen: 'wardrobe'
});
```

## Benefits

1. **Development**: Easy debugging during development
2. **QA Testing**: Detailed logs for bug reproduction
3. **Production**: Crash reporting and analytics
4. **Support**: Help users by examining their logs
5. **Performance**: Track app performance over time
6. **Business**: Understand user behavior patterns

## Security & Privacy

- All sensitive data is automatically redacted
- Logs are stored locally by default
- User consent required for remote logging
- Logs auto-delete after 7 days
- Export requires authentication

## Next Steps

1. Review and refine the architecture
2. Set up the basic logger tomorrow
3. Integrate into existing error handling
4. Add to critical user flows
5. Create debug UI component
6. Test in development and production modes