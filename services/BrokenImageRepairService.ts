import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { ImagePersistenceService } from './ImagePersistenceService';
import { PersistenceService } from './PersistenceService';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

export interface RepairProgress {
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

export interface RepairSummary {
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

export interface ValidationResult {
  exists: boolean;
  accessible: boolean;
  size?: number;
  isCorrupted?: boolean;
  errorType?: 'not_found' | 'permission' | 'corrupted' | 'network' | 'format';
  path: string;
}

export class BrokenImageRepairService {
  private static instance: BrokenImageRepairService;
  private imagePersistence = ImagePersistenceService.getInstance();
  private persistenceService = new PersistenceService();
  private startTime: number = 0;

  private constructor() {}

  static getInstance(): BrokenImageRepairService {
    if (!BrokenImageRepairService.instance) {
      BrokenImageRepairService.instance = new BrokenImageRepairService();
    }
    return BrokenImageRepairService.instance;
  }

  /**
   * Main repair function - comprehensive broken image repair with analytics
   */
  async performComprehensiveRepair(
    onProgress?: (progress: RepairProgress) => void,
    options: {
      dryRun?: boolean;
      removeUnrecoverable?: boolean;
      backupBeforeRepair?: boolean;
      maxRecoveryAttempts?: number;
    } = {}
  ): Promise<RepairSummary> {
    this.startTime = Date.now();
    const {
      dryRun = false,
      removeUnrecoverable = true,
      backupBeforeRepair = true,
      maxRecoveryAttempts = 5
    } = options;

    logger.info(LogCategories.MIGRATION, 'Starting comprehensive image repair', {
      dryRun,
      removeUnrecoverable,
      backupBeforeRepair,
      maxRecoveryAttempts
    });

    try {
      // Initialize progress tracking
      const progress: RepairProgress = {
        phase: 'scanning',
        totalItems: 0,
        processedItems: 0,
        recoveredItems: 0,
        failedItems: 0,
        removedItems: 0,
        message: 'Loading wardrobe data...',
        analytics: {
          brokenByType: {},
          recoveryMethods: {},
          failureReasons: {}
        }
      };

      onProgress?.(progress);

      // Phase 1: Load and scan wardrobe data
      const wardrobeData = await this.persistenceService.loadData();
      const items = wardrobeData.wardrobeItems || [];

      // Create backup if requested
      let backupPath: string | null = null;
      if (backupBeforeRepair && !dryRun) {
        backupPath = await this.createBackup(wardrobeData);
        logger.info(LogCategories.MIGRATION, 'Backup created', { backupPath });
      }

      progress.totalItems = items.length;
      progress.message = `Found ${items.length} wardrobe items to analyze`;
      onProgress?.(progress);

      // Phase 2: Comprehensive scanning and validation
      progress.phase = 'analyzing';
      progress.message = 'Analyzing image references...';
      onProgress?.(progress);

      const analysisResults = await this.analyzeAllImages(items, progress, onProgress);
      
      logger.info(LogCategories.MIGRATION, 'Analysis completed', {
        totalItems: analysisResults.totalItems,
        brokenItems: analysisResults.brokenItems.length,
        workingItems: analysisResults.workingItems.length
      });

      // Phase 3: Repair broken references
      progress.phase = 'repairing';
      progress.processedItems = 0;
      progress.message = `Repairing ${analysisResults.brokenItems.length} broken references...`;
      onProgress?.(progress);

      const repairResults = await this.repairBrokenImages(
        analysisResults.brokenItems,
        progress,
        onProgress,
        maxRecoveryAttempts,
        dryRun
      );

      // Phase 4: Cleanup and removal of unrecoverable items
      const cleanupResults = await this.cleanupUnrecoverableItems(
        repairResults.stillBrokenItems,
        removeUnrecoverable,
        dryRun,
        progress,
        onProgress
      );

      // Save updated data (if not dry run)
      if (!dryRun && (repairResults.recoveredItems.length > 0 || cleanupResults.removedItems.length > 0)) {
        await this.persistenceService.saveData(wardrobeData);
        logger.info(LogCategories.MIGRATION, 'Updated wardrobe data saved', {
          recoveredItems: repairResults.recoveredItems.length,
          removedItems: cleanupResults.removedItems.length
        });
      }

      // Phase 5: Complete
      progress.phase = 'completed';
      const timeTaken = Date.now() - this.startTime;
      progress.message = `${dryRun ? 'Analysis' : 'Repair'} completed in ${(timeTaken / 1000).toFixed(1)}s`;
      onProgress?.(progress);

      const summary: RepairSummary = {
        success: repairResults.failedItems.length === 0,
        totalItems: items.length,
        scannedItems: items.length,
        brokenItems: analysisResults.brokenItems.length,
        recoveredItems: repairResults.recoveredItems.length,
        removedItems: cleanupResults.removedItems.length,
        failedItems: repairResults.failedItems.length,
        brokenReferences: analysisResults.brokenItems.map(item => this.getItemIdentifier(item)),
        recoveredReferences: repairResults.recoveredItems.map(item => this.getItemIdentifier(item)),
        removedReferences: cleanupResults.removedItems.map(item => this.getItemIdentifier(item)),
        details: [
          ...repairResults.details,
          ...cleanupResults.details,
          backupPath ? `📁 Backup created: ${backupPath}` : null
        ].filter(Boolean) as string[],
        analytics: {
          brokenByType: progress.analytics.brokenByType,
          recoveryMethods: progress.analytics.recoveryMethods,
          failureReasons: progress.analytics.failureReasons,
          timeTaken,
          throughputPerSecond: Math.round((items.length / timeTaken) * 1000)
        }
      };

      logger.info(LogCategories.MIGRATION, 'Comprehensive repair completed', summary);
      return summary;

    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Comprehensive repair failed', error);
      
      const errorSummary: RepairSummary = {
        success: false,
        totalItems: 0,
        scannedItems: 0,
        brokenItems: 0,
        recoveredItems: 0,
        removedItems: 0,
        failedItems: 0,
        brokenReferences: [],
        recoveredReferences: [],
        removedReferences: [],
        details: [`Repair failed: ${error}`],
        analytics: {
          brokenByType: {},
          recoveryMethods: {},
          failureReasons: { system_error: 1 },
          timeTaken: Date.now() - this.startTime,
          throughputPerSecond: 0
        }
      };

      if (onProgress) {
        onProgress({
          phase: 'failed',
          totalItems: 0,
          processedItems: 0,
          recoveredItems: 0,
          failedItems: 0,
          removedItems: 0,
          message: `Repair failed: ${error}`,
          analytics: {
            brokenByType: {},
            recoveryMethods: {},
            failureReasons: { system_error: 1 }
          }
        });
      }

      return errorSummary;
    }
  }

