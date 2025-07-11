import { WardrobeItem } from '../hooks/useWardrobeData';

export interface StyleCategory {
  name: string;
  tops: string[];
  bottoms: string[];
  shoes: string[];
  jackets: string[];
  accessories: string[];
  formality: [number, number]; // Min and max formality level (1-10)
  colors: string[];
  occasionTags: string[];
}

export interface FilteredWardrobe {
  tops: WardrobeItem[];
  bottoms: WardrobeItem[];
  shoes: WardrobeItem[];
  jackets: WardrobeItem[];
  accessories: WardrobeItem[];
}

export interface ColorGroup {
  name: string;
  colors: string[];
  compatibleWith: string[];
}

// Style categories with compatibility rules
export const STYLE_CATEGORIES: Record<string, StyleCategory> = {
  casual: {
    name: 'Casual',
    tops: ['t-shirt', 'tank', 'hoodie', 'sweater', 'casual-blouse', 'graphic-tee', 'polo'],
    bottoms: ['jeans', 'joggers', 'shorts', 'leggings', 'casual-pants', 'denim-skirt'],
    shoes: ['sneakers', 'flats', 'casual-boots', 'sandals', 'slip-on'],
    jackets: ['denim-jacket', 'cardigan', 'bomber', 'zip-hoodie', 'flannel'],
    accessories: ['casual-bag', 'baseball-cap', 'sunglasses', 'crossbody-bag'],
    formality: [1, 4],
    colors: ['any'], // Most flexible with colors
    occasionTags: ['everyday', 'weekend', 'casual', 'relaxed', 'comfortable']
  },

  business: {
    name: 'Business',
    tops: ['blouse', 'button-down', 'blazer', 'dress-shirt', 'professional-sweater'],
    bottoms: ['slacks', 'pencil-skirt', 'dress-pants', 'business-dress', 'suit-pants'],
    shoes: ['heels', 'loafers', 'oxfords', 'professional-flats', 'dress-boots'],
    jackets: ['blazer', 'suit-jacket', 'professional-cardigan', 'trench-coat'],
    accessories: ['professional-bag', 'watch', 'minimalist-jewelry', 'briefcase'],
    formality: [6, 9],
    colors: ['navy', 'black', 'gray', 'white', 'burgundy', 'charcoal'],
    occasionTags: ['work', 'professional', 'business', 'formal', 'office']
  },

  sporty: {
    name: 'Sporty',
    tops: ['athletic-top', 'sports-bra', 'tank', 'athletic-hoodie', 'performance-tee'],
    bottoms: ['leggings', 'athletic-shorts', 'joggers', 'track-pants', 'bike-shorts'],
    shoes: ['athletic-shoes', 'running-shoes', 'cross-trainers', 'gym-shoes'],
    jackets: ['track-jacket', 'athletic-hoodie', 'windbreaker', 'sports-vest'],
    accessories: ['gym-bag', 'fitness-tracker', 'athletic-cap', 'water-bottle'],
    formality: [1, 2],
    colors: ['bright', 'neon', 'black', 'gray', 'white', 'athletic-colors'],
    occasionTags: ['workout', 'athletic', 'gym', 'sports', 'active']
  },

  date_night: {
    name: 'Date Night',
    tops: ['dressy-blouse', 'silk-top', 'bodysuit', 'wrap-top', 'elegant-sweater'],
    bottoms: ['midi-skirt', 'dress-pants', 'elegant-dress', 'high-waisted-pants'],
    shoes: ['heels', 'elegant-flats', 'ankle-boots', 'dress-sandals'],
    jackets: ['blazer', 'elegant-cardigan', 'leather-jacket', 'wrap-coat'],
    accessories: ['clutch', 'statement-jewelry', 'elegant-scarf', 'designer-bag'],
    formality: [5, 8],
    colors: ['black', 'navy', 'burgundy', 'emerald', 'gold', 'deep-colors'],
    occasionTags: ['date', 'romantic', 'evening', 'elegant', 'dressy']
  },

  weekend: {
    name: 'Weekend',
    tops: ['comfortable-sweater', 'flannel', 'cozy-top', 'oversized-tee', 'soft-blouse'],
    bottoms: ['comfortable-jeans', 'joggers', 'maxi-skirt', 'leggings', 'casual-dress'],
    shoes: ['comfortable-sneakers', 'boots', 'slip-on-shoes', 'casual-sandals'],
    jackets: ['cozy-cardigan', 'denim-jacket', 'flannel-shirt', 'casual-blazer'],
    accessories: ['crossbody-bag', 'cozy-scarf', 'casual-hat', 'tote-bag'],
    formality: [1, 3],
    colors: ['earth-tones', 'neutrals', 'cozy-colors', 'warm-colors'],
    occasionTags: ['weekend', 'leisure', 'comfortable', 'relaxed', 'cozy']
  },

  party: {
    name: 'Party',
    tops: ['party-top', 'sequin-top', 'silk-blouse', 'bodysuit', 'crop-top'],
    bottoms: ['mini-skirt', 'party-dress', 'high-waisted-pants', 'leather-pants'],
    shoes: ['heels', 'party-shoes', 'statement-boots', 'platform-shoes'],
    jackets: ['leather-jacket', 'blazer', 'kimono', 'statement-coat'],
    accessories: ['clutch', 'statement-jewelry', 'party-bag', 'bold-accessories'],
    formality: [4, 7],
    colors: ['bold', 'metallic', 'bright', 'black', 'jewel-tones'],
    occasionTags: ['party', 'nightout', 'celebration', 'fun', 'bold']
  }
};

