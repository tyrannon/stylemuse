import { useState, useEffect, useCallback } from 'react';
import { TierManager, UserTier, TierLimits, UsageStats } from '../utils/TierManager';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

export interface TierManagementState {
  userTier: UserTier;
  limits: TierLimits;
  usage: UsageStats;
  isLoading: boolean;
  error: string | null;
}

export interface TierManagementActions {
  refreshData: () => Promise<void>;
  checkAIGeneration: () => Promise<{ allowed: boolean; remaining: number; limit: number }>;
  checkWardrobeItem: (currentCount?: number) => Promise<{ allowed: boolean; remaining: number; limit: number }>;
  incrementAIUsage: () => Promise<void>;
  updateWardrobeCount: (count: number) => Promise<void>;
  updateOutfitCount: (count: number) => Promise<void>;
  upgradeTier: (newTier: UserTier) => Promise<void>;
  canUseFeature: (feature: keyof TierLimits) => boolean;
}

export const useTierManagement = (): TierManagementState & TierManagementActions => {
  const [state, setState] = useState<TierManagementState>({
    userTier: 'free',
    limits: {
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
    usage: {
      aiGenerationsThisMonth: 0,
      currentWardrobeItems: 0,
      currentSavedOutfits: 0,
      monthlyResetDate: new Date().toISOString(),
      lastUsageUpdate: new Date().toISOString(),
    },
    isLoading: true,
    error: null,
  });

  const refreshData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const [userTier, limits, usage] = await Promise.all([
        TierManager.getUserTier(),
        TierManager.getTierLimits(),
        TierManager.getUsageStats(),
      ]);

      setState(prev => ({
        ...prev,
        userTier,
        limits,
        usage,
        isLoading: false,
      }));

      logger.debug(LogCategories.MONETIZATION, 'Tier management data refreshed', {
        userTier,
        aiGenerationsUsed: usage.aiGenerationsThisMonth,
        wardrobeItems: usage.currentWardrobeItems,
      });
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to refresh tier data', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load tier information',
      }));
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const checkAIGeneration = useCallback(async () => {
    try {
      const result = await TierManager.canGenerateAI();
      logger.debug(LogCategories.MONETIZATION, 'AI generation check completed', result);
      return result;
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'AI generation check failed', error);
      return { allowed: false, remaining: 0, limit: 0 };
    }
  }, []);

  const checkWardrobeItem = useCallback(async (currentCount?: number) => {
    try {
      const result = await TierManager.canAddWardrobeItem(currentCount);
      logger.debug(LogCategories.MONETIZATION, 'Wardrobe item check completed', result);
      return result;
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Wardrobe item check failed', error);
      return { allowed: false, remaining: 0, limit: 0 };
    }
  }, []);

  const incrementAIUsage = useCallback(async () => {
    try {
      await TierManager.incrementAIGeneration();
      await refreshData(); // Refresh to get updated counts
      logger.info(LogCategories.MONETIZATION, 'AI usage incremented successfully');
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to increment AI usage', error);
    }
  }, [refreshData]);

  const updateWardrobeCount = useCallback(async (count: number) => {
    try {
      await TierManager.updateWardrobeCount(count);
      setState(prev => ({
        ...prev,
        usage: {
          ...prev.usage,
          currentWardrobeItems: count,
        },
      }));
      logger.debug(LogCategories.MONETIZATION, 'Wardrobe count updated via hook', { count });
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to update wardrobe count', error);
    }
  }, []);

  const updateOutfitCount = useCallback(async (count: number) => {
    try {
      await TierManager.updateOutfitCount(count);
      setState(prev => ({
        ...prev,
        usage: {
          ...prev.usage,
          currentSavedOutfits: count,
        },
      }));
      logger.debug(LogCategories.MONETIZATION, 'Outfit count updated via hook', { count });
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to update outfit count', error);
    }
  }, []);

  const upgradeTier = useCallback(async (newTier: UserTier) => {
    try {
      await TierManager.setUserTier(newTier);
      await refreshData(); // Refresh to get new limits
      logger.info(LogCategories.MONETIZATION, 'User tier upgraded successfully', { newTier });
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to upgrade tier', error);
      throw error;
    }
  }, [refreshData]);

  const canUseFeature = useCallback((feature: keyof TierLimits): boolean => {
    return state.limits[feature] as boolean;
  }, [state.limits]);

  return {
    ...state,
    refreshData,
    checkAIGeneration,
    checkWardrobeItem,
    incrementAIUsage,
    updateWardrobeCount,
    updateOutfitCount,
    upgradeTier,
    canUseFeature,
  };
};