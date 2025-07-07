import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { STORAGE_KEYS } from '../constants/storage';

// Reset options interface
interface ResetOptions {
  resetWardrobeItems?: boolean;
  resetLovedOutfits?: boolean;
  resetStyleDNA?: boolean;
  resetProfileImage?: boolean;
  resetSettings?: boolean;
  resetUserPreferences?: boolean;
  resetImages?: boolean;
  createBackupBeforeReset?: boolean;
  confirmationRequired?: boolean;
}

// Reset result
interface ResetResult {
  success: boolean;
  backupId?: string; // If backup was created before reset
  deletedCounts: {
    wardrobeItems: number;
    lovedOutfits: number;
    images: number;
    storageKeys: number;
  };
  errors: string[];
  warnings: string[];
  duration: number;
}

export class DataResetService {
  
  /**
   * Completely reset app data with safety measures
   */
  static async performCompleteReset(
    options: ResetOptions = {},
    confirmationPhrase?: string
  ): Promise<ResetResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const deletedCounts = {
      wardrobeItems: 0,
      lovedOutfits: 0,
      images: 0,
      storageKeys: 0,
    };
    let backupId: string | undefined;

    try {
      console.log('⚠️ [DataReset] Starting complete data reset...');

      // Default options (reset everything by default)
      const defaultOptions: ResetOptions = {
        resetWardrobeItems: true,
        resetLovedOutfits: true,
        resetStyleDNA: true,
        resetProfileImage: true,
        resetSettings: true,
        resetUserPreferences: true,
        resetImages: true,
        createBackupBeforeReset: true,
        confirmationRequired: true,
        ...options,
      };

      // Safety confirmation check
      if (defaultOptions.confirmationRequired) {
        const expectedPhrase = 'RESET ALL DATA';
        if (confirmationPhrase !== expectedPhrase) {
          throw new Error(`Invalid confirmation phrase. Expected: "${expectedPhrase}"`);
        }
      }

      // Step 1: Create backup before reset (if requested)
      if (defaultOptions.createBackupBeforeReset) {
        console.log('💾 [DataReset] Creating backup before reset...');
        try {
          const { FullBackupService } = await import('./FullBackupService');
          const backupMetadata = await FullBackupService.createFullBackup('Pre-reset backup');
          backupId = backupMetadata.id;
          console.log(`✅ [DataReset] Created pre-reset backup: ${backupId}`);
        } catch (backupError) {
          console.error('❌ [DataReset] Failed to create backup before reset:', backupError);
          warnings.push(`Failed to create backup: ${backupError.message}`);
          // Continue with reset even if backup fails, but warn user
        }
      }

      // Step 2: Count existing data before deletion
      await this.countExistingData(deletedCounts);

      // Step 3: Reset wardrobe items
      if (defaultOptions.resetWardrobeItems) {
        console.log('👕 [DataReset] Resetting wardrobe items...');
        await AsyncStorage.removeItem(STORAGE_KEYS.WARDROBE_ITEMS);
      }

      // Step 4: Reset loved outfits
      if (defaultOptions.resetLovedOutfits) {
        console.log('💕 [DataReset] Resetting loved outfits...');
        await AsyncStorage.removeItem(STORAGE_KEYS.LOVED_OUTFITS);
      }

      // Step 5: Reset style DNA and profile
      if (defaultOptions.resetStyleDNA) {
        console.log('🧬 [DataReset] Resetting style DNA...');
        await AsyncStorage.removeItem(STORAGE_KEYS.STYLE_DNA);
        await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_GENDER);
      }

