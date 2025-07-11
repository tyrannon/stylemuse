import { WardrobeItem } from '../hooks/useWardrobeData';
import { GearSlots, GearSlot } from '../hooks/useOutfitGeneration';
import { StyleCompatibility, FilteredWardrobe, STYLE_CATEGORIES } from './StyleCompatibility';

export interface RandomOutfitOptions {
  style?: string;
  colorScheme?: string;
  includeAccessories?: boolean;
  includeJacket?: boolean;
  avoidRecentlyWorn?: boolean;
  formalityLevel?: number;
  preferredColors?: string[];
}

export interface OutfitPieces {
  top: WardrobeItem | null;
  bottom: WardrobeItem | null;
  shoes: WardrobeItem | null;
  jacket: WardrobeItem | null;
  accessories: WardrobeItem | null;
}

export interface GenerationResult {
  outfit: GearSlots;
  style: string;
  colorHarmony: boolean;
  completeness: number; // Percentage of filled slots
  generationTime: number; // Time in milliseconds
}

export class RandomOutfitGenerator {
  private static recentlyUsedItems: Set<string> = new Set();
  private static readonly MAX_RECENT_ITEMS = 20;

  /**
   * Generate a random outfit from the given wardrobe
   */
  static generate(
    wardrobe: WardrobeItem[], 
    options: RandomOutfitOptions = {}
  ): GenerationResult {
    const startTime = Date.now();

    try {
      const targetStyle = options.style || 'casual';
      console.log('🎲 [RandomOutfit] Generating', targetStyle, 'outfit');
      
      // Get items by basic categorization 
      const allTops = wardrobe.filter(item => this.isCategory(item, 'tops'));
      const allBottoms = wardrobe.filter(item => this.isCategory(item, 'bottoms'));
      const allShoes = wardrobe.filter(item => this.isCategory(item, 'shoes'));
      const allJackets = wardrobe.filter(item => this.isCategory(item, 'jackets'));
      const allAccessories = wardrobe.filter(item => this.isCategory(item, 'accessories'));
      
      // Randomly select items from each category
      const outfit = {
        top: this.pickRandom(allTops),
        bottom: this.pickRandom(allBottoms),
        shoes: this.pickRandom(allShoes),
        jacket: options.includeJacket && Math.random() > 0.5 ? this.pickRandom(allJackets) : null,
        accessories: options.includeAccessories && Math.random() > 0.6 ? this.pickRandom(allAccessories) : null
      };
      
      // Ensure we have at least one piece
      if (!outfit.top && !outfit.bottom) {
        outfit.top = this.pickRandom(wardrobe);
      }
      
      const gearSlots = this.convertToGearSlots(outfit);
      const completeness = this.calculateCompleteness(outfit);
      
      console.log('✅ [RandomOutfit] Generated outfit with', completeness + '%', 'completeness');
      
      return {
        outfit: gearSlots,
        style: targetStyle,
        colorHarmony: true,
        completeness,
        generationTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('❌ [RandomOutfit] Generation failed:', error);
      
      return {
        outfit: this.getEmptyGearSlots(),
        style: 'casual',
        colorHarmony: false,
        completeness: 0,
        generationTime: Date.now() - startTime
      };
    }
  }

  /**
   * Simple category check using keywords
   */
  private static isCategory(item: WardrobeItem, category: string): boolean {
    if (!item?.title) return false;
    
    const title = item.title.toLowerCase();
    const itemCategory = item.category?.toLowerCase() || '';
    
    switch (category) {
      case 'tops':
        return itemCategory.includes('top') || 
               title.includes('shirt') || title.includes('blouse') || title.includes('top') || 
               title.includes('sweater') || title.includes('hoodie') || title.includes('tank');
      case 'bottoms':
        return itemCategory.includes('bottom') || 
               title.includes('pants') || title.includes('skirt') || title.includes('short') || 
               title.includes('jeans') || title.includes('dress');
      case 'shoes':
        return itemCategory.includes('shoe') || 
               title.includes('shoe') || title.includes('sneaker') || title.includes('boot') || 
               title.includes('sandal') || title.includes('heel');
      case 'jackets':
        return itemCategory.includes('jacket') || 
               title.includes('jacket') || title.includes('blazer') || title.includes('coat') || 
               title.includes('cardigan');
      case 'accessories':
        return itemCategory.includes('accessor') || 
               title.includes('bag') || title.includes('hat') || title.includes('scarf') || 
               title.includes('belt') || title.includes('jewelry');
      default:
        return false;
    }
  }

  /**
   * Pick a random item from an array
   */
  private static pickRandom<T>(items: T[]): T | null {
    if (items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)];
  }

