# URI Validation System

This document describes the comprehensive URI validation layer implemented to prevent temporary URIs from being stored in AsyncStorage, ensuring all image URIs are persistent before storage.

## Overview

The URI validation system provides a robust layer of protection against image persistence issues by:

- **Validating URIs** before storage operations
- **Detecting temporary storage locations** (cache, ImagePicker, etc.)
- **Providing repair suggestions** for problematic URIs
- **Blocking storage operations** that would cause data loss
- **Comprehensive logging** for debugging and monitoring

## Core Components

### 1. URIValidator (`utils/URIValidation.ts`)

The main validation utility that analyzes URIs and determines their storage type and validity.

```typescript
import { URIValidator } from '../utils/URIValidation';

// Validate a single URI
const result = await URIValidator.validateURI(imageUri, {
  requireFileExists: true,
  generateRepairSuggestions: true,
  logValidation: true
});

if (!result.isValid) {
  console.log(`Invalid URI: ${result.details}`);
  // Handle repair suggestions
  if (result.repairSuggestions) {
    for (const suggestion of result.repairSuggestions) {
      const repairedUri = await suggestion.action();
      if (repairedUri) break;
    }
  }
}
```

#### URI Types Detected

- **Persistent Storage**: DocumentDirectory, app files directory, stylemuse directories
- **Temporary Storage**: Cache directory, ImagePicker, camera temp, system temp
- **Network URLs**: HTTP/HTTPS URLs (configurable)
- **Invalid URIs**: Empty, malformed, or missing files

### 2. URIValidationMiddleware

Provides middleware functions for automatic validation before storage operations.

```typescript
import { URIValidationMiddleware } from '../utils/URIValidation';

// Validate before AsyncStorage operations
const result = await URIValidationMiddleware.validateBeforeAsyncStorage(
  wardrobeItems, 
  'save'
);

if (result.blocked) {
  console.log('Storage blocked:', result.warnings);
  // Handle validation failures
}
```

### 3. ValidatedStorageService (`utils/ValidatedStorageService.ts`)

A wrapper around the standard StorageService that automatically validates URIs before storage.

```typescript
import { ValidatedStorageService } from '../utils/ValidatedStorageService';

// Save with automatic validation
const result = await ValidatedStorageService.saveWardrobeItems(items);

if (!result.success) {
  console.log(`Blocked items: ${result.blocked.length}`);
  console.log('Warnings:', result.warnings);
}
```

### 4. useValidatedWardrobeData Hook (`hooks/useValidatedWardrobeData.ts`)

Enhanced version of useWardrobeData with built-in URI validation.

```typescript
import { useValidatedWardrobeData } from '../hooks/useValidatedWardrobeData';

const {
  saveBulkWardrobeItems, // Automatically validates URIs
  validationWarnings,
  auditStorageValidation,
  checkStorageSafety,
} = useValidatedWardrobeData();
```

## Usage Patterns

### Basic Validation

```typescript
// Quick safety check
const isSafe = URIValidationUtils.isSafeForStorage(imageUri);

// Detailed validation
const validation = await URIValidator.validateURI(imageUri);
console.log(`Storage type: ${URIValidator.getStorageTypeDescription(imageUri)}`);
```

### Batch Operations

```typescript
// Validate multiple URIs
const results = await URIValidator.validateBatch(imageUris);

// Check batch storage safety
const safety = URIValidationUtils.checkBatchStorageSafety(items);
console.log(`Safe: ${safety.safe}, Unsafe: ${safety.unsafe}`);
```

### Storage Operations

```typescript
// Automatically validated save
const result = await ValidatedStorageService.saveWardrobeItems(items);

// Batch save with validation
const batchResult = await ValidatedStorageService.batchValidatedSave({
  wardrobeItems: items,
  profileImage: profileUri
});
```

### Auditing Existing Data

```typescript
// Audit stored data for validation issues
const audit = await ValidatedStorageService.auditStoredData();

console.log(`Wardrobe items: ${audit.wardrobeItems.valid}/${audit.wardrobeItems.total} valid`);
console.log(`Temporary URIs: ${audit.wardrobeItems.temporary}`);
```

## Integration Points

### 1. WardrobeUploadScreen

Replace direct AsyncStorage calls with validated storage:

```typescript
// Before
await AsyncStorage.setItem(STORAGE_KEYS.WARDROBE_ITEMS, JSON.stringify(items));

// After
const result = await ValidatedStorageService.saveWardrobeItems(items);
if (!result.success) {
  // Handle validation failures
  Alert.alert('Storage Issue', result.warnings.join('\n'));
}
```

