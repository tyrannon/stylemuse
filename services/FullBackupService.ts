import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { STORAGE_KEYS } from '../constants/storage';
import { WardrobeItem, LovedOutfit } from '../hooks/useWardrobeData';
import { EnhancedStyleDNA } from '../types/Avatar';

// Backup metadata interface
interface BackupMetadata {
  id: string;
  timestamp: number;
  version: string;
  itemCount: number;
  outfitCount: number;
  imageCount: number;
  totalSizeMB: number;
  userDescription?: string;
}

// Complete backup data structure
interface FullBackupData {
  metadata: BackupMetadata;
  data: {
    wardrobeItems: WardrobeItem[];
    lovedOutfits: LovedOutfit[];
    styleDNA: EnhancedStyleDNA | null;
    selectedGender: 'male' | 'female' | 'nonbinary';
    profileImage: string | null;
    settings: any; // App settings
    userPreferences: any; // User preferences
  };
  images: {
    [itemId: string]: {
      uri: string;
      fileName: string;
      base64Data: string;
    };
  };
}

export class FullBackupService {
  private static readonly BACKUP_DIRECTORY = `${FileSystem.documentDirectory}backups/`;
  private static readonly BACKUP_INDEX_KEY = 'backup_index';
  private static readonly APP_VERSION = '1.0.0'; // TODO: Get from app config

