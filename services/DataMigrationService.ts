import { Alert } from 'react-native';
import { ImagePersistenceService } from './ImagePersistenceService';
import { PersistenceService } from './PersistenceService';

export interface MigrationProgress {
  phase: 'detecting' | 'migrating' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  recoveredItems: number;
  failedItems: number;
  currentItem?: string;
  message: string;
}

export interface MigrationSummary {
  success: boolean;
  totalItems: number;
  recoveredItems: number;
  failedItems: number;
  brokenReferences: string[];
  details: string[];
}

export class DataMigrationService {
  private static instance: DataMigrationService;
  private imagePersistence = ImagePersistenceService.getInstance();
  private persistenceService = new PersistenceService();

  private constructor() {}

  static getInstance(): DataMigrationService {
    if (!DataMigrationService.instance) {
      DataMigrationService.instance = new DataMigrationService();
    }
    return DataMigrationService.instance;
  }

  async performDataMigration(
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<MigrationSummary> {
    console.log('🔄 Starting data migration process...');
    
    try {
      // Initialize progress
      const progress: MigrationProgress = {
        phase: 'detecting',
        totalItems: 0,
        processedItems: 0,
        recoveredItems: 0,
        failedItems: 0,
        message: 'Loading wardrobe data...'
      };
      
      onProgress?.(progress);

      // Load existing wardrobe data
      const wardrobeData = await this.persistenceService.loadData();
      const items = wardrobeData.wardrobeItems || [];

      progress.totalItems = items.length;
      progress.message = `Found ${items.length} wardrobe items to check`;
      onProgress?.(progress);

      // Phase 1: Detect broken references
      progress.phase = 'detecting';
      progress.message = 'Detecting broken image references...';
      onProgress?.(progress);

      const brokenItems: any[] = [];
      const workingItems: any[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        progress.processedItems = i + 1;
        progress.currentItem = item.title || item.description || `Item ${i + 1}`;
        progress.message = `Checking: ${progress.currentItem}`;
        onProgress?.(progress);

        if (item.image && typeof item.image === 'string') {
          const exists = await this.imagePersistence.validateImageExists(item.image);
          if (!exists) {
            brokenItems.push(item);
          } else {
            // Check if it's already in persistent storage
            if (!item.image.includes('/stylemuse/')) {
              brokenItems.push(item); // Needs migration to persistent storage
            } else {
              workingItems.push(item);
            }
          }
        } else {
          // Item without image or invalid image reference
          brokenItems.push(item);
        }

        // Small delay to prevent UI blocking
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // Phase 2: Migrate broken references
      progress.phase = 'migrating';
      progress.processedItems = 0;
      progress.message = `Migrating ${brokenItems.length} items with issues...`;
      onProgress?.(progress);

      const recoveredItems: string[] = [];
      const failedItems: string[] = [];
      const details: string[] = [];

      for (let i = 0; i < brokenItems.length; i++) {
        const item = brokenItems[i];
        progress.processedItems = i + 1;
        progress.currentItem = item.title || item.description || `Item ${i + 1}`;
        progress.message = `Migrating: ${progress.currentItem}`;
        onProgress?.(progress);

        try {
          const migrationResult = await this.migrateItem(item);
          
          if (migrationResult.success) {
            recoveredItems.push(item.id || item.title || `Item ${i + 1}`);
            details.push(`✅ Recovered: ${item.title || item.description || 'Unknown item'}`);
            progress.recoveredItems++;
          } else {
            failedItems.push(item.id || item.title || `Item ${i + 1}`);
            details.push(`❌ Failed: ${item.title || item.description || 'Unknown item'} - ${migrationResult.error}`);
            progress.failedItems++;
          }
        } catch (error) {
          failedItems.push(item.id || item.title || `Item ${i + 1}`);
          details.push(`❌ Error: ${item.title || item.description || 'Unknown item'} - ${error}`);
          progress.failedItems++;
        }

        // Small delay to prevent UI blocking
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }

      // Save updated data
      if (recoveredItems.length > 0) {
        await this.persistenceService.saveData({ wardrobeItems: items });
        console.log(`✅ Saved updated wardrobe data with ${recoveredItems.length} recovered items`);
      }

      // Phase 3: Complete
      progress.phase = 'completed';
      progress.message = `Migration completed: ${recoveredItems.length} recovered, ${failedItems.length} failed`;
      onProgress?.(progress);

      const summary: MigrationSummary = {
        success: failedItems.length === 0,
        totalItems: items.length,
        recoveredItems: recoveredItems.length,
        failedItems: failedItems.length,
        brokenReferences: failedItems,
        details
      };

      console.log('📊 Migration Summary:', summary);
      return summary;

    } catch (error) {
      console.error('❌ Migration failed:', error);
      
      const errorSummary: MigrationSummary = {
        success: false,
        totalItems: 0,
        recoveredItems: 0,
        failedItems: 0,
        brokenReferences: [],
        details: [`Migration failed: ${error}`]
      };

      if (onProgress) {
        onProgress({
          phase: 'failed',
          totalItems: 0,
          processedItems: 0,
          recoveredItems: 0,
          failedItems: 0,
          message: `Migration failed: ${error}`
        });
      }

      return errorSummary;
    }
  }

  private async migrateItem(item: any): Promise<{ success: boolean; error?: string }> {
    try {
      if (!item.image || typeof item.image !== 'string') {
        // Item has no image - mark as text-only item
        item.isTextOnly = true;
        return { success: true };
      }

      // Check if image already exists
      const exists = await this.imagePersistence.validateImageExists(item.image);
      
      if (exists && item.image.includes('/stylemuse/')) {
        // Already in persistent storage
        return { success: true };
      }

      if (exists && !item.image.includes('/stylemuse/')) {
        // Exists but needs migration to persistent storage
        try {
          const persistentImage = await this.imagePersistence.persistImage(item.image, 'wardrobe', item.id);
          item.image = persistentImage.originalUri;
          return { success: true };
        } catch (error) {
          return { success: false, error: `Failed to persist existing image: ${error}` };
        }
      }

      // Image doesn't exist - try to recover from various locations
      const potentialPaths = this.generatePotentialPaths(item.image);
      
      for (const path of potentialPaths) {
        try {
          const pathExists = await this.imagePersistence.validateImageExists(path);
          if (pathExists) {
            // Found the image! Migrate to persistent storage
            const persistentImage = await this.imagePersistence.persistImage(path, 'wardrobe', item.id);
            item.image = persistentImage.originalUri;
            console.log(`✅ Recovered image from: ${path}`);
            return { success: true };
          }
        } catch (error) {
          // Continue to next potential path
          continue;
        }
      }

      // Could not recover image
      item.isTextOnly = true; // Mark as text-only
      item.originalImagePath = item.image; // Keep reference for user information
      item.image = null; // Clear broken reference
      
      return { success: false, error: 'Image could not be recovered from any location' };

    } catch (error) {
      return { success: false, error: `Migration error: ${error}` };
    }
  }

  private generatePotentialPaths(originalPath: string): string[] {
    const filename = originalPath.split('/').pop() || 'unknown.jpg';
    const filenameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    
    return [
      originalPath,
      // Try different app container paths
      originalPath.replace(/file:\/\/\/.*?\/Documents/, 'file:///var/mobile/Containers/Data/Application/Documents'),
      originalPath.replace(/file:\/\/\/.*?\/tmp/, 'file:///var/mobile/Containers/Data/Application/tmp'),
      // Try cache directories
      `file:///var/mobile/Containers/Data/Application/Library/Caches/camera/${filename}`,
      `file:///var/mobile/Containers/Data/Application/Library/Caches/ImagePicker/${filename}`,
      `file:///var/mobile/Containers/Data/Application/Library/Caches/${filename}`,
      // Try with different extensions
      `file:///var/mobile/Containers/Data/Application/Documents/${filenameWithoutExt}.jpg`,
      `file:///var/mobile/Containers/Data/Application/Documents/${filenameWithoutExt}.jpeg`,
      `file:///var/mobile/Containers/Data/Application/Documents/${filenameWithoutExt}.png`,
      // Try in stylemuse directory (in case partially migrated)
      `file:///var/mobile/Containers/Data/Application/Documents/stylemuse/images/wardrobe/${filename}`,
      // Try Expo FileSystem paths
      `${require('expo-file-system').documentDirectory}${filename}`,
      `${require('expo-file-system').cacheDirectory}${filename}`,
      `${require('expo-file-system').documentDirectory}stylemuse/images/wardrobe/${filename}`,
    ];
  }

  async showMigrationPrompt(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Wardrobe Migration',
        'We need to update your wardrobe images to prevent future data loss. This will check and fix any broken image references.\n\nThis is a one-time process and will improve app reliability.',
        [
          {
            text: 'Skip',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Migrate Now',
            style: 'default',
            onPress: () => resolve(true)
          }
        ],
        { cancelable: false }
      );
    });
  }

  async showMigrationResults(summary: MigrationSummary): Promise<void> {
    const message = summary.success
      ? `Migration completed successfully!\n\n✅ ${summary.recoveredItems} items recovered\n📁 All images are now safely stored\n\nYour wardrobe is protected from future data loss.`
      : `Migration completed with some issues:\n\n✅ ${summary.recoveredItems} items recovered\n❌ ${summary.failedItems} items could not be recovered\n\nRecovered items are now safely stored. You may need to re-add images for items that couldn't be recovered.`;

    return new Promise((resolve) => {
      Alert.alert(
        'Migration Results',
        message,
        [
          {
            text: 'OK',
            onPress: () => resolve()
          }
        ]
      );
    });
  }

  async checkNeedsMigration(): Promise<boolean> {
    try {
      const wardrobeData = await this.persistenceService.loadData();
      const items = wardrobeData.wardrobeItems || [];

      // Check if any items have images that are not in persistent storage
      for (const item of items) {
        if (item.image && typeof item.image === 'string') {
          // If image doesn't include stylemuse path, it needs migration
          if (!item.image.includes('/stylemuse/')) {
            return true;
          }
          
          // Check if the persistent image actually exists
          const exists = await this.imagePersistence.validateImageExists(item.image);
          if (!exists) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to check migration needs:', error);
      return false;
    }
  }
}

export default DataMigrationService;