### 2. Camera Integration

Validate camera image URIs before saving:

```typescript
// After capturing image
const validation = await URIValidator.validateURI(capturedImageUri);

if (validation.isTemporary) {
  // Migrate to persistent storage
  const persistentUri = await ImagePersistenceService.persistImage(capturedImageUri, 'wardrobe');
  // Use persistentUri for storage
}
```

### 3. Profile Management

Use validated profile image saving:

```typescript
// Replace direct storage
const { success, warnings } = await ValidatedStorageService.saveProfileImage(imageUri);

if (!success) {
  console.log('Profile image validation failed:', warnings);
}
```

## Validation Patterns

### Persistent URI Patterns

```
✅ file:///data/user/0/app/files/stylemuse/...
✅ file:///var/mobile/Containers/Data/Application/.../Documents/...
✅ Any path containing /stylemuse/
✅ DocumentDirectory paths
```

### Temporary URI Patterns (Blocked)

```
❌ file:///data/user/0/app/cache/...
❌ file:///var/tmp/...
❌ Paths containing /ImagePicker/
❌ Paths containing /camera/
❌ Paths containing /ExponentExperienceData/
❌ CacheDirectory paths
```

## Error Handling

The validation system provides detailed error information and repair suggestions:

```typescript
const result = await URIValidator.validateURI(problematicUri, {
  generateRepairSuggestions: true
});

if (!result.isValid && result.repairSuggestions) {
  for (const suggestion of result.repairSuggestions) {
    console.log(`${suggestion.type}: ${suggestion.description}`);
    
    if (suggestion.priority === 'high') {
      try {
        const repairedUri = await suggestion.action();
        if (repairedUri) {
          console.log(`Repaired: ${repairedUri}`);
          break;
        }
      } catch (error) {
        console.log(`Repair failed: ${error.message}`);
      }
    }
  }
}
```

## Testing

Run the comprehensive test suite:

```bash
npm test utils/__tests__/URIValidation.test.ts
```

Test scenarios include:
- Persistent vs temporary URI detection
- Batch validation
- Error handling
- Repair suggestions
- Integration scenarios

## Development Tools

### Validation Script

Run the storage validation script to audit existing data:

```bash
# Audit current storage
node scripts/validate-storage-uris.js

# Generate detailed report
node scripts/validate-storage-uris.js --report-only

# Attempt repairs (placeholder)
node scripts/validate-storage-uris.js --fix
```

### Debug Logging

All validation operations are logged using the DebugLogger system:

```bash
# Watch validation logs
./scripts/watch-logs.sh | grep -i "uri\|storage\|validation"
```

## Performance Considerations

- **Batch validation** for multiple URIs improves performance
- **Caching** of validation results for repeated URIs
- **Async validation** doesn't block UI operations
- **Selective validation** based on operation type

## Migration Guide

To integrate the URI validation system into existing code:

1. **Replace storage calls**:
   ```typescript
   // Old
   import { StorageService } from '../services/StorageService';
   
   // New
   import { ValidatedStorageService } from '../utils/ValidatedStorageService';
   ```

2. **Update hooks**:
   ```typescript
   // Old
   import { useWardrobeData } from '../hooks/useWardrobeData';
   
   // New
   import { useValidatedWardrobeData } from '../hooks/useValidatedWardrobeData';
   ```

3. **Add validation checks**:
   ```typescript
   // Before saving images
   const isSafe = URIValidationUtils.isSafeForStorage(imageUri);
   if (!isSafe) {
     // Handle unsafe URI
   }
   ```

## Configuration

Validation behavior can be configured:

```typescript
const validation = await URIValidator.validateURI(uri, {
  allowNetworkUrls: false,        // Allow HTTP/HTTPS URLs
  requireFileExists: true,        // Check file existence
  generateRepairSuggestions: true, // Generate repair actions
  logValidation: true             // Log validation operations
});
```

## Best Practices

1. **Always validate** before storage operations
2. **Use batch validation** for multiple URIs
3. **Handle repair suggestions** automatically when possible
4. **Log validation results** for debugging
5. **Audit existing data** regularly
6. **Migrate temporary URIs** immediately after capture
7. **Test validation logic** thoroughly

## Future Enhancements

- **Automatic migration** of temporary URIs
- **Background validation** of stored data
- **Cloud storage** validation patterns
- **Performance optimization** with caching
- **Visual indicators** for validation status in UI

This URI validation system provides a robust foundation for preventing image persistence issues while maintaining a smooth user experience.