  /**
   * Advanced image validation with multiple strategies
   */
  private async validateImageComprehensively(imagePath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      exists: false,
      accessible: false,
      path: imagePath
    };

    try {
      // Strategy 1: Basic file existence check
      const fileInfo = await FileSystem.getInfoAsync(imagePath);
      result.exists = fileInfo.exists;
      
      if (!fileInfo.exists) {
        result.errorType = 'not_found';
        return result;
      }

      result.size = fileInfo.size;
      result.accessible = true;

      // Strategy 2: Check file size (corrupted files often have 0 size)
      if (fileInfo.size === 0) {
        result.isCorrupted = true;
        result.errorType = 'corrupted';
        return result;
      }

      // Strategy 3: For very small files, check if they might be error files
      if (fileInfo.size < 100) {
        try {
          const content = await FileSystem.readAsStringAsync(imagePath, { length: 100 });
          if (content.includes('error') || content.includes('404') || content.includes('not found')) {
            result.isCorrupted = true;
            result.errorType = 'corrupted';
            return result;
          }
        } catch (e) {
          // If we can't read it as text, it's probably a valid (small) image
        }
      }

      // Strategy 4: Basic format validation (check file extension and magic bytes)
      const fileName = imagePath.split('/').pop() || '';
      const isImageExtension = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName);
      