// Color harmony system
export const COLOR_HARMONY = {
  // Universal colors that work with everything
  universals: ['black', 'white', 'gray', 'grey', 'navy', 'denim', 'nude', 'beige'],

  // Color groups that work well together
  groups: {
    earth: ['brown', 'tan', 'olive', 'rust', 'cream', 'khaki', 'camel'],
    jewel: ['emerald', 'sapphire', 'ruby', 'amethyst', 'gold', 'deep-purple'],
    pastels: ['pink', 'lavender', 'mint', 'peach', 'powder-blue', 'pale-yellow'],
    monochrome: ['black', 'gray', 'white', 'charcoal'],
    warm: ['red', 'orange', 'yellow', 'coral', 'warm-pink', 'rust'],
    cool: ['blue', 'green', 'purple', 'teal', 'cool-pink', 'mint'],
    bright: ['neon', 'electric-blue', 'hot-pink', 'lime-green', 'bright-yellow'],
    neutrals: ['beige', 'cream', 'tan', 'taupe', 'mushroom', 'stone']
  },

  // Combinations that always work
  safeCombos: [
    ['black', 'white'],
    ['navy', 'white'],
    ['gray', '*'], // Gray works with anything
    ['grey', '*'], // British spelling
    ['denim', 'white'],
    ['black', 'gray'],
    ['navy', 'beige'],
    ['white', '*'], // White works with anything
    ['beige', 'brown'],
    ['navy', 'gold']
  ]
};

export class StyleCompatibility {
  /**
   * Filter wardrobe items by style compatibility
   */
  static filterByStyle(wardrobe: WardrobeItem[], styleName: string): FilteredWardrobe {
    const style = STYLE_CATEGORIES[styleName];
    if (!style) {
      throw new Error(`Unknown style: ${styleName}`);
    }

    const filtered: FilteredWardrobe = {
      tops: [],
      bottoms: [],
      shoes: [],
      jackets: [],
      accessories: []
    };

    // Pre-filter to remove any null/undefined items
    const validItems = wardrobe.filter((item, index) => {
      if (!item || typeof item !== 'object') {
        console.warn(`⚠️ [StyleCompatibility] Skipping invalid item at index ${index}`);
        return false;
      }
      return true;
    });

    validItems.forEach((item) => {
      try {
        const category = this.categorizeItem(item);
        const isCompatible = this.isItemCompatibleWithStyle(item, style);
        
        if (isCompatible && category in filtered) {
          filtered[category as keyof FilteredWardrobe].push(item);
        }
      } catch (error) {
        console.error(`❌ [StyleCompatibility] Error processing item ${item.title || 'Untitled'}:`, error);
      }
    });

    return filtered;
  }

  /**
   * Categorize a wardrobe item
   */
  static categorizeItem(item: WardrobeItem): string {
    if (!item || typeof item !== 'object') {
      console.warn('⚠️ [StyleCompatibility] categorizeItem called with invalid item:', item);
      return 'tops'; // Default fallback
    }
    
    try {
      const category = item.category?.toLowerCase?.() || '';
      const tags = Array.isArray(item.tags) ? 
        item.tags.map(tag => typeof tag === 'string' ? tag.toLowerCase() : '').filter(Boolean) : 
        [];
      const title = typeof item.title === 'string' ? item.title.toLowerCase() : '';

      // Check category first
      if (category === 'tops' || category === 'top') return 'tops';
      if (category === 'bottoms' || category === 'bottom') return 'bottoms';
      if (category === 'shoes' || category === 'shoe') return 'shoes';
      if (category === 'jackets' || category === 'jacket') return 'jackets';
      if (category === 'accessories' || category === 'accessory') return 'accessories';

      // Check tags and title for classification
      const topKeywords = ['shirt', 'blouse', 'top', 'sweater', 'hoodie', 't-shirt', 'tank', 'polo'];
      const bottomKeywords = ['pants', 'jeans', 'skirt', 'shorts', 'leggings', 'dress'];
      const shoeKeywords = ['shoes', 'sneakers', 'boots', 'heels', 'flats', 'sandals'];
      const jacketKeywords = ['jacket', 'blazer', 'coat', 'cardigan', 'vest'];
      const accessoryKeywords = ['bag', 'hat', 'scarf', 'jewelry', 'belt', 'watch'];

      if (topKeywords.some(keyword => title.includes(keyword) || tags.includes(keyword))) {
        return 'tops';
      }
      if (bottomKeywords.some(keyword => title.includes(keyword) || tags.includes(keyword))) {
        return 'bottoms';
      }
      if (shoeKeywords.some(keyword => title.includes(keyword) || tags.includes(keyword))) {
        return 'shoes';
      }
      if (jacketKeywords.some(keyword => title.includes(keyword) || tags.includes(keyword))) {
        return 'jackets';
      }
      if (accessoryKeywords.some(keyword => title.includes(keyword) || tags.includes(keyword))) {
        return 'accessories';
      }

      // Default to tops if unclear
      return 'tops';
    } catch (error) {
      console.error('⚠️ [StyleCompatibility] Error in categorizeItem:', error, 'Item:', item);
      return 'tops'; // Safe fallback
    }
  }