  /**
   * Generate a random outfit for a specific piece (build around an item)
   */
  static generateAroundItem(
    centerItem: WardrobeItem,
    wardrobe: WardrobeItem[],
    options: RandomOutfitOptions = {}
  ): GenerationResult {
    const startTime = Date.now();

    try {
      // Determine what style works best with the center item
      const bestStyle = this.findBestStyleForItem(centerItem);
      const targetStyle = options.style || bestStyle;

      // Filter wardrobe and ensure center item is included
      const compatibleItems = StyleCompatibility.filterByStyle(wardrobe, targetStyle);
      const centerCategory = StyleCompatibility.categorizeItem(centerItem);

      // Start with the center item
      const outfit: OutfitPieces = {
        top: null,
        bottom: null,
        shoes: null,
        jacket: null,
        accessories: null
      };

      outfit[centerCategory as keyof OutfitPieces] = centerItem;

      // Fill remaining slots
      const remainingSlots = Object.keys(outfit).filter(
        slot => slot !== centerCategory && outfit[slot as keyof OutfitPieces] === null
      );

      remainingSlots.forEach(slot => {
        const items = compatibleItems[slot as keyof FilteredWardrobe];
        if (items.length > 0) {
          const compatibleWithCenter = items.filter(item => 
            StyleCompatibility.areColorsCompatible(centerItem.color || '', item.color || '')
          );
          
          const itemsToChooseFrom = compatibleWithCenter.length > 0 ? compatibleWithCenter : items;
          outfit[slot as keyof OutfitPieces] = this.selectRandomItem(itemsToChooseFrom, options);
        }
      });

      // Apply optional pieces logic
      if (!options.includeJacket || Math.random() < 0.3) {
        outfit.jacket = null;
      }
      
      if (!options.includeAccessories || Math.random() < 0.4) {
        outfit.accessories = null;
      }

      const gearSlots = this.convertToGearSlots(outfit);
      this.trackRecentlyUsed(outfit);

      const generationTime = Date.now() - startTime;
      const colorHarmony = StyleCompatibility.validateOutfitColorHarmony(
        Object.values(outfit).filter(item => item !== null)
      );
      const completeness = this.calculateCompleteness(outfit);

      return {
        outfit: gearSlots,
        style: targetStyle,
        colorHarmony,
        completeness,
        generationTime
      };
    } catch (error) {
      console.error('Error generating outfit around item:', error);
      return {
        outfit: this.getEmptyGearSlots(),
        style: 'casual',
        colorHarmony: false,
        completeness: 0,
        generationTime: Date.now() - startTime
      };
    }
  }

  /**
   * Select a random style based on wardrobe contents
   */
  private static selectRandomStyle(wardrobe: WardrobeItem[]): string {
    if (wardrobe.length === 0) return 'casual';

    try {
      console.log('🔧 [RandomOutfit] Analyzing wardrobe for best style...');
      
      // Find the style with the most compatible items
      const styleCounts: Record<string, number> = {};
      
      Object.keys(STYLE_CATEGORIES).forEach(styleName => {
        try {
          const compatible = StyleCompatibility.filterByStyle(wardrobe, styleName);
          const totalItems = Object.values(compatible).reduce((sum, items) => sum + items.length, 0);
          styleCounts[styleName] = totalItems;
          console.log(`🔧 [RandomOutfit] Style ${styleName}: ${totalItems} compatible items`);
        } catch (error) {
          console.error(`❌ [RandomOutfit] Error checking style ${styleName}:`, error);
          styleCounts[styleName] = 0;
        }
      });

      // Get top 3 styles and randomly pick from them
      const topStyles = Object.entries(styleCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([style]) => style);

      console.log('🔧 [RandomOutfit] Top styles:', topStyles);
      const selectedStyle = topStyles[Math.floor(Math.random() * topStyles.length)] || 'casual';
      console.log('🔧 [RandomOutfit] Selected style:', selectedStyle);
      
      return selectedStyle;
    } catch (error) {
      console.error('❌ [RandomOutfit] Error in selectRandomStyle:', error);
      return 'casual';
    }
  }

  /**
   * Select core outfit pieces (top, bottom, shoes)
   */
  private static selectCoreOutfit(
    compatibleItems: FilteredWardrobe, 
    options: RandomOutfitOptions
  ): OutfitPieces {
    const outfit: OutfitPieces = {
      top: this.selectRandomItem(compatibleItems.tops, options),
      bottom: this.selectRandomItem(compatibleItems.bottoms, options),
      shoes: this.selectRandomItem(compatibleItems.shoes, options),
      jacket: null,
      accessories: null
    };

    return outfit;
  }

