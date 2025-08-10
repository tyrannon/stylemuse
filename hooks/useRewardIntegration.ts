import { useCallback } from 'react';
import { useWardrobeData, WardrobeItem } from './useWardrobeData';
import { useDailyRewards } from './useDailyRewards';
import { wardrobeRewardService } from '../services/WardrobeRewardService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

interface RewardWardrobeItem extends WardrobeItem {
  rewardType: 'daily_login' | 'streak_milestone' | 'achievement' | 'special_event';
  rewardRarity: string;
  rewardDate: Date;
  isRewardItem: true;
}

export const useRewardIntegration = (userId: string) => {
  const {
    savedItems,
    setSavedItems,
    STORAGE_KEYS,
    loadWardrobeData,
  } = useWardrobeData();

  const dailyRewards = useDailyRewards(userId);

  // Add reward wardrobe items to user's wardrobe
  const addRewardItemsToWardrobe = useCallback(async (
    rewardItems: RewardWardrobeItem[]
  ): Promise<{ success: boolean; addedCount: number }> => {
    try {
      if (!rewardItems || rewardItems.length === 0) {
        return { success: true, addedCount: 0 };
      }

      logger.info(LogCategories.GAMIFICATION, 'Adding reward items to wardrobe', {
        itemCount: rewardItems.length,
        rewardTypes: rewardItems.map(item => item.rewardType),
      });

      // Validate and prepare items for wardrobe
      const validatedItems: WardrobeItem[] = rewardItems.map(rewardItem => ({
        image: rewardItem.image,
        title: rewardItem.title || 'Reward Item',
        description: rewardItem.description || 'Item received as a reward',
        tags: [...(rewardItem.tags || []), 'reward-item', rewardItem.rewardType],
        color: rewardItem.color,
        material: rewardItem.material,
        style: rewardItem.style,
        fit: rewardItem.fit,
        category: rewardItem.category,
        isNew: true, // Mark as new so user sees the red dot

        // Laundry tracking - reward items start clean
        laundryStatus: 'clean',
        laundryHistory: [{
          status: 'clean',
          changedAt: new Date(),
          notes: `Received as ${rewardItem.rewardType} reward`
        }],
        timesWashed: 0,
        needsSpecialCare: rewardItem.rewardRarity === 'legendary' || rewardItem.rewardRarity === 'mythic',

        // Cost tracking - reward items are free
        purchasePrice: 0,
        purchaseDate: new Date(),
        purchaseCurrency: 'reward',

        // Usage tracking
        timesWornInOutfits: 0,
        lastUsedInOutfit: undefined,
        outfitGenerationHistory: [],
      }));

      // Add items to existing wardrobe
      const updatedItems = [...savedItems, ...validatedItems];
      setSavedItems(updatedItems);

      // Save to storage
      await AsyncStorage.setItem(STORAGE_KEYS.WARDROBE_ITEMS, JSON.stringify(updatedItems));

      // Provide haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      logger.info(LogCategories.GAMIFICATION, 'Reward items added to wardrobe successfully', {
        addedCount: validatedItems.length,
        newTotalCount: updatedItems.length,
      });

      return { success: true, addedCount: validatedItems.length };

    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to add reward items to wardrobe', error as Error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return { success: false, addedCount: 0 };
    }
  }, [savedItems, setSavedItems, STORAGE_KEYS.WARDROBE_ITEMS]);

  // Generate and add milestone reward items
  const generateMilestoneReward = useCallback(async (
    streakDay: number
  ): Promise<{ success: boolean; items: RewardWardrobeItem[] }> => {
    try {
      const rewardItem = await wardrobeRewardService.generateMilestoneReward(streakDay);
      
      logger.info(LogCategories.GAMIFICATION, 'Generated milestone reward', {
        streakDay,
        rarity: rewardItem.rewardRarity,
        itemTitle: rewardItem.title,
      });

      return { success: true, items: [rewardItem] };
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to generate milestone reward', error as Error);
      return { success: false, items: [] };
    }
  }, []);

  // Generate and add achievement reward items
  const generateAchievementReward = useCallback(async (
    achievementId: string,
    rarity?: string
  ): Promise<{ success: boolean; items: RewardWardrobeItem[] }> => {
    try {
      const rewardItem = await wardrobeRewardService.generateRewardItem(
        'achievement',
        { rarity: rarity as any }
      );

      logger.info(LogCategories.GAMIFICATION, 'Generated achievement reward', {
        achievementId,
        rarity: rewardItem.rewardRarity,
        itemTitle: rewardItem.title,
      });

      return { success: true, items: [rewardItem] };
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to generate achievement reward', error as Error);
      return { success: false, items: [] };
    }
  }, []);

  // Generate pack-like rewards (multiple items)
  const generateRewardPack = useCallback(async (
    packType: 'small' | 'medium' | 'large',
    rewardSource: 'daily_login' | 'streak_milestone' | 'achievement' | 'special_event'
  ): Promise<{ success: boolean; items: RewardWardrobeItem[] }> => {
    try {
      const packSizes = {
        small: { count: 1, guaranteedRarity: undefined },
        medium: { count: 2, guaranteedRarity: 'uncommon' },
        large: { count: 3, guaranteedRarity: 'rare' },
      };

      const packConfig = packSizes[packType];
      const rewardItems = await wardrobeRewardService.generateRewardPack(
        packConfig.count,
        rewardSource,
        packConfig.guaranteedRarity as any
      );

      logger.info(LogCategories.GAMIFICATION, 'Generated reward pack', {
        packType,
        itemCount: rewardItems.length,
        rarities: rewardItems.map(item => item.rewardRarity),
      });

      return { success: true, items: rewardItems };
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to generate reward pack', error as Error);
      return { success: false, items: [] };
    }
  }, []);

  // Get reward statistics
  const getRewardStats = useCallback(() => {
    const rewardItems = savedItems.filter(item => 
      item.tags?.includes('reward-item')
    );

    const stats = {
      totalRewardItems: rewardItems.length,
      dailyLoginRewards: rewardItems.filter(item => 
        item.tags?.includes('daily_login')
      ).length,
      milestoneRewards: rewardItems.filter(item => 
        item.tags?.includes('streak_milestone')
      ).length,
      achievementRewards: rewardItems.filter(item => 
        item.tags?.includes('achievement')
      ).length,
      mostRecentReward: rewardItems.length > 0 
        ? rewardItems[rewardItems.length - 1] 
        : null,
    };

    return stats;
  }, [savedItems]);

  // Check if user has any unclaimed rewards
  const hasUnclaimedRewards = useCallback(() => {
    return dailyRewards.canClaimRewards;
  }, [dailyRewards.canClaimRewards]);

  return {
    // Daily rewards integration
    ...dailyRewards,

    // Wardrobe integration functions
    addRewardItemsToWardrobe,
    generateMilestoneReward,
    generateAchievementReward,
    generateRewardPack,

    // Statistics and utilities
    getRewardStats,
    hasUnclaimedRewards,

    // Direct access to wardrobe functions that might be needed
    loadWardrobeData,
  };
};