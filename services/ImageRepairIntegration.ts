import AsyncStorage from '@react-native-async-storage/async-storage';
import { BrokenImageRepairService } from './BrokenImageRepairService';
import { DataMigrationService } from './DataMigrationService';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

export interface RepairScheduleConfig {
  autoRepairEnabled: boolean;
  lastRepairDate: string | null;
  repairIntervalDays: number;
  repairThreshold: number; // Minimum number of broken items to trigger repair
  skipNextAutoRepair: boolean;
}

export class ImageRepairIntegration {
  private static instance: ImageRepairIntegration;
  private repairService = BrokenImageRepairService.getInstance();
  private legacyMigrationService = DataMigrationService.getInstance();

  private constructor() {}

  static getInstance(): ImageRepairIntegration {
    if (!ImageRepairIntegration.instance) {
      ImageRepairIntegration.instance = new ImageRepairIntegration();
    }
    return ImageRepairIntegration.instance;
  }

  /**
   * Main integration point - call this during app startup
   */
  async performStartupImageCheck(): Promise<{
    needsRepair: boolean;
    needsLegacyMigration: boolean;
    repairInfo?: { brokenCount: number; totalCount: number };
    shouldPromptUser: boolean;
    autoRepairRecommended: boolean;
  }> {
    try {
      logger.info(LogCategories.APP_LIFECYCLE, 'Starting startup image check');

      // Get repair configuration
      const config = await this.getRepairConfig();
      
      // Check if legacy migration is needed first
      const needsLegacyMigration = await this.legacyMigrationService.checkNeedsMigration();
      
      if (needsLegacyMigration) {
        logger.info(LogCategories.MIGRATION, 'Legacy migration needed, will run before comprehensive repair');
        return {
          needsRepair: false,
          needsLegacyMigration: true,
          shouldPromptUser: true,
          autoRepairRecommended: false
        };
      }

      // Check if comprehensive repair is needed
      const repairNeeds = await this.repairService.checkNeedsRepair();
      
      if (!repairNeeds.needsRepair) {
        logger.info(LogCategories.MIGRATION, 'No image repair needed');
        return {
          needsRepair: false,
          needsLegacyMigration: false,
          shouldPromptUser: false,
          autoRepairRecommended: false
        };
      }

      // Determine if we should prompt user or run automatically
      const shouldPromptUser = await this.shouldPromptForRepair(config, repairNeeds);
      const autoRepairRecommended = this.shouldRecommendAutoRepair(config, repairNeeds);

      logger.info(LogCategories.MIGRATION, 'Startup image check completed', {
        needsRepair: repairNeeds.needsRepair,
        brokenCount: repairNeeds.brokenCount,
        shouldPromptUser,
        autoRepairRecommended
      });

      return {
        needsRepair: repairNeeds.needsRepair,
        needsLegacyMigration: false,
        repairInfo: repairNeeds,
        shouldPromptUser,
        autoRepairRecommended
      };

    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Startup image check failed', error);
      return {
        needsRepair: false,
        needsLegacyMigration: false,
        shouldPromptUser: false,
        autoRepairRecommended: false
      };
    }
  }

  /**
   * Run legacy migration first if needed
   */
  async runLegacyMigration(): Promise<boolean> {
    try {
      logger.info(LogCategories.MIGRATION, 'Running legacy migration');
      const summary = await this.legacyMigrationService.performDataMigration();
      
      // Update last repair date since legacy migration includes repair functionality
      await this.updateLastRepairDate();
      
      return summary.success;
    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Legacy migration failed', error);
      return false;
    }
  }

  /**
   * Run comprehensive repair
   */
  async runComprehensiveRepair(options?: {
    dryRun?: boolean;
    removeUnrecoverable?: boolean;
    silent?: boolean;
  }): Promise<boolean> {
    try {
      const { silent = false, ...repairOptions } = options || {};
      
      logger.info(LogCategories.MIGRATION, 'Running comprehensive repair', repairOptions);
      
      const summary = await this.repairService.performComprehensiveRepair(
        silent ? undefined : (progress) => {
          logger.info(LogCategories.MIGRATION, 'Repair progress', {
            phase: progress.phase,
            processed: progress.processedItems,
            total: progress.totalItems
          });
        },
        {
          dryRun: false,
          removeUnrecoverable: true,
          backupBeforeRepair: true,
          maxRecoveryAttempts: 5,
          ...repairOptions
        }
      );

      if (summary.success) {
        await this.updateLastRepairDate();
        await this.updateRepairConfig({ skipNextAutoRepair: false });
      }

      return summary.success;
    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Comprehensive repair failed', error);
      return false;
    }
  }

  /**
   * Get current repair configuration
   */
  private async getRepairConfig(): Promise<RepairScheduleConfig> {
    try {
      const configStr = await AsyncStorage.getItem('imageRepairConfig');
      if (configStr) {
        return JSON.parse(configStr);
      }
    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Failed to load repair config', error);
    }

    // Default configuration
    return {
      autoRepairEnabled: true,
      lastRepairDate: null,
      repairIntervalDays: 7, // Weekly automatic checks
      repairThreshold: 5, // Minimum 5 broken items to auto-trigger
      skipNextAutoRepair: false
    };
  }

