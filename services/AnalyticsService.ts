import AsyncStorage from '@react-native-async-storage/async-storage';
import { WardrobeItem, LovedOutfit } from '../hooks/useWardrobeData';
import { GearSlots } from '../hooks/useOutfitGeneration';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

/**
 * Local-first analytics service for StyleMuse
 * Tracks wardrobe utilization, cost-per-wear, and outfit generation patterns
 */
export class AnalyticsService {
  private static readonly ANALYTICS_STORAGE_KEY = 'stylemuse_analytics_data';

  /**
   * Track when items are used in generated outfits
   */
  static async trackOutfitGeneration(
    gearSlots: GearSlots,
    outfitId: string,
    savedItems: WardrobeItem[]
  ): Promise<void> {
    try {
      logger.info(LogCategories.USER_ACTION, 'Tracking outfit generation analytics', {
        outfitId,
        itemCount: Object.values(gearSlots).filter(slot => slot.itemId).length
      });

      // Get all items used in this outfit
      const usedItemIds = Object.values(gearSlots)
        .map(slot => slot.itemId)
        .filter(id => id !== null) as string[];

      // Update usage tracking for each item
      for (const itemId of usedItemIds) {
        await this.updateItemUsageTracking(itemId, outfitId, savedItems);
      }

      // Track the outfit generation event
      await this.recordOutfitGenerationEvent(outfitId, usedItemIds);

      logger.info(LogCategories.ANALYTICS, 'Analytics tracking completed', {
        trackedItems: usedItemIds.length,
        outfitId
      });

    } catch (error) {
      logger.error(LogCategories.ANALYTICS, 'Failed to track outfit generation', error, {
        outfitId,
        gearSlotsCount: Object.keys(gearSlots).length
      });
    }
  }

  /**
   * Update individual item usage tracking
   */
  private static async updateItemUsageTracking(
    itemId: string,
    outfitId: string,
    savedItems: WardrobeItem[]
  ): Promise<void> {
    try {
      // Find the item in the wardrobe
      const itemIndex = savedItems.findIndex(item => 
        item.image === itemId || JSON.stringify(item).includes(itemId)
      );

      if (itemIndex === -1) {
        logger.warn(LogCategories.ANALYTICS, 'Item not found for usage tracking', { itemId });
        return;
      }

      // Update the item's usage tracking
      savedItems[itemIndex] = {
        ...savedItems[itemIndex],
        timesWornInOutfits: (savedItems[itemIndex].timesWornInOutfits || 0) + 1,
        lastUsedInOutfit: new Date(),
        outfitGenerationHistory: [
          ...(savedItems[itemIndex].outfitGenerationHistory || []),
          outfitId
        ].slice(-50) // Keep last 50 outfit generations
      };

      // Save the updated wardrobe
      await AsyncStorage.setItem('stylemuse_wardrobe_items', JSON.stringify(savedItems));

    } catch (error) {
      logger.error(LogCategories.ANALYTICS, 'Failed to update item usage tracking', error, {
        itemId,
        outfitId
      });
    }
  }

  /**
   * Record outfit generation event for pattern analysis
   */
  private static async recordOutfitGenerationEvent(
    outfitId: string,
    usedItemIds: string[]
  ): Promise<void> {
    try {
      const analyticsData = await this.getAnalyticsData();
      
      const generationEvent = {
        outfitId,
        timestamp: new Date().toISOString(),
        itemIds: usedItemIds,
        itemCount: usedItemIds.length,
        generationType: 'speed_dial' // Track different generation methods
      };

      analyticsData.outfitGenerations = [
        ...analyticsData.outfitGenerations,
        generationEvent
      ].slice(-1000); // Keep last 1000 generations

      await AsyncStorage.setItem(this.ANALYTICS_STORAGE_KEY, JSON.stringify(analyticsData));

    } catch (error) {
      logger.error(LogCategories.ANALYTICS, 'Failed to record outfit generation event', error);
    }
  }

  /**
   * Calculate wardrobe utilization metrics
   */
  static async getWardrobeUtilizationStats(savedItems: WardrobeItem[]): Promise<{
    totalItems: number;
    itemsUsedInOutfits: number;
    utilizationRate: number;
    averageUsagePerItem: number;
    mostUsedItems: Array<{ item: WardrobeItem; usage: number }>;
    leastUsedItems: Array<{ item: WardrobeItem; usage: number }>;
  }> {
    try {
      const totalItems = savedItems.length;
      const itemsWithUsage = savedItems.filter(item => (item.timesWornInOutfits || 0) > 0);
      const itemsUsedInOutfits = itemsWithUsage.length;
      const utilizationRate = totalItems > 0 ? (itemsUsedInOutfits / totalItems) * 100 : 0;
      
      const totalUsage = savedItems.reduce((sum, item) => sum + (item.timesWornInOutfits || 0), 0);
      const averageUsagePerItem = totalItems > 0 ? totalUsage / totalItems : 0;

      // Sort items by usage
      const sortedByUsage = savedItems
        .map(item => ({ item, usage: item.timesWornInOutfits || 0 }))
        .sort((a, b) => b.usage - a.usage);

      const mostUsedItems = sortedByUsage.slice(0, 10);
      const leastUsedItems = sortedByUsage.slice(-10).reverse();

      logger.info(LogCategories.ANALYTICS, 'Calculated wardrobe utilization stats', {
        totalItems,
        itemsUsedInOutfits,
        utilizationRate: Math.round(utilizationRate)
      });

      return {
        totalItems,
        itemsUsedInOutfits,
        utilizationRate,
        averageUsagePerItem,
        mostUsedItems,
        leastUsedItems
      };

    } catch (error) {
      logger.error(LogCategories.ANALYTICS, 'Failed to calculate utilization stats', error);
      return {
        totalItems: 0,
        itemsUsedInOutfits: 0,
        utilizationRate: 0,
        averageUsagePerItem: 0,
        mostUsedItems: [],
        leastUsedItems: []
      };
    }
  }