  /**
   * Select core outfit pieces with fallbacks to ensure we have items
   */
  private static selectCoreOutfitWithFallbacks(
    compatibleItems: FilteredWardrobe,
    fullWardrobe: WardrobeItem[],
    options: RandomOutfitOptions
  ): OutfitPieces {
    // First try to get items from the compatible items
    let top = this.selectRandomItem(compatibleItems.tops, options);
    let bottom = this.selectRandomItem(compatibleItems.bottoms, options);
    let shoes = this.selectRandomItem(compatibleItems.shoes, options);

    // If we don't have essential pieces, fall back to any items from wardrobe
    if (!top && !bottom) {
      // We need at least one core piece - try to get any top or bottom
      const allTops = fullWardrobe.filter(item => {
        try {
          return StyleCompatibility.categorizeItem(item) === 'tops';
        } catch {
          return false;
        }
      });
      const allBottoms = fullWardrobe.filter(item => {
        try {
          return StyleCompatibility.categorizeItem(item) === 'bottoms';
        } catch {
          return false;
        }
      });

      if (allTops.length > 0) {
        top = this.selectRandomItem(allTops, options);
      }
      if (allBottoms.length > 0) {
        bottom = this.selectRandomItem(allBottoms, options);
      }
    }

    // If still no shoes, try to get any shoes
    if (!shoes) {
      const allShoes = fullWardrobe.filter(item => {
        try {
          return StyleCompatibility.categorizeItem(item) === 'shoes';
        } catch {
          return false;
        }
      });
      if (allShoes.length > 0) {
        shoes = this.selectRandomItem(allShoes, options);
      }
    }

    return {
      top,
      bottom,
      shoes,
      jacket: null,
      accessories: null
    };
  }

  /**
   * Add optional pieces (jacket, accessories) based on options and probability
   */
  private static addOptionalPieces(
    coreOutfit: OutfitPieces,
    compatibleItems: FilteredWardrobe,
    options: RandomOutfitOptions
  ): OutfitPieces {
    const outfit = { ...coreOutfit };

    // Add jacket with 40% probability (or if explicitly requested)
    if (options.includeJacket || (!options.includeJacket && Math.random() < 0.4)) {
      outfit.jacket = this.selectRandomItem(compatibleItems.jackets, options);
    }

    // Add accessories with 30% probability (or if explicitly requested)
    if (options.includeAccessories || (!options.includeAccessories && Math.random() < 0.3)) {
      outfit.accessories = this.selectRandomItem(compatibleItems.accessories, options);
    }

    return outfit;
  }

  /**
   * Select a random item from an array with various filters
   */
  private static selectRandomItem(
    items: WardrobeItem[], 
    options: RandomOutfitOptions
  ): WardrobeItem | null {
    if (items.length === 0) return null;

    let filteredItems = [...items];

    // Filter out recently used items if option is enabled
    if (options.avoidRecentlyWorn) {
      const nonRecentItems = filteredItems.filter(item => 
        !this.recentlyUsedItems.has(item.image || item.title || '')
      );
      
      if (nonRecentItems.length > 0) {
        filteredItems = nonRecentItems;
      }
    }

    // Filter by preferred colors if specified
    if (options.preferredColors && options.preferredColors.length > 0) {
      const colorMatchItems = filteredItems.filter(item =>
        options.preferredColors!.some(prefColor =>
          StyleCompatibility.areColorsCompatible(item.color || '', prefColor)
        )
      );
      
      if (colorMatchItems.length > 0) {
        filteredItems = colorMatchItems;
      }
    }

    // Select random item from filtered list
    const randomIndex = Math.floor(Math.random() * filteredItems.length);
    return filteredItems[randomIndex];
  }

  /**
   * Ensure color harmony by potentially swapping items
   */
  private static ensureColorHarmony(
    outfit: OutfitPieces, 
    compatibleItems: FilteredWardrobe
  ): OutfitPieces {
    const items = Object.values(outfit).filter(item => item !== null) as WardrobeItem[];
    
    // If already harmonious, return as-is
    if (StyleCompatibility.validateOutfitColorHarmony(items)) {
      return outfit;
    }

    // Try to fix color harmony by replacing one item at a time
    const result = { ...outfit };
    const slots = ['top', 'bottom', 'shoes', 'jacket', 'accessories'] as const;

    for (const slot of slots) {
      if (!result[slot]) continue;

      const currentItem = result[slot];
      const otherItems = Object.values(result)
        .filter(item => item !== null && item !== currentItem) as WardrobeItem[];

      // Try to find a replacement that works better with other items
      const alternatives = compatibleItems[slot === 'accessories' ? 'accessories' : 
                                        slot === 'jacket' ? 'jackets' :
                                        slot + 's' as keyof FilteredWardrobe];

      for (const alternative of alternatives) {
        if (alternative === currentItem) continue;

        const testItems = otherItems.concat(alternative);
        if (StyleCompatibility.validateOutfitColorHarmony(testItems)) {
          result[slot] = alternative;
          break;
        }
      }

      // Check if we fixed the harmony
      const finalItems = Object.values(result).filter(item => item !== null) as WardrobeItem[];
      if (StyleCompatibility.validateOutfitColorHarmony(finalItems)) {
        break;
      }
    }

    return result;
  }

