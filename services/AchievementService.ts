import AsyncStorage from '@react-native-async-storage/async-storage';
import { CardRarity } from '../types/StyleCards';
import { wardrobeRewardService } from './WardrobeRewardService';
import { currencyService, CurrencyEarning } from './CurrencyService';
import { soundService } from './SoundService';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import * as Haptics from 'expo-haptics';

// Achievement types and their reward configurations
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'wardrobe' | 'outfits' | 'streaks' | 'milestones' | 'social' | 'special';
  type: 'progress' | 'milestone' | 'streak' | 'unlock';
  
  // Unlock conditions
  targetValue: number;
  currentProgress?: number;
  
  // Rewards
  rewards: {
    coins?: number;
    gems?: number;
    wardrobeItems?: {
      count: number;
      rarity: CardRarity;
      category?: string;
      style?: string;
    };
    specialReward?: string; // For unique rewards
  };
  
  // Achievement metadata
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythic';
  icon: string;
  isUnlocked: boolean;
  unlockedAt?: Date;
  isHidden?: boolean; // Hidden until conditions are met
}

export interface AchievementProgress {
  userId: string;
  achievements: { [achievementId: string]: Achievement };
  totalUnlocked: number;
  lastUpdated: Date;
}

// Pre-defined achievements system
const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'isUnlocked' | 'currentProgress' | 'unlockedAt'>[] = [
  // Wardrobe Building Achievements
  {
    id: 'first_upload',
    name: 'Fashion Pioneer',
    description: 'Upload your first item to the wardrobe',
    category: 'wardrobe',
    type: 'milestone',
    targetValue: 1,
    rewards: { coins: 100, wardrobeItems: { count: 1, rarity: CardRarity.COMMON } },
    rarity: 'common',
    icon: '👗',
  },
  {
    id: 'upload_5_items',
    name: 'Style Collector',
    description: 'Upload 5 items to your wardrobe',
    category: 'wardrobe',
    type: 'milestone',
    targetValue: 5,
    rewards: { coins: 250, wardrobeItems: { count: 1, rarity: CardRarity.UNCOMMON } },
    rarity: 'uncommon',
    icon: '👘',
  },
  {
    id: 'upload_25_items',
    name: 'Fashion Curator',
    description: 'Build a wardrobe of 25 items',
    category: 'wardrobe',
    type: 'milestone',
    targetValue: 25,
    rewards: { coins: 500, gems: 25, wardrobeItems: { count: 2, rarity: CardRarity.RARE } },
    rarity: 'rare',
    icon: '👑',
  },
  {
    id: 'upload_100_items',
    name: 'Master Stylist',
    description: 'Curate a wardrobe collection of 100 items',
    category: 'wardrobe',
    type: 'milestone',
    targetValue: 100,
    rewards: { coins: 1000, gems: 100, wardrobeItems: { count: 1, rarity: CardRarity.LEGENDARY } },
    rarity: 'legendary',
    icon: '✨',
  },

  // Outfit Creation Achievements
  {
    id: 'first_outfit',
    name: 'Style Novice',
    description: 'Create your first outfit',
    category: 'outfits',
    type: 'milestone',
    targetValue: 1,
    rewards: { coins: 50, wardrobeItems: { count: 1, rarity: CardRarity.COMMON } },
    rarity: 'common',
    icon: '🎨',
  },
  {
    id: 'create_10_outfits',
    name: 'Outfit Artist',
    description: 'Create 10 unique outfits',
    category: 'outfits',
    type: 'milestone',
    targetValue: 10,
    rewards: { coins: 300, wardrobeItems: { count: 2, rarity: CardRarity.UNCOMMON } },
    rarity: 'uncommon',
    icon: '🎭',
  },
  {
    id: 'create_50_outfits',
    name: 'Style Virtuoso',
    description: 'Master the art of styling with 50 outfits',
    category: 'outfits',
    type: 'milestone',
    targetValue: 50,
    rewards: { coins: 750, gems: 50, wardrobeItems: { count: 1, rarity: CardRarity.RARE } },
    rarity: 'rare',
    icon: '🌟',
  },
  {
    id: 'create_200_outfits',
    name: 'Fashion Guru',
    description: 'Become a legend with 200+ outfit creations',
    category: 'outfits',
    type: 'milestone',
    targetValue: 200,
    rewards: { coins: 2000, gems: 200, wardrobeItems: { count: 1, rarity: CardRarity.MYTHIC } },
    rarity: 'mythic',
    icon: '🔮',
  },

  // Daily Streak Achievements
  {
    id: 'streak_3_days',
    name: 'Style Habit',
    description: 'Log in for 3 consecutive days',
    category: 'streaks',
    type: 'streak',
    targetValue: 3,
    rewards: { coins: 150, wardrobeItems: { count: 1, rarity: CardRarity.COMMON } },
    rarity: 'common',
    icon: '🔥',
  },
  {
    id: 'streak_7_days',
    name: 'Fashion Week',
    description: 'Maintain a 7-day style streak',
    category: 'streaks',
    type: 'streak',
    targetValue: 7,
    rewards: { coins: 400, gems: 25, wardrobeItems: { count: 1, rarity: CardRarity.UNCOMMON } },
    rarity: 'uncommon',
    icon: '📅',
  },
  {
    id: 'streak_30_days',
    name: 'Style Legend',
    description: 'Achieve a legendary 30-day streak',
    category: 'streaks',
    type: 'streak',
    targetValue: 30,
    rewards: { coins: 1500, gems: 100, wardrobeItems: { count: 1, rarity: CardRarity.LEGENDARY } },
    rarity: 'legendary',
    icon: '👑',
  },
  {
    id: 'streak_365_days',
    name: 'Eternal Fashionista',
    description: 'The ultimate achievement: 365-day streak',
    category: 'streaks',
    type: 'streak',
    targetValue: 365,
    rewards: { coins: 5000, gems: 500, wardrobeItems: { count: 1, rarity: CardRarity.MYTHIC }, specialReward: 'exclusive_title' },
    rarity: 'mythic',
    icon: '♾️',
    isHidden: true,
  },

  // Special Hidden Achievements
  {
    id: 'night_owl_stylist',
    name: 'Night Owl Stylist',
    description: 'Create 5 outfits between midnight and 6 AM',
    category: 'special',
    type: 'progress',
    targetValue: 5,
    rewards: { coins: 300, wardrobeItems: { count: 1, rarity: CardRarity.RARE, style: 'glamorous' } },
    rarity: 'rare',
    icon: '🦉',
    isHidden: true,
  },
  {
    id: 'weather_warrior',
    name: 'Weather Warrior',
    description: 'Use weather-appropriate outfits for 10 different weather conditions',
    category: 'special',
    type: 'progress',
    targetValue: 10,
    rewards: { coins: 500, gems: 50, wardrobeItems: { count: 2, rarity: CardRarity.UNCOMMON } },
    rarity: 'uncommon',
    icon: '⛈️',
    isHidden: true,
  },
  {
    id: 'color_master',
    name: 'Color Harmony Master',
    description: 'Create outfits using every color category',
    category: 'special',
    type: 'progress',
    targetValue: 12, // Assuming 12 color categories
    rewards: { coins: 800, gems: 75, wardrobeItems: { count: 1, rarity: CardRarity.LEGENDARY } },
    rarity: 'legendary',
    icon: '🎨',
    isHidden: true,
  },
];

