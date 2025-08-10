import AsyncStorage from '@react-native-async-storage/async-storage';
import { WardrobeItem } from '../hooks/useWardrobeData';
import { CardRarity, RARITY_RATES } from '../types/StyleCards';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

interface WardrobeRewardItem extends WardrobeItem {
  rewardType: 'daily_login' | 'streak_milestone' | 'achievement' | 'special_event';
  rewardRarity: CardRarity;
  rewardDate: Date;
  isRewardItem: true;
}

interface RewardGenerationOptions {
  rarity?: CardRarity;
  category?: string;
  style?: 'casual' | 'formal' | 'streetwear' | 'vintage' | 'athletic' | 'bohemian' | 'minimalist' | 'glamorous';
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'all';
  forStreak?: number;
}

class WardrobeRewardService {
  private static instance: WardrobeRewardService;

  static getInstance(): WardrobeRewardService {
    if (!WardrobeRewardService.instance) {
      WardrobeRewardService.instance = new WardrobeRewardService();
    }
    return WardrobeRewardService.instance;
  }

  // Generate random rarity based on Pokemon TCG-style rates
  generateRandomRarity(): CardRarity {
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const [rarity, rate] of Object.entries(RARITY_RATES)) {
      cumulativeProbability += rate;
      if (random <= cumulativeProbability) {
        return rarity as CardRarity;
      }
    }

