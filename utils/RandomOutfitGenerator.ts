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
      // 1. Determine target style
      const targetStyle = options.style || this.selectRandomStyle(wardrobe);
      
      // 2. Filter wardrobe by style compatibility
      const compatibleItems = StyleCompatibility.filterByStyle(wardrobe, targetStyle);
      
      // 3. Select core pieces (top, bottom, shoes)
      const coreOutfit = this.selectCoreOutfit(compatibleItems, options);
      
      // 4. Add optional pieces (jacket, accessories)
      const completeOutfit = this.addOptionalPieces(coreOutfit, compatibleItems, options);
      
      // 5. Validate and improve color harmony
      const harmonizedOutfit = this.ensureColorHarmony(completeOutfit, compatibleItems);
      
      // 6. Convert to GearSlots format
      const gearSlots = this.convertToGearSlots(harmonizedOutfit);
      
      // 7. Track recently used items
      this.trackRecentlyUsed(harmonizedOutfit);
      
      const generationTime = Date.now() - startTime;
      const colorHarmony = StyleCompatibility.validateOutfitColorHarmony(
        Object.values(harmonizedOutfit).filter(item => item !== null)
      );
      const completeness = this.calculateCompleteness(harmonizedOutfit);

      return {
        outfit: gearSlots,
        style: targetStyle,
        colorHarmony,
        completeness,
        generationTime
      };
    } catch (error) {
      console.error('Error generating random outfit:', error);
      
      // Return empty outfit on error
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

    // Find the style with the most compatible items
    const styleCounts: Record<string, number> = {};
    
    Object.keys(STYLE_CATEGORIES).forEach(styleName => {
      const compatible = StyleCompatibility.filterByStyle(wardrobe, styleName);
      const totalItems = Object.values(compatible).reduce((sum, items) => sum + items.length, 0);
      styleCounts[styleName] = totalItems;
    });

    // Get top 3 styles and randomly pick from them
    const topStyles = Object.entries(styleCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([style]) => style);

    return topStyles[Math.floor(Math.random() * topStyles.length)] || 'casual';
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
    const createGearSlot = (item: WardrobeItem | null): GearSlot => ({
      itemId: item?.image || null,
      itemImage: item?.image || null,
      itemTitle: item?.title || null
    });

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