class AchievementService {
  private static instance: AchievementService;
  private readonly STORAGE_KEY = 'user_achievements';

  static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  // Initialize achievements for a user
  async initializeAchievements(userId: string): Promise<AchievementProgress> {
    try {
      const achievements: { [key: string]: Achievement } = {};
      
      // Initialize all achievements as locked with 0 progress
      ACHIEVEMENT_DEFINITIONS.forEach(def => {
        achievements[def.id] = {
          ...def,
          isUnlocked: false,
          currentProgress: 0,
        };
      });

      const progress: AchievementProgress = {
        userId,
        achievements,
        totalUnlocked: 0,
        lastUpdated: new Date(),
      };

      await this.saveProgress(progress);
      
      logger.info(LogCategories.GAMIFICATION, 'Achievements initialized for user', {
        userId,
        totalAchievements: Object.keys(achievements).length,
      });

      return progress;
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to initialize achievements', error);
      throw error;
    }
  }

  // Get user's achievement progress
  async getProgress(userId: string): Promise<AchievementProgress> {
    try {
      const progressStr = await AsyncStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      
      if (!progressStr) {
        return await this.initializeAchievements(userId);
      }

      const progress: AchievementProgress = JSON.parse(progressStr);
      
      // Check for new achievements that might have been added
      const existingIds = Object.keys(progress.achievements);
      const newAchievements = ACHIEVEMENT_DEFINITIONS.filter(def => 
        !existingIds.includes(def.id)
      );

      if (newAchievements.length > 0) {
        newAchievements.forEach(def => {
          progress.achievements[def.id] = {
            ...def,
            isUnlocked: false,
            currentProgress: 0,
          };
        });
        
        await this.saveProgress(progress);
        
        logger.info(LogCategories.GAMIFICATION, 'Added new achievements to user progress', {
          userId,
          newAchievementCount: newAchievements.length,
        });
      }

      return progress;
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to get achievement progress', error);
      return await this.initializeAchievements(userId);
    }
  }