  /**
   * Initialize backup system
   */
  static async initialize(): Promise<void> {
    try {
      // Ensure backup directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.BACKUP_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.BACKUP_DIRECTORY, { intermediates: true });
        console.log('📁 [FullBackup] Created backup directory');
      }
    } catch (error) {
      console.error('❌ [FullBackup] Failed to initialize backup system:', error);
      throw error;
    }
  }

  /**
   * Create a complete backup of all app data
   */
  static async createFullBackup(userDescription?: string): Promise<BackupMetadata> {
    try {
      console.log('🎯 [FullBackup] Starting complete backup creation...');
      
      await this.initialize();
      
      // Generate backup metadata
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const timestamp = Date.now();

      // Load all app data
      console.log('📊 [FullBackup] Loading app data...');
      const data = await this.loadAllAppData();
      
      // Process images
      console.log('🖼️ [FullBackup] Processing images...');
      const images = await this.processAllImages(data.wardrobeItems, data.profileImage);
      
      // Calculate backup size
      const totalSizeMB = await this.calculateBackupSize(data, images);
      
      // Create metadata
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp,
        version: this.APP_VERSION,
        itemCount: data.wardrobeItems.length,
        outfitCount: data.lovedOutfits.length,
        imageCount: Object.keys(images).length,
        totalSizeMB,
        userDescription,
      };

      // Create full backup object
      const backup: FullBackupData = {
        metadata,
        data,
        images,
      };

      // Save backup to file
      const backupFilePath = `${this.BACKUP_DIRECTORY}${backupId}.json`;
      await FileSystem.writeAsStringAsync(backupFilePath, JSON.stringify(backup), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Update backup index
      await this.updateBackupIndex(metadata);

      console.log(`✅ [FullBackup] Created backup: ${backupId}`, {
        itemCount: metadata.itemCount,
        outfitCount: metadata.outfitCount,
        imageCount: metadata.imageCount,
        sizeMB: metadata.totalSizeMB,
      });

      return metadata;
    } catch (error) {
      console.error('❌ [FullBackup] Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Load all app data from AsyncStorage with robust error handling
   */
  private static async loadAllAppData(): Promise<FullBackupData['data']> {
    try {
      const keys = [
        STORAGE_KEYS.WARDROBE_ITEMS,
        STORAGE_KEYS.LOVED_OUTFITS,
        STORAGE_KEYS.STYLE_DNA,
        STORAGE_KEYS.SELECTED_GENDER,
        STORAGE_KEYS.PROFILE_IMAGE,
        STORAGE_KEYS.USER_PREFERENCES,
      ];

      const values = await AsyncStorage.multiGet(keys);
      const dataMap = Object.fromEntries(values);

      console.log('🔍 [FullBackup] Raw data loaded:', {
        wardrobeItemsLength: dataMap[STORAGE_KEYS.WARDROBE_ITEMS]?.length || 0,
        lovedOutfitsLength: dataMap[STORAGE_KEYS.LOVED_OUTFITS]?.length || 0,
        hasStyleDNA: !!dataMap[STORAGE_KEYS.STYLE_DNA],
        hasProfileImage: !!dataMap[STORAGE_KEYS.PROFILE_IMAGE],
        profileImageValue: dataMap[STORAGE_KEYS.PROFILE_IMAGE]?.substring(0, 100) + '...',
        hasGender: !!dataMap[STORAGE_KEYS.SELECTED_GENDER],
      });

      // Safely parse each piece of data with individual error handling
      const wardrobeItems = this.safeJSONParse(dataMap[STORAGE_KEYS.WARDROBE_ITEMS], []);
      const lovedOutfits = this.safeJSONParse(dataMap[STORAGE_KEYS.LOVED_OUTFITS], []);
      const styleDNA = this.safeJSONParse(dataMap[STORAGE_KEYS.STYLE_DNA], null);
      const selectedGender = this.safeJSONParse(dataMap[STORAGE_KEYS.SELECTED_GENDER], 'female');
      // Profile image is stored as a plain string, not JSON
      const profileImageRaw = dataMap[STORAGE_KEYS.PROFILE_IMAGE];
      const profileImage = profileImageRaw && profileImageRaw !== 'null' && profileImageRaw !== 'undefined' ? profileImageRaw : null;
      const userPreferences = this.safeJSONParse(dataMap[STORAGE_KEYS.USER_PREFERENCES], {});
      
      console.log('🔍 [FullBackup] Profile image parsing:', {
        rawValue: profileImageRaw,
        finalValue: profileImage,
        willProcess: !!profileImage,
      });

      console.log('✅ [FullBackup] Parsed data successfully:', {
        wardrobeItemsCount: Array.isArray(wardrobeItems) ? wardrobeItems.length : 0,
        lovedOutfitsCount: Array.isArray(lovedOutfits) ? lovedOutfits.length : 0,
        hasStyleDNA: !!styleDNA,
        selectedGender,
      });

      return {
        wardrobeItems: Array.isArray(wardrobeItems) ? wardrobeItems : [],
        lovedOutfits: Array.isArray(lovedOutfits) ? lovedOutfits : [],
        styleDNA,
        selectedGender,
        profileImage,
        settings: {}, // TODO: Add app settings
        userPreferences,
      };
    } catch (error) {
      console.error('❌ [FullBackup] Failed to load app data:', error);
      throw error;
    }
  }

  /**
   * Safely parse JSON with fallback value
   */
  private static safeJSONParse<T>(jsonString: string | null | undefined, fallback: T): T {
    if (!jsonString || jsonString === 'undefined' || jsonString === 'null') {
      return fallback;
    }

    try {
      const parsed = JSON.parse(jsonString);
      return parsed !== undefined && parsed !== null ? parsed : fallback;
    } catch (error) {
      console.warn('⚠️ [FullBackup] Failed to parse JSON:', {
        error: error.message,
        jsonString: jsonString.substring(0, 100) + (jsonString.length > 100 ? '...' : ''),
      });
      return fallback;
    }
  }

  /**
   * Process and encode all images for backup
   */
  private static async processAllImages(
    wardrobeItems: WardrobeItem[], 
    profileImage: string | null
  ): Promise<FullBackupData['images']> {
    const images: FullBackupData['images'] = {};
    const processedUris = new Set<string>();

    try {
      // Process wardrobe item images
      for (let i = 0; i < wardrobeItems.length; i++) {
        const item = wardrobeItems[i];
        if (item && item.image && typeof item.image === 'string' && !processedUris.has(item.image)) {
          try {
            // Check if file exists before trying to read it
            const fileInfo = await FileSystem.getInfoAsync(item.image);
            if (!fileInfo.exists) {
              console.warn(`⚠️ [FullBackup] Image file not found for item ${i}: ${item.image}`);
              continue;
            }

            const base64Data = await FileSystem.readAsStringAsync(item.image, {
              encoding: FileSystem.EncodingType.Base64,
            });
            
            const itemId = `item_${i}`; // Use index as ID since WardrobeItem doesn't have id
            images[itemId] = {
              uri: item.image,
              fileName: item.image.split('/').pop() || `${itemId}.jpg`,
              base64Data,
            };
            
            processedUris.add(item.image);
            console.log(`📸 [FullBackup] Processed image for item ${i}: ${item.image}`);
          } catch (imageError) {
            console.warn(`⚠️ [FullBackup] Failed to process image for item ${i}:`, {
              error: imageError.message,
              imageUri: item.image,
            });
          }
        }
      }

      // Process profile image
      if (profileImage && typeof profileImage === 'string' && !processedUris.has(profileImage)) {
        try {
          console.log(`🔍 [FullBackup] Processing profile image: ${profileImage}`);
          
          // Check if profile image file exists
          const fileInfo = await FileSystem.getInfoAsync(profileImage);
          if (!fileInfo.exists) {
            console.warn(`⚠️ [FullBackup] Profile image file not found: ${profileImage}`);
          } else {
            console.log(`📸 [FullBackup] Profile image file exists, size: ${fileInfo.size} bytes`);
            const base64Data = await FileSystem.readAsStringAsync(profileImage, {
              encoding: FileSystem.EncodingType.Base64,
            });
            
            images['profile'] = {
              uri: profileImage,
              fileName: profileImage.split('/').pop() || 'profile.jpg',
              base64Data,
            };
            console.log(`✅ [FullBackup] Successfully processed profile image: ${profileImage}`, {
              base64Length: base64Data.length,
              fileName: profileImage.split('/').pop() || 'profile.jpg',
            });
          }
        } catch (imageError) {
          console.error('❌ [FullBackup] Failed to process profile image:', {
            error: imageError.message,
            profileImage,
            stack: imageError.stack,
          });
        }
      } else if (profileImage) {
        console.log(`🔍 [FullBackup] Profile image skipped:`, {
          profileImage,
          isString: typeof profileImage === 'string',
          alreadyProcessed: processedUris.has(profileImage),
        });
      }

      console.log(`🖼️ [FullBackup] Processed ${Object.keys(images).length} images`);
      return images;
    } catch (error) {
      console.error('❌ [FullBackup] Failed to process images:', error);
      throw error;
    }
  }

  /**
   * Calculate approximate backup size
   */
  private static async calculateBackupSize(
    data: FullBackupData['data'], 
    images: FullBackupData['images']
  ): Promise<number> {
    try {
      // Calculate data size (JSON)
      const dataSize = JSON.stringify(data).length;
      
      // Calculate images size (base64)
      const imageSize = Object.values(images).reduce((total, img) => total + img.base64Data.length, 0);
      
      // Convert to MB
      const totalSizeMB = (dataSize + imageSize) / (1024 * 1024);
      
      return Math.round(totalSizeMB * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('❌ [FullBackup] Failed to calculate backup size:', error);
      return 0;
    }
  }

  /**
   * Update backup index with new backup metadata
   */
  private static async updateBackupIndex(metadata: BackupMetadata): Promise<void> {
    try {
      const existingIndexStr = await AsyncStorage.getItem(this.BACKUP_INDEX_KEY);
      const existingIndex: BackupMetadata[] = existingIndexStr ? JSON.parse(existingIndexStr) : [];
      
      // Add new backup to index
      existingIndex.push(metadata);
      
      // Sort by timestamp (newest first)
      existingIndex.sort((a, b) => b.timestamp - a.timestamp);
      
      // Keep only last 10 backups in index (configurable)
      const maxBackups = 10;
      if (existingIndex.length > maxBackups) {
        const toRemove = existingIndex.slice(maxBackups);
        
        // Delete old backup files
        for (const oldBackup of toRemove) {
          try {
            const oldFilePath = `${this.BACKUP_DIRECTORY}${oldBackup.id}.json`;
            await FileSystem.deleteAsync(oldFilePath, { idempotent: true });
            console.log(`🗑️ [FullBackup] Deleted old backup: ${oldBackup.id}`);
          } catch (deleteError) {
            console.warn(`⚠️ [FullBackup] Failed to delete old backup ${oldBackup.id}:`, deleteError);
          }
        }
        
        // Keep only recent backups in index
        existingIndex.splice(maxBackups);
      }
      
      await AsyncStorage.setItem(this.BACKUP_INDEX_KEY, JSON.stringify(existingIndex));
    } catch (error) {
      console.error('❌ [FullBackup] Failed to update backup index:', error);
      throw error;
    }
  }

  /**
   * Get list of available backups
   */
  static async getAvailableBackups(): Promise<BackupMetadata[]> {
    try {
      const indexStr = await AsyncStorage.getItem(this.BACKUP_INDEX_KEY);
      return indexStr ? JSON.parse(indexStr) : [];
    } catch (error) {
      console.error('❌ [FullBackup] Failed to get available backups:', error);
      return [];
    }
  }

  /**
   * Load a specific backup by ID
   */
  static async loadBackup(backupId: string): Promise<FullBackupData | null> {
    try {
      const backupFilePath = `${this.BACKUP_DIRECTORY}${backupId}.json`;
      const backupStr = await FileSystem.readAsStringAsync(backupFilePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      return JSON.parse(backupStr);
    } catch (error) {
      console.error(`❌ [FullBackup] Failed to load backup ${backupId}:`, error);
      return null;
    }
  }

  /**
   * Delete a specific backup
   */
  static async deleteBackup(backupId: string): Promise<boolean> {
    try {
      // Remove from file system
      const backupFilePath = `${this.BACKUP_DIRECTORY}${backupId}.json`;
      await FileSystem.deleteAsync(backupFilePath, { idempotent: true });
      
      // Remove from index
      const indexStr = await AsyncStorage.getItem(this.BACKUP_INDEX_KEY);
      if (indexStr) {
        const index: BackupMetadata[] = JSON.parse(indexStr);
        const filteredIndex = index.filter(backup => backup.id !== backupId);
        await AsyncStorage.setItem(this.BACKUP_INDEX_KEY, JSON.stringify(filteredIndex));
      }
      
      console.log(`🗑️ [FullBackup] Deleted backup: ${backupId}`);
      return true;
    } catch (error) {
      console.error(`❌ [FullBackup] Failed to delete backup ${backupId}:`, error);
      return false;
    }
  }

  /**
   * Validate backup integrity
   */
  static async validateBackup(backupId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const backup = await this.loadBackup(backupId);
      
      if (!backup) {
        errors.push('Backup file not found or corrupted');
        return { isValid: false, errors, warnings };
      }

      // Validate metadata
      if (!backup.metadata || !backup.metadata.id || !backup.metadata.timestamp) {
        errors.push('Invalid backup metadata');
      }

      // Validate data structure
      if (!backup.data) {
        errors.push('Missing backup data');
      } else {
        if (!Array.isArray(backup.data.wardrobeItems)) {
          errors.push('Invalid wardrobe items data');
        }
        if (!Array.isArray(backup.data.lovedOutfits)) {
          errors.push('Invalid loved outfits data');
        }
      }

      // Validate images
      if (!backup.images || typeof backup.images !== 'object') {
        warnings.push('No image data found in backup');
      } else {
        const imageCount = Object.keys(backup.images).length;
        if (imageCount !== backup.metadata.imageCount) {
          warnings.push(`Image count mismatch: expected ${backup.metadata.imageCount}, found ${imageCount}`);
        }
      }

      const isValid = errors.length === 0;
      console.log(`🔍 [FullBackup] Validation for ${backupId}:`, { isValid, errors: errors.length, warnings: warnings.length });
      
      return { isValid, errors, warnings };
    } catch (error) {
      errors.push(`Validation failed: ${error.message}`);
      return { isValid: false, errors, warnings };
    }
  }
}