import * as FileSystem from 'expo-file-system';
import { logger } from './DebugLogger';
import { LogCategories } from '../constants/LogCategories';

/**
 * URI validation types and interfaces
 */
export interface URIValidationResult {
  isValid: boolean;
  isPersistent: boolean;
  isTemporary: boolean;
  validationType: URIValidationType;
  details: string;
  repairSuggestions?: URIRepairSuggestion[];
}

export interface URIRepairSuggestion {
  type: 'migrate' | 'recreate' | 'fallback';
  description: string;
  action: () => Promise<string | null>;
  priority: 'high' | 'medium' | 'low';
}

export type URIValidationType = 
  | 'persistent-document' 
  | 'persistent-app' 
  | 'temporary-cache' 
  | 'temporary-picker' 
  | 'temporary-system' 
  | 'invalid-missing' 
  | 'invalid-malformed' 
  | 'network-url';

export interface URIValidationOptions {
  allowNetworkUrls?: boolean;
  requireFileExists?: boolean;
  generateRepairSuggestions?: boolean;
  logValidation?: boolean;
}

/**
 * Comprehensive URI validation patterns for React Native/Expo
 */
export class URIValidator {
  private static readonly PERSISTENT_PATTERNS = [
    // Expo DocumentDirectory - persistent across app updates
    new RegExp(`^${FileSystem.documentDirectory?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || ''}`),
    // iOS Documents Directory
    /^file:\/\/\/.*\/Documents\//,
    // Android app-specific storage
    /^file:\/\/\/.*\/files\//,
    // StyleMuse specific directory
    /\/stylemuse\//,
  ];

  private static readonly TEMPORARY_PATTERNS = [
    // Expo cache directory
    new RegExp(`^${FileSystem.cacheDirectory?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || ''}`),
    // iOS temporary directories
    /^file:\/\/\/.*\/tmp\//,
    /^file:\/\/\/var\/mobile\/Containers\/Data\/.*\/tmp\//,
    // Image picker temporary locations
    /\/ImagePicker\//,
    /\/camera\//,
    /\/ExponentExperienceData\//,
    /\/ImageManipulator\//,
    // iOS system temp
    /^file:\/\/\/System\/Library\/Caches\//,
    /^file:\/\/\/private\/var\/tmp\//,
    // Android temp patterns
    /\/cache\//,
    /\/temp\//,
    /\/tmp\//,
    // Expo Go specific temp locations
    /\/ExpoKit\//,
    /\/ExperienceData\//,
  ];

  private static readonly NETWORK_PATTERNS = [
    /^https?:\/\//,
    /^ftp:\/\//,
  ];