  // Update progress towards an achievement
  async updateProgress(
    userId: string,
    achievementId: string,
    incrementValue: number = 1
  ): Promise<{ unlocked: boolean; achievement?: Achievement; rewards?: any }> {
    try {
      const progress = await this.getProgress(userId);
      const achievement = progress.achievements[achievementId];

      if (!achievement) {
        logger.warn(LogCategories.GAMIFICATION, 'Achievement not found', { userId, achievementId });
        return { unlocked: false };
      }

      if (achievement.isUnlocked) {
        // Already unlocked, no need to update
        return { unlocked: false };
      }

      // Update progress
      const newProgress = (achievement.currentProgress || 0) + incrementValue;
      achievement.currentProgress = Math.min(newProgress, achievement.targetValue);

      // Check if achievement should unlock
      if (achievement.currentProgress >= achievement.targetValue) {
        return await this.unlockAchievement(userId, achievementId, progress);
      } else {
        // Save updated progress
        progress.lastUpdated = new Date();
        await this.saveProgress(progress);
        
        logger.info(LogCategories.GAMIFICATION, 'Achievement progress updated', {
          userId,
          achievementId,
          progress: achievement.currentProgress,
          target: achievement.targetValue,
        });

        return { unlocked: false };
      }
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to update achievement progress', error);
      return { unlocked: false };
    }
  }

  // Unlock an achievement and distribute rewards
  private async unlockAchievement(
    userId: string,
    achievementId: string,
    progress?: AchievementProgress
  ): Promise<{ unlocked: boolean; achievement: Achievement; rewards: any }> {
    try {
      const userProgress = progress || await this.getProgress(userId);
      const achievement = userProgress.achievements[achievementId];

      if (!achievement || achievement.isUnlocked) {
        return { unlocked: false, achievement, rewards: null };
      }

      // Mark as unlocked
      achievement.isUnlocked = true;
      achievement.unlockedAt = new Date();
      userProgress.totalUnlocked += 1;
      userProgress.lastUpdated = new Date();

      // Distribute rewards
      const rewards = await this.distributeRewards(userId, achievement);

      // Save progress
      await this.saveProgress(userProgress);

      // Play achievement sound and haptic feedback
      await soundService.playAchievement();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      logger.info(LogCategories.GAMIFICATION, 'Achievement unlocked!', {
        userId,
        achievementId,
        achievementName: achievement.name,
        rewards: {
          coins: rewards.coins || 0,
          gems: rewards.gems || 0,
          wardrobeItems: rewards.wardrobeItems?.length || 0,
        },
      });

      return { unlocked: true, achievement, rewards };
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to unlock achievement', error);
      throw error;
    }
  }

  // Distribute achievement rewards
  private async distributeRewards(userId: string, achievement: Achievement) {
    const rewards = {
      coins: 0,
      gems: 0,
      wardrobeItems: [] as any[],
      specialRewards: [] as string[],
    };

    try {
      // Award coins
      if (achievement.rewards.coins) {
        const coinResult = await currencyService.earnCoins(
          userId,
          CurrencyEarning.ACHIEVEMENT_UNLOCKED(achievement.rewards.coins, achievement.name)
        );
        if (coinResult.success) {
          rewards.coins = achievement.rewards.coins;
        }
      }

      // Award gems
      if (achievement.rewards.gems) {
        const gemResult = await currencyService.earnGems(userId, {
          source: 'achievement',
          amount: achievement.rewards.gems,
          description: `Achievement "${achievement.name}": +${achievement.rewards.gems} gems`
        });
        if (gemResult.success) {
          rewards.gems = achievement.rewards.gems;
        }
      }

      // Award wardrobe items
      if (achievement.rewards.wardrobeItems) {
        const { count, rarity, category, style } = achievement.rewards.wardrobeItems;
        
        for (let i = 0; i < count; i++) {
          const rewardItem = await wardrobeRewardService.generateRewardItem('achievement', {
            rarity,
            category,
            style: style as any,
          });
          
          rewards.wardrobeItems.push(rewardItem);
        }
      }

      // Handle special rewards
      if (achievement.rewards.specialReward) {
        rewards.specialRewards.push(achievement.rewards.specialReward);
      }

      logger.info(LogCategories.GAMIFICATION, 'Achievement rewards distributed', {
        userId,
        achievementId: achievement.id,
        coinsAwarded: rewards.coins,
        gemsAwarded: rewards.gems,
        itemsAwarded: rewards.wardrobeItems.length,
      });

      return rewards;
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to distribute achievement rewards', error);
      return rewards;
    }
  }