  /**
   * Calculate cost-per-wear analytics
   */
  static getCostPerWearAnalytics(savedItems: WardrobeItem[]): {
    itemsWithCostData: number;
    averageCostPerWear: number;
    bestValueItems: Array<{ item: WardrobeItem; costPerWear: number }>;
    expensiveUnusedItems: Array<{ item: WardrobeItem; daysUnused: number }>;
  } {
    try {
      const itemsWithCost = savedItems.filter(item => 
        item.purchasePrice && item.purchasePrice > 0
      );

      const costPerWearData = itemsWithCost.map(item => {
        const timesWorn = item.timesWornInOutfits || 0;
        const costPerWear = timesWorn > 0 ? (item.purchasePrice! / timesWorn) : item.purchasePrice!;
        
        const daysUnused = item.lastUsedInOutfit 
          ? Math.floor((new Date().getTime() - new Date(item.lastUsedInOutfit).getTime()) / (1000 * 60 * 60 * 24))
          : item.purchaseDate
            ? Math.floor((new Date().getTime() - new Date(item.purchaseDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        return { item, costPerWear, timesWorn, daysUnused };
      });

      const averageCostPerWear = costPerWearData.length > 0
        ? costPerWearData.reduce((sum, data) => sum + data.costPerWear, 0) / costPerWearData.length
        : 0;

      // Best value items (low cost per wear, worn multiple times)
      const bestValueItems = costPerWearData
        .filter(data => data.timesWorn > 0)
        .sort((a, b) => a.costPerWear - b.costPerWear)
        .slice(0, 10)
        .map(data => ({ item: data.item, costPerWear: data.costPerWear }));

      // Expensive unused items (high cost, rarely worn)
      const expensiveUnusedItems = costPerWearData
        .filter(data => data.item.purchasePrice! > 50 && data.timesWorn < 3)
        .sort((a, b) => b.daysUnused - a.daysUnused)
        .slice(0, 10)
        .map(data => ({ item: data.item, daysUnused: data.daysUnused }));

      logger.info(LogCategories.ANALYTICS, 'Calculated cost-per-wear analytics', {
        itemsWithCost: itemsWithCost.length,
        averageCostPerWear: Math.round(averageCostPerWear * 100) / 100
      });

      return {
        itemsWithCostData: itemsWithCost.length,
        averageCostPerWear,
        bestValueItems,
        expensiveUnusedItems
      };

    } catch (error) {
      logger.error(LogCategories.ANALYTICS, 'Failed to calculate cost-per-wear analytics', error);
      return {
        itemsWithCostData: 0,
        averageCostPerWear: 0,
        bestValueItems: [],
        expensiveUnusedItems: []
      };
    }
  }

  /**
   * Get or initialize analytics data
   */
  private static async getAnalyticsData(): Promise<{
    outfitGenerations: Array<{
      outfitId: string;
      timestamp: string;
      itemIds: string[];
      itemCount: number;
      generationType: string;
    }>;
  }> {
    try {
      const stored = await AsyncStorage.getItem(this.ANALYTICS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      logger.warn(LogCategories.ANALYTICS, 'Failed to load analytics data', error);
    }

    // Return default structure
    return {
      outfitGenerations: []
    };
  }

  /**
   * Get outfit generation patterns for dashboard
   */
  static async getOutfitGenerationPatterns(): Promise<{
    totalGenerations: number;
    generationsThisWeek: number;
    generationsThisMonth: number;
    averageItemsPerOutfit: number;
    mostActiveHours: Array<{ hour: number; count: number }>;
  }> {
    try {
      const analyticsData = await this.getAnalyticsData();
      const generations = analyticsData.outfitGenerations;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const generationsThisWeek = generations.filter(g => 
        new Date(g.timestamp) > weekAgo
      ).length;

      const generationsThisMonth = generations.filter(g => 
        new Date(g.timestamp) > monthAgo
      ).length;

      const averageItemsPerOutfit = generations.length > 0
        ? generations.reduce((sum, g) => sum + g.itemCount, 0) / generations.length
        : 0;

      // Analyze most active hours
      const hourCounts: Record<number, number> = {};
      generations.forEach(g => {
        const hour = new Date(g.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const mostActiveHours = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalGenerations: generations.length,
        generationsThisWeek,
        generationsThisMonth,
        averageItemsPerOutfit,
        mostActiveHours
      };

    } catch (error) {
      logger.error(LogCategories.ANALYTICS, 'Failed to get generation patterns', error);
      return {
        totalGenerations: 0,
        generationsThisWeek: 0,
        generationsThisMonth: 0,
        averageItemsPerOutfit: 0,
        mostActiveHours: []
      };
    }
  }
}