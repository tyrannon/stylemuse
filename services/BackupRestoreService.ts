import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { STORAGE_KEYS } from '../constants/storage';
import { FullBackupService } from './FullBackupService';
import { ImagePersistenceService } from './ImagePersistenceService';

// Restore options interface
interface RestoreOptions {
  restoreWardrobeItems?: boolean;
  restoreLovedOutfits?: boolean;
  restoreStyleDNA?: boolean;
  restoreProfileImage?: boolean;
  restoreSettings?: boolean;
  mergeMode?: 'replace' | 'merge' | 'skip_existing';
}

// Restore progress callback
type RestoreProgressCallback = (progress: {
  step: string;
  current: number;
  total: number;
  percentage: number;
  message: string;
}) => void;

// Restore result
interface RestoreResult {
  success: boolean;
  restoredCounts: {
    wardrobeItems: number;
    lovedOutfits: number;
    images: number;
    styleDNA: boolean;
    profileImage: boolean;
  };
  errors: string[];
  warnings: string[];
  duration: number;
}

export class BackupRestoreService {
  
  /**
   * Restore complete app state from backup
   */
  static async restoreFromBackup(
    backupId: string,
    options: RestoreOptions = {},
    progressCallback?: RestoreProgressCallback
  ): Promise<RestoreResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const restoredCounts = {
      wardrobeItems: 0,
      lovedOutfits: 0,
      images: 0,
      styleDNA: false,
      profileImage: false,
    };