  /**
   * Convert OutfitPieces to GearSlots format
   */
  private static convertToGearSlots(outfit: OutfitPieces): GearSlots {
    const createGearSlot = (item: WardrobeItem | null): GearSlot => {
      if (!item) {
        return { itemId: null, itemImage: null, itemTitle: null };
      }
      
      return {
        itemId: item.image || null,
        itemImage: item.image || null,
        itemTitle: item.title || null
      };
    };

    return {
      top: createGearSlot(outfit.top),
      bottom: createGearSlot(outfit.bottom),
      shoes: createGearSlot(outfit.shoes),
      jacket: createGearSlot(outfit.jacket),
      hat: { itemId: null, itemImage: null, itemTitle: null }, // Not used in random generation yet
      accessories: createGearSlot(outfit.accessories)
    };
  }

  /**
   * Track recently used items to avoid repetition
   */
  private static trackRecentlyUsed(outfit: OutfitPieces): void {
    Object.values(outfit).forEach(item => {
      if (item) {
        const itemKey = item.image || item.title || '';
        this.recentlyUsedItems.add(itemKey);
      }
    });

    // Limit size of recently used set
    if (this.recentlyUsedItems.size > this.MAX_RECENT_ITEMS) {
      const itemsArray = Array.from(this.recentlyUsedItems);
      this.recentlyUsedItems = new Set(itemsArray.slice(-this.MAX_RECENT_ITEMS));
    }
  }

  /**
   * Calculate outfit completeness percentage
   */
  private static calculateCompleteness(outfit: OutfitPieces): number {
    const coreSlots = ['top', 'bottom', 'shoes'];
    const filledCore = coreSlots.filter(slot => outfit[slot as keyof OutfitPieces] !== null).length;
    const coreCompleteness = (filledCore / coreSlots.length) * 100;

    // Bonus points for optional pieces
    const optionalBonus = (outfit.jacket ? 10 : 0) + (outfit.accessories ? 10 : 0);
    
    return Math.min(100, coreCompleteness + optionalBonus);
  }

  /**
   * Find the best style for a specific item
   */
  private static findBestStyleForItem(item: WardrobeItem): string {
    const scores: Record<string, number> = {};

    Object.entries(STYLE_CATEGORIES).forEach(([styleName, style]) => {
      scores[styleName] = StyleCompatibility.isItemCompatibleWithStyle(item, style) ? 1 : 0;
    });

    return Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0] || 'casual';
  }

  /**
   * Get empty gear slots
   */
  private static getEmptyGearSlots(): GearSlots {
    const emptySlot: GearSlot = { itemId: null, itemImage: null, itemTitle: null };
    
    return {
      top: emptySlot,
      bottom: emptySlot,
      shoes: emptySlot,
      jacket: emptySlot,
      hat: emptySlot,
      accessories: emptySlot
    };
  }

  /**
   * Clear recently used items (useful for testing or user preference)
   */
  static clearRecentlyUsed(): void {
    this.recentlyUsedItems.clear();
  }

  /**
   * Get statistics about generation capabilities for a wardrobe
   */
  static getWardrobeStats(wardrobe: WardrobeItem[]): {
    totalItems: number;
    byCategory: Record<string, number>;
    byStyle: Record<string, number>;
    estimatedCombinations: number;
  } {
    const stats = {
      totalItems: wardrobe.length,
      byCategory: {} as Record<string, number>,
      byStyle: {} as Record<string, number>,
      estimatedCombinations: 0
    };

    // Count by category
    wardrobe.forEach(item => {
      const category = StyleCompatibility.categorizeItem(item);
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });

    // Count by style compatibility
    Object.keys(STYLE_CATEGORIES).forEach(styleName => {
      const compatible = StyleCompatibility.filterByStyle(wardrobe, styleName);
      const total = Object.values(compatible).reduce((sum, items) => sum + items.length, 0);
      stats.byStyle[styleName] = total;
    });

    // Estimate possible combinations (simplified)
    const tops = stats.byCategory.tops || 0;
    const bottoms = stats.byCategory.bottoms || 0;
    const shoes = stats.byCategory.shoes || 0;
    stats.estimatedCombinations = tops * bottoms * shoes;

    return stats;
  }
}