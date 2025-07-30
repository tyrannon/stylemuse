import { Alert } from 'react-native';
import { ImageRepairIntegration } from '../services/ImageRepairIntegration';
import { BrokenImageRepairService } from '../services/BrokenImageRepairService';
import { logger } from './DebugLogger';
import { LogCategories } from '../constants/LogCategories';

export class ManualImageRepairTrigger {
  private static instance: ManualImageRepairTrigger;
  private repairIntegration = ImageRepairIntegration.getInstance();
  private repairService = BrokenImageRepairService.getInstance();

  private constructor() {}

  static getInstance(): ManualImageRepairTrigger {
    if (!ManualImageRepairTrigger.instance) {
      ManualImageRepairTrigger.instance = new ManualImageRepairTrigger();
    }
    return ManualImageRepairTrigger.instance;
  }

  /**
   * Show manual repair menu with options
   */
  async showRepairMenu(): Promise<void> {
    try {
      // First check if repair is needed
      const repairStats = await this.repairIntegration.getRepairStats();
      const { currentStatus, config, lastRepairDaysAgo } = repairStats;

      if (!currentStatus.needsRepair) {
        Alert.alert(
          'Image Health Check',
          `✅ All ${currentStatus.totalCount} wardrobe images are healthy!\n\n` +
          `Last repair: ${lastRepairDaysAgo === -1 ? 'Never' : `${lastRepairDaysAgo} days ago`}\n` +
          `Auto repair: ${config.autoRepairEnabled ? 'Enabled' : 'Disabled'}`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Show repair options
      Alert.alert(
        'Image Repair Options',
        `Found ${currentStatus.brokenCount} items with image issues out of ${currentStatus.totalCount} total items.\n\n` +
        `Last repair: ${lastRepairDaysAgo === -1 ? 'Never' : `${lastRepairDaysAgo} days ago`}`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Preview Changes',
            onPress: () => this.runDryRunRepair()
          },
          {
            text: 'Repair Now',
            onPress: () => this.runFullRepair()
          },
          {
            text: 'Settings',
            onPress: () => this.showRepairSettings()
          }
        ]
      );
    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Failed to show repair menu', error);
      Alert.alert('Error', 'Failed to check repair status. Please try again.');
    }
  }

  /**
   * Run dry run repair (preview only)
   */
  private async runDryRunRepair(): Promise<void> {
    try {
      logger.info(LogCategories.MIGRATION, 'Starting manual dry run repair');
      
      Alert.alert(
        'Preview Mode',
        'Running in preview mode - no changes will be made to your wardrobe.',
        [{ text: 'Continue', onPress: () => this.executeRepair(true) }]
      );
    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Failed to start dry run repair', error);
      Alert.alert('Error', 'Failed to start preview. Please try again.');
    }
  }

