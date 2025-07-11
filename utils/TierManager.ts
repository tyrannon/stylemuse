import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './DebugLogger';
import { LogCategories } from '../constants/LogCategories';

export type UserTier = 'free' | 'pro' | 'elite';

export interface TierLimits {
  aiGenerationsPerMonth: number;
  maxWardrobeItems: number;
  maxSavedOutfits: number;
  hasAdvancedAnalytics: boolean;
  hasWeatherRecommendations: boolean;
  hasSeasonalUpdates: boolean;
  hasTrendForecasts: boolean;
  hasApiAccess: boolean;
  hasVirtualStylist: boolean;
  hasPrioritySupport: boolean;
}

export interface UsageStats {
  aiGenerationsThisMonth: number;
  currentWardrobeItems: number;
  currentSavedOutfits: number;
  monthlyResetDate: string;
  lastUsageUpdate: string;
}

export class TierManager {
  private static readonly TIER_LIMITS: Record<UserTier, TierLimits> = {
    free: {
      aiGenerationsPerMonth: 5,
      maxWardrobeItems: 50,
      maxSavedOutfits: 3,
      hasAdvancedAnalytics: false,
      hasWeatherRecommendations: false,
      hasSeasonalUpdates: false,
      hasTrendForecasts: false,
      hasApiAccess: false,
      hasVirtualStylist: false,
      hasPrioritySupport: false,
    },
    pro: {
      aiGenerationsPerMonth: -1, // Unlimited
      maxWardrobeItems: -1, // Unlimited
      maxSavedOutfits: -1, // Unlimited
      hasAdvancedAnalytics: true,
      hasWeatherRecommendations: true,
      hasSeasonalUpdates: true,
      hasTrendForecasts: false,
      hasApiAccess: false,
      hasVirtualStylist: false,
      hasPrioritySupport: true,
    },
    elite: {
      aiGenerationsPerMonth: -1, // Unlimited
      maxWardrobeItems: -1, // Unlimited
      maxSavedOutfits: -1, // Unlimited
      hasAdvancedAnalytics: true,
      hasWeatherRecommendations: true,
      hasSeasonalUpdates: true,
      hasTrendForecasts: true,
      hasApiAccess: true,
      hasVirtualStylist: true,
      hasPrioritySupport: true,
    },
  };

  static async getUserTier(): Promise<UserTier> {
    try {
      const tier = await AsyncStorage.getItem('userTier');
      const validTier = tier as UserTier;
      
      // Validate tier value
      if (!tier || !['free', 'pro', 'elite'].includes(validTier)) {
        logger.warn(LogCategories.MONETIZATION, 'Invalid or missing user tier, defaulting to free', { tier });
        await this.setUserTier('free');
        return 'free';
      }
      
      return validTier;
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to get user tier', error);
      return 'free'; // Default to free on error
    }
  }

  static async setUserTier(tier: UserTier): Promise<void> {
    try {
      await AsyncStorage.setItem('userTier', tier);
      logger.info(LogCategories.MONETIZATION, 'User tier updated', { tier });
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to set user tier', error);
      throw error;
    }
  }

  static async getTierLimits(tier?: UserTier): Promise<TierLimits> {
    const userTier = tier || await this.getUserTier();
    return this.TIER_LIMITS[userTier];
  }

  static async getUsageStats(): Promise<UsageStats> {
    try {
      const statsJson = await AsyncStorage.getItem('usageStats');
      const now = new Date();
      
      if (!statsJson) {
        // Initialize usage stats
        const initialStats: UsageStats = {
          aiGenerationsThisMonth: 0,
          currentWardrobeItems: 0,
          currentSavedOutfits: 0,
          monthlyResetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
          lastUsageUpdate: now.toISOString(),
        };
        
        await this.updateUsageStats(initialStats);
        return initialStats;
      }
      
      const stats: UsageStats = JSON.parse(statsJson);
      
      // Check if we need to reset monthly counters
      const resetDate = new Date(stats.monthlyResetDate);
      if (now >= resetDate) {
        stats.aiGenerationsThisMonth = 0;
        stats.monthlyResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
        await this.updateUsageStats(stats);
        
        logger.info(LogCategories.MONETIZATION, 'Monthly usage stats reset', {
          newResetDate: stats.monthlyResetDate
        });
      }
      
      return stats;
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to get usage stats', error);
      throw error;
    }
  }