  /**
   * Validate a single URI
   */
  static async validateURI(
    uri: string, 
    options: URIValidationOptions = {}
  ): Promise<URIValidationResult> {
    const {
      allowNetworkUrls = false,
      requireFileExists = true,
      generateRepairSuggestions = true,
      logValidation = true,
    } = options;

    if (logValidation) {
      logger.info(LogCategories.STORAGE, 'Validating URI', { uri, options });
    }

    // Check for malformed URIs
    if (!uri || typeof uri !== 'string' || uri.trim().length === 0) {
      return {
        isValid: false,
        isPersistent: false,
        isTemporary: false,
        validationType: 'invalid-malformed',
        details: 'URI is empty or malformed',
        repairSuggestions: generateRepairSuggestions ? [{
          type: 'recreate',
          description: 'URI is empty - image needs to be re-captured or re-selected',
          action: async () => null,
          priority: 'high',
        }] : undefined,
      };
    }

    // Check for network URLs
    const isNetworkUrl = this.NETWORK_PATTERNS.some(pattern => pattern.test(uri));
    if (isNetworkUrl) {
      return {
        isValid: allowNetworkUrls,
        isPersistent: false,
        isTemporary: false,
        validationType: 'network-url',
        details: `Network URL ${allowNetworkUrls ? 'allowed' : 'not allowed'}`,
        repairSuggestions: !allowNetworkUrls && generateRepairSuggestions ? [{
          type: 'migrate',
          description: 'Download and store network image locally',
          action: async () => await this.downloadNetworkImage(uri),
          priority: 'medium',
        }] : undefined,
      };
    }

    // Check for persistent storage patterns
    const isPersistent = this.PERSISTENT_PATTERNS.some(pattern => pattern.test(uri));
    
    // Check for temporary storage patterns
    const isTemporary = this.TEMPORARY_PATTERNS.some(pattern => pattern.test(uri));

    // Determine validation type
    let validationType: URIValidationType;
    if (isPersistent) {
      validationType = uri.includes('/Documents/') ? 'persistent-document' : 'persistent-app';
    } else if (isTemporary) {
      if (uri.includes('/ImagePicker/')) validationType = 'temporary-picker';
      else if (uri.includes('/cache/') || uri.includes('/tmp/')) validationType = 'temporary-cache';
      else validationType = 'temporary-system';
    } else {
      validationType = 'invalid-malformed';
    }

    // Check if file exists (if required)
    let fileExists = true;
    if (requireFileExists && !isNetworkUrl) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        fileExists = fileInfo.exists;
      } catch (error) {
        fileExists = false;
        if (logValidation) {
          logger.warn(LogCategories.STORAGE, 'Error checking file existence', { uri, error });
        }
      }
    }

    // Generate repair suggestions for problematic URIs
    const repairSuggestions: URIRepairSuggestion[] = [];
    if (generateRepairSuggestions) {
      if (isTemporary) {
        repairSuggestions.push({
          type: 'migrate',
          description: 'Migrate from temporary to persistent storage',
          action: async () => await this.migrateToPeristentStorage(uri),
          priority: 'high',
        });
      }

      if (!fileExists) {
        repairSuggestions.push({
          type: 'recreate',
          description: 'File missing - needs to be recreated',
          action: async () => null,
          priority: 'high',
        });

        if (isTemporary || !isPersistent) {
          repairSuggestions.push({
            type: 'fallback',
            description: 'Try alternative temporary locations',
            action: async () => await this.findAlternativeLocation(uri),
            priority: 'medium',
          });
        }
      }
    }

    const isValid = isPersistent && (!requireFileExists || fileExists);
    
    const result: URIValidationResult = {
      isValid,
      isPersistent,
      isTemporary,
      validationType,
      details: `${validationType} - ${fileExists ? 'exists' : 'missing'} - ${isValid ? 'valid' : 'invalid'}`,
      repairSuggestions: repairSuggestions.length > 0 ? repairSuggestions : undefined,
    };

    if (logValidation) {
      const logLevel = isValid ? 'info' : 'warn';
      logger[logLevel as 'info' | 'warn'](LogCategories.STORAGE, 'URI validation result', { 
        uri, 
        result 
      });
    }

    return result;
  }

  /**
   * Validate multiple URIs in batch
   */
  static async validateBatch(
    uris: string[], 
    options: URIValidationOptions = {}
  ): Promise<Map<string, URIValidationResult>> {
    const results = new Map<string, URIValidationResult>();
    
    await Promise.all(
      uris.map(async (uri) => {
        try {
          const result = await this.validateURI(uri, options);
          results.set(uri, result);
        } catch (error) {
          logger.error(LogCategories.STORAGE, 'Error validating URI', error, { uri });
          results.set(uri, {
            isValid: false,
            isPersistent: false,
            isTemporary: false,
            validationType: 'invalid-malformed',
            details: `Validation error: ${error}`,
          });
        }
      })
    );

    return results;
  }

  /**
   * Check if URI is in persistent storage
   */
  static isPersistentURI(uri: string): boolean {
    if (!uri) return false;
    return this.PERSISTENT_PATTERNS.some(pattern => pattern.test(uri));
  }

  /**
   * Check if URI is in temporary storage
   */
  static isTemporaryURI(uri: string): boolean {
    if (!uri) return false;
    return this.TEMPORARY_PATTERNS.some(pattern => pattern.test(uri));
  }

  /**
   * Get storage type description
   */
  static getStorageTypeDescription(uri: string): string {
    if (this.NETWORK_PATTERNS.some(p => p.test(uri))) return 'Network URL';
    if (this.isPersistentURI(uri)) return 'Persistent Storage';
    if (this.isTemporaryURI(uri)) return 'Temporary Storage';
    return 'Unknown Storage';
  }

  /**
   * Validate and log storage operations for debugging
   */
  static async validateBeforeStorage(
    items: any[],
    storageOperation: string
  ): Promise<{ valid: any[], invalid: any[], warnings: string[] }> {
    const valid: any[] = [];
    const invalid: any[] = [];
    const warnings: string[] = [];

    logger.info(LogCategories.STORAGE, `Validating ${items.length} items before ${storageOperation}`);

    for (const item of items) {
      if (item.image) {
        const validation = await this.validateURI(item.image, { 
          requireFileExists: true,
          generateRepairSuggestions: false,
          logValidation: false 
        });

        if (validation.isValid) {
          valid.push(item);
        } else {
          invalid.push(item);
          warnings.push(`Invalid URI for item ${item.id || item.title || 'unknown'}: ${validation.details}`);
        }

        if (validation.isTemporary) {
          warnings.push(`Temporary URI detected for item ${item.id || item.title || 'unknown'}: ${item.image}`);
        }
      } else {
        valid.push(item); // Items without images are valid
      }
    }

    if (warnings.length > 0) {
      logger.warn(LogCategories.STORAGE, `Storage validation warnings for ${storageOperation}`, { 
        warnings,
        validCount: valid.length,
        invalidCount: invalid.length
      });
    }

    return { valid, invalid, warnings };
  }

  /**
   * Private helper methods
   */
  private static async downloadNetworkImage(url: string): Promise<string | null> {
    try {
      const filename = `downloaded_${Date.now()}.jpg`;
      const localUri = `${FileSystem.documentDirectory}stylemuse/images/downloaded/${filename}`;
      
      // Ensure directory exists
      const dir = localUri.substring(0, localUri.lastIndexOf('/'));
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }

      // Download the file
      const downloadResult = await FileSystem.downloadAsync(url, localUri);
      return downloadResult.uri;
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to download network image', error, { url });
      return null;
    }
  }

  private static async migrateToPeristentStorage(tempUri: string): Promise<string | null> {
    try {
      // Import ImagePersistenceService dynamically to avoid circular dependency
      const { ImagePersistenceService } = await import('../services/ImagePersistenceService');
      const service = ImagePersistenceService.getInstance();
      
      const persistentImage = await service.persistImage(tempUri, 'wardrobe');
      return persistentImage.originalUri;
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to migrate to persistent storage', error, { tempUri });
      return null;
    }
  }

  private static async findAlternativeLocation(originalUri: string): Promise<string | null> {
    const filename = originalUri.split('/').pop();
    if (!filename) return null;

    const alternativeLocations = [
      `${FileSystem.cacheDirectory}camera/${filename}`,
      `${FileSystem.cacheDirectory}ImagePicker/${filename}`,
      `${FileSystem.cacheDirectory}ExponentExperienceData/${filename}`,
      `${FileSystem.cacheDirectory}ImageManipulator/${filename}`,
      originalUri.replace('file:///', 'file:///var/mobile/Containers/Data/Application/'),
    ];

    for (const location of alternativeLocations) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(location);
        if (fileInfo.exists) {
          logger.info(LogCategories.STORAGE, 'Found alternative location', { originalUri, alternativeLocation: location });
          return location;
        }
      } catch (error) {
        // Continue checking other locations
      }
    }

    return null;
  }
}

