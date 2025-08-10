/**
 * Enhanced Streak Service with Duolingo-style features
 * - Daily streak tracking with detailed statistics
 * - Streak freeze system for missed days
 * - Milestone rewards and achievements
 * - Visual indicators and animations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import { currencyService } from './CurrencyService';
import { achievementService } from './AchievementService';
import { soundService } from './SoundService';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  lastActiveDate: string; // ISO date YYYY-MM-DD
  streakFreezes: number;
  freezesUsed: number;
  streakStartDate: string;
  milestones: StreakMilestone[];
  weeklyActivity: boolean[]; // 7 booleans for each day of week
  perfectWeeks: number;
  monthlyStats: MonthlyStreakStats;
}

export interface StreakMilestone {
  days: number;
  achieved: boolean;
  achievedDate?: string;
  reward: {
    type: 'coins' | 'gems' | 'freeze' | 'achievement';
    amount: number;
    name?: string;
  };
}

export interface MonthlyStreakStats {
  [key: string]: { // YYYY-MM format
    activeDays: number;
    totalDays: number;
    longestStreak: number;
    freezesUsed: number;
  };
}

export interface StreakFreeze {
  id: string;
  usedDate?: string;
  expiryDate?: string; // Optional expiry for time-limited freezes
  source: 'earned' | 'purchased' | 'gifted';
}

class StreakService {
  private static instance: StreakService;
  private readonly STORAGE_KEY = 'streak_data';
  private readonly FREEZE_STORAGE_KEY = 'streak_freezes';
  
  // Milestone definitions
  private readonly MILESTONES: StreakMilestone[] = [
    { days: 3, achieved: false, reward: { type: 'coins', amount: 100 } },
    { days: 7, achieved: false, reward: { type: 'freeze', amount: 1 } },
    { days: 14, achieved: false, reward: { type: 'gems', amount: 50 } },
    { days: 30, achieved: false, reward: { type: 'achievement', amount: 1, name: 'Monthly Master' } },
    { days: 60, achieved: false, reward: { type: 'gems', amount: 200 } },
    { days: 100, achieved: false, reward: { type: 'achievement', amount: 1, name: 'Century Club' } },
    { days: 365, achieved: false, reward: { type: 'achievement', amount: 1, name: 'Year of Style' } },
  ];

  static getInstance(): StreakService {
    if (!StreakService.instance) {
      StreakService.instance = new StreakService();
    }
    return StreakService.instance;
  }

  /**
   * Check and update daily streak
   */
  async checkDailyStreak(): Promise<{
    streakData: StreakData;
    isNewDay: boolean;
    streakMaintained: boolean;
    freezeUsed: boolean;
    milestonesReached: StreakMilestone[];
  }> {
    try {
      const today = this.getTodayKey();
      const streakData = await this.getStreakData();
      const lastActive = streakData.lastActiveDate;
      
      // Check if already logged in today
      if (lastActive === today) {
        return {
          streakData,
          isNewDay: false,
          streakMaintained: true,
          freezeUsed: false,
          milestonesReached: []
        };
      }

      // Calculate days since last activity
      const daysSinceLast = this.getDaysBetween(lastActive, today);
      let freezeUsed = false;
      let streakMaintained = true;
      
      if (daysSinceLast === 0 || daysSinceLast === 1) {
        // Consecutive day - increase streak
        streakData.currentStreak++;
        streakData.totalDays++;
        
      } else if (daysSinceLast === 2 && streakData.streakFreezes > 0) {
        // Missed one day but have a freeze
        freezeUsed = true;
        streakData.streakFreezes--;
        streakData.freezesUsed++;
        streakData.totalDays++;
        logger.info(LogCategories.GAMIFICATION, 'Streak freeze used automatically', {
          remainingFreezes: streakData.streakFreezes,
          currentStreak: streakData.currentStreak
        });
        
      } else {
        // Streak broken
        streakMaintained = false;
        streakData.currentStreak = 1; // Reset to 1 for today
        streakData.totalDays++;
        streakData.streakStartDate = today;
        logger.info(LogCategories.GAMIFICATION, 'Streak broken', {
          previousStreak: streakData.currentStreak,
          daysMissed: daysSinceLast - 1
        });
      }

      // Update longest streak
      if (streakData.currentStreak > streakData.longestStreak) {
        streakData.longestStreak = streakData.currentStreak;
      }

      // Update last active date
      streakData.lastActiveDate = today;

      // Update weekly activity
      const dayOfWeek = new Date().getDay();
      streakData.weeklyActivity[dayOfWeek] = true;
      
      // Check for perfect week
      if (streakData.weeklyActivity.every(day => day)) {
        streakData.perfectWeeks++;
        streakData.weeklyActivity = new Array(7).fill(false);
        streakData.weeklyActivity[dayOfWeek] = true;
        
        // Award perfect week bonus
        await currencyService.addCurrency('user123', 'gems', 25);
        logger.info(LogCategories.GAMIFICATION, 'Perfect week achieved!', {
          perfectWeeks: streakData.perfectWeeks
        });
      }

      // Update monthly stats
      const monthKey = today.substring(0, 7); // YYYY-MM
      if (!streakData.monthlyStats[monthKey]) {
        streakData.monthlyStats[monthKey] = {
          activeDays: 0,
          totalDays: new Date().getDate(),
          longestStreak: 0,
          freezesUsed: 0
        };
      }
      streakData.monthlyStats[monthKey].activeDays++;
      if (freezeUsed) {
        streakData.monthlyStats[monthKey].freezesUsed++;
      }

      // Check milestones
      const milestonesReached = await this.checkMilestones(streakData);

      // Save updated data
      await this.saveStreakData(streakData);

      return {
        streakData,
        isNewDay: true,
        streakMaintained,
        freezeUsed,
        milestonesReached
      };
      
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to check daily streak', error as Error);
      throw error;
    }
  }

  /**
   * Check and award milestone rewards
   */
  private async checkMilestones(streakData: StreakData): Promise<StreakMilestone[]> {
    const newMilestones: StreakMilestone[] = [];
    
    for (const milestone of streakData.milestones) {
      if (!milestone.achieved && streakData.currentStreak >= milestone.days) {
        milestone.achieved = true;
        milestone.achievedDate = this.getTodayKey();
        newMilestones.push(milestone);
        
        // Award milestone reward
        switch (milestone.reward.type) {
          case 'coins':
            await currencyService.addCurrency('user123', 'styleCoins', milestone.reward.amount);
            break;
          case 'gems':
            await currencyService.addCurrency('user123', 'fashionGems', milestone.reward.amount);
            break;
          case 'freeze':
            streakData.streakFreezes += milestone.reward.amount;
            break;
          case 'achievement':
            if (milestone.reward.name) {
              await achievementService.unlockAchievement(milestone.reward.name);
            }
            break;
        }
        
        // Play achievement sound
        await soundService.playSound('achievement');
        
        logger.info(LogCategories.GAMIFICATION, 'Streak milestone reached!', {
          days: milestone.days,
          reward: milestone.reward
        });
      }
    }
    
    return newMilestones;
  }

  /**
   * Purchase a streak freeze
   */
  async purchaseStreakFreeze(count: number = 1): Promise<{
    success: boolean;
    newFreezeCount: number;
    error?: string;
  }> {
    try {
      const FREEZE_COST = 200; // Cost in gems
      const totalCost = FREEZE_COST * count;
      
      // Check if user has enough gems
      const userCurrency = await currencyService.getCurrency('user123');
      if (userCurrency.fashionGems < totalCost) {
        return {
          success: false,
          newFreezeCount: userCurrency.fashionGems,
          error: 'Insufficient gems'
        };
      }
      
      // Deduct gems
      await currencyService.subtractCurrency('user123', 'fashionGems', totalCost);
      
      // Add freezes
      const streakData = await this.getStreakData();
      streakData.streakFreezes += count;
      await this.saveStreakData(streakData);
      
      logger.info(LogCategories.GAMIFICATION, 'Streak freezes purchased', {
        count,
        cost: totalCost,
        newTotal: streakData.streakFreezes
      });
      
      return {
        success: true,
        newFreezeCount: streakData.streakFreezes
      };
      
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to purchase streak freeze', error as Error);
      return {
        success: false,
        newFreezeCount: 0,
        error: 'Purchase failed'
      };
    }
  }

  /**
   * Get current streak data
   */
  async getStreakData(): Promise<StreakData> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Initialize new streak data
      const today = this.getTodayKey();
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalDays: 0,
        lastActiveDate: '',
        streakFreezes: 2, // Start with 2 free freezes
        freezesUsed: 0,
        streakStartDate: today,
        milestones: [...this.MILESTONES],
        weeklyActivity: new Array(7).fill(false),
        perfectWeeks: 0,
        monthlyStats: {}
      };
      
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to get streak data', error as Error);
      throw error;
    }
  }

  /**
   * Save streak data
   */
  private async saveStreakData(data: StreakData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to save streak data', error as Error);
      throw error;
    }
  }

  /**
   * Get today's date key (YYYY-MM-DD)
   */
  private getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Calculate days between two date strings
   */
  private getDaysBetween(date1: string, date2: string): number {
    if (!date1) return 999; // First time user
    
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Reset streak (for testing)
   */
  async resetStreak(): Promise<void> {
    if (__DEV__) {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      logger.info(LogCategories.GAMIFICATION, 'Streak data reset');
    }
  }

  /**
   * Get streak statistics
   */
  async getStreakStats(): Promise<{
    currentStreak: number;
    longestStreak: number;
    totalDays: number;
    freezesAvailable: number;
    nextMilestone?: number;
    perfectWeeks: number;
  }> {
    const data = await this.getStreakData();
    
    // Find next milestone
    const nextMilestone = data.milestones
      .filter(m => !m.achieved)
      .map(m => m.days)
      .sort((a, b) => a - b)[0];
    
    return {
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      totalDays: data.totalDays,
      freezesAvailable: data.streakFreezes,
      nextMilestone,
      perfectWeeks: data.perfectWeeks
    };
  }
}

export const streakService = StreakService.getInstance();