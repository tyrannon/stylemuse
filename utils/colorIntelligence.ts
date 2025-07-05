import { ColorIntelligence, WardrobeItem } from '../hooks/useWardrobeData';

/**
 * Smart Wardrobe Intelligence - Color Utilities
 * Advanced color analysis and coordination functions
 */

// Color family definitions for filtering and grouping
export const COLOR_FAMILIES = {
  reds: ['crimson', 'burgundy', 'cherry', 'wine', 'brick', 'coral', 'rose', 'blush', 'pink'],
  blues: ['navy', 'royal', 'sky', 'powder', 'teal', 'periwinkle', 'slate', 'denim', 'indigo'],
  greens: ['forest', 'sage', 'mint', 'olive', 'emerald', 'lime', 'seafoam', 'hunter'],
  neutrals: ['ivory', 'cream', 'beige', 'taupe', 'camel', 'chocolate', 'charcoal', 'stone', 'black', 'white', 'gray'],
  pastels: ['baby blue', 'lavender', 'peach', 'mint green', 'powder pink', 'buttercream'],
  earth: ['brown', 'tan', 'khaki', 'rust', 'terracotta', 'sand', 'clay'],
  jewel: ['emerald', 'sapphire', 'ruby', 'amethyst', 'topaz', 'garnet'],
};

// Seasonal color mappings
export const SEASONAL_COLORS = {
  spring: ['coral', 'peach', 'mint', 'lavender', 'buttercream yellow', 'bright navy', 'soft pink'],
  summer: ['powder blue', 'rose pink', 'sage green', 'dove gray', 'soft white', 'lavender'],
  autumn: ['burnt orange', 'deep burgundy', 'forest green', 'chocolate brown', 'mustard', 'rust'],
  winter: ['true red', 'royal blue', 'emerald', 'black', 'pure white', 'hot pink', 'deep purple'],
};

/**
 * Get items by color family
 */
export function getItemsByColorFamily(items: WardrobeItem[], colorFamily: string): WardrobeItem[] {
  return items.filter(item => 
    item.colorIntelligence?.colorFamily?.toLowerCase() === colorFamily.toLowerCase()
  );
}

/**
 * Get items by seasonal color mapping
 */
export function getItemsBySeason(items: WardrobeItem[], season: string): WardrobeItem[] {
  return items.filter(item => 
    item.colorIntelligence?.seasonalMapping?.toLowerCase() === season.toLowerCase()
  );
}

/**
 * Get items by color temperature (warm/cool/neutral)
 */
export function getItemsByTemperature(items: WardrobeItem[], temperature: string): WardrobeItem[] {
  return items.filter(item => 
    item.colorIntelligence?.colorTemperature?.toLowerCase().includes(temperature.toLowerCase())
  );
}

/**
 * Get items by coordination potential
 */
export function getItemsByCoordinationPotential(items: WardrobeItem[], potential: string): WardrobeItem[] {
  return items.filter(item => 
    item.colorIntelligence?.coordinationPotential?.toLowerCase().includes(potential.toLowerCase())
  );
}

/**
 * Find complementary items based on color theory
 */
export function findComplementaryItems(targetItem: WardrobeItem, items: WardrobeItem[]): WardrobeItem[] {
  if (!targetItem.colorIntelligence) return [];
  
  const { colorFamily, colorTemperature, coordinationPotential } = targetItem.colorIntelligence;
  
  return items.filter(item => {
    if (!item.colorIntelligence || item === targetItem) return false;
    
    // Neutrals go with everything
    if (colorFamily === 'neutrals' || item.colorIntelligence.colorFamily === 'neutrals') {
      return true;
    }
    
    // Same color temperature works well
    if (colorTemperature === item.colorIntelligence.colorTemperature) {
      return true;
    }
    
    // Statement pieces pair with neutral bases
    if (coordinationPotential === 'statement piece' && 
        item.colorIntelligence.coordinationPotential === 'neutral base') {
      return true;
    }
    
    return false;
  });
}

/**
 * Get color distribution analytics for wardrobe
 */