    try {
      console.log(`🔄 [BackupRestore] Starting restore from backup: ${backupId}`);
      
      // Default options
      const defaultOptions: RestoreOptions = {
        restoreWardrobeItems: true,
        restoreLovedOutfits: true,
        restoreStyleDNA: true,
        restoreProfileImage: true,
        restoreSettings: true,
        mergeMode: 'replace',
        ...options,
      };

      // Step 1: Load and validate backup
      progressCallback?.({
        step: 'loading',
        current: 1,
        total: 6,
        percentage: 16,
        message: 'Loading backup file...',
      });

      const backup = await FullBackupService.loadBackup(backupId);
      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      // Validate backup integrity
      const validation = await FullBackupService.validateBackup(backupId);
      if (!validation.isValid) {
        errors.push(...validation.errors);
        if (errors.length > 0) {
          throw new Error(`Backup validation failed: ${errors.join(', ')}`);
        }
      }
      warnings.push(...validation.warnings);

      // Step 2: Restore images first (they're needed for other data)
      progressCallback?.({
        step: 'images',
        current: 2,
        total: 6,
        percentage: 33,
        message: 'Restoring images...',
      });

      const restoredImages = await this.restoreImages(backup.images);
      restoredCounts.images = restoredImages.count;
      errors.push(...restoredImages.errors);
      warnings.push(...restoredImages.warnings);

      // Step 3: Restore wardrobe items
      if (defaultOptions.restoreWardrobeItems) {
        progressCallback?.({
          step: 'wardrobe',
          current: 3,
          total: 6,
          percentage: 50,
          message: 'Restoring wardrobe items...',
        });

        const wardrobeResult = await this.restoreWardrobeItems(
          backup.data.wardrobeItems,
          restoredImages.mapping,
          defaultOptions.mergeMode!
        );
        restoredCounts.wardrobeItems = wardrobeResult.count;
        errors.push(...wardrobeResult.errors);
        warnings.push(...wardrobeResult.warnings);
      }

      // Step 4: Restore loved outfits
      if (defaultOptions.restoreLovedOutfits) {
        progressCallback?.({
          step: 'outfits',
          current: 4,
          total: 6,
          percentage: 66,
          message: 'Restoring loved outfits...',
        });

        const outfitsResult = await this.restoreLovedOutfits(
          backup.data.lovedOutfits,
          defaultOptions.mergeMode!
        );
        restoredCounts.lovedOutfits = outfitsResult.count;
        errors.push(...outfitsResult.errors);
        warnings.push(...outfitsResult.warnings);
      }

      // Step 5: Restore profile and style data
      if (defaultOptions.restoreStyleDNA || defaultOptions.restoreProfileImage) {
        progressCallback?.({
          step: 'profile',
          current: 5,
          total: 6,
          percentage: 83,
          message: 'Restoring profile data...',
        });

        if (defaultOptions.restoreStyleDNA && backup.data.styleDNA) {
          console.log('👤 [BackupRestore] Restoring style DNA...', {
            hasStyleDNA: !!backup.data.styleDNA,
            styleDNAKeys: Object.keys(backup.data.styleDNA || {}),
            hasAvatarImage: !!(backup.data.styleDNA as any)?.avatar_image_url,
            avatarImageUrl: (backup.data.styleDNA as any)?.avatar_image_url,
          });
          await AsyncStorage.setItem(STORAGE_KEYS.STYLE_DNA, JSON.stringify(backup.data.styleDNA));
          restoredCounts.styleDNA = true;
          
          // Verify it was saved
          const verifyStyleDNA = await AsyncStorage.getItem(STORAGE_KEYS.STYLE_DNA);
          console.log('🔍 [BackupRestore] Style DNA verification:', {
            saved: !!verifyStyleDNA,
            length: verifyStyleDNA?.length || 0,
            parsedData: verifyStyleDNA ? JSON.parse(verifyStyleDNA) : null,
          });
        }

        if (defaultOptions.restoreProfileImage && backup.data.profileImage) {
          try {
            console.log('📸 [BackupRestore] Restoring profile image...', {
              originalUri: backup.data.profileImage,
              hasProfileInMapping: !!restoredImages.mapping['profile'],
              hasProfileInImages: !!backup.images['profile'],
              mappedUri: restoredImages.mapping['profile'],
            });
            
            // Check if profile image was successfully restored to mapping
            let profileImageUri: string;
            if (restoredImages.mapping['profile']) {
              // Profile image was successfully restored
              profileImageUri = restoredImages.mapping['profile'];
              console.log('✅ [BackupRestore] Using restored profile image:', profileImageUri);
            } else {
              // Profile image restoration failed, try to restore it manually
              console.log('⚠️ [BackupRestore] Profile image not in mapping, attempting manual restoration...');
              
              if (backup.images['profile']) {
                const profileImageData = backup.images['profile'] as { base64Data: string; uri: string; fileName: string };
                
                // Create a temporary file from base64 data
                const tempUri = `${FileSystem.cacheDirectory}restore_profile_${Date.now()}.jpg`;
                await FileSystem.writeAsStringAsync(tempUri, profileImageData.base64Data, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                
                // Use ImagePersistenceService to persist the profile image properly
                const persistenceService = ImagePersistenceService.getInstance();
                const persistentImage = await persistenceService.persistImage(tempUri, 'profile', 'profile');
                profileImageUri = persistentImage.originalUri;
                
                // Clean up temp file
                await FileSystem.deleteAsync(tempUri, { idempotent: true });
                
                console.log('✅ [BackupRestore] Manually restored profile image:', profileImageUri);
              } else {
                throw new Error('Profile image data not found in backup');
              }
            }
            
            // Save the profile image URI (as plain string, not JSON)
            await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_IMAGE, profileImageUri);
            restoredCounts.profileImage = true;
            
            // Verify it was saved
            const verifyProfileImage = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE);
            console.log('🔍 [BackupRestore] Profile image verification:', {
              saved: !!verifyProfileImage,
              uri: verifyProfileImage,
              matches: verifyProfileImage === profileImageUri,
            });
          } catch (profileError) {
            console.error('❌ [BackupRestore] Failed to restore profile image:', profileError);
            errors.push(`Profile image restoration failed: ${profileError.message}`);
            restoredCounts.profileImage = false;
          }
        }

        // Restore gender selection (save as raw string, not JSON)
        console.log('👫 [BackupRestore] Restoring gender selection...', {
          gender: backup.data.selectedGender,
        });
        await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_GENDER, backup.data.selectedGender);
        