      if (!isImageExtension) {
        result.errorType = 'format';
        return result;
      }

      return result;

    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Image validation failed', error, { imagePath });
      result.errorType = 'permission';
      return result;
    }
  }

  /**
   * Analyze all images with comprehensive validation
   */
  private async analyzeAllImages(
    items: any[],
    progress: RepairProgress,
    onProgress?: (progress: RepairProgress) => void
  ): Promise<{ brokenItems: any[], workingItems: any[], totalItems: number }> {
    const brokenItems: any[] = [];
    const workingItems: any[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      progress.processedItems = i + 1;
      progress.currentItem = this.getItemIdentifier(item);
      progress.message = `Analyzing: ${progress.currentItem}`;
      onProgress?.(progress);

      if (!item.image || typeof item.image !== 'string') {
        // No image reference
        progress.analytics.brokenByType['no_image'] = (progress.analytics.brokenByType['no_image'] || 0) + 1;
        brokenItems.push({
          ...item,
          repairContext: { issueType: 'no_image', originalImage: item.image }
        });
        continue;
      }

      const validation = await this.validateImageComprehensively(item.image);
      
      if (!validation.exists || validation.isCorrupted) {
        const issueType = validation.errorType || 'unknown';
        progress.analytics.brokenByType[issueType] = (progress.analytics.brokenByType[issueType] || 0) + 1;
        brokenItems.push({
          ...item,
          repairContext: { 
            issueType, 
            originalImage: item.image,
            validationResult: validation
          }
        });
      } else if (!item.image.includes('/stylemuse/')) {
        // Needs migration to persistent storage
        progress.analytics.brokenByType['needs_migration'] = (progress.analytics.brokenByType['needs_migration'] || 0) + 1;
        brokenItems.push({
          ...item,
          repairContext: { 
            issueType: 'needs_migration', 
            originalImage: item.image,
            validationResult: validation
          }
        });
      } else {
        workingItems.push(item);
      }

      // Prevent UI blocking
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    }

    return { brokenItems, workingItems, totalItems: items.length };
  }

