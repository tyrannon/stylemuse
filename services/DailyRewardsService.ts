import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import { StyleCard, StylePack, CardRarity, PACK_CONFIG } from '../types/StyleCards';
import { soundService } from './SoundService';

interface DailyLoginStreak {
  currentStreak: number;
  lastLoginDate: string; // ISO date string
  longestStreak: number;
  totalLogins: number;
}

interface DailyReward {
  day: number;
  type: 'coins' | 'gems' | 'pack' | 'card';
  amount?: number;
  packType?: string;
  cardRarity?: CardRarity;
  claimed: boolean;
  claimedDate?: string;
}

interface WeeklyRewardCycle {
  day1: { type: 'coins', amount: 100 };
  day2: { type: 'coins', amount: 150 };
  day3: { type: 'gems', amount: 25 };
  day4: { type: 'coins', amount: 200 };
  day5: { type: 'pack', packType: 'standard' };
  day6: { type: 'gems', amount: 50 };
  day7: { type: 'pack', packType: 'premium' }; // Weekly bonus
}

class DailyRewardsService {
  private static instance: DailyRewardsService;
  private readonly STORAGE_KEYS = {
    LOGIN_STREAK: 'daily_login_streak',
    LAST_FREE_PACK: 'last_free_pack_claim',
    WEEKLY_REWARDS: 'weekly_rewards_progress'
  };

  static getInstance(): DailyRewardsService {
    if (!DailyRewardsService.instance) {
      DailyRewardsService.instance = new DailyRewardsService();
    }
    return DailyRewardsService.instance;
  }

