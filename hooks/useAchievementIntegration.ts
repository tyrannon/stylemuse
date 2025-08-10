import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { achievementService, AchievementTracker, Achievement } from '../services/AchievementService';
import { wardrobeRewardService } from '../services/WardrobeRewardService';
import { useRewardIntegration } from './useRewardIntegration';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import * as Haptics from 'expo-haptics';

interface AchievementUnlockResult {
  unlocked: boolean;
  achievement?: Achievement;
  rewards?: {
    coins: number;
    gems: number;
    wardrobeItems: any[];
    specialRewards: string[];
  };
}

export const useAchievementIntegration = (
  userId: string,
  wardrobeItemCount: number = 0
) => {
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [showAchievementNotification, setShowAchievementNotification] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Achievement | null>(null);
  
  const rewardIntegration = useRewardIntegration(userId);

  // Auto-check achievements based on wardrobe size changes
  useEffect(() => {
    if (wardrobeItemCount > 0) {
      checkWardrobeAchievements();
    }
  }, [wardrobeItemCount]);

  // Check wardrobe-related achievements
  const checkWardrobeAchievements = useCallback(async () => {
    try {
      const results = await Promise.all([
        AchievementTracker.itemsUploaded(userId, wardrobeItemCount),
        wardrobeItemCount === 1 ? AchievementTracker.itemUploaded(userId) : Promise.resolve({ unlocked: false }),
      ]);

      const unlockedAchievements = results.filter(result => result?.unlocked);
      if (unlockedAchievements.length > 0) {
        await handleAchievementUnlocks(unlockedAchievements);
      }
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to check wardrobe achievements', error);
    }
  }, [userId, wardrobeItemCount]);

  // Track outfit creation achievements
  const trackOutfitCreation = useCallback(async () => {
    try {
      const currentTime = new Date().getHours();
      const isNightTime = currentTime >= 22 || currentTime <= 6; // 10 PM - 6 AM
      
      const result = await AchievementTracker.outfitCreated(userId, isNightTime);
      if (result?.unlocked) {
        await handleAchievementUnlocks([result]);
      }
      
      logger.info(LogCategories.GAMIFICATION, 'Outfit creation tracked for achievements', {
        userId,
        isNightTime,
        unlocked: result?.unlocked || false,
      });
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to track outfit creation achievement', error);
    }
  }, [userId]);

  // Track login streak achievements  
  const trackLoginStreak = useCallback(async (streakDays: number) => {
    try {
      const result = await AchievementTracker.loginStreak(userId, streakDays);
      if (result?.unlocked) {
        await handleAchievementUnlocks([result]);
      }
      
      logger.info(LogCategories.GAMIFICATION, 'Login streak tracked for achievements', {
        userId,
        streakDays,
        unlocked: result?.unlocked || false,
      });
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to track login streak achievement', error);
    }
  }, [userId]);

  // Track weather outfit usage
  const trackWeatherOutfitUsage = useCallback(async () => {
    try {
      const result = await AchievementTracker.weatherOutfitUsed(userId);
      if (result?.unlocked) {
        await handleAchievementUnlocks([result]);
      }
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to track weather outfit achievement', error);
    }
  }, [userId]);

  // Track color usage for color master achievement
  const trackColorUsage = useCallback(async () => {
    try {
      const result = await AchievementTracker.colorUsed(userId);
      if (result?.unlocked) {
        await handleAchievementUnlocks([result]);
      }
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to track color usage achievement', error);
    }
  }, [userId]);

  // Handle multiple achievement unlocks
  const handleAchievementUnlocks = useCallback(async (results: AchievementUnlockResult[]) => {
    try {
      for (const result of results) {
        if (result.unlocked && result.achievement && result.rewards) {
          // Add wardrobe rewards if any
          if (result.rewards.wardrobeItems && result.rewards.wardrobeItems.length > 0) {
            await rewardIntegration.addRewardItemsToWardrobe(result.rewards.wardrobeItems);
          }

          // Show achievement notification
          setCurrentNotification(result.achievement);
          setShowAchievementNotification(true);
          
          // Add to recent achievements
          setRecentAchievements(prev => [result.achievement!, ...prev.slice(0, 4)]); // Keep last 5

          // Haptic feedback
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          logger.info(LogCategories.GAMIFICATION, 'Achievement rewards distributed', {
            userId,
            achievementId: result.achievement.id,
            achievementName: result.achievement.name,
            coinsAwarded: result.rewards.coins,
            gemsAwarded: result.rewards.gems,
            wardrobeItemsAwarded: result.rewards.wardrobeItems.length,
          });
        }
      }
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to handle achievement unlocks', error);
    }
  }, [rewardIntegration, userId]);

  // Show achievement details alert
  const showAchievementAlert = useCallback((achievement: Achievement) => {
    let rewardText = '';
    if (achievement.rewards.coins) {
      rewardText += `+${achievement.rewards.coins} Style Coins\n`;
    }
    if (achievement.rewards.gems) {
      rewardText += `+${achievement.rewards.gems} Fashion Gems\n`;
    }
    if (achievement.rewards.wardrobeItems) {
      rewardText += `+${achievement.rewards.wardrobeItems.count} ${achievement.rewards.wardrobeItems.rarity} wardrobe item(s)\n`;
    }
    if (achievement.rewards.specialReward) {
      rewardText += `Special Reward: ${achievement.rewards.specialReward}\n`;
    }

    Alert.alert(
      `🏆 Achievement Unlocked!`,
      `${achievement.name}\n\n${achievement.description}\n\nRewards:\n${rewardText}`,
      [
        { text: 'Amazing!', style: 'default' }
      ]
    );
  }, []);

  // Dismiss achievement notification
  const dismissAchievementNotification = useCallback(() => {
    setShowAchievementNotification(false);
    setCurrentNotification(null);
  }, []);

  // Force unlock achievement (for testing)
  const forceUnlockAchievement = useCallback(async (achievementId: string) => {
    try {
      const result = await achievementService.forceUnlockAchievement(userId, achievementId);
      if (result.unlocked) {
        await handleAchievementUnlocks([result]);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to force unlock achievement', error);
      return false;
    }
  }, [userId, handleAchievementUnlocks]);

  // Get achievement progress
  const getAchievementProgress = useCallback(async () => {
    try {
      return await achievementService.getProgress(userId);
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to get achievement progress', error);
      return null;
    }
  }, [userId]);

  // Get achievement statistics
  const getAchievementStats = useCallback(async () => {
    try {
      return await achievementService.getAchievementStats(userId);
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to get achievement stats', error);
      return null;
    }
  }, [userId]);

  // Get achievements by category
  const getAchievementsByCategory = useCallback(async (category: string) => {
    try {
      return await achievementService.getAchievementsByCategory(userId, category);
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to get achievements by category', error);
      return [];
    }
  }, [userId]);

  return {
    // Tracking functions
    trackOutfitCreation,
    trackLoginStreak,
    trackWeatherOutfitUsage,
    trackColorUsage,
    checkWardrobeAchievements,

    // Achievement state
    recentAchievements,
    showAchievementNotification,
    currentNotification,

    // UI functions
    showAchievementAlert,
    dismissAchievementNotification,

    // Data functions
    getAchievementProgress,
    getAchievementStats,
    getAchievementsByCategory,

    // Testing functions
    forceUnlockAchievement,

    // Direct reward integration access
    ...rewardIntegration,
  };
};

// High-level integration functions for easy use throughout the app
export const IntegratedAchievements = {
  // Call when user uploads wardrobe items
  onWardrobeItemsAdded: async (userId: string, itemCount: number) => {
    await AchievementTracker.itemsUploaded(userId, itemCount);
    if (itemCount === 1) {
      await AchievementTracker.itemUploaded(userId);
    }
  },

  // Call when user creates an outfit
  onOutfitCreated: async (userId: string, context?: { isNightTime?: boolean, weatherContext?: any }) => {
    const isNightTime = context?.isNightTime || (new Date().getHours() >= 22 || new Date().getHours() <= 6);
    await AchievementTracker.outfitCreated(userId, isNightTime);
    
    // If weather context is provided, track weather achievement
    if (context?.weatherContext) {
      await AchievementTracker.weatherOutfitUsed(userId);
    }
  },

  // Call during daily login check
  onDailyLogin: async (userId: string, streakDays: number) => {
    await AchievementTracker.loginStreak(userId, streakDays);
  },

  // Call when user uses different colors
  onColorUsed: async (userId: string) => {
    await AchievementTracker.colorUsed(userId);
  },
};