  /**
   * Repair broken images with multiple recovery strategies
   */
  private async repairBrokenImages(
    brokenItems: any[],
    progress: RepairProgress,
    onProgress?: (progress: RepairProgress) => void,
    maxAttempts: number = 5,
    dryRun: boolean = false
  ): Promise<{
    recoveredItems: any[];
    failedItems: any[];
    stillBrokenItems: any[];
    details: string[];
  }> {
    const recoveredItems: any[] = [];
    const failedItems: any[] = [];
    const stillBrokenItems: any[] = [];
    const details: string[] = [];

    for (let i = 0; i < brokenItems.length; i++) {
      const item = brokenItems[i];
      const context = item.repairContext;
      
      progress.processedItems = i + 1;
      progress.currentItem = this.getItemIdentifier(item);
      progress.message = `Repairing: ${progress.currentItem}`;
      onProgress?.(progress);

      try {
        const repairResult = await this.attemptImageRepair(item, context, maxAttempts, dryRun);
        
        if (repairResult.success) {
          recoveredItems.push(item);
          progress.recoveredItems++;
          progress.analytics.recoveryMethods[repairResult.method] = 
            (progress.analytics.recoveryMethods[repairResult.method] || 0) + 1;
          details.push(`✅ Recovered: ${this.getItemIdentifier(item)} via ${repairResult.method}`);
        } else {
          failedItems.push(item);
          stillBrokenItems.push(item);
          progress.failedItems++;
          progress.analytics.failureReasons[repairResult.errorType] = 
            (progress.analytics.failureReasons[repairResult.errorType] || 0) + 1;
          details.push(`❌ Failed: ${this.getItemIdentifier(item)} - ${repairResult.error}`);
        }
      } catch (error) {
        failedItems.push(item);
        stillBrokenItems.push(item);
        progress.failedItems++;
        progress.analytics.failureReasons['system_error'] = 
          (progress.analytics.failureReasons['system_error'] || 0) + 1;
        details.push(`❌ Error: ${this.getItemIdentifier(item)} - ${error}`);
        logger.error(LogCategories.MIGRATION, 'Item repair failed', error, { item: this.getItemIdentifier(item) });
      }

      // Prevent UI blocking
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    return { recoveredItems, failedItems, stillBrokenItems, details };
  }

  /**
   * Attempt to repair a single image with multiple strategies
   */
  private async attemptImageRepair(
    item: any,
    context: any,
    maxAttempts: number,
    dryRun: boolean
  ): Promise<{ success: boolean; method?: string; error?: string; errorType?: string }> {
    const originalImage = context.originalImage;

    // Strategy 1: If image exists but needs migration to persistent storage
    if (context.issueType === 'needs_migration' && context.validationResult?.exists) {
      try {
        if (!dryRun) {
          const persistentImage = await this.imagePersistence.persistImage(originalImage, 'wardrobe', item.id);
          item.image = persistentImage.originalUri;
        }
        return { success: true, method: 'persistence_migration' };
      } catch (error) {
        return { success: false, error: `Migration failed: ${error}`, errorType: 'migration_error' };
      }
    }

    // Strategy 2: If no image reference, mark as text-only
    if (context.issueType === 'no_image') {
      if (!dryRun) {
        item.isTextOnly = true;
        item.image = null;
      }
      return { success: true, method: 'marked_text_only' };
    }

    // Strategy 3: Search for the image in alternative locations
    const potentialPaths = this.generateAdvancedPotentialPaths(originalImage, item);
    
    for (let attempt = 0; attempt < Math.min(potentialPaths.length, maxAttempts); attempt++) {
      const path = potentialPaths[attempt];
      
      try {
        const validation = await this.validateImageComprehensively(path);
        
        if (validation.exists && !validation.isCorrupted) {
          if (!dryRun) {
            // Found the image! Migrate to persistent storage
            const persistentImage = await this.imagePersistence.persistImage(path, 'wardrobe', item.id);
            item.image = persistentImage.originalUri;
          }
          logger.info(LogCategories.MIGRATION, 'Image recovered from alternative path', { 
            originalPath: originalImage, 
            recoveredPath: path,
            itemId: item.id
          });
          return { success: true, method: `alternative_path_${attempt + 1}` };
        }
      } catch (error) {
        // Continue to next potential path
        continue;
      }
    }

    // Strategy 4: Last resort - mark as unrecoverable
    return { 
      success: false, 
      error: 'Image could not be recovered from any location', 
      errorType: 'unrecoverable' 
    };
  }

  /**
   * Generate advanced potential paths for image recovery
   */
  private generateAdvancedPotentialPaths(originalPath: string, item: any): string[] {
    const filename = originalPath.split('/').pop() || 'unknown.jpg';
    const filenameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    const itemId = item.id || '';
    
    const paths = [
      originalPath,
      
      // Try with item ID variations
      `${FileSystem.documentDirectory}stylemuse/images/wardrobe/${itemId}_${filename}`,
      `${FileSystem.documentDirectory}stylemuse/images/wardrobe/${itemId}.jpg`,
      `${FileSystem.documentDirectory}stylemuse/images/wardrobe/${itemId}.png`,
      
      // Try different app container paths
      originalPath.replace(/file:\/\/\/.*?\/Documents/, `${FileSystem.documentDirectory}`),
      originalPath.replace(/file:\/\/\/.*?\/tmp/, `${FileSystem.cacheDirectory}`),
      
      // Try various cache directories
      `${FileSystem.cacheDirectory}camera/${filename}`,
      `${FileSystem.cacheDirectory}ImagePicker/${filename}`,
      `${FileSystem.cacheDirectory}ExponentExperienceData/${filename}`,
      `${FileSystem.cacheDirectory}ImageManipulator/${filename}`,
      
      // Try Documents subdirectories
      `${FileSystem.documentDirectory}images/${filename}`,
      `${FileSystem.documentDirectory}photos/${filename}`,
      `${FileSystem.documentDirectory}wardrobe/${filename}`,
      
      // Try with different extensions
      `${FileSystem.documentDirectory}${filenameWithoutExt}.jpg`,
      `${FileSystem.documentDirectory}${filenameWithoutExt}.jpeg`,
      `${FileSystem.documentDirectory}${filenameWithoutExt}.png`,
      `${FileSystem.documentDirectory}${filenameWithoutExt}.webp`,
      
      // Try in stylemuse directories (partial migrations)
      `${FileSystem.documentDirectory}stylemuse/images/${filename}`,
      `${FileSystem.documentDirectory}stylemuse/images/wardrobe/${filename}`,
      `${FileSystem.documentDirectory}stylemuse/cache/${filename}`,
      `${FileSystem.documentDirectory}stylemuse/temp/${filename}`,
      
      // Try timestamp-based variations (common pattern)
      ...this.generateTimestampVariations(filenameWithoutExt, FileSystem.documentDirectory),
      
      // Try legacy paths
      ...this.generateLegacyPaths(filename),
    ];

    // Remove duplicates and return
    return [...new Set(paths)];
  }

  /**
   * Generate timestamp-based filename variations
   */
  private generateTimestampVariations(filenameBase: string, directory: string): string[] {
    const variations = [];
    const now = new Date();
    
    // Try recent timestamps (last 30 days)
    for (let days = 0; days < 30; days++) {
      const date = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      const timestamp = date.getTime();
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      
      variations.push(
        `${directory}${filenameBase}_${timestamp}.jpg`,
        `${directory}${filenameBase}_${dateStr}.jpg`,
        `${directory}${timestamp}_${filenameBase}.jpg`,
        `${directory}${dateStr}_${filenameBase}.jpg`
      );
    }
    
    return variations.slice(0, 10); // Limit to prevent excessive searches
  }

  /**
   * Generate legacy path variations
   */
  private generateLegacyPaths(filename: string): string[] {
    return [
      // iOS specific paths
      `/var/mobile/Containers/Data/Application/Documents/${filename}`,
      `/var/mobile/Containers/Data/Application/Library/Caches/${filename}`,
      `/var/mobile/Containers/Data/Application/tmp/${filename}`,
      
      // Common Android paths (if applicable)
      `/data/data/com.stylemuse.app/files/${filename}`,
      `/storage/emulated/0/Android/data/com.stylemuse.app/files/${filename}`,
    ];
  }

  /**
   * Clean up unrecoverable items
   */
  private async cleanupUnrecoverableItems(
    stillBrokenItems: any[],
    removeUnrecoverable: boolean,
    dryRun: boolean,
    progress: RepairProgress,
    onProgress?: (progress: RepairProgress) => void
  ): Promise<{ removedItems: any[]; details: string[] }> {
    progress.phase = 'cleanup';
    progress.message = `Cleaning up ${stillBrokenItems.length} unrecoverable items...`;
    onProgress?.(progress);

    const removedItems: any[] = [];
    const details: string[] = [];

    if (!removeUnrecoverable) {
      details.push(`ℹ️ Skipped removal of ${stillBrokenItems.length} unrecoverable items (removeUnrecoverable=false)`);
      return { removedItems, details };
    }

    for (const item of stillBrokenItems) {
      if (!dryRun) {
        // Mark item for removal or convert to text-only
        item.isTextOnly = true;
        item.originalImagePath = item.image; // Keep reference for user information
        item.image = null; // Clear broken reference
        item.repairAttempted = true;
        item.repairDate = new Date().toISOString();
      }
      
      removedItems.push(item);
      progress.removedItems++;
      details.push(`🗑️ Cleaned up: ${this.getItemIdentifier(item)} (marked as text-only)`);
    }

    return { removedItems, details };
  }

  /**
   * Create a backup of wardrobe data before migration
   */
  private async createBackup(wardrobeData: any): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `${FileSystem.documentDirectory}stylemuse/backups/`;
    const backupPath = `${backupDir}wardrobe_backup_${timestamp}.json`;

    await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
    await FileSystem.writeAsStringAsync(backupPath, JSON.stringify(wardrobeData, null, 2));

    return backupPath;
  }