  // Get unlocked achievements
  async getUnlockedAchievements(userId: string): Promise<Achievement[]> {
    const progress = await this.getProgress(userId);
    return Object.values(progress.achievements).filter(achievement => achievement.isUnlocked);
  }

  // Get achievements by category
  async getAchievementsByCategory(userId: string, category: string): Promise<Achievement[]> {
    const progress = await this.getProgress(userId);
    return Object.values(progress.achievements).filter(achievement => 
      achievement.category === category && (!achievement.isHidden || achievement.isUnlocked)
    );
  }

  // Get achievement statistics
  async getAchievementStats(userId: string) {
    const progress = await this.getProgress(userId);
    const achievements = Object.values(progress.achievements);
    
    const stats = {
      total: achievements.length,
      unlocked: achievements.filter(a => a.isUnlocked).length,
      hidden: achievements.filter(a => a.isHidden && !a.isUnlocked).length,
      byCategory: {} as { [category: string]: { total: number; unlocked: number } },
      byRarity: {} as { [rarity: string]: { total: number; unlocked: number } },
      completionPercentage: 0,
      lastUnlocked: null as Achievement | null,
    };

    // Calculate completion percentage
    stats.completionPercentage = (stats.unlocked / stats.total) * 100;

    // Stats by category
    achievements.forEach(achievement => {
      if (!stats.byCategory[achievement.category]) {
        stats.byCategory[achievement.category] = { total: 0, unlocked: 0 };
      }
      stats.byCategory[achievement.category].total++;
      if (achievement.isUnlocked) {
        stats.byCategory[achievement.category].unlocked++;
      }
    });

    // Stats by rarity
    achievements.forEach(achievement => {
      if (!stats.byRarity[achievement.rarity]) {
        stats.byRarity[achievement.rarity] = { total: 0, unlocked: 0 };
      }
      stats.byRarity[achievement.rarity].total++;
      if (achievement.isUnlocked) {
        stats.byRarity[achievement.rarity].unlocked++;
      }
    });

    // Find most recently unlocked achievement
    const unlockedAchievements = achievements
      .filter(a => a.isUnlocked && a.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime());
    
    if (unlockedAchievements.length > 0) {
      stats.lastUnlocked = unlockedAchievements[0];
    }

    return stats;
  }

  // Force unlock achievement (for testing)
  async forceUnlockAchievement(userId: string, achievementId: string) {
    try {
      const progress = await this.getProgress(userId);
      return await this.unlockAchievement(userId, achievementId, progress);
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to force unlock achievement', error);
      throw error;
    }
  }

  // Save progress to storage
  private async saveProgress(progress: AchievementProgress): Promise<void> {
    await AsyncStorage.setItem(`${this.STORAGE_KEY}_${progress.userId}`, JSON.stringify(progress));
  }

  // Export for testing and debugging
  getAchievementDefinitions() {
    return ACHIEVEMENT_DEFINITIONS;
  }
}

export const achievementService = AchievementService.getInstance();

// Achievement tracking utilities for easy integration
export const AchievementTracker = {
  // Wardrobe achievements
  itemUploaded: (userId: string) => achievementService.updateProgress(userId, 'first_upload'),
  itemsUploaded: (userId: string, count: number) => {
    achievementService.updateProgress(userId, 'upload_5_items', count);
    achievementService.updateProgress(userId, 'upload_25_items', count);
    achievementService.updateProgress(userId, 'upload_100_items', count);
  },

  // Outfit achievements
  outfitCreated: (userId: string, isNightTime?: boolean) => {
    achievementService.updateProgress(userId, 'first_outfit');
    achievementService.updateProgress(userId, 'create_10_outfits');
    achievementService.updateProgress(userId, 'create_50_outfits');
    achievementService.updateProgress(userId, 'create_200_outfits');
    
    // Special night owl achievement
    if (isNightTime) {
      achievementService.updateProgress(userId, 'night_owl_stylist');
    }
  },

  // Streak achievements
  loginStreak: (userId: string, streakDays: number) => {
    if (streakDays >= 3) achievementService.updateProgress(userId, 'streak_3_days');
    if (streakDays >= 7) achievementService.updateProgress(userId, 'streak_7_days');
    if (streakDays >= 30) achievementService.updateProgress(userId, 'streak_30_days');
    if (streakDays >= 365) achievementService.updateProgress(userId, 'streak_365_days');
  },

  // Special achievements
  weatherOutfitUsed: (userId: string) => achievementService.updateProgress(userId, 'weather_warrior'),
  colorUsed: (userId: string) => achievementService.updateProgress(userId, 'color_master'),
};