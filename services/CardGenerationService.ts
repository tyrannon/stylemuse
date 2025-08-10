import { StyleCard, CardRarity, CardType, StyleAttribute, RARITY_RATES, RARITY_MULTIPLIERS } from '../types/StyleCards';
import { WardrobeItem } from '../types/WardrobeTypes';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CardGenerationOptions {
  forceRarity?: CardRarity;
  preferredType?: CardType;
  guaranteedHolographic?: boolean;
  basedOnWardrobeItem?: WardrobeItem;
}

class CardGenerationService {
  private static instance: CardGenerationService;
  private cardDatabase: StyleCard[] = [];

  static getInstance(): CardGenerationService {
    if (!CardGenerationService.instance) {
      CardGenerationService.instance = new CardGenerationService();
    }
    return CardGenerationService.instance;
  }

  // Generate random rarity based on rates
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

  // Generate style card based on wardrobe item
  generateCardFromWardrobeItem(item: WardrobeItem, options: CardGenerationOptions = {}): StyleCard {
    const rarity = options.forceRarity || this.generateRandomRarity();
    const isHolographic = options.guaranteedHolographic || (rarity >= CardRarity.RARE && Math.random() < 0.15);
    const isShiny = rarity >= CardRarity.LEGENDARY && Math.random() < 0.05;

    // Convert wardrobe item type to card type
    const cardType = this.mapWardrobeTypeToCardType(item.type);
    
    // Generate style points based on AI analysis and rarity
    const baseStylePoints = this.calculateBaseStylePoints(item);
    const stylePoints = Math.round(baseStylePoints * RARITY_MULTIPLIERS[rarity]);

    // Generate attributes based on item properties
    const attributes = this.extractStyleAttributes(item);

    const card: StyleCard = {
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: this.generateCardName(item, rarity),
      description: this.generateCardDescription(item, rarity),
      type: cardType,
      rarity,
      
      // Stats
      stylePoints,
      versatility: this.calculateVersatility(item, rarity),
      trendiness: this.calculateTrendiness(item, rarity),
      occasionMatch: this.calculateOccasionMatch(item, rarity),
      
      // Visual
      imageUrl: item.imageUrl,
      isHolographic,
      isShiny,
      
      // Style attributes
      primaryAttribute: attributes.primary,
      secondaryAttribute: attributes.secondary,
      
      // Metadata
      season: this.determineSeason(item),
      colors: item.colors || [],
      tags: this.generateTags(item, rarity),
      
      // Gamification
      dateObtained: new Date(),
      timesUsed: 0,
      favorited: false,
      rarityMultiplier: RARITY_MULTIPLIERS[rarity],
      specialAbility: rarity >= CardRarity.LEGENDARY ? this.generateSpecialAbility(item, rarity) : undefined,
    };

    logger.info(LogCategories.GAMIFICATION, 'Generated style card from wardrobe item', {
      itemId: item.id,
      cardRarity: rarity,
      stylePoints,
      isHolographic,
      specialAbility: card.specialAbility
    });

    return card;
  }

  // Generate random card (for packs)
  generateRandomCard(options: CardGenerationOptions = {}): StyleCard {
    const rarity = options.forceRarity || this.generateRandomRarity();
    const type = options.preferredType || this.getRandomCardType();
    const isHolographic = options.guaranteedHolographic || (rarity >= CardRarity.RARE && Math.random() < 0.15);
    
    // Generate random attributes for fantasy cards
    const mockItem = this.generateMockWardrobeItem(type, rarity);
    
    return this.generateCardFromWardrobeItem(mockItem, { ...options, forceRarity: rarity });
  }

  // Generate multiple cards for pack opening
  generateCardsForPack(count: number, guaranteedRarity?: CardRarity): StyleCard[] {
    const cards: StyleCard[] = [];
    
    // First card is guaranteed rarity if specified
    if (guaranteedRarity) {
      cards.push(this.generateRandomCard({ forceRarity: guaranteedRarity }));
      count--;
    }
    
    // Generate remaining cards
    for (let i = 0; i < count; i++) {
      cards.push(this.generateRandomCard());
    }
    
    logger.info(LogCategories.GAMIFICATION, 'Generated pack cards', {
      cardCount: cards.length,
      guaranteedRarity,
      rarities: cards.map(c => c.rarity)
    });
    
    return cards;
  }