        // Verify it was saved
        const verifyGender = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_GENDER);
        console.log('🔍 [BackupRestore] Gender verification:', {
          saved: !!verifyGender,
          gender: verifyGender,
        });
      }

      // Step 6: Restore settings and preferences
      if (defaultOptions.restoreSettings) {
        progressCallback?.({
          step: 'settings',
          current: 6,
          total: 6,
          percentage: 100,
          message: 'Restoring settings...',
        });

        if (backup.data.userPreferences) {
          await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(backup.data.userPreferences));
        }
      }

      const duration = Date.now() - startTime;
      const success = errors.length === 0;

      console.log(`✅ [BackupRestore] Restore completed in ${duration}ms`, {
        success,
        restoredCounts,
        errors: errors.length,
        warnings: warnings.length,
      });

      return {
        success,
        restoredCounts,
        errors,
        warnings,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [BackupRestore] Restore failed:', error);
      errors.push(`Restore failed: ${error.message}`);
      
      return {
        success: false,
        restoredCounts,
        errors,
        warnings,
        duration,
      };
    }
  }

  /**
   * Restore images from backup
   */
  private static async restoreImages(backupImages: any): Promise<{
    count: number;
    mapping: { [oldUri: string]: string };
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const mapping: { [oldUri: string]: string } = {};
    let count = 0;

    try {
      console.log(`🖼️ [BackupRestore] Restoring ${Object.keys(backupImages).length} images...`);
      console.log(`🔍 [BackupRestore] Image IDs to restore:`, Object.keys(backupImages));

      for (const [itemId, imageData] of Object.entries(backupImages)) {
        try {
          // Type guard for image data
          if (!imageData || typeof imageData !== 'object' || !('base64Data' in imageData) || !('uri' in imageData)) {
            console.warn(`⚠️ [BackupRestore] Invalid image data for ${itemId}:`, {
              hasImageData: !!imageData,
              imageDataType: typeof imageData,
              hasBase64: imageData && 'base64Data' in imageData,
              hasUri: imageData && 'uri' in imageData,
            });
            continue;
          }

          const typedImageData = imageData as { base64Data: string; uri: string; fileName: string };

          // Create a temporary file from base64 data
          const tempUri = `${FileSystem.cacheDirectory}restore_${itemId}_${Date.now()}.jpg`;
          await FileSystem.writeAsStringAsync(tempUri, typedImageData.base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Use ImagePersistenceService to persist the image properly
          const persistenceService = ImagePersistenceService.getInstance();
          // Determine the correct image type based on itemId
          const imageType = itemId === 'profile' ? 'profile' : 'wardrobe';
          const persistentImage = await persistenceService.persistImage(tempUri, imageType, itemId);
          const persistedUri = persistentImage.originalUri;
          
          // Clean up temp file
          await FileSystem.deleteAsync(tempUri, { idempotent: true });

          // Map old URI to new URI
          mapping[typedImageData.uri] = persistedUri;
          mapping[itemId] = persistedUri; // Also map by item ID for convenience
          count++;

          console.log(`📸 [BackupRestore] Restored image for ${itemId}: ${persistedUri}`);
        } catch (imageError) {
          console.error(`❌ [BackupRestore] Failed to restore image for ${itemId}:`, imageError);
          errors.push(`Failed to restore image for ${itemId}: ${imageError.message}`);
        }
      }

      console.log(`✅ [BackupRestore] Restored ${count}/${Object.keys(backupImages).length} images`);
      return { count, mapping, errors, warnings };
    } catch (error) {
      console.error('❌ [BackupRestore] Failed to restore images:', error);
      errors.push(`Image restoration failed: ${error.message}`);
      return { count, mapping, errors, warnings };
    }
  }

  /**
   * Restore wardrobe items
   */
  private static async restoreWardrobeItems(
    backupItems: any[],
    imageMapping: { [oldUri: string]: string },
    mergeMode: string
  ): Promise<{
    count: number;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let count = 0;

    try {
      console.log(`👕 [BackupRestore] Restoring ${backupItems.length} wardrobe items...`);

      // Load existing items if merging
      let existingItems: any[] = [];
      if (mergeMode !== 'replace') {
        const existingData = await AsyncStorage.getItem(STORAGE_KEYS.WARDROBE_ITEMS);
        existingItems = existingData ? JSON.parse(existingData) : [];
      }

      // Process backup items
      const restoredItems = backupItems.map((item, index) => {
        // Update image URI if we have a mapping (WardrobeItem uses 'image' not 'imageUri')
        const itemId = `item_${index}`;
        const oldImageUri = item.image || item.imageUri; // Support both for compatibility
        const newImageUri = imageMapping[oldImageUri] || imageMapping[itemId] || oldImageUri;
        
        console.log(`🔄 [BackupRestore] Restoring item ${index}:`, {
          oldImage: oldImageUri,
          newImage: newImageUri,
          hasMapping: !!imageMapping[oldImageUri],
        });
        
        return {
          ...item,
          image: newImageUri, // Use 'image' field for WardrobeItem
          // Update any timestamps to current time if needed
          dateAdded: item.dateAdded || new Date().toISOString(),
        };
      });

      // Handle merge modes
      let finalItems: any[];
      if (mergeMode === 'replace') {
        finalItems = restoredItems;
      } else if (mergeMode === 'merge') {
        // Merge: add all backup items, update existing ones
        const existingMap = new Map(existingItems.map(item => [item.id, item]));
        
        restoredItems.forEach(item => {
          existingMap.set(item.id, item);
        });
        
        finalItems = Array.from(existingMap.values());
      } else { // skip_existing
        // Skip existing: only add items that don't exist
        const existingIds = new Set(existingItems.map(item => item.id));
        const newItems = restoredItems.filter(item => !existingIds.has(item.id));
        finalItems = [...existingItems, ...newItems];
      }

      // Save restored items
      await AsyncStorage.setItem(STORAGE_KEYS.WARDROBE_ITEMS, JSON.stringify(finalItems));
      count = restoredItems.length;

      console.log(`✅ [BackupRestore] Restored ${count} wardrobe items (${mergeMode} mode)`, {
        finalItemsCount: finalItems.length,
        firstItemSample: finalItems[0] ? {
          hasImage: !!finalItems[0].image,
          hasDescription: !!finalItems[0].description,
        } : null,
      });
      
      // Verify the data was actually saved
      const verifyData = await AsyncStorage.getItem(STORAGE_KEYS.WARDROBE_ITEMS);
      const verifyItems = verifyData ? JSON.parse(verifyData) : [];
      console.log(`🔍 [BackupRestore] Verification: ${verifyItems.length} items saved to storage`);
      
      return { count, errors, warnings };
    } catch (error) {
      console.error('❌ [BackupRestore] Failed to restore wardrobe items:', error);
      errors.push(`Wardrobe restoration failed: ${error.message}`);
      return { count, errors, warnings };
    }
  }

  /**
   * Restore loved outfits
   */
  private static async restoreLovedOutfits(
    backupOutfits: any[],
    mergeMode: string
  ): Promise<{
    count: number;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let count = 0;

    try {
      console.log(`💕 [BackupRestore] Restoring ${backupOutfits.length} loved outfits...`);

      // Load existing outfits if merging
      let existingOutfits: any[] = [];
      if (mergeMode !== 'replace') {
        const existingData = await AsyncStorage.getItem(STORAGE_KEYS.LOVED_OUTFITS);
        existingOutfits = existingData ? JSON.parse(existingData) : [];
      }

      // Handle merge modes
      let finalOutfits: any[];
      if (mergeMode === 'replace') {
        finalOutfits = backupOutfits;
      } else if (mergeMode === 'merge') {
        // Merge: add all backup outfits, update existing ones
        const existingMap = new Map(existingOutfits.map(outfit => [outfit.id, outfit]));
        
        backupOutfits.forEach(outfit => {
          existingMap.set(outfit.id, outfit);
        });
        
        finalOutfits = Array.from(existingMap.values());
      } else { // skip_existing
        // Skip existing: only add outfits that don't exist
        const existingIds = new Set(existingOutfits.map(outfit => outfit.id));
        const newOutfits = backupOutfits.filter(outfit => !existingIds.has(outfit.id));
        finalOutfits = [...existingOutfits, ...newOutfits];
      }

      // Save restored outfits
      await AsyncStorage.setItem(STORAGE_KEYS.LOVED_OUTFITS, JSON.stringify(finalOutfits));
      count = backupOutfits.length;

      console.log(`✅ [BackupRestore] Restored ${count} loved outfits (${mergeMode} mode)`, {
        finalOutfitsCount: finalOutfits.length,
      });
      
      // Verify the data was actually saved
      const verifyData = await AsyncStorage.getItem(STORAGE_KEYS.LOVED_OUTFITS);
      const verifyOutfits = verifyData ? JSON.parse(verifyData) : [];
      console.log(`🔍 [BackupRestore] Verification: ${verifyOutfits.length} outfits saved to storage`);
      
      return { count, errors, warnings };
    } catch (error) {
      console.error('❌ [BackupRestore] Failed to restore loved outfits:', error);
      errors.push(`Outfits restoration failed: ${error.message}`);
      return { count, errors, warnings };
    }
  }

  /**
   * Perform a dry run of restore operation (test without actually restoring)
   */
  static async dryRunRestore(backupId: string, options: RestoreOptions = {}): Promise<{
    wouldRestore: {
      wardrobeItems: number;
      lovedOutfits: number;
      images: number;
      styleDNA: boolean;
      profileImage: boolean;
    };
    conflicts: string[];
    warnings: string[];
    estimatedDuration: number;
  }> {
    try {
      console.log(`🔍 [BackupRestore] Performing dry run for backup: ${backupId}`);
      
      const backup = await FullBackupService.loadBackup(backupId);
      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      const conflicts: string[] = [];
      const warnings: string[] = [];

      // Check what would be restored
      const wouldRestore = {
        wardrobeItems: options.restoreWardrobeItems !== false ? backup.data.wardrobeItems.length : 0,
        lovedOutfits: options.restoreLovedOutfits !== false ? backup.data.lovedOutfits.length : 0,
        images: Object.keys(backup.images).length,
        styleDNA: options.restoreStyleDNA !== false && !!backup.data.styleDNA,
        profileImage: options.restoreProfileImage !== false && !!backup.data.profileImage,
      };

      // Check for conflicts
      if (options.mergeMode !== 'replace') {
        // Check existing data
        const existingWardrobe = await AsyncStorage.getItem(STORAGE_KEYS.WARDROBE_ITEMS);
        const existingOutfits = await AsyncStorage.getItem(STORAGE_KEYS.LOVED_OUTFITS);
        
        if (existingWardrobe) {
          const existing = JSON.parse(existingWardrobe);
          if (existing.length > 0) {
            conflicts.push(`${existing.length} existing wardrobe items`);
          }
        }
        
        if (existingOutfits) {
          const existing = JSON.parse(existingOutfits);
          if (existing.length > 0) {
            conflicts.push(`${existing.length} existing loved outfits`);
          }
        }
      }

      // Estimate duration based on data size
      const estimatedDuration = Math.max(
        1000, // Minimum 1 second
        (wouldRestore.wardrobeItems * 50) + // 50ms per item
        (wouldRestore.images * 200) + // 200ms per image
        (wouldRestore.lovedOutfits * 25) // 25ms per outfit
      );

      console.log(`🔍 [BackupRestore] Dry run complete`, {
        wouldRestore,
        conflicts: conflicts.length,
        estimatedDuration,
      });

      return {
        wouldRestore,
        conflicts,
        warnings,
        estimatedDuration,
      };
    } catch (error) {
      console.error('❌ [BackupRestore] Dry run failed:', error);
      throw error;
    }
  }
}