/**
 * Validation middleware for storage operations
 */
export class URIValidationMiddleware {
  /**
   * Middleware to validate URIs before AsyncStorage operations
   */
  static async validateBeforeAsyncStorage<T extends { image?: string }>(
    data: T | T[],
    operation: 'save' | 'update' | 'create'
  ): Promise<{ data: T | T[], warnings: string[], blocked: boolean }> {
    const items = Array.isArray(data) ? data : [data];
    const warnings: string[] = [];
    let blocked = false;

    // Validate all items
    const validation = await URIValidator.validateBeforeStorage(items, `AsyncStorage ${operation}`);
    
    // Log results
    if (validation.warnings.length > 0) {
      warnings.push(...validation.warnings);
    }

    // Block storage if critical issues found
    if (validation.invalid.length > 0) {
      blocked = true;
      warnings.push(`Blocked ${operation} operation due to ${validation.invalid.length} invalid URIs`);
      
      logger.error(LogCategories.STORAGE, `Blocked AsyncStorage ${operation}`, null, {
        invalidItems: validation.invalid.length,
        validItems: validation.valid.length,
        operation
      });
    }

    return {
      data: Array.isArray(data) ? validation.valid as T[] : validation.valid[0] as T,
      warnings,
      blocked
    };
  }

  /**
   * Pre-storage hook for automatic URI validation
   */
  static async preStorageValidation<T extends { image?: string }>(
    items: T[]
  ): Promise<{ validItems: T[], invalidItems: T[], shouldProceed: boolean }> {
    const validation = await URIValidator.validateBeforeStorage(items, 'pre-storage validation');
    
    const shouldProceed = validation.invalid.length === 0;
    
    if (!shouldProceed) {
      logger.warn(LogCategories.STORAGE, 'Pre-storage validation failed', {
        invalidCount: validation.invalid.length,
        validCount: validation.valid.length,
        warnings: validation.warnings
      });
    }

    return {
      validItems: validation.valid as T[],
      invalidItems: validation.invalid as T[],
      shouldProceed
    };
  }
}

/**
 * Utility functions for common URI validation scenarios
 */
export const URIValidationUtils = {
  /**
   * Quick check if URI is safe for storage
   */
  isSafeForStorage: (uri: string): boolean => {
    return URIValidator.isPersistentURI(uri) && !URIValidator.isTemporaryURI(uri);
  },

  /**
   * Get human-readable validation status
   */
  getValidationSummary: async (uri: string): Promise<string> => {
    const result = await URIValidator.validateURI(uri, { logValidation: false });
    return `${URIValidator.getStorageTypeDescription(uri)} - ${result.details}`;
  },

  /**
   * Batch check for storage safety
   */
  checkBatchStorageSafety: (items: { image?: string }[]): { safe: number, unsafe: number, details: string[] } => {
    let safe = 0;
    let unsafe = 0;
    const details: string[] = [];

    items.forEach((item, index) => {
      if (!item.image) {
        safe++;
        return;
      }

      if (URIValidationUtils.isSafeForStorage(item.image)) {
        safe++;
      } else {
        unsafe++;
        details.push(`Item ${index}: ${URIValidator.getStorageTypeDescription(item.image)} - ${item.image}`);
      }
    });

    return { safe, unsafe, details };
  },
};

export default URIValidator;