  // Private helper methods
  private mapWardrobeTypeToCardType(wardrobeType: string): CardType {
    const typeMap: { [key: string]: CardType } = {
      'top': CardType.TOP,
      'bottom': CardType.BOTTOM,
      'shoes': CardType.SHOES,
      'accessory': CardType.ACCESSORY,
      'jacket': CardType.TOP,
      'dress': CardType.FULL_OUTFIT,
    };
    
    return typeMap[wardrobeType.toLowerCase()] || CardType.ACCESSORY;
  }

  private calculateBaseStylePoints(item: WardrobeItem): number {
    // Base calculation from item metadata
    let points = 50; // Base points
    
    // Add points based on AI analysis if available
    if (item.aiAnalysis) {
      points += Math.round(item.aiAnalysis.styleScore * 30);
    }
    
    // Add points for premium brands/materials
    if (item.brand && ['designer', 'luxury', 'premium'].some(keyword => 
      item.brand?.toLowerCase().includes(keyword))) {
      points += 15;
    }
    
    // Add points for versatility (how well it pairs)
    points += Math.random() * 20; // 0-20 random points
    
    return Math.min(Math.max(points, 20), 80); // Clamp between 20-80
  }

  private calculateVersatility(item: WardrobeItem, rarity: CardRarity): number {
    let versatility = 5; // Base versatility
    
    // Rarity bonus
    const rarityBonus = {
      [CardRarity.COMMON]: 0,
      [CardRarity.UNCOMMON]: 1,
      [CardRarity.RARE]: 2,
      [CardRarity.LEGENDARY]: 3,
      [CardRarity.MYTHIC]: 4,
    };
    
    versatility += rarityBonus[rarity];
    versatility += Math.round(Math.random() * 3); // 0-3 random
    
    return Math.min(Math.max(versatility, 1), 10);
  }

  private calculateTrendiness(item: WardrobeItem, rarity: CardRarity): number {
    let trendiness = 5; // Base trendiness
    
    // Recent items are more trendy
    const daysSinceAdded = item.dateAdded ? 
      (Date.now() - new Date(item.dateAdded).getTime()) / (1000 * 60 * 60 * 24) : 30;
    
    if (daysSinceAdded < 30) trendiness += 2;
    else if (daysSinceAdded < 90) trendiness += 1;
    
    // Rarity affects trendiness
    if (rarity >= CardRarity.RARE) trendiness += 2;
    if (rarity >= CardRarity.LEGENDARY) trendiness += 1;
    
    trendiness += Math.round(Math.random() * 2); // 0-2 random
    
    return Math.min(Math.max(trendiness, 1), 10);
  }

  private calculateOccasionMatch(item: WardrobeItem, rarity: CardRarity): number {
    let occasionMatch = 5; // Base occasion match
    
    // Formal items have higher occasion match
    const formalKeywords = ['suit', 'dress', 'formal', 'business', 'wedding'];
    if (formalKeywords.some(keyword => 
      item.description?.toLowerCase().includes(keyword) || 
      item.category?.toLowerCase().includes(keyword))) {
      occasionMatch += 3;
    }
    
    // Rarity bonus
    if (rarity >= CardRarity.RARE) occasionMatch += 1;
    if (rarity >= CardRarity.LEGENDARY) occasionMatch += 1;
    
    occasionMatch += Math.round(Math.random() * 2); // 0-2 random
    
    return Math.min(Math.max(occasionMatch, 1), 10);
  }

  private extractStyleAttributes(item: WardrobeItem): { primary: StyleAttribute; secondary?: StyleAttribute } {
    // Simple mapping based on item properties
    const attributes = Object.values(StyleAttribute);
    
    // Try to match based on description/category
    let primary = StyleAttribute.CASUAL; // Default
    
    if (item.description || item.category) {
      const text = `${item.description || ''} ${item.category || ''}`.toLowerCase();
      
      if (text.includes('formal') || text.includes('business') || text.includes('suit')) {
        primary = StyleAttribute.FORMAL;
      } else if (text.includes('casual') || text.includes('everyday')) {
        primary = StyleAttribute.CASUAL;
      } else if (text.includes('vintage') || text.includes('retro')) {
        primary = StyleAttribute.VINTAGE;
      } else if (text.includes('athletic') || text.includes('sport')) {
        primary = StyleAttribute.ATHLETIC;
      } else if (text.includes('glamorous') || text.includes('party') || text.includes('evening')) {
        primary = StyleAttribute.GLAMOROUS;
      }
    }
    
    // Sometimes add secondary attribute
    const secondary = Math.random() < 0.3 ? 
      attributes[Math.floor(Math.random() * attributes.length)] : undefined;
    
    return { primary, secondary: secondary !== primary ? secondary : undefined };
  }

