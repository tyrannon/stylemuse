# Broken Image Repair Migration System

## Overview

The Broken Image Repair Migration System is a comprehensive solution designed to detect, repair, and maintain the integrity of image references in the StyleMuse wardrobe system. It extends the existing DataMigrationService with advanced capabilities for handling broken, temporary, and corrupted image URIs.

## Architecture

### Core Components

1. **BrokenImageRepairService** (`/services/BrokenImageRepairService.ts`)
   - Main repair engine with comprehensive validation and recovery
   - Multiple recovery strategies and advanced path generation
   - Analytics and progress tracking
   - Backup and rollback capabilities

2. **ImageRepairIntegration** (`/services/ImageRepairIntegration.ts`)
   - App startup integration and scheduling
   - Configuration management
   - Legacy migration compatibility
   - Automatic repair triggers

3. **BrokenImageRepairModal** (`/components/BrokenImageRepairModal.tsx`)
   - User interface for repair progress
   - Real-time analytics display
   - Interactive progress tracking

4. **ManualImageRepairTrigger** (`/utils/ManualImageRepairTrigger.ts`)
   - Manual repair triggers for settings/debug
   - Health check utilities
   - Configuration management UI

## Features

### 🔍 Advanced Detection
- **Multiple Validation Strategies**: File existence, size validation, corruption detection
- **Format Validation**: Magic byte checking and extension validation
- **Comprehensive Scanning**: Analyzes all wardrobe items for image issues

### 🔧 Intelligent Recovery
- **Multi-Strategy Recovery**: Attempts recovery from various potential locations
- **Path Generation**: Generates dozens of potential paths based on naming patterns
- **Legacy Path Support**: Handles iOS container path changes and app updates
- **Timestamp Variations**: Tries timestamp-based filename variations

### 📊 Analytics & Reporting
- **Detailed Progress Tracking**: Real-time progress with phase indicators
- **Comprehensive Analytics**: Breakdown by issue type, recovery method, failure reasons
- **Performance Metrics**: Throughput, timing, and efficiency measurements
- **Backup Creation**: Automatic backup before repairs with rollback capability

### ⚙️ Configuration & Scheduling
- **Automatic Scheduling**: Weekly checks with configurable intervals
- **Threshold Management**: Configurable minimum broken items for auto-trigger
- **User Preferences**: Enable/disable auto repair, skip options
- **Integration Points**: Seamless integration with app startup and existing migration

## Usage

### Automatic Integration

The system automatically integrates with the app startup process in `App.js`:

```javascript
// Automatic check during app startup
const checkResult = await repairIntegration.performStartupImageCheck();

if (checkResult.needsRepair || checkResult.needsLegacyMigration) {
  // Shows appropriate modal based on needs
  setImageRepairNeeded(true);
  setRepairInfo(checkResult);
}
```

### Manual Triggers

#### From Settings/Debug Menu
```javascript
import { ManualImageRepairTrigger } from '../utils/ManualImageRepairTrigger';

const repairTrigger = ManualImageRepairTrigger.getInstance();

// Show repair menu with options
await repairTrigger.showRepairMenu();

// Quick health check
const healthStatus = await repairTrigger.quickHealthCheck();
console.log(healthStatus);
```

#### Programmatic Usage
```javascript
import { BrokenImageRepairService } from '../services/BrokenImageRepairService';

const repairService = BrokenImageRepairService.getInstance();

// Run comprehensive repair
const summary = await repairService.performComprehensiveRepair(
  (progress) => {
    console.log(`${progress.phase}: ${progress.processedItems}/${progress.totalItems}`);
  },
  {
    dryRun: false,
    removeUnrecoverable: true,
    backupBeforeRepair: true,
    maxRecoveryAttempts: 5
  }
);

console.log('Repair completed:', summary);
```

### Configuration Management

```javascript
import { ImageRepairIntegration } from '../services/ImageRepairIntegration';

const integration = ImageRepairIntegration.getInstance();

// Enable/disable auto repair
await integration.setAutoRepairEnabled(true);

// Skip next automatic repair
await integration.skipNextAutoRepair();

// Get current statistics
const stats = await integration.getRepairStats();
```

## Recovery Strategies

### 1. Persistence Migration
- Migrates images from temporary to persistent storage
- Uses ImagePersistenceService for secure storage
- Maintains thumbnails and metadata

### 2. Alternative Path Recovery
- Searches multiple potential file locations
- Handles iOS container path changes
- Checks various cache and temporary directories

### 3. Timestamp-Based Recovery
- Generates filename variations with timestamps
- Handles date-based naming patterns
- Covers recent file creation patterns (last 30 days)

### 4. Legacy Path Support
- iOS application container path variations
- Android storage path alternatives
- Expo FileSystem path variations

### 5. Format-Based Recovery
- Tries different image format extensions
- Handles extension-based filename variations
- Validates recovered files for format integrity

## Configuration Options

### Repair Options
```typescript
interface RepairOptions {
  dryRun?: boolean;                    // Preview mode without changes
  removeUnrecoverable?: boolean;       // Clean up unrecoverable items
  backupBeforeRepair?: boolean;        // Create backup before changes
  maxRecoveryAttempts?: number;        // Maximum recovery attempts per item
}
```