  /**
   * Run full repair
   */
  private async runFullRepair(): Promise<void> {
    try {
      logger.info(LogCategories.MIGRATION, 'Starting manual full repair');
      
      Alert.alert(
        'Confirm Repair',
        'This will:\n• Create a backup of your wardrobe\n• Attempt to recover broken images\n• Clean up unrecoverable references\n• Optimize image storage\n\nContinue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Repair', onPress: () => this.executeRepair(false) }
        ]
      );
    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Failed to start full repair', error);
      Alert.alert('Error', 'Failed to start repair. Please try again.');
    }
  }

  /**
   * Execute the repair with progress tracking
   */
  private async executeRepair(dryRun: boolean): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Show initial progress
      const progressAlert = Alert.alert(
        dryRun ? 'Previewing Changes...' : 'Repairing Images...',
        'Initializing...\n\n⏳ Please wait...',
        [],
        { cancelable: false }
      );

      const summary = await this.repairService.performComprehensiveRepair(
        (progress) => {
          // Update progress in console (Alert can't be updated dynamically)
          logger.info(LogCategories.MIGRATION, 'Repair progress', {
            phase: progress.phase,
            processed: progress.processedItems,
            total: progress.totalItems,
            recovered: progress.recoveredItems,
            failed: progress.failedItems
          });
        },
        {
          dryRun,
          removeUnrecoverable: !dryRun,
          backupBeforeRepair: !dryRun,
          maxRecoveryAttempts: 5
        }
      );

      const timeTaken = Date.now() - startTime;
      
      // Show results
      const resultMessage = dryRun 
        ? this.formatDryRunResults(summary, timeTaken)
        : this.formatRepairResults(summary, timeTaken);

      Alert.alert(
        dryRun ? 'Preview Results' : 'Repair Results',
        resultMessage,
        [
          ...(dryRun ? [{
            text: 'Run Repair',
            onPress: () => this.executeRepair(false)
          }] : []),
          { text: 'OK' }
        ]
      );

    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Manual repair execution failed', error);
      Alert.alert(
        'Repair Failed',
        `An error occurred during ${dryRun ? 'preview' : 'repair'}:\n\n${error}\n\nPlease try again or contact support.`,
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Format dry run results for display
   */
  private formatDryRunResults(summary: any, timeTaken: number): string {
    const { totalItems, brokenItems, recoveredItems, failedItems, analytics } = summary;
    
    return `📊 Analysis completed in ${(timeTaken / 1000).toFixed(1)}s\n\n` +
           `📁 Total items: ${totalItems}\n` +
           `⚠️ Items with issues: ${brokenItems}\n` +
           `✅ Recoverable: ${recoveredItems}\n` +
           `❌ Unrecoverable: ${failedItems}\n\n` +
           `🔧 Recovery rate: ${brokenItems > 0 ? Math.round((recoveredItems / brokenItems) * 100) : 0}%\n\n` +
           `No changes were made in preview mode.`;
  }

  /**
   * Format repair results for display
   */
  private formatRepairResults(summary: any, timeTaken: number): string {
    const { success, totalItems, recoveredItems, removedItems, failedItems, analytics } = summary;
    
    const successRate = Math.round((recoveredItems / Math.max(recoveredItems + failedItems, 1)) * 100);
    
    return success 
      ? `🎉 Repair completed successfully in ${(timeTaken / 1000).toFixed(1)}s!\n\n` +
        `📁 Total items: ${totalItems}\n` +
        `✅ Recovered: ${recoveredItems}\n` +
        `🧹 Cleaned up: ${removedItems}\n` +
        `⚡ Throughput: ${analytics.throughputPerSecond} items/sec\n\n` +
        `Your wardrobe is now optimized and protected!`
      : `⚠️ Repair completed with issues in ${(timeTaken / 1000).toFixed(1)}s\n\n` +
        `📁 Total items: ${totalItems}\n` +
        `✅ Recovered: ${recoveredItems}\n` +
        `🧹 Cleaned up: ${removedItems}\n` +
        `❌ Still need attention: ${failedItems}\n` +
        `📈 Success rate: ${successRate}%\n\n` +
        `Most items were recovered. Review failed items manually.`;
  }

  /**
   * Show repair settings menu
   */
  private async showRepairSettings(): Promise<void> {
    try {
      const stats = await this.repairIntegration.getRepairStats();
      const { config } = stats;

      Alert.alert(
        'Repair Settings',
        `Current Configuration:\n\n` +
        `🔄 Auto repair: ${config.autoRepairEnabled ? 'Enabled' : 'Disabled'}\n` +
        `📅 Check interval: ${config.repairIntervalDays} days\n` +
        `🎯 Trigger threshold: ${config.repairThreshold} broken items\n` +
        `⏭️ Skip next auto: ${config.skipNextAutoRepair ? 'Yes' : 'No'}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: config.autoRepairEnabled ? 'Disable Auto' : 'Enable Auto',
            onPress: () => this.toggleAutoRepair()
          },
          {
            text: 'Skip Next Auto',
            onPress: () => this.skipNextAutoRepair()
          },
          {
            text: 'Reset Settings',
            onPress: () => this.resetSettings()
          }
        ]
      );
    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Failed to show repair settings', error);
      Alert.alert('Error', 'Failed to load settings. Please try again.');
    }
  }

  /**
   * Toggle auto repair setting
   */
  private async toggleAutoRepair(): Promise<void> {
    try {
      const stats = await this.repairIntegration.getRepairStats();
      const newState = !stats.config.autoRepairEnabled;
      
      await this.repairIntegration.setAutoRepairEnabled(newState);
      
      Alert.alert(
        'Setting Updated',
        `Auto repair ${newState ? 'enabled' : 'disabled'}.\n\n` +
        `${newState 
          ? 'The app will automatically check and repair images weekly.' 
          : 'You will need to run repairs manually.'
        }`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Failed to toggle auto repair', error);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  }

  /**
   * Skip next auto repair
   */
  private async skipNextAutoRepair(): Promise<void> {
    try {
      await this.repairIntegration.skipNextAutoRepair();
      
      Alert.alert(
        'Setting Updated',
        'The next automatic repair will be skipped. You can still run manual repairs anytime.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Failed to skip next auto repair', error);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  }

  /**
   * Reset settings to defaults
   */
  private async resetSettings(): Promise<void> {
    try {
      Alert.alert(
        'Confirm Reset',
        'Reset all repair settings to defaults?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset',
            onPress: async () => {
              await this.repairIntegration.resetRepairConfig();
              Alert.alert(
                'Settings Reset',
                'All repair settings have been reset to defaults:\n\n• Auto repair: Enabled\n• Check interval: 7 days\n• Trigger threshold: 5 items',
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Failed to reset settings', error);
      Alert.alert('Error', 'Failed to reset settings. Please try again.');
    }
  }

  /**
   * Quick health check - can be used in debug menus
   */
  async quickHealthCheck(): Promise<string> {
    try {
      const stats = await this.repairIntegration.getRepairStats();
      const { currentStatus, lastRepairDaysAgo } = stats;
      
      return `Image Health: ${currentStatus.needsRepair ? '⚠️ Issues Found' : '✅ Healthy'}\n` +
             `Total items: ${currentStatus.totalCount}\n` +
             `Broken items: ${currentStatus.brokenCount}\n` +
             `Last repair: ${lastRepairDaysAgo === -1 ? 'Never' : `${lastRepairDaysAgo} days ago`}`;
    } catch (error) {
      return `❌ Health check failed: ${error}`;
    }
  }

  /**
   * Export repair analytics for debugging
   */
  async exportRepairAnalytics(): Promise<any> {
    try {
      const stats = await this.repairIntegration.getRepairStats();
      return {
        timestamp: new Date().toISOString(),
        ...stats,
        systemInfo: {
          platform: 'react-native',
          version: '1.0.0' // You might want to import this from package.json
        }
      };
    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Failed to export analytics', error);
      return null;
    }
  }
}

export default ManualImageRepairTrigger;