      if (defaultOptions.resetProfileImage) {
        console.log('📸 [DataReset] Resetting profile image...');
        await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE_IMAGE);
      }

      // Step 6: Reset settings and preferences
      if (defaultOptions.resetSettings) {
        console.log('⚙️ [DataReset] Resetting settings...');
        // Add specific settings keys to reset
        const settingsKeys = [
          // Add your app's settings keys here
        ];
        
        for (const key of settingsKeys) {
          await AsyncStorage.removeItem(key);
        }
      }

      if (defaultOptions.resetUserPreferences) {
        console.log('👤 [DataReset] Resetting user preferences...');
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
      }

      // Step 7: Reset images from file system
      if (defaultOptions.resetImages) {
        console.log('🖼️ [DataReset] Resetting images...');
        await this.resetImageFiles();
      }

      // Step 8: Count storage keys and reset additional data
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter(key => 
        key.startsWith('stylemuse_') || 
        Object.values(STORAGE_KEYS).includes(key as any)
      );
      deletedCounts.storageKeys = appKeys.length;

      // Optional: Clear all app-related AsyncStorage (nuclear option)
      if (defaultOptions.resetSettings && defaultOptions.resetUserPreferences) {
        console.log('🧹 [DataReset] Clearing all app storage keys...');
        await AsyncStorage.multiRemove(appKeys);
      }

      const duration = Date.now() - startTime;
      const success = errors.length === 0;

      console.log(`✅ [DataReset] Reset completed in ${duration}ms`, {
        success,
        backupId,
        deletedCounts,
        errors: errors.length,
        warnings: warnings.length,
      });

      return {
        success,
        backupId,
        deletedCounts,
        errors,
        warnings,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [DataReset] Reset failed:', error);
      errors.push(`Reset failed: ${error.message}`);
      
      return {
        success: false,
        backupId,
        deletedCounts,
        errors,
        warnings,
        duration,
      };
    }
  }

  /**
   * Reset only specific data types
   */
  static async performSelectiveReset(
    dataTypes: ('wardrobe' | 'outfits' | 'profile' | 'settings')[],
    createBackup: boolean = true
  ): Promise<ResetResult> {
    const options: ResetOptions = {
      resetWardrobeItems: dataTypes.includes('wardrobe'),
      resetLovedOutfits: dataTypes.includes('outfits'),
      resetStyleDNA: dataTypes.includes('profile'),
      resetProfileImage: dataTypes.includes('profile'),
      resetSettings: dataTypes.includes('settings'),
      resetUserPreferences: dataTypes.includes('settings'),
      resetImages: dataTypes.includes('wardrobe'), // Reset images only if wardrobe is reset
      createBackupBeforeReset: createBackup,
      confirmationRequired: false, // Selective reset doesn't require confirmation phrase
    };

    return this.performCompleteReset(options);
  }

  /**
   * Count existing data before deletion
   */
  private static async countExistingData(deletedCounts: ResetResult['deletedCounts']): Promise<void> {
    try {
      // Count wardrobe items
      const wardrobeData = await AsyncStorage.getItem(STORAGE_KEYS.WARDROBE_ITEMS);
      if (wardrobeData) {
        const items = JSON.parse(wardrobeData);
        deletedCounts.wardrobeItems = Array.isArray(items) ? items.length : 0;
      }

      // Count loved outfits
      const outfitsData = await AsyncStorage.getItem(STORAGE_KEYS.LOVED_OUTFITS);
      if (outfitsData) {
        const outfits = JSON.parse(outfitsData);
        deletedCounts.lovedOutfits = Array.isArray(outfits) ? outfits.length : 0;
      }

      // Count image files
      const imageDir = `${FileSystem.documentDirectory}images/`;
      try {
        const imageInfo = await FileSystem.getInfoAsync(imageDir);
        if (imageInfo.exists && imageInfo.isDirectory) {
          const files = await FileSystem.readDirectoryAsync(imageDir);
          deletedCounts.images = files.length;
        }
      } catch (imageDirError) {
        console.warn('⚠️ [DataReset] Could not count image files:', imageDirError);
      }

      console.log('📊 [DataReset] Existing data counts:', deletedCounts);
    } catch (error) {
      console.error('❌ [DataReset] Failed to count existing data:', error);
    }
  }

  /**
   * Reset image files from file system
   */
  private static async resetImageFiles(): Promise<void> {
    try {
      const imageDir = `${FileSystem.documentDirectory}images/`;
      const thumbnailDir = `${FileSystem.documentDirectory}thumbnails/`;
      
      // Delete images directory
      const imageInfo = await FileSystem.getInfoAsync(imageDir);
      if (imageInfo.exists) {
        await FileSystem.deleteAsync(imageDir, { idempotent: true });
        console.log('🗑️ [DataReset] Deleted images directory');
      }

      // Delete thumbnails directory
      const thumbnailInfo = await FileSystem.getInfoAsync(thumbnailDir);
      if (thumbnailInfo.exists) {
        await FileSystem.deleteAsync(thumbnailDir, { idempotent: true });
        console.log('🗑️ [DataReset] Deleted thumbnails directory');
      }

      // Recreate directories for future use
      await FileSystem.makeDirectoryAsync(imageDir, { intermediates: true });
      await FileSystem.makeDirectoryAsync(thumbnailDir, { intermediates: true });
      console.log('📁 [DataReset] Recreated image directories');
    } catch (error) {
      console.error('❌ [DataReset] Failed to reset image files:', error);
      throw error;
    }
  }

  /**
   * Get preview of what would be reset (dry run)
   */
  static async previewReset(options: ResetOptions = {}): Promise<{
    wouldDelete: {
      wardrobeItems: number;
      lovedOutfits: number;
      images: number;
      storageKeys: string[];
    };
    estimatedDuration: number;
    warnings: string[];
  }> {
    try {
      console.log('🔍 [DataReset] Previewing reset operation...');
      
      const wouldDelete = {
        wardrobeItems: 0,
        lovedOutfits: 0,
        images: 0,
        storageKeys: [] as string[],
      };
      const warnings: string[] = [];

      // Count what would be deleted (create a temporary object for the method)
      const tempDeletedCounts = {
        wardrobeItems: 0,
        lovedOutfits: 0,
        images: 0,
        storageKeys: 0, // This will be overwritten
      };
      await this.countExistingData(tempDeletedCounts);
      
      // Copy the counts to our return object
      wouldDelete.wardrobeItems = tempDeletedCounts.wardrobeItems;
      wouldDelete.lovedOutfits = tempDeletedCounts.lovedOutfits;
      wouldDelete.images = tempDeletedCounts.images;

      // Get storage keys that would be deleted
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter(key => 
        key.startsWith('stylemuse_') || 
        Object.values(STORAGE_KEYS).includes(key as any)
      );
      wouldDelete.storageKeys = appKeys;

      // Estimate duration
      const estimatedDuration = Math.max(
        500, // Minimum 0.5 seconds
        (wouldDelete.wardrobeItems * 10) + // 10ms per item
        (wouldDelete.images * 50) + // 50ms per image
        (wouldDelete.storageKeys.length * 25) // 25ms per storage key
      );

      // Add warnings
      if (wouldDelete.wardrobeItems > 0 || wouldDelete.lovedOutfits > 0) {
        warnings.push('This action will permanently delete all your wardrobe data');
      }
      if (wouldDelete.images > 0) {
        warnings.push('All stored images will be permanently deleted');
      }

      console.log('🔍 [DataReset] Preview complete:', {
        wouldDelete,
        estimatedDuration,
        warnings: warnings.length,
      });

      return {
        wouldDelete,
        estimatedDuration,
        warnings,
      };
    } catch (error) {
      console.error('❌ [DataReset] Preview failed:', error);
      throw error;
    }
  }

  /**
   * Emergency recovery: restore from most recent backup
   */
  static async emergencyRestore(): Promise<{
    success: boolean;
    backupId?: string;
    message: string;
  }> {
    try {
      console.log('🚨 [DataReset] Attempting emergency restore...');

      const { FullBackupService } = await import('./FullBackupService');
      const { BackupRestoreService } = await import('./BackupRestoreService');
      
      // Get most recent backup
      const backups = await FullBackupService.getAvailableBackups();
      if (backups.length === 0) {
        return {
          success: false,
          message: 'No backups available for emergency restore',
        };
      }

      const mostRecentBackup = backups[0]; // Backups are sorted by timestamp (newest first)
      
      // Restore from most recent backup
      const restoreResult = await BackupRestoreService.restoreFromBackup(mostRecentBackup.id);
      
      if (restoreResult.success) {
        console.log(`✅ [DataReset] Emergency restore completed from backup: ${mostRecentBackup.id}`);
        return {
          success: true,
          backupId: mostRecentBackup.id,
          message: `Successfully restored from backup created on ${new Date(mostRecentBackup.timestamp).toLocaleString()}`,
        };
      } else {
        return {
          success: false,
          backupId: mostRecentBackup.id,
          message: `Failed to restore from backup: ${restoreResult.errors.join(', ')}`,
        };
      }
    } catch (error) {
      console.error('❌ [DataReset] Emergency restore failed:', error);
      return {
        success: false,
        message: `Emergency restore failed: ${error.message}`,
      };
    }
  }

  /**
   * Safely test backup/restore cycle
   */
  static async testBackupRestoreCycle(): Promise<{
    success: boolean;
    steps: string[];
    errors: string[];
    backupId?: string;
    duration: number;
  }> {
    const startTime = Date.now();
    const steps: string[] = [];
    const errors: string[] = [];
    let backupId: string | undefined;

    try {
      console.log('🧪 [DataReset] Starting backup/restore cycle test...');

      // Step 1: Create backup of current state
      steps.push('Creating initial backup...');
      const { FullBackupService } = await import('./FullBackupService');
      const backupMetadata = await FullBackupService.createFullBackup('Test cycle backup');
      backupId = backupMetadata.id;
      steps.push(`✅ Created backup: ${backupId}`);

      // Step 2: Verify backup integrity
      steps.push('Validating backup integrity...');
      const validation = await FullBackupService.validateBackup(backupId);
      if (!validation.isValid) {
        throw new Error(`Backup validation failed: ${validation.errors.join(', ')}`);
      }
      steps.push('✅ Backup integrity verified');

      // Step 3: Perform selective reset (test data only)
      steps.push('Performing test reset...');
      // Note: In a real test, you might create dummy data first
      const resetResult = await this.performSelectiveReset(['settings'], false);
      if (!resetResult.success) {
        throw new Error(`Reset failed: ${resetResult.errors.join(', ')}`);
      }
      steps.push('✅ Test reset completed');

      // Step 4: Restore from backup
      steps.push('Restoring from backup...');
      const { BackupRestoreService } = await import('./BackupRestoreService');
      const restoreResult = await BackupRestoreService.restoreFromBackup(backupId);
      if (!restoreResult.success) {
        throw new Error(`Restore failed: ${restoreResult.errors.join(', ')}`);
      }
      steps.push('✅ Restore completed');

      const duration = Date.now() - startTime;
      steps.push(`🎉 Test cycle completed in ${duration}ms`);

      console.log('✅ [DataReset] Backup/restore cycle test successful');
      return {
        success: true,
        steps,
        errors,
        backupId,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [DataReset] Backup/restore cycle test failed:', error);
      errors.push(error.message);
      steps.push(`❌ Test failed: ${error.message}`);

      return {
        success: false,
        steps,
        errors,
        backupId,
        duration,
      };
    }
  }
}