### Schedule Configuration
```typescript
interface RepairScheduleConfig {
  autoRepairEnabled: boolean;          // Enable automatic repairs
  lastRepairDate: string | null;       // Last repair timestamp
  repairIntervalDays: number;          // Days between automatic checks
  repairThreshold: number;             // Minimum broken items to trigger
  skipNextAutoRepair: boolean;         // Skip next automatic repair
}
```

## Integration Points

### App Startup (`App.js`)
- Automatic health check for existing users
- Seamless modal integration
- Non-blocking initialization

### Settings Integration
- Manual repair triggers
- Configuration management
- Health status display

### Debug Menu Integration
- Quick health checks
- Analytics export
- Manual trigger options

## Error Handling & Safety

### Backup System
- Automatic backup creation before repairs
- JSON-based wardrobe data backup
- Timestamped backup files in `/stylemuse/backups/`

### Rollback Capability
- Failed repairs don't lose data
- Original paths preserved in metadata
- Manual rollback support

### Safe Defaults
- Conservative removal policies
- Text-only fallback for unrecoverable items
- Non-destructive dry-run mode

### Error Recovery
- Graceful handling of repair failures
- Detailed error logging and analytics
- Continuation after individual item failures

## Performance Considerations

### Optimizations
- Batch processing with UI thread yielding
- Efficient file system operations
- Minimal memory footprint during repairs

### Throughput
- Typical performance: 50-100 items/second
- Progress reporting every 5-10 items
- Configurable delay intervals to prevent blocking

### Memory Management
- Streaming processing of large wardrobes
- Garbage collection friendly operations
- Efficient path generation algorithms

## Analytics & Monitoring

### Progress Tracking
```typescript
interface RepairProgress {
  phase: 'scanning' | 'analyzing' | 'repairing' | 'cleanup' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  recoveredItems: number;
  failedItems: number;
  removedItems: number;
  currentItem?: string;
  message: string;
  analytics: {
    brokenByType: { [key: string]: number };
    recoveryMethods: { [key: string]: number };
    failureReasons: { [key: string]: number };
  };
}
```

### Summary Analytics
```typescript
interface RepairSummary {
  success: boolean;
  totalItems: number;
  scannedItems: number;
  brokenItems: number;
  recoveredItems: number;
  removedItems: number;
  failedItems: number;
  brokenReferences: string[];
  recoveredReferences: string[];
  removedReferences: string[];
  details: string[];
  analytics: {
    brokenByType: { [key: string]: number };
    recoveryMethods: { [key: string]: number };
    failureReasons: { [key: string]: number };
    timeTaken: number;
    throughputPerSecond: number;
  };
}
```

## Testing & Validation

### Dry Run Mode
- Preview all changes without modification
- Full analytics and reporting
- Safe testing of repair strategies

### Health Checks
- Non-invasive status checking
- Quick wardrobe health assessment
- Configuration validation

### Manual Testing
```javascript
// Test repair on specific items
const testItems = [/* test wardrobe items */];
const result = await repairService.analyzeAllImages(testItems);

// Test path generation
const paths = repairService.generateAdvancedPotentialPaths(brokenPath, item);
console.log('Generated paths:', paths);
```

## Migration Path

### From Legacy DataMigrationService
1. System detects if legacy migration is needed
2. Runs existing DataMigrationService first
3. Follows up with comprehensive repair
4. Maintains backward compatibility

### Gradual Rollout
1. Start with dry-run mode enabled
2. Monitor analytics and success rates
3. Gradually enable automatic repairs
4. Full rollout with user controls

## Troubleshooting

### Common Issues

#### High Failure Rate
- Check file system permissions
- Verify storage paths are accessible
- Review path generation patterns

#### Performance Issues
- Adjust recovery attempt limits
- Increase delay intervals between items
- Enable progress reporting for monitoring

#### Configuration Problems
- Reset configuration to defaults
- Verify AsyncStorage accessibility
- Check integration setup

### Debug Tools

#### Manual Health Check
```javascript
const trigger = ManualImageRepairTrigger.getInstance();
const health = await trigger.quickHealthCheck();
console.log(health);
```

#### Analytics Export
```javascript
const analytics = await trigger.exportRepairAnalytics();
console.log(JSON.stringify(analytics, null, 2));
```

#### Configuration Inspection
```javascript
const integration = ImageRepairIntegration.getInstance();
const stats = await integration.getRepairStats();
console.log('Current config:', stats.config);
```

## Future Enhancements

### Planned Features
- Cloud backup integration
- Smart learning from successful recovery patterns
- Batch processing optimization
- Advanced corruption detection

### Monitoring Integration
- Health monitoring dashboards
- Automated alerts for high failure rates
- Performance trend analysis

## Conclusion

The Broken Image Repair Migration System provides a robust, comprehensive solution for maintaining wardrobe image integrity. With its multiple recovery strategies, comprehensive analytics, and seamless integration, it ensures users never lose their wardrobe data due to image reference issues.

The system is designed to be safe, reversible, and user-friendly while providing deep insights into the health and maintenance of the wardrobe image system.