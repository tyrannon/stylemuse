import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

export interface PersistentImage {
  originalUri: string;
  thumbnailUri: string;
  processedUri?: string;
  fileSize: number;
  dimensions: { width: number; height: number };
  timestamp: number;
}

export interface MigrationResult {
  success: boolean;
  recovered: number;
  failed: number;
  details: string[];
}

export interface RepairResult {
  success: boolean;
  repaired: number;
  failed: number;
  details: string[];
}

export type ImageType = 'wardrobe' | 'outfit' | 'profile';

export class ImagePersistenceService {
  private static instance: ImagePersistenceService;
  private readonly BASE_DIR = `${FileSystem.documentDirectory}stylemuse/`;
  private readonly IMAGES_DIR = `${this.BASE_DIR}images/`;
  private readonly WARDROBE_DIR = `${this.IMAGES_DIR}wardrobe/`;
  private readonly OUTFITS_DIR = `${this.IMAGES_DIR}outfits/`;
  private readonly PROFILE_DIR = `${this.IMAGES_DIR}profile/`;

  private constructor() {}

  static getInstance(): ImagePersistenceService {
    if (!ImagePersistenceService.instance) {
      ImagePersistenceService.instance = new ImagePersistenceService();
    }
    return ImagePersistenceService.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.ensureDirectoryExists(this.BASE_DIR);
      await this.ensureDirectoryExists(this.IMAGES_DIR);
      await this.ensureDirectoryExists(this.WARDROBE_DIR);
      await this.ensureDirectoryExists(this.OUTFITS_DIR);
      await this.ensureDirectoryExists(this.PROFILE_DIR);
      
      console.log('ImagePersistenceService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ImagePersistenceService:', error);
      throw error;
    }
  }

  private async ensureDirectoryExists(dir: string): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }

  async persistImage(tempUri: string, type: ImageType, itemId?: string): Promise<PersistentImage> {
    try {
      await this.initialize();
      
      // Validate the temporary image exists
      const tempInfo = await FileSystem.getInfoAsync(tempUri);
      if (!tempInfo.exists) {
        throw new Error(`Temporary image not found: ${tempUri}`);
      }

      // Get image info
      const imageInfo = await ImageManipulator.manipulateAsync(tempUri, [], {
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 0.8,
      });

      // Generate unique filename
      const timestamp = Date.now();
      const filename = itemId ? `${itemId}_${timestamp}` : `${timestamp}`;
      const extension = '.jpg';
      
      // Determine target directory
      const targetDir = this.getTargetDirectory(type);
      const originalPath = `${targetDir}${filename}_original${extension}`;
      const thumbnailPath = `${targetDir}${filename}_thumbnail${extension}`;

      // Copy original image to permanent location
      await FileSystem.copyAsync({
        from: tempUri,
        to: originalPath,
      });

      // Create thumbnail
      const thumbnailInfo = await ImageManipulator.manipulateAsync(originalPath, [
        { resize: { width: 300, height: 300 } }
      ], {
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 0.7,
      });

      await FileSystem.copyAsync({
        from: thumbnailInfo.uri,
        to: thumbnailPath,
      });

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(originalPath);
      const fileSize = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;

      // Get dimensions
      const dimensions = {
        width: imageInfo.width,
        height: imageInfo.height,
      };

      const persistentImage: PersistentImage = {
        originalUri: originalPath,
        thumbnailUri: thumbnailPath,
        fileSize,
        dimensions,
        timestamp,
      };

      console.log(`Image persisted successfully: ${originalPath}`);
      return persistentImage;

    } catch (error) {
      console.error('Failed to persist image:', error);
      throw error;
    }
  }

  private getTargetDirectory(type: ImageType): string {
    switch (type) {
      case 'wardrobe':
        return this.WARDROBE_DIR;
      case 'outfit':
        return this.OUTFITS_DIR;
      case 'profile':
        return this.PROFILE_DIR;
      default:
        return this.WARDROBE_DIR;
    }
  }

  async deleteImage(persistentUri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(persistentUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(persistentUri);
        
        // Also delete thumbnail if it exists
        const thumbnailUri = persistentUri.replace('_original', '_thumbnail');
        const thumbnailInfo = await FileSystem.getInfoAsync(thumbnailUri);
        if (thumbnailInfo.exists) {
          await FileSystem.deleteAsync(thumbnailUri);
        }
        
        console.log(`Image deleted: ${persistentUri}`);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      throw error;
    }
  }

  async validateImageExists(uri: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.exists;
    } catch (error) {
      console.error('Failed to validate image existence:', error);
      return false;
    }
  }

  async repairBrokenReferences(items: any[]): Promise<RepairResult> {
    let repaired = 0;
    let failed = 0;
    const details: string[] = [];

    for (const item of items) {
      try {
        if (item.image && typeof item.image === 'string') {
          const exists = await this.validateImageExists(item.image);
          if (!exists) {
            details.push(`Missing image for item: ${item.id || item.title || 'Unknown'}`);
            failed++;
          } else {
            repaired++;
          }
        }
      } catch (error) {
        details.push(`Error checking item: ${item.id || item.title || 'Unknown'}`);
        failed++;
      }
    }

    return {
      success: failed === 0,
      repaired,
      failed,
      details,
    };
  }

  async migrateImages(items: any[]): Promise<MigrationResult> {
    let recovered = 0;
    let failed = 0;
    const details: string[] = [];

    for (const item of items) {
      try {
        if (item.image && typeof item.image === 'string') {
          const exists = await this.validateImageExists(item.image);
          
          if (!exists) {
            // Try to find the image in various temporary locations
            const potentialPaths = [
              item.image,
              item.image.replace('file:///', 'file:///var/mobile/Containers/Data/Application/'),
              `${FileSystem.cacheDirectory}camera/${item.image.split('/').pop()}`,
              `${FileSystem.cacheDirectory}ImagePicker/${item.image.split('/').pop()}`,
            ];

            let found = false;
            for (const path of potentialPaths) {
              const pathExists = await this.validateImageExists(path);
              if (pathExists) {
                // Migrate to permanent storage
                const persistentImage = await this.persistImage(path, 'wardrobe', item.id);
                item.image = persistentImage.originalUri;
                found = true;
                recovered++;
                details.push(`Recovered image for: ${item.title || item.id || 'Unknown'}`);
                break;
              }
            }

            if (!found) {
              details.push(`Could not recover image for: ${item.title || item.id || 'Unknown'}`);
              failed++;
            }
          } else {
            // Image exists, check if it's in permanent storage
            if (!item.image.includes('/stylemuse/')) {
              // Migrate to permanent storage
              const persistentImage = await this.persistImage(item.image, 'wardrobe', item.id);
              item.image = persistentImage.originalUri;
              recovered++;
              details.push(`Migrated image for: ${item.title || item.id || 'Unknown'}`);
            }
          }
        }
      } catch (error) {
        details.push(`Error migrating item: ${item.title || item.id || 'Unknown'} - ${error}`);
        failed++;
      }
    }

    return {
      success: failed === 0,
      recovered,
      failed,
      details,
    };
  }

  async getStorageInfo(): Promise<{ total: number; used: number; available: number }> {
    try {
      const info = await FileSystem.getInfoAsync(this.IMAGES_DIR);
      if (!info.exists) {
        return { total: 0, used: 0, available: 0 };
      }

      // Calculate used space by walking through all image files
      let used = 0;
      const wardrobeFiles = await FileSystem.readDirectoryAsync(this.WARDROBE_DIR);
      const outfitFiles = await FileSystem.readDirectoryAsync(this.OUTFITS_DIR);
      const profileFiles = await FileSystem.readDirectoryAsync(this.PROFILE_DIR);

      const allFiles = [
        ...wardrobeFiles.map(f => `${this.WARDROBE_DIR}${f}`),
        ...outfitFiles.map(f => `${this.OUTFITS_DIR}${f}`),
        ...profileFiles.map(f => `${this.PROFILE_DIR}${f}`),
      ];

      for (const file of allFiles) {
        const fileInfo = await FileSystem.getInfoAsync(file);
        if (fileInfo.exists && fileInfo.size) {
          used += fileInfo.size;
        }
      }

      // Get available space on device
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      const totalSpace = await FileSystem.getTotalDiskCapacityAsync();

      return {
        total: totalSpace,
        used: used,
        available: freeSpace,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { total: 0, used: 0, available: 0 };
    }
  }

  async cleanupOldImages(olderThanDays: number = 30): Promise<void> {
    try {
      const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
      
      const directories = [this.WARDROBE_DIR, this.OUTFITS_DIR, this.PROFILE_DIR];
      
      for (const dir of directories) {
        const files = await FileSystem.readDirectoryAsync(dir);
        
        for (const file of files) {
          const filePath = `${dir}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          
          if (fileInfo.exists && fileInfo.modificationTime && fileInfo.modificationTime < cutoffTime) {
            await FileSystem.deleteAsync(filePath);
            console.log(`Cleaned up old image: ${filePath}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old images:', error);
    }
  }

  async createThumbnail(imageUri: string, size: number = 300): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(imageUri, [
        { resize: { width: size, height: size } }
      ], {
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 0.7,
      });

      return result.uri;
    } catch (error) {
      console.error('Failed to create thumbnail:', error);
      throw error;
    }
  }

  async compressImage(imageUri: string, quality: number = 0.8): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(imageUri, [], {
        format: ImageManipulator.SaveFormat.JPEG,
        compress: quality,
      });

      return result.uri;
    } catch (error) {
      console.error('Failed to compress image:', error);
      throw error;
    }
  }
}

export default ImagePersistenceService;