  /**
   * Utility to get item identifier for logging
   */
  private getItemIdentifier(item: any): string {
    return item.title || item.description || item.id || `Item-${Date.now()}`;
  }

  /**
   * Manual trigger for repair process
   */
  async triggerManualRepair(options?: {
    dryRun?: boolean;
    removeUnrecoverable?: boolean;
    backupBeforeRepair?: boolean;
  }): Promise<RepairSummary> {
    logger.info(LogCategories.MIGRATION, 'Manual repair triggered', options);
    
    return this.performComprehensiveRepair(
      (progress) => {
        logger.info(LogCategories.MIGRATION, 'Repair progress', {
          phase: progress.phase,
          processed: progress.processedItems,
          total: progress.totalItems,
          recovered: progress.recoveredItems,
          failed: progress.failedItems
        });
      },
      options
    );
  }

  /**
   * Check if repair is needed
   */
  async checkNeedsRepair(): Promise<{ needsRepair: boolean; brokenCount: number; totalCount: number }> {
    try {
      const wardrobeData = await this.persistenceService.loadData();
      const items = wardrobeData.wardrobeItems || [];
      let brokenCount = 0;

      for (const item of items) {
        if (!item.image || typeof item.image !== 'string') {
          brokenCount++;
          continue;
        }

        if (!item.image.includes('/stylemuse/')) {
          brokenCount++;
          continue;
        }

        const validation = await this.validateImageComprehensively(item.image);
        if (!validation.exists || validation.isCorrupted) {
          brokenCount++;
        }
      }

      return {
        needsRepair: brokenCount > 0,
        brokenCount,
        totalCount: items.length
      };
    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Failed to check repair needs', error);
      return { needsRepair: false, brokenCount: 0, totalCount: 0 };
    }
  }