  static async updateUsageStats(stats: Partial<UsageStats>): Promise<void> {
    try {
      // Get current stats without triggering reset logic to avoid infinite recursion
      const statsJson = await AsyncStorage.getItem('usageStats');
      const currentStats: UsageStats = statsJson ? JSON.parse(statsJson) : {
        aiGenerationsThisMonth: 0,
        currentWardrobeItems: 0,
        currentSavedOutfits: 0,
        monthlyResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
        lastUsageUpdate: new Date().toISOString(),
      };
      
      const updatedStats = {
        ...currentStats,
        ...stats,
        lastUsageUpdate: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('usageStats', JSON.stringify(updatedStats));
      logger.debug(LogCategories.MONETIZATION, 'Usage stats updated', updatedStats);
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to update usage stats', error);
      throw error;
    }
  }

  static async canUseFeature(feature: keyof TierLimits): Promise<boolean> {
    try {
      const limits = await this.getTierLimits();
      return limits[feature] as boolean;
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to check feature access', error);
      return false; // Deny access on error
    }
  }

  static async canGenerateAI(): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    try {
      const [limits, stats] = await Promise.all([
        this.getTierLimits(),
        this.getUsageStats()
      ]);
      
      if (limits.aiGenerationsPerMonth === -1) {
        // Unlimited
        return { allowed: true, remaining: -1, limit: -1 };
      }
      
      const remaining = Math.max(0, limits.aiGenerationsPerMonth - stats.aiGenerationsThisMonth);
      const allowed = remaining > 0;
      
      logger.debug(LogCategories.MONETIZATION, 'AI generation check', {
        allowed,
        remaining,
        limit: limits.aiGenerationsPerMonth,
        used: stats.aiGenerationsThisMonth
      });
      
      return { allowed, remaining, limit: limits.aiGenerationsPerMonth };
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to check AI generation limits', error);
      return { allowed: false, remaining: 0, limit: 0 };
    }
  }

  static async canAddWardrobeItem(currentCount?: number): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    try {
      const limits = await this.getTierLimits();
      
      if (limits.maxWardrobeItems === -1) {
        // Unlimited
        return { allowed: true, remaining: -1, limit: -1 };
      }
      
      // If currentCount not provided, get from stats
      const count = currentCount !== undefined ? currentCount : (await this.getUsageStats()).currentWardrobeItems;
      
      const remaining = Math.max(0, limits.maxWardrobeItems - count);
      const allowed = remaining > 0;
      
      logger.debug(LogCategories.MONETIZATION, 'Wardrobe item check', {
        allowed,
        remaining,
        limit: limits.maxWardrobeItems,
        current: count
      });
      
      return { allowed, remaining, limit: limits.maxWardrobeItems };
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to check wardrobe limits', error);
      return { allowed: false, remaining: 0, limit: 0 };
    }
  }

  static async incrementAIGeneration(): Promise<void> {
    try {
      const stats = await this.getUsageStats();
      await this.updateUsageStats({
        aiGenerationsThisMonth: stats.aiGenerationsThisMonth + 1
      });
      
      logger.info(LogCategories.MONETIZATION, 'AI generation incremented', {
        newCount: stats.aiGenerationsThisMonth + 1
      });
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to increment AI generation', error);
    }
  }

  static async updateWardrobeCount(count: number): Promise<void> {
    try {
      await this.updateUsageStats({
        currentWardrobeItems: count
      });
      
      logger.debug(LogCategories.MONETIZATION, 'Wardrobe count updated', { count });
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to update wardrobe count', error);
    }
  }

  static async updateOutfitCount(count: number): Promise<void> {
    try {
      await this.updateUsageStats({
        currentSavedOutfits: count
      });
      
      logger.debug(LogCategories.MONETIZATION, 'Outfit count updated', { count });
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to update outfit count', error);
    }
  }

  static getTierDisplayName(tier: UserTier): string {
    switch (tier) {
      case 'free':
        return 'StyleMuse Explorer';
      case 'pro':
        return 'StyleMuse Pro';
      case 'elite':
        return 'StyleMuse Elite';
      default:
        return 'StyleMuse Explorer';
    }
  }

  static getTierColor(tier: UserTier): string {
    switch (tier) {
      case 'free':
        return '#6B7280'; // Gray
      case 'pro':
        return '#3B82F6'; // Blue
      case 'elite':
        return '#EF4444'; // Red
      default:
        return '#6B7280';
    }
  }

  // Backward compatibility - preserve existing functionality
  static async shouldShowUpgrade(): Promise<boolean> {
    try {
      const tier = await this.getUserTier();
      return tier === 'free';
    } catch (error) {
      return false;
    }
  }
}