  /**
   * Check if an item is compatible with a specific style
   */
  static isItemCompatibleWithStyle(item: WardrobeItem, style: StyleCategory): boolean {
    if (!item || !style) return false;
    
    try {
      const category = this.categorizeItem(item);
      const itemTags = Array.isArray(item.tags) ? 
        item.tags.map(tag => typeof tag === 'string' ? tag.toLowerCase() : '').filter(Boolean) : 
        [];
      const itemTitle = typeof item.title === 'string' ? item.title.toLowerCase() : '';
      const itemStyle = typeof item.style === 'string' ? item.style.toLowerCase() : '';
      const itemFit = typeof item.fit === 'string' ? item.fit.toLowerCase() : '';

      // Check if item type is in the style's allowed types
      const allowedTypes = style[category as keyof StyleCategory] as string[];
      if (!allowedTypes || !Array.isArray(allowedTypes)) return false;

      // Check if any of the item's characteristics match the style
      const itemCharacteristics = [...itemTags, itemTitle, itemStyle, itemFit].filter(Boolean);
      
      // If the style allows anything ('any'), it's compatible
      if (allowedTypes.includes('any')) return true;

      // Check for direct matches
      const hasDirectMatch = allowedTypes.some(allowedType => 
        itemCharacteristics.some(char => char.includes(allowedType) || allowedType.includes(char))
      );

      if (hasDirectMatch) return true;

      // Check occasion tags
      const hasOccasionMatch = Array.isArray(style.occasionTags) ? 
        style.occasionTags.some(occasion =>
          itemCharacteristics.some(char => char.includes(occasion))
        ) : false;

      return hasOccasionMatch;
    } catch (error) {
      console.error('⚠️ [StyleCompatibility] Error in isItemCompatibleWithStyle:', error);
      return false;
    }
  }

  /**
   * Check if colors work well together
   */
  static areColorsCompatible(color1: string, color2: string): boolean {
    const c1 = color1.toLowerCase().trim();
    const c2 = color2.toLowerCase().trim();

    // Same color is always compatible
    if (c1 === c2) return true;

    // Check if either color is universal
    if (COLOR_HARMONY.universals.includes(c1) || COLOR_HARMONY.universals.includes(c2)) {
      return true;
    }

    // Check safe combinations
    for (const combo of COLOR_HARMONY.safeCombos) {
      if (combo.includes('*')) {
        // Wildcard combinations
        if (combo[0] === c1 || combo[0] === c2) return true;
      } else {
        // Exact combinations
        if ((combo[0] === c1 && combo[1] === c2) || (combo[0] === c2 && combo[1] === c1)) {
          return true;
        }
      }
    }

    // Check if colors are in the same group
    for (const group of Object.values(COLOR_HARMONY.groups)) {
      if (group.includes(c1) && group.includes(c2)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Validate color harmony for an entire outfit
   */
  static validateOutfitColorHarmony(items: (WardrobeItem | null)[]): boolean {
    const validItems = items.filter(item => item !== null) as WardrobeItem[];
    if (validItems.length < 2) return true;

    const colors = validItems.map(item => item.color).filter(color => color);
    
    // Check each color pair
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        if (!this.areColorsCompatible(colors[i], colors[j])) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get all available style names
   */
  static getAvailableStyles(): string[] {
    return Object.keys(STYLE_CATEGORIES);
  }

  /**
   * Get style information by name
   */
  static getStyleInfo(styleName: string): StyleCategory | null {
    return STYLE_CATEGORIES[styleName] || null;
  }

  /**
   * Find the best style match for a given wardrobe
   */
  static findBestStyleForWardrobe(wardrobe: WardrobeItem[]): string {
    const styleCounts: Record<string, number> = {};

    // Count how many items match each style
    Object.keys(STYLE_CATEGORIES).forEach(styleName => {
      const style = STYLE_CATEGORIES[styleName];
      let count = 0;

      wardrobe.forEach(item => {
        if (this.isItemCompatibleWithStyle(item, style)) {
          count++;
        }
      });

      styleCounts[styleName] = count;
    });

    // Return the style with the most matching items
    return Object.keys(styleCounts).reduce((a, b) => 
      styleCounts[a] > styleCounts[b] ? a : b
    );
  }
}