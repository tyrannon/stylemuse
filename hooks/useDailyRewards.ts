import { useState, useEffect, useCallback } from 'react';
import { dailyRewardsService } from '../services/DailyRewardsService';
import { currencyService } from '../services/CurrencyService';
import { wardrobeRewardService } from '../services/WardrobeRewardService';
import { StyleCard, StylePack, CardRarity } from '../types/StyleCards';
import { WardrobeItem } from '../hooks/useWardrobeData';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

interface DailyLoginStreak {
  currentStreak: number;
  lastLoginDate: string;
  longestStreak: number;
  totalLogins: number;
}

interface DailyReward {
  day: number;
  type: 'coins' | 'gems' | 'pack' | 'card' | 'wardrobe_item';
  amount?: number;
  packType?: string;
  cardRarity?: CardRarity;
  claimed: boolean;
  claimedDate?: string;
}

interface ClaimResult {
  success: boolean;
  claimedReward?: DailyReward;
  earnedCurrency?: { coins?: number; gems?: number };
  earnedCards?: StyleCard[];
  earnedWardrobeItems?: WardrobeItem[];
  isSpecialMilestone?: boolean;
}

export const useDailyRewards = (userId: string) => {
  const [streak, setStreak] = useState<DailyLoginStreak | null>(null);
  const [todaysReward, setTodaysReward] = useState<DailyReward | null>(null);
  const [canClaimRewards, setCanClaimRewards] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheckDate, setLastCheckDate] = useState<string>('');

  // Check for daily rewards on component mount and when userId changes
  useEffect(() => {
    if (userId) {
      checkDailyLogin();
    }
  }, [userId]);

  // Auto-check every minute if app is active (for edge cases like midnight rollover)
  useEffect(() => {
    const interval = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      if (lastCheckDate !== today && userId) {
        checkDailyLogin();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [lastCheckDate, userId]);

  const checkDailyLogin = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      setLastCheckDate(today);

      const result = await dailyRewardsService.checkDailyLogin();
      
      setStreak(result.streak);
      setCanClaimRewards(result.canClaimRewards);

      // Enhance the reward if it's a special milestone
      if (result.todaysReward && result.canClaimRewards) {
        let enhancedReward = { ...result.todaysReward };

        // Special milestone rewards
        const currentStreak = result.streak.currentStreak;
        if (currentStreak % 30 === 0) {
          // Every 30 days: guarantee wardrobe item
          enhancedReward = {
            ...enhancedReward,
            type: 'wardrobe_item',
            cardRarity: CardRarity.MYTHIC,
          };
        } else if (currentStreak % 14 === 0) {
          // Every 2 weeks: guarantee rare pack
          enhancedReward = {
            ...enhancedReward,
            type: 'pack',
            packType: 'legendary',
          };
        } else if (currentStreak % 7 === 0) {
          // Every week: guarantee wardrobe item
          enhancedReward = {
            ...enhancedReward,
            type: 'wardrobe_item',
            cardRarity: CardRarity.RARE,
          };
        }

        setTodaysReward(enhancedReward);
      } else {
        setTodaysReward(result.todaysReward || null);
      }

      logger.info(LogCategories.GAMIFICATION, 'Daily rewards checked', {
        canClaim: result.canClaimRewards,
        streak: result.streak.currentStreak,
        rewardType: result.todaysReward?.type,
      });

    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to check daily rewards', error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const claimDailyReward = useCallback(async (): Promise<ClaimResult> => {
    if (!todaysReward || !canClaimRewards || !userId) {
      return { success: false };
    }

    try {
      setIsLoading(true);

      const result = await dailyRewardsService.claimDailyReward(todaysReward);
      if (!result.success || !result.claimedReward) {
        return { success: false };
      }

      const claimResult: ClaimResult = {
        success: true,
        claimedReward: result.claimedReward,
        isSpecialMilestone: streak ? isSpecialMilestone(streak.currentStreak) : false,
      };

      // Process different reward types
      switch (result.claimedReward.type) {
        case 'coins':
          if (result.claimedReward.amount) {
            const coinResult = await currencyService.earnCoins(userId, {
              source: 'daily_login',
              amount: result.claimedReward.amount,
              description: `Day ${result.claimedReward.day} login bonus`,
            });
            claimResult.earnedCurrency = { coins: coinResult.newBalance };
          }
          break;

        case 'gems':
          if (result.claimedReward.amount) {
            const gemResult = await currencyService.earnGems(userId, {
              source: 'daily_login',
              amount: result.claimedReward.amount,
              description: `Day ${result.claimedReward.day} login bonus`,
            });
            claimResult.earnedCurrency = { gems: gemResult.newBalance };
          }
          break;

        case 'pack':
          // Generate style cards for pack reward
          const cardCount = result.claimedReward.packType === 'premium' ? 5 : 3;
          const guaranteedRarity = result.claimedReward.packType === 'premium' ? CardRarity.RARE : undefined;
          // Note: This would need actual card generation service integration
          claimResult.earnedCards = []; // Placeholder
          break;

        case 'wardrobe_item':
          // Generate wardrobe item reward
          const rewardItem = await wardrobeRewardService.generateRewardItem(
            'daily_login',
            { 
              rarity: result.claimedReward.cardRarity,
              forStreak: streak?.currentStreak,
            }
          );
          claimResult.earnedWardrobeItems = [rewardItem];
          break;
      }

      // Update local state
      setTodaysReward(result.claimedReward);
      setCanClaimRewards(false);
      
      // Track login streak achievements
      try {
        const { IntegratedAchievements } = await import('./useAchievementIntegration');
        if (streak) {
          await IntegratedAchievements.onDailyLogin(userId, streak.currentStreak);
          logger.info(LogCategories.GAMIFICATION, 'Daily login achievement tracked', {
            streak: streak.currentStreak,
            rewardType: result.claimedReward.type,
          });
        }
      } catch (achievementError) {
        logger.warn(LogCategories.GAMIFICATION, 'Failed to track daily login achievements', achievementError);
      }

      logger.info(LogCategories.GAMIFICATION, 'Daily reward claimed', {
        rewardType: result.claimedReward.type,
        amount: result.claimedReward.amount,
        isSpecialMilestone: claimResult.isSpecialMilestone,
      });

      return claimResult;

    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to claim daily reward', error as Error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [todaysReward, canClaimRewards, userId, streak]);

  const canClaimFreeDailyPack = useCallback(async (): Promise<boolean> => {
    try {
      return await dailyRewardsService.canClaimFreeDailyPack();
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to check free pack availability', error as Error);
      return false;
    }
  }, []);

  const claimFreeDailyPack = useCallback(async (): Promise<{ 
    success: boolean; 
    pack?: StylePack;
  }> => {
    try {
      return await dailyRewardsService.claimFreeDailyPack();
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to claim free pack', error as Error);
      return { success: false };
    }
  }, []);

  const getTimeUntilNextFreePack = useCallback(async (): Promise<number> => {
    try {
      return await dailyRewardsService.getTimeUntilNextFreePack();
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to get free pack cooldown', error as Error);
      return 0;
    }
  }, []);

  // Helper function to determine if current streak is a special milestone
  const isSpecialMilestone = (streakCount: number): boolean => {
    return streakCount % 7 === 0 || streakCount % 14 === 0 || streakCount % 30 === 0;
  };

  // Get preview of upcoming rewards for motivation
  const getUpcomingRewards = useCallback((daysAhead: number = 7) => {
    if (!streak) return [];

    const upcomingRewards = [];
    const currentDay = streak.currentStreak;

    for (let i = 1; i <= daysAhead; i++) {
      const futureDay = currentDay + i;
      const dayInCycle = ((futureDay - 1) % 7) + 1;
      
      const weeklyRewards = {
        1: { type: 'coins', amount: 100 },
        2: { type: 'coins', amount: 150 },
        3: { type: 'gems', amount: 25 },
        4: { type: 'coins', amount: 200 },
        5: { type: 'pack', packType: 'standard' },
        6: { type: 'gems', amount: 50 },
        7: { type: 'pack', packType: 'premium' },
      };

      let reward = weeklyRewards[dayInCycle as keyof typeof weeklyRewards];

      // Override with special milestone rewards
      if (futureDay % 30 === 0) {
        reward = { type: 'wardrobe_item', amount: 1 } as any;
      } else if (futureDay % 14 === 0) {
        reward = { type: 'pack', packType: 'legendary' } as any;
      } else if (futureDay % 7 === 0) {
        reward = { type: 'wardrobe_item', amount: 1 } as any;
      }

      upcomingRewards.push({
        day: futureDay,
        ...reward,
        isSpecialMilestone: isSpecialMilestone(futureDay),
      });
    }

    return upcomingRewards;
  }, [streak]);

  return {
    // State
    streak,
    todaysReward,
    canClaimRewards,
    isLoading,

    // Actions
    checkDailyLogin,
    claimDailyReward,
    canClaimFreeDailyPack,
    claimFreeDailyPack,
    getTimeUntilNextFreePack,

    // Utilities
    getUpcomingRewards,
    isSpecialMilestone: (streakCount: number) => isSpecialMilestone(streakCount),
  };
};