export function getColorAnalytics(items: WardrobeItem[]) {
  const analytics = {
    totalItems: items.length,
    colorFamilies: {} as Record<string, number>,
    seasons: {} as Record<string, number>,
    temperatures: {} as Record<string, number>,
    coordinationTypes: {} as Record<string, number>,
    mostCommonColor: '',
    neutralPercentage: 0,
    seasonalBalance: {} as Record<string, number>,
  };

  items.forEach(item => {
    if (item.colorIntelligence) {
      // Color families
      const family = item.colorIntelligence.colorFamily;
      analytics.colorFamilies[family] = (analytics.colorFamilies[family] || 0) + 1;
      
      // Seasonal mapping
      const season = item.colorIntelligence.seasonalMapping;
      analytics.seasons[season] = (analytics.seasons[season] || 0) + 1;
      
      // Temperature
      const temp = item.colorIntelligence.colorTemperature;
      analytics.temperatures[temp] = (analytics.temperatures[temp] || 0) + 1;
      
      // Coordination potential
      const coord = item.colorIntelligence.coordinationPotential;
      analytics.coordinationTypes[coord] = (analytics.coordinationTypes[coord] || 0) + 1;
    }
  });

  // Calculate most common color family
  const sortedFamilies = Object.entries(analytics.colorFamilies)
    .sort(([,a], [,b]) => b - a);
  analytics.mostCommonColor = sortedFamilies[0]?.[0] || '';

  // Calculate neutral percentage
  const neutralCount = analytics.colorFamilies['neutrals'] || 0;
  analytics.neutralPercentage = Math.round((neutralCount / items.length) * 100);

  // Calculate seasonal balance
  const totalSeasonal = Object.values(analytics.seasons).reduce((sum, count) => sum + count, 0);
  Object.entries(analytics.seasons).forEach(([season, count]) => {
    analytics.seasonalBalance[season] = Math.round((count / totalSeasonal) * 100);
  });

  return analytics;
}

/**
 * Suggest wardrobe gaps based on color analysis
 */
export function suggestWardrobeGaps(items: WardrobeItem[]): string[] {
  const analytics = getColorAnalytics(items);
  const suggestions: string[] = [];

  // Check for neutral base pieces
  if (analytics.neutralPercentage < 30) {
    suggestions.push('Add more neutral basics (white, black, navy, beige) for versatile foundation pieces');
  }

  // Check seasonal balance
  Object.entries(analytics.seasonalBalance).forEach(([season, percentage]) => {
    if (percentage < 15) {
      suggestions.push(`Consider adding ${season} colors for better seasonal variety`);
    }
  });

  // Check for statement pieces
  const statementCount = analytics.coordinationTypes['statement piece'] || 0;
  if (statementCount < 3) {
    suggestions.push('Add colorful statement pieces to brighten your wardrobe');
  }

  // Check color temperature balance
  const warmCount = analytics.temperatures['warm-toned'] || 0;
  const coolCount = analytics.temperatures['cool-toned'] || 0;
  const totalToned = warmCount + coolCount;
  
  if (totalToned > 0) {
    const warmPercentage = (warmCount / totalToned) * 100;
    if (warmPercentage > 80) {
      suggestions.push('Consider adding cool-toned pieces for better color balance');
    } else if (warmPercentage < 20) {
      suggestions.push('Consider adding warm-toned pieces for better color balance');
    }
  }

  return suggestions;
}

/**
 * Create color-based outfit suggestions
 */
export function suggestColorOutfits(items: WardrobeItem[]): Array<{
  name: string;
  items: WardrobeItem[];
  description: string;
}> {
  const suggestions = [];

  // Monochromatic outfit
  const blues = getItemsByColorFamily(items, 'blues');
  if (blues.length >= 2) {
    suggestions.push({
      name: 'Monochromatic Blue',
      items: blues.slice(0, 3),
      description: 'Sophisticated monochromatic look using various shades of blue'
    });
  }

  // Neutral base with statement piece
  const neutrals = getItemsByCoordinationPotential(items, 'neutral base');
  const statements = getItemsByCoordinationPotential(items, 'statement piece');
  if (neutrals.length >= 1 && statements.length >= 1) {
    suggestions.push({
      name: 'Neutral + Statement',
      items: [neutrals[0], statements[0]],
      description: 'Classic neutral foundation with a pop of color'
    });
  }

  // Seasonal coordination
  const currentSeason = getCurrentSeason();
  const seasonalItems = getItemsBySeason(items, currentSeason);
  if (seasonalItems.length >= 2) {
    suggestions.push({
      name: `Perfect for ${currentSeason}`,
      items: seasonalItems.slice(0, 3),
      description: `Seasonal color palette perfect for ${currentSeason}`
    });
  }

  return suggestions;
}

/**
 * Get current season based on date
 */
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1; // 1-12
  
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/**
 * Get emoji for color family
 */
export function getColorFamilyEmoji(colorFamily: string): string {
  const emojiMap: Record<string, string> = {
    reds: '❤️',
    blues: '💙',
    greens: '💚',
    neutrals: '🤍',
    pastels: '🌸',
    earth: '🤎',
    jewel: '💎',
  };
  
  return emojiMap[colorFamily.toLowerCase()] || '🎨';
}

/**
 * Get emoji for seasonal mapping
 */
export function getSeasonalEmoji(season: string): string {
  const emojiMap: Record<string, string> = {
    spring: '🌸',
    summer: '☀️',
    autumn: '🍂',
    winter: '❄️',
    'year-round': '🔄',
  };
  
  return emojiMap[season.toLowerCase()] || '🎨';
}