    return CardRarity.COMMON; // Fallback
  }

  // Generate a random wardrobe item based on rarity and preferences
  async generateRewardItem(
    rewardType: 'daily_login' | 'streak_milestone' | 'achievement' | 'special_event',
    options: RewardGenerationOptions = {}
  ): Promise<WardrobeRewardItem> {
    try {
      const rarity = options.rarity || this.generateRandomRarity();
      const category = options.category || this.getRandomCategory();
      const style = options.style || this.getRandomStyle();
      const season = options.season || this.getRandomSeason();

      // Generate item based on rarity and category
      const itemData = this.generateItemData(rarity, category, style, season);

      const rewardItem: WardrobeRewardItem = {
        image: itemData.image,
        title: itemData.title,
        description: itemData.description,
        tags: itemData.tags,
        color: itemData.color,
        material: itemData.material,
        style: itemData.style,
        fit: itemData.fit,
        category,
        isNew: true,
        
        // Reward-specific fields
        rewardType,
        rewardRarity: rarity,
        rewardDate: new Date(),
        isRewardItem: true,

        // Initialize as clean for new reward items
        laundryStatus: 'clean',
        laundryHistory: [{
          status: 'clean',
          changedAt: new Date(),
          notes: `Received as ${rewardType} reward`
        }],
        timesWashed: 0,
        needsSpecialCare: rarity >= CardRarity.RARE,

        // Cost tracking (reward items are free)
        purchasePrice: 0,
        purchaseDate: new Date(),
        purchaseCurrency: 'reward',

        // Usage tracking
        timesWornInOutfits: 0,
        lastUsedInOutfit: undefined,
        outfitGenerationHistory: [],
      };

      logger.info(LogCategories.GAMIFICATION, 'Generated reward wardrobe item', {
        rewardType,
        rarity,
        category,
        itemTitle: rewardItem.title,
      });

      return rewardItem;
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to generate reward item', error);
      // Return a basic common item as fallback
      return this.generateFallbackItem(rewardType);
    }
  }

  // Generate special milestone reward (higher rarity guarantee)
  async generateMilestoneReward(streakDay: number): Promise<WardrobeRewardItem> {
    let guaranteedRarity: CardRarity;

    // Special milestone rarity bonuses
    if (streakDay >= 30) {
      guaranteedRarity = CardRarity.MYTHIC;
    } else if (streakDay >= 14) {
      guaranteedRarity = CardRarity.LEGENDARY;
    } else if (streakDay >= 7) {
      guaranteedRarity = CardRarity.RARE;
    } else if (streakDay >= 3) {
      guaranteedRarity = CardRarity.UNCOMMON;
    } else {
      guaranteedRarity = CardRarity.COMMON;
    }

    return this.generateRewardItem('streak_milestone', {
      rarity: guaranteedRarity,
      forStreak: streakDay,
    });
  }

  // Generate multiple random items (for pack-like rewards)
  async generateRewardPack(
    count: number,
    rewardType: 'daily_login' | 'streak_milestone' | 'achievement' | 'special_event',
    guaranteedRarity?: CardRarity
  ): Promise<WardrobeRewardItem[]> {
    const items: WardrobeRewardItem[] = [];

    try {
      // First item with guaranteed rarity if specified
      if (guaranteedRarity) {
        items.push(await this.generateRewardItem(rewardType, { rarity: guaranteedRarity }));
        count--;
      }

      // Generate remaining items
      for (let i = 0; i < count; i++) {
        items.push(await this.generateRewardItem(rewardType));
      }

      logger.info(LogCategories.GAMIFICATION, 'Generated reward pack', {
        rewardType,
        itemCount: items.length,
        rarities: items.map(item => item.rewardRarity),
      });

      return items;
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to generate reward pack', error);
      return [this.generateFallbackItem(rewardType)];
    }
  }

  // Private helper methods
  private getRandomCategory(): string {
    const categories = ['top', 'bottom', 'shoes', 'jacket', 'hat', 'accessories'];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  private getRandomStyle(): string {
    const styles = ['casual', 'formal', 'streetwear', 'vintage', 'athletic', 'bohemian', 'minimalist', 'glamorous'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  private getRandomSeason(): 'spring' | 'summer' | 'fall' | 'winter' | 'all' {
    const seasons: ('spring' | 'summer' | 'fall' | 'winter' | 'all')[] = ['spring', 'summer', 'fall', 'winter', 'all'];
    return seasons[Math.floor(Math.random() * seasons.length)];
  }

  private generateItemData(rarity: CardRarity, category: string, style: string, season: string) {
    const rarityModifiers = {
      [CardRarity.COMMON]: { prefix: '', quality: 'Basic' },
      [CardRarity.UNCOMMON]: { prefix: 'Stylish ', quality: 'Quality' },
      [CardRarity.RARE]: { prefix: 'Designer ', quality: 'Premium' },
      [CardRarity.LEGENDARY]: { prefix: 'Luxury ', quality: 'Exclusive' },
      [CardRarity.MYTHIC]: { prefix: 'Mythical ', quality: 'Divine' },
    };

    const itemTemplates = {
      top: {
        items: ['Blouse', 'Shirt', 'Sweater', 'T-Shirt', 'Tank Top', 'Blazer', 'Cardigan'],
        materials: ['Cotton', 'Silk', 'Cashmere', 'Linen', 'Polyester', 'Wool'],
        colors: ['White', 'Black', 'Navy', 'Gray', 'Burgundy', 'Emerald', 'Coral'],
      },
      bottom: {
        items: ['Jeans', 'Trousers', 'Skirt', 'Shorts', 'Leggings', 'Pants', 'Chinos'],
        materials: ['Denim', 'Cotton', 'Wool', 'Linen', 'Polyester', 'Leather'],
        colors: ['Blue', 'Black', 'Gray', 'White', 'Brown', 'Navy', 'Khaki'],
      },
      shoes: {
        items: ['Sneakers', 'Boots', 'Heels', 'Flats', 'Sandals', 'Loafers', 'Oxfords'],
        materials: ['Leather', 'Canvas', 'Suede', 'Synthetic', 'Rubber', 'Patent Leather'],
        colors: ['Black', 'Brown', 'White', 'Navy', 'Tan', 'Red', 'Silver'],
      },
      jacket: {
        items: ['Jacket', 'Coat', 'Blazer', 'Hoodie', 'Vest', 'Bomber', 'Cardigan'],
        materials: ['Cotton', 'Wool', 'Leather', 'Denim', 'Polyester', 'Nylon'],
        colors: ['Black', 'Navy', 'Gray', 'Brown', 'Green', 'Burgundy', 'Camel'],
      },
      hat: {
        items: ['Cap', 'Beanie', 'Hat', 'Beret', 'Fedora', 'Bucket Hat', 'Headband'],
        materials: ['Cotton', 'Wool', 'Felt', 'Straw', 'Polyester', 'Leather'],
        colors: ['Black', 'Navy', 'Gray', 'Brown', 'Red', 'Blue', 'White'],
      },
      accessories: {
        items: ['Necklace', 'Bracelet', 'Watch', 'Earrings', 'Bag', 'Scarf', 'Belt'],
        materials: ['Gold', 'Silver', 'Leather', 'Silk', 'Cotton', 'Steel'],
        colors: ['Gold', 'Silver', 'Black', 'Brown', 'Red', 'Blue', 'Pink'],
      },
    };

    const template = itemTemplates[category as keyof typeof itemTemplates] || itemTemplates.top;
    const rarityMod = rarityModifiers[rarity];

    const itemName = template.items[Math.floor(Math.random() * template.items.length)];
    const material = template.materials[Math.floor(Math.random() * template.materials.length)];
    const color = template.colors[Math.floor(Math.random() * template.colors.length)];

    const title = `${rarityMod.prefix}${color} ${material} ${itemName}`;
    const description = `${rarityMod.quality} ${style} ${itemName.toLowerCase()} perfect for ${season} weather`;

    // Generate placeholder image URL (in production, this would be actual fashion images)
    const imageWidth = 300 + Math.floor(Math.random() * 100);
    const imageHeight = 400 + Math.floor(Math.random() * 100);
    const image = `https://picsum.photos/${imageWidth}/${imageHeight}?random=${Date.now()}`;

    return {
      title,
      description,
      image,
      color: color.toLowerCase(),
      material: material.toLowerCase(),
      style: style.toLowerCase(),
      fit: this.getRandomFit(),
      tags: [category, style, season, rarity, 'reward-item'],
    };
  }

  private getRandomFit(): string {
    const fits = ['regular', 'slim', 'loose', 'relaxed', 'tailored', 'oversized'];
    return fits[Math.floor(Math.random() * fits.length)];
  }

  private generateFallbackItem(rewardType: string): WardrobeRewardItem {
    return {
      image: `https://picsum.photos/300/400?random=${Date.now()}`,
      title: 'Reward T-Shirt',
      description: 'A comfortable cotton t-shirt received as a daily reward',
      tags: ['top', 'casual', 'reward-item'],
      color: 'white',
      material: 'cotton',
      style: 'casual',
      fit: 'regular',
      category: 'top',
      isNew: true,
      rewardType: rewardType as any,
      rewardRarity: CardRarity.COMMON,
      rewardDate: new Date(),
      isRewardItem: true,
      laundryStatus: 'clean',
      laundryHistory: [{
        status: 'clean',
        changedAt: new Date(),
        notes: 'Fallback reward item'
      }],
      timesWashed: 0,
      needsSpecialCare: false,
      purchasePrice: 0,
      purchaseDate: new Date(),
      purchaseCurrency: 'reward',
      timesWornInOutfits: 0,
      lastUsedInOutfit: undefined,
      outfitGenerationHistory: [],
    };
  }
}

export const wardrobeRewardService = WardrobeRewardService.getInstance();