  /**
   * Update repair configuration
   */
  async updateRepairConfig(updates: Partial<RepairScheduleConfig>): Promise<void> {
    try {
      const currentConfig = await this.getRepairConfig();
      const newConfig = { ...currentConfig, ...updates };
      await AsyncStorage.setItem('imageRepairConfig', JSON.stringify(newConfig));
      logger.info(LogCategories.MIGRATION, 'Repair config updated', updates);
    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Failed to update repair config', error);
    }
  }

  /**
   * Update last repair date
   */
  private async updateLastRepairDate(): Promise<void> {
    await this.updateRepairConfig({ 
      lastRepairDate: new Date().toISOString() 
    });
  }

  /**
   * Determine if we should prompt user for repair
   */
  private async shouldPromptForRepair(
    config: RepairScheduleConfig, 
    repairNeeds: { brokenCount: number; totalCount: number }
  ): Promise<boolean> {
    // Always prompt if user disabled auto repair
    if (!config.autoRepairEnabled) {
      return true;
    }

    // Always prompt if user requested to skip next auto repair
    if (config.skipNextAutoRepair) {
      return true;
    }

    // Always prompt if there are many broken items (>20% of wardrobe)
    const brokenPercentage = (repairNeeds.brokenCount / repairNeeds.totalCount) * 100;
    if (brokenPercentage > 20) {
      return true;
    }

    // Check if enough time has passed since last repair
    const daysSinceLastRepair = this.getDaysSinceLastRepair(config.lastRepairDate);
    const shouldAutoRepair = (
      daysSinceLastRepair >= config.repairIntervalDays &&
      repairNeeds.brokenCount >= config.repairThreshold
    );

    // If we can auto-repair, don't prompt
    return !shouldAutoRepair;
  }

  /**
   * Determine if we should recommend auto repair
   */
  private shouldRecommendAutoRepair(
    config: RepairScheduleConfig,
    repairNeeds: { brokenCount: number; totalCount: number }
  ): boolean {
    if (!config.autoRepairEnabled || config.skipNextAutoRepair) {
      return false;
    }

    const daysSinceLastRepair = this.getDaysSinceLastRepair(config.lastRepairDate);
    const brokenPercentage = (repairNeeds.brokenCount / repairNeeds.totalCount) * 100;

    return (
      daysSinceLastRepair >= config.repairIntervalDays &&
      repairNeeds.brokenCount >= config.repairThreshold &&
      brokenPercentage <= 20 // Don't auto-repair if too many items are broken
    );
  }

  /**
   * Get days since last repair
   */
  private getDaysSinceLastRepair(lastRepairDate: string | null): number {
    if (!lastRepairDate) return Infinity;
    
    const last = new Date(lastRepairDate);
    const now = new Date();
    return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Enable/disable automatic repair
   */
  async setAutoRepairEnabled(enabled: boolean): Promise<void> {
    await this.updateRepairConfig({ autoRepairEnabled: enabled });
    logger.info(LogCategories.MIGRATION, `Auto repair ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Skip next automatic repair (user choice)
   */
  async skipNextAutoRepair(): Promise<void> {
    await this.updateRepairConfig({ skipNextAutoRepair: true });
    logger.info(LogCategories.MIGRATION, 'Next auto repair will be skipped');
  }

  /**
   * Manual trigger for repair with user confirmation
   */
  async triggerManualRepair(): Promise<boolean> {
    try {
      const repairNeeds = await this.repairService.checkNeedsRepair();
      
      if (!repairNeeds.needsRepair) {
        logger.info(LogCategories.MIGRATION, 'No repair needed for manual trigger');
        return true;
      }

      // Show prompt to user
      const userConfirmed = await this.repairService.showRepairPrompt(repairNeeds);
      
      if (!userConfirmed) {
        logger.info(LogCategories.MIGRATION, 'User declined manual repair');
        return false;
      }

      // Run repair
      const success = await this.runComprehensiveRepair();
      
      if (success) {
        logger.info(LogCategories.MIGRATION, 'Manual repair completed successfully');
      }

      return success;
    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Manual repair trigger failed', error);
      return false;
    }
  }

  /**
   * Get repair statistics for settings/debug purposes
   */
  async getRepairStats(): Promise<{
    config: RepairScheduleConfig;
    lastRepairDaysAgo: number;
    currentStatus: { needsRepair: boolean; brokenCount: number; totalCount: number };
  }> {
    const config = await this.getRepairConfig();
    const daysSinceLastRepair = this.getDaysSinceLastRepair(config.lastRepairDate);
    const currentStatus = await this.repairService.checkNeedsRepair();

    return {
      config,
      lastRepairDaysAgo: daysSinceLastRepair === Infinity ? -1 : daysSinceLastRepair,
      currentStatus
    };
  }

  /**
   * Reset repair configuration to defaults
   */
  async resetRepairConfig(): Promise<void> {
    await AsyncStorage.removeItem('imageRepairConfig');
    logger.info(LogCategories.MIGRATION, 'Repair config reset to defaults');
  }
}

export default ImageRepairIntegration;