  // Check if user can claim daily rewards and update streak
  async checkDailyLogin(): Promise<{
    canClaimRewards: boolean;
    streak: DailyLoginStreak;
    todaysReward?: DailyReward;
    isNewDay: boolean;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const streak = await this.getLoginStreak();
      const lastLogin = streak.lastLoginDate;
      
      // Check if this is a new day
      const isNewDay = lastLogin !== today;
      
      if (!isNewDay) {
        return {
          canClaimRewards: false,
          streak,
          isNewDay: false
        };
      }

      // Update streak
      const updatedStreak = await this.updateLoginStreak(today, lastLogin);
      const todaysReward = this.getTodaysReward(updatedStreak.currentStreak);

      logger.info(LogCategories.GAMIFICATION, 'Daily login checked', {
        streak: updatedStreak.currentStreak,
        isNewDay,
        todaysReward: todaysReward?.type
      });

      return {
        canClaimRewards: true,
        streak: updatedStreak,
        todaysReward,
        isNewDay: true
      };
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to check daily login', error);
      return {
        canClaimRewards: false,
        streak: { currentStreak: 0, lastLoginDate: '', longestStreak: 0, totalLogins: 0 },
        isNewDay: false
      };
    }
  }

  // Claim daily rewards
  async claimDailyReward(reward: DailyReward): Promise<{
    success: boolean;
    claimedReward?: DailyReward;
    newCurrencyAmounts?: { coins: number; gems: number };
  }> {
    try {
      const today = new Date().toISOString();
      
      // Mark reward as claimed
      const claimedReward: DailyReward = {
        ...reward,
        claimed: true,
        claimedDate: today
      };

      // Apply reward to user's account
      const currencyResult = await this.applyRewardToAccount(reward);
      
      // Play reward sound
      await soundService.playSuccess();
      
      // Log achievement
      logger.info(LogCategories.GAMIFICATION, 'Daily reward claimed', {
        rewardType: reward.type,
        amount: reward.amount,
        day: reward.day
      });

      return {
        success: true,
        claimedReward,
        newCurrencyAmounts: currencyResult
      };
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to claim daily reward', error);
      return { success: false };
    }
  }

  // Check if free daily pack is available
  async canClaimFreeDailyPack(): Promise<boolean> {
    try {
      const lastClaimStr = await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_FREE_PACK);
      if (!lastClaimStr) return true;

      const lastClaim = new Date(lastClaimStr);
      const now = new Date();
      const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

      return hoursSinceLastClaim >= PACK_CONFIG.FREE_DAILY.cooldownHours;
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to check free pack availability', error);
      return false;
    }
  }

  // Claim free daily pack
  async claimFreeDailyPack(): Promise<{ success: boolean; pack?: StylePack }> {
    try {
      const canClaim = await this.canClaimFreeDailyPack();
      if (!canClaim) {
        return { success: false };
      }

      // Generate free daily pack
      const pack: StylePack = {
        id: `free_daily_${Date.now()}`,
        name: 'Daily Free Pack',
        description: 'Your daily dose of style cards!',
        type: 'free_daily',
        cardCount: PACK_CONFIG.FREE_DAILY.cardCount,
        isFree: true,
        openingAnimation: 'standard',
        isLimitedTime: false,
        totalOpened: 0
      };

      // Mark as claimed
      await AsyncStorage.setItem(this.STORAGE_KEYS.LAST_FREE_PACK, new Date().toISOString());
      
      logger.info(LogCategories.GAMIFICATION, 'Free daily pack claimed', { packId: pack.id });
      
      return { success: true, pack };
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to claim free daily pack', error);
      return { success: false };
    }
  }

  // Get time until next free pack
  async getTimeUntilNextFreePack(): Promise<number> {
    try {
      const lastClaimStr = await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_FREE_PACK);
      if (!lastClaimStr) return 0;

      const lastClaim = new Date(lastClaimStr);
      const nextClaimTime = new Date(lastClaim.getTime() + (PACK_CONFIG.FREE_DAILY.cooldownHours * 60 * 60 * 1000));
      const now = new Date();

      return Math.max(0, nextClaimTime.getTime() - now.getTime());
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to get time until next free pack', error);
      return 0;
    }
  }

  // Private helper methods
  private async getLoginStreak(): Promise<DailyLoginStreak> {
    try {
      const streakStr = await AsyncStorage.getItem(this.STORAGE_KEYS.LOGIN_STREAK);
      if (!streakStr) {
        return { currentStreak: 0, lastLoginDate: '', longestStreak: 0, totalLogins: 0 };
      }
      return JSON.parse(streakStr);
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to get login streak', error);
      return { currentStreak: 0, lastLoginDate: '', longestStreak: 0, totalLogins: 0 };
    }
  }

  private async updateLoginStreak(today: string, lastLogin: string): Promise<DailyLoginStreak> {
    try {
      const currentStreak = await this.getLoginStreak();
      
      // Calculate new streak
      let newStreakCount = 1;
      if (lastLogin) {
        const lastLoginDate = new Date(lastLogin);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day - increment streak
          newStreakCount = currentStreak.currentStreak + 1;
        } else if (daysDiff > 1) {
          // Broke streak - reset to 1
          newStreakCount = 1;
        }
      }

      const updatedStreak: DailyLoginStreak = {
        currentStreak: newStreakCount,
        lastLoginDate: today,
        longestStreak: Math.max(currentStreak.longestStreak, newStreakCount),
        totalLogins: currentStreak.totalLogins + 1
      };

      await AsyncStorage.setItem(this.STORAGE_KEYS.LOGIN_STREAK, JSON.stringify(updatedStreak));
      return updatedStreak;
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to update login streak', error);
      throw error;
    }
  }

  private getTodaysReward(streakDay: number): DailyReward {
    // Use modulo to cycle through weekly rewards (1-7)
    const dayInCycle = ((streakDay - 1) % 7) + 1;
    
    const weeklyRewards: WeeklyRewardCycle = {
      day1: { type: 'coins', amount: 100 },
      day2: { type: 'coins', amount: 150 },
      day3: { type: 'gems', amount: 25 },
      day4: { type: 'coins', amount: 200 },
      day5: { type: 'pack', packType: 'standard' },
      day6: { type: 'gems', amount: 50 },
      day7: { type: 'pack', packType: 'premium' }
    };

    const dayKey = `day${dayInCycle}` as keyof WeeklyRewardCycle;
    const rewardTemplate = weeklyRewards[dayKey];

    return {
      day: dayInCycle,
      type: rewardTemplate.type as 'coins' | 'gems' | 'pack',
      amount: 'amount' in rewardTemplate ? rewardTemplate.amount : undefined,
      packType: 'packType' in rewardTemplate ? rewardTemplate.packType : undefined,
      claimed: false
    };
  }

  private async applyRewardToAccount(reward: DailyReward): Promise<{ coins: number; gems: number }> {
    // This would integrate with currency service
    // For now, just return mock values
    logger.info(LogCategories.GAMIFICATION, 'Applied reward to account', reward);
    return { coins: 1000, gems: 150 }; // Mock values
  }
}

export const dailyRewardsService = DailyRewardsService.getInstance();