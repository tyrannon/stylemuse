// Style Card system types - Pokemon TCG inspired

export enum CardRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon', 
  RARE = 'rare',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic'
}

export enum CardType {
  TOP = 'top',
  BOTTOM = 'bottom',
  SHOES = 'shoes',
  ACCESSORY = 'accessory',
  FULL_OUTFIT = 'full_outfit',
  STYLE_BOOST = 'style_boost'
}

export enum StyleAttribute {
  CASUAL = 'casual',
  FORMAL = 'formal',
  STREETWEAR = 'streetwear',
  VINTAGE = 'vintage',
  ATHLETIC = 'athletic',
  BOHEMIAN = 'bohemian',
  MINIMALIST = 'minimalist',
  GLAMOROUS = 'glamorous'
}

export interface StyleCard {
  id: string;
  name: string;
  description: string;
  type: CardType;
  rarity: CardRarity;
  
  // Card stats (Pokemon-style)
  stylePoints: number;      // Base power (1-100)
  versatility: number;      // How well it pairs with other items (1-10)
  trendiness: number;       // Current fashion relevance (1-10)
  occasionMatch: number;    // Situational appropriateness (1-10)
  
  // Visual properties
  imageUrl?: string;        // Card artwork
  isHolographic: boolean;   // Special animated version
  isShiny: boolean;         // Rare alternate coloring
  
  // Style attributes
  primaryAttribute: StyleAttribute;
  secondaryAttribute?: StyleAttribute;
  
  // Metadata
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'all';
  colors: string[];         // Primary colors in the item
  tags: string[];          // Descriptive tags
  
  // Gamification
  dateObtained: Date;
  timesUsed: number;       // Track usage in outfits
  favorited: boolean;
  
  // Rarity specific properties
  rarityMultiplier: number; // Style points multiplier based on rarity
  specialAbility?: string;  // Legendary/Mythic cards have special abilities
}

export interface StylePack {
  id: string;
  name: string;
  description: string;
  type: 'free_daily' | 'premium' | 'event' | 'achievement';
  
  // Contents
  cardCount: number;          // Number of cards in pack
  guaranteedRarity?: CardRarity; // Minimum rarity guarantee
  
  // Cost and availability
  costCoins?: number;         // Style Coins cost
  costGems?: number;          // Fashion Gems cost
  isFree: boolean;
  
  // Pack opening animation
  packArtUrl?: string;
  openingAnimation: 'standard' | 'premium' | 'legendary';
  
  // Metadata
  isLimitedTime: boolean;
  expirationDate?: Date;
  totalOpened: number;        // Track how many opened
}

export interface CardCollection {
  userId: string;
  cards: StyleCard[];
  
  // Collection stats
  totalCards: number;
  uniqueCards: number;
  completionPercentage: number;
  
  // Rarity counts
  commonCount: number;
  uncommonCount: number;
  rareCount: number;
  legendaryCount: number;
  mythicCount: number;
  
  // Special collections
  holographicCount: number;
  shinyCount: number;
  
  // Achievement tracking
  collectionLevel: number;      // Based on total cards and rarities
  prestigeRank: string;        // Title based on collection achievements
  
  lastUpdated: Date;
}

export interface StyleCurrency {
  userId: string;
  
  // Primary currencies
  styleCoins: number;          // Earned through gameplay
  fashionGems: number;         // Premium currency (purchased/rare rewards)
  
  // Special currencies
  dustParticles: number;       // From duplicate cards (crafting)
  trophyTokens: number;        // From battle victories
  
  // Lifetime stats
  totalCoinsEarned: number;
  totalGemsEarned: number;
  totalSpent: number;
  
  lastUpdated: Date;
}

export interface CardTradeOffer {
  id: string;
  fromUserId: string;
  toUserId: string;
  
  // Cards being traded
  offeredCards: StyleCard[];
  requestedCards: StyleCard[];
  
  // Additional currency offers
  offeredCoins?: number;
  offeredGems?: number;
  
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expirationDate: Date;
  createdAt: Date;
}

// Rarity configuration for pack generation
export const RARITY_RATES = {
  [CardRarity.COMMON]: 0.60,      // 60%
  [CardRarity.UNCOMMON]: 0.25,    // 25%
  [CardRarity.RARE]: 0.10,        // 10%
  [CardRarity.LEGENDARY]: 0.04,   // 4%
  [CardRarity.MYTHIC]: 0.01       // 1%
} as const;

// Style points multipliers by rarity
export const RARITY_MULTIPLIERS = {
  [CardRarity.COMMON]: 1.0,
  [CardRarity.UNCOMMON]: 1.2,
  [CardRarity.RARE]: 1.5,
  [CardRarity.LEGENDARY]: 2.0,
  [CardRarity.MYTHIC]: 3.0
} as const;

// Pack costs and rewards
export const PACK_CONFIG = {
  FREE_DAILY: {
    costCoins: 0,
    costGems: 0,
    cardCount: 3,
    cooldownHours: 24
  },
  STANDARD: {
    costCoins: 500,
    costGems: 0,
    cardCount: 5,
    cooldownHours: 0
  },
  PREMIUM: {
    costCoins: 0,
    costGems: 100,
    cardCount: 8,
    guaranteedRare: true,
    cooldownHours: 0
  },
  LEGENDARY: {
    costCoins: 0,
    costGems: 500,
    cardCount: 12,
    guaranteedLegendary: true,
    cooldownHours: 0
  }
} as const;