  private determineSeason(item: WardrobeItem): 'spring' | 'summer' | 'fall' | 'winter' | 'all' {
    if (item.description || item.category) {
      const text = `${item.description || ''} ${item.category || ''}`.toLowerCase();
      
      if (text.includes('winter') || text.includes('coat') || text.includes('wool')) return 'winter';
      if (text.includes('summer') || text.includes('shorts') || text.includes('tank')) return 'summer';
      if (text.includes('spring')) return 'spring';
      if (text.includes('fall') || text.includes('autumn')) return 'fall';
    }
    
    return 'all'; // Default to all seasons
  }

  private generateTags(item: WardrobeItem, rarity: CardRarity): string[] {
    const tags: string[] = [];
    
    // Add type-based tags
    tags.push(item.type || 'clothing');
    
    // Add rarity tag
    tags.push(rarity);
    
    // Add color tags
    if (item.colors) {
      tags.push(...item.colors.slice(0, 2)); // Max 2 color tags
    }
    
    // Add category tag
    if (item.category) {
      tags.push(item.category.toLowerCase());
    }
    
    // Add special tags for rare items
    if (rarity >= CardRarity.RARE) {
      tags.push('premium');
    }
    
    if (rarity >= CardRarity.LEGENDARY) {
      tags.push('exclusive');
    }
    
    return tags.slice(0, 5); // Max 5 tags
  }

  private generateCardName(item: WardrobeItem, rarity: CardRarity): string {
    const rarityPrefixes = {
      [CardRarity.COMMON]: '',
      [CardRarity.UNCOMMON]: 'Stylish ',
      [CardRarity.RARE]: 'Designer ',
      [CardRarity.LEGENDARY]: 'Legendary ',
      [CardRarity.MYTHIC]: 'Mythic ',
    };
    
    const baseName = item.description || item.category || 'Fashion Item';
    return `${rarityPrefixes[rarity]}${baseName}`;
  }

  private generateCardDescription(item: WardrobeItem, rarity: CardRarity): string {
    const descriptions = {
      [CardRarity.COMMON]: 'A reliable fashion choice for everyday wear.',
      [CardRarity.UNCOMMON]: 'A stylish piece that stands out from the crowd.',
      [CardRarity.RARE]: 'An exceptional item that elevates any outfit.',
      [CardRarity.LEGENDARY]: 'A legendary fashion piece that defines true style.',
      [CardRarity.MYTHIC]: 'A mythical garment that transcends fashion itself.',
    };
    
    return item.description || descriptions[rarity];
  }

  private generateSpecialAbility(item: WardrobeItem, rarity: CardRarity): string {
    const abilities = [
      'Charm +25% for social occasions',
      'Professional presence +50% in business settings',
      'Confidence boost +30% for presentations',
      'Style multiplier x2 for evening events',
      'Versatility bonus: pairs well with any outfit',
      'Trending factor: increases outfit visibility by 40%',
      'Seasonal adaptation: works perfectly in any weather',
      'Compliment magnet: attracts positive attention',
    ];
    
    return abilities[Math.floor(Math.random() * abilities.length)];
  }

  private getRandomCardType(): CardType {
    const types = Object.values(CardType);
    return types[Math.floor(Math.random() * types.length)];
  }

  private generateMockWardrobeItem(type: CardType, rarity: CardRarity): WardrobeItem {
    const mockNames = {
      [CardType.TOP]: ['Classic Blazer', 'Silk Blouse', 'Cashmere Sweater', 'Vintage Tee'],
      [CardType.BOTTOM]: ['Tailored Trousers', 'Designer Jeans', 'Elegant Skirt', 'Chic Shorts'],
      [CardType.SHOES]: ['Leather Loafers', 'Stiletto Heels', 'Designer Sneakers', 'Ankle Boots'],
      [CardType.ACCESSORY]: ['Gold Watch', 'Silk Scarf', 'Pearl Necklace', 'Designer Bag'],
      [CardType.FULL_OUTFIT]: ['Evening Gown', 'Power Suit', 'Cocktail Dress', 'Casual Set'],
      [CardType.STYLE_BOOST]: ['Confidence Booster', 'Style Multiplier', 'Trend Setter', 'Charm Enhancer'],
    };
    
    const names = mockNames[type] || ['Fashion Item'];
    const name = names[Math.floor(Math.random() * names.length)];
    
    return {
      id: `mock_${Date.now()}`,
      type: type.toLowerCase(),
      description: name,
      category: type,
      imageUrl: undefined,
      colors: ['black', 'white'],
      dateAdded: new Date().toISOString(),
    } as WardrobeItem;
  }
}

export const cardGenerationService = CardGenerationService.getInstance();