  /**
   * Show repair prompt to user
   */
  async showRepairPrompt(repairNeeds: { brokenCount: number; totalCount: number }): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Image Repair Needed',
        `Found ${repairNeeds.brokenCount} items with broken image references out of ${repairNeeds.totalCount} total items.\n\nThis comprehensive repair will:\n• Attempt to recover broken images\n• Migrate images to secure storage\n• Clean up unrecoverable references\n• Create a backup before changes\n\nRecommended to run now for best results.`,
        [
          {
            text: 'Skip',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Preview Changes',
            style: 'default',
            onPress: () => {
              // Run dry-run first
              this.triggerManualRepair({ dryRun: true }).then(() => resolve(true));
            }
          },
          {
            text: 'Repair Now',
            style: 'default',
            onPress: () => resolve(true)
          }
        ],
        { cancelable: false }
      );
    });
  }

  /**
   * Show repair results to user
   */
  async showRepairResults(summary: RepairSummary): Promise<void> {
    const message = summary.success
      ? `Repair completed successfully!\n\n✅ ${summary.recoveredItems} images recovered\n🗑️ ${summary.removedItems} items cleaned up\n⚡ Processed ${summary.totalItems} items in ${(summary.analytics.timeTaken / 1000).toFixed(1)}s\n\nYour wardrobe is now optimized and protected.`
      : `Repair completed with some issues:\n\n✅ ${summary.recoveredItems} images recovered\n🗑️ ${summary.removedItems} items cleaned up\n❌ ${summary.failedItems} items need attention\n\nRecovered items are safely stored. Review failed items manually.`;

    return new Promise((resolve) => {
      Alert.alert(
        'Repair Results',
        message,
        [
          {
            text: 'View Details',
            onPress: () => {
              logger.info(LogCategories.MIGRATION, 'Repair summary details', summary);
              resolve();
            }
          },
          {
            text: 'OK',
            onPress: () => resolve()
          }
        ]
      );
    });
  }
}

export default BrokenImageRepairService;