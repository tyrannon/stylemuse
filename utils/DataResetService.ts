import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './DebugLogger';
import { LogCategories } from '../constants/LogCategories';

export interface ResetStats {
  clearedItems: number;
  totalSizeMB: number;
  clearedKeys: string[];
  errors: string[];
}

export class DataResetService {
  private static readonly STORAGE_KEYS = [
    // Core app data
    'savedItems',
    'lovedOutfits',
    'profileImage',
    'styleDNA',
    'selectedGender',
    'avatarData',
    
    // Onboarding data
    'onboardingCompleted',
    'onboardingData',
    'onboardingStep',
    'userTier',
    
    // User preferences
    'themeMode',
    'colorScheme',
    'userPreferences',
    
    // App state
    'cameraPermissionRequested',
    'firstLaunch',
    'lastAppVersion',
    
    // Cache and temporary data
    'imageCache',
    'apiCache',
    'tempData',
    
    // Backup data
    'backupData',
    'backupMetadata',
    
    // Debug data
    'debugSettings',
    'logLevel',
    
    // Feature flags
    'featureFlags',
    'experimentalFeatures',
    
    // Analytics
    'analyticsData',
    'usageStats',
    
    // Any other app-specific keys
    'customization',
    'suggestions',
    'recommendations',
    'searchHistory',
    'recentlyViewed',
    
    // Missing keys found during analysis
    'backup_index',
    'last_auto_backup',
    'forceAppRestart'
  ];

  static async getStorageInfo(): Promise<{ totalKeys: number; totalSizeMB: number; keys: string[] }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter(key => 
        this.STORAGE_KEYS.includes(key) || 
        key.startsWith('StyleMuse_') ||
        key.startsWith('@StyleMuse_')
      );

      let totalSize = 0;
      for (const key of appKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            totalSize += new Blob([value]).size;
          }
        } catch (error) {
          logger.warn(LogCategories.STORAGE, `Failed to get size for key: ${key}`, error);
        }
      }

      return {
        totalKeys: appKeys.length,
        totalSizeMB: totalSize / (1024 * 1024),
        keys: appKeys
      };
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to get storage info', error);
      return { totalKeys: 0, totalSizeMB: 0, keys: [] };
    }
  }

  static async resetAllData(): Promise<ResetStats> {
    const resetStats: ResetStats = {
      clearedItems: 0,
      totalSizeMB: 0,
      clearedKeys: [],
      errors: []
    };

    try {
      logger.info(LogCategories.USER_ACTION, 'Starting complete data reset');

      // Get storage info before reset
      const storageInfo = await this.getStorageInfo();
      resetStats.totalSizeMB = storageInfo.totalSizeMB;

      // Clear all known keys
      for (const key of this.STORAGE_KEYS) {
        try {
          await AsyncStorage.removeItem(key);
          resetStats.clearedKeys.push(key);
          resetStats.clearedItems++;
          logger.debug(LogCategories.STORAGE, `Cleared storage key: ${key}`);
        } catch (error) {
          const errorMsg = `Failed to clear ${key}: ${error.message}`;
          resetStats.errors.push(errorMsg);
          logger.error(LogCategories.STORAGE, errorMsg, error);
        }
      }

      // Clear any additional app-specific keys
      const allKeys = await AsyncStorage.getAllKeys();
      const additionalKeys = allKeys.filter(key => 
        (key.startsWith('StyleMuse_') || key.startsWith('@StyleMuse_')) &&
        !this.STORAGE_KEYS.includes(key)
      );

      for (const key of additionalKeys) {
        try {
          await AsyncStorage.removeItem(key);
          resetStats.clearedKeys.push(key);
          resetStats.clearedItems++;
          logger.debug(LogCategories.STORAGE, `Cleared additional key: ${key}`);
        } catch (error) {
          const errorMsg = `Failed to clear additional key ${key}: ${error.message}`;
          resetStats.errors.push(errorMsg);
          logger.error(LogCategories.STORAGE, errorMsg, error);
        }
      }

      logger.info(LogCategories.USER_ACTION, 'Data reset completed', {
        clearedItems: resetStats.clearedItems,
        totalSizeMB: resetStats.totalSizeMB,
        errors: resetStats.errors.length
      });

      return resetStats;
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to reset data', error);
      resetStats.errors.push(`Reset failed: ${error.message}`);
      return resetStats;
    }
  }

  static async resetSpecificData(categories: string[]): Promise<ResetStats> {
    const resetStats: ResetStats = {
      clearedItems: 0,
      totalSizeMB: 0,
      clearedKeys: [],
      errors: []
    };

    try {
      logger.info(LogCategories.USER_ACTION, 'Starting selective data reset', { categories });

      const categoryKeys: Record<string, string[]> = {
        wardrobe: ['savedItems', 'lovedOutfits', 'recentlyViewed'],
        profile: ['profileImage', 'styleDNA', 'selectedGender', 'avatarData'],
        onboarding: ['onboardingCompleted', 'onboardingData', 'onboardingStep', 'userTier'],
        preferences: ['themeMode', 'colorScheme', 'userPreferences'],
        cache: ['imageCache', 'apiCache', 'tempData'],
        analytics: ['analyticsData', 'usageStats']
      };

      for (const category of categories) {
        const keys = categoryKeys[category] || [];
        for (const key of keys) {
          try {
            await AsyncStorage.removeItem(key);
            resetStats.clearedKeys.push(key);
            resetStats.clearedItems++;
            logger.debug(LogCategories.STORAGE, `Cleared ${category} key: ${key}`);
          } catch (error) {
            const errorMsg = `Failed to clear ${category} key ${key}: ${error.message}`;
            resetStats.errors.push(errorMsg);
            logger.error(LogCategories.STORAGE, errorMsg, error);
          }
        }
      }

      logger.info(LogCategories.USER_ACTION, 'Selective data reset completed', {
        categories,
        clearedItems: resetStats.clearedItems,
        errors: resetStats.errors.length
      });

      return resetStats;
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to reset selective data', error);
      resetStats.errors.push(`Selective reset failed: ${error.message}`);
      return resetStats;
    }
  }

  static async createBackupBeforeReset(): Promise<string | null> {
    try {
      logger.info(LogCategories.STORAGE, 'Creating backup before reset');
      
      const { FullBackupService } = await import('../services/FullBackupService');
      const backupId = await FullBackupService.createFullBackup('Pre-Reset Backup');
      
      logger.info(LogCategories.STORAGE, 'Backup created before reset', { backupId });
      return backupId;
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to create backup before reset', error);
      return null;
    }
  }

  static async validateReset(): Promise<boolean> {
    try {
      const storageInfo = await this.getStorageInfo();
      const hasRemainingData = storageInfo.totalKeys > 0;
      
      if (hasRemainingData) {
        logger.warn(LogCategories.STORAGE, 'Reset validation failed - data still exists', {
          remainingKeys: storageInfo.keys,
          totalKeys: storageInfo.totalKeys
        });
      } else {
        logger.info(LogCategories.STORAGE, 'Reset validation passed - no app data remaining');
      }
      
      return !hasRemainingData;
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to validate reset', error);
      return false;
    }
  }
}