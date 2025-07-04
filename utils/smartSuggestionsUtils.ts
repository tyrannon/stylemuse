import { WardrobeItem } from '../hooks/useWardrobeData';
import { UserStyleProfile } from '../services/SmartSuggestionsService';

/**
 * Create a user style profile from existing wardrobe data and user preferences
 */
export function createUserStyleProfile(
  wardrobeItems: WardrobeItem[],
  selectedGender?: string | null,
  styleDNA?: any
): UserStyleProfile {
  // Analyze existing wardrobe to infer preferences
  const styleAnalysis = analyzeExistingStyle(wardrobeItems);
  
  return {
    gender: selectedGender as 'male' | 'female' | 'nonbinary' || undefined,
    age: styleDNA?.appearance?.age_range ? extractAgeFromRange(styleDNA.appearance.age_range) : undefined,
    stylePreference: styleAnalysis.dominantStyle,
    occasion: styleAnalysis.primaryOccasion,
    budget: 'medium', // Default - could be customizable
    season: getCurrentSeason(),
    bodyType: styleDNA?.appearance?.build || undefined,
    colorPreferences: styleAnalysis.commonColors,
  };
}

/**
 * Analyze existing wardrobe to infer style preferences
 */
function analyzeExistingStyle(wardrobeItems: WardrobeItem[]) {
  if (wardrobeItems.length === 0) {
    return {
      dominantStyle: 'casual' as const,
      primaryOccasion: 'casual' as const,
      commonColors: ['navy', 'white', 'black'], // Safe defaults
    };
  }

  // Count style frequencies
  const styles = wardrobeItems.map(item => item.style?.toLowerCase()).filter(Boolean);
  const colors = wardrobeItems.map(item => item.color?.toLowerCase()).filter(Boolean);
  const materials = wardrobeItems.map(item => item.material?.toLowerCase()).filter(Boolean);

  const styleFreq = countFrequency(styles);
  const colorFreq = countFrequency(colors);

  // Determine dominant style
  let dominantStyle: UserStyleProfile['stylePreference'] = 'casual';
  
  if (styleFreq['formal'] || styleFreq['business'] || styleFreq['professional']) {
    dominantStyle = 'formal';
  } else if (styleFreq['trendy'] || styleFreq['modern'] || styleFreq['contemporary']) {
    dominantStyle = 'trendy';
  } else if (styleFreq['classic'] || styleFreq['traditional'] || styleFreq['timeless']) {
    dominantStyle = 'classic';
  } else if (styleFreq['bohemian'] || styleFreq['boho'] || styleFreq['flowing']) {
    dominantStyle = 'bohemian';
  } else if (styleFreq['minimal'] || styleFreq['clean'] || styleFreq['simple']) {
    dominantStyle = 'minimalist';
  }

  // Determine primary occasion
  let primaryOccasion: UserStyleProfile['occasion'] = 'casual';
  
  if (materials.includes('wool') || materials.includes('silk') || styles.includes('blazer')) {
    primaryOccasion = 'work';
  } else if (styles.includes('athletic') || materials.includes('polyester')) {
    primaryOccasion = 'sports';
  }

  // Get most common colors (limit to top 3)
  const commonColors = Object.entries(colorFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([color]) => color);

  return {
    dominantStyle,
    primaryOccasion,
    commonColors: commonColors.length > 0 ? commonColors : ['navy', 'white', 'black'],
  };
}

/**
 * Count frequency of items in array
 */
function countFrequency(items: string[]): Record<string, number> {
  return items.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Extract numeric age from age range string
 */
function extractAgeFromRange(ageRange: string): number {
  const match = ageRange.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 25; // Default
}

/**
 * Get current season based on date
 */
function getCurrentSeason(): UserStyleProfile['season'] {
  const month = new Date().getMonth();
  
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

/**
 * Generate smart prompts for AI based on wardrobe state
 */
export function generateSmartPromptContext(
  wardrobeItems: WardrobeItem[],
  userProfile: UserStyleProfile
): string {
  const wardrobeState = analyzeWardrobeCompleteness(wardrobeItems);
  
  let context = `User Context:
- Wardrobe size: ${wardrobeItems.length} items
- Wardrobe state: ${wardrobeState.description}
- Style preference: ${userProfile.stylePreference || 'versatile'}
- Primary occasion: ${userProfile.occasion || 'casual'}
- Season: ${userProfile.season || 'current'}
- Budget: ${userProfile.budget || 'medium'}`;

  if (wardrobeState.missingCategories.length > 0) {
    context += `
- Missing categories: ${wardrobeState.missingCategories.join(', ')}`;
  }

  if (wardrobeState.priorities.length > 0) {
    context += `
- Top priorities: ${wardrobeState.priorities.slice(0, 3).join(', ')}`;
  }

  return context;
}

/**
 * Analyze how complete a wardrobe is
 */
function analyzeWardrobeCompleteness(wardrobeItems: WardrobeItem[]) {
  const essentialCategories = ['top', 'bottom', 'shoes'];
  const desirableCategories = ['jacket', 'accessories'];
  
  const presentCategories = [...new Set(wardrobeItems.map(item => item.category))].filter(Boolean);
  const missingEssentials = essentialCategories.filter(cat => !presentCategories.includes(cat));
  const missingDesirable = desirableCategories.filter(cat => !presentCategories.includes(cat));
  
  let description = '';
  let priorities: string[] = [];
  
  if (wardrobeItems.length === 0) {
    description = 'Empty - needs complete wardrobe foundation';
    priorities = ['versatile top', 'quality bottom', 'everyday shoes'];
  } else if (missingEssentials.length > 0) {
    description = 'Incomplete - missing essential categories';
    priorities = missingEssentials;
  } else if (wardrobeItems.length < 10) {
    description = 'Basic - has essentials but needs variety';
    priorities = missingDesirable;
  } else if (wardrobeItems.length < 20) {
    description = 'Developing - good foundation, building style';
    priorities = ['statement pieces', 'seasonal items'];
  } else {
    description = 'Established - has variety, may need refreshing';
    priorities = ['trendy updates', 'quality upgrades'];
  }
  
  return {
    description,
    missingCategories: [...missingEssentials, ...missingDesirable],
    priorities,
    completeness: Math.min(100, (presentCategories.length / essentialCategories.length) * 60 + (wardrobeItems.length / 20) * 40)
  };
}

/**
 * Generate search terms for Amazon from AI suggestions
 */
export function generateAmazonSearchTerms(suggestion: any): string[] {
  const baseTerms = [
    suggestion.title,
    `${suggestion.color} ${suggestion.style}`,
    `${suggestion.material} ${suggestion.category}`,
  ].filter(Boolean);

  // Add gender-specific terms if available
  if (suggestion.searchTerms) {
    return [...baseTerms, ...suggestion.searchTerms];
  }

  return baseTerms;
}

/**
 * Estimate outfit versatility score
 */
export function calculateOutfitVersatility(outfitItems: any[]): number {
  let score = 0;
  
  // Basic items get higher versatility scores
  const versatileColors = ['black', 'white', 'navy', 'gray', 'beige'];
  const versatileStyles = ['classic', 'basic', 'simple', 'minimal'];
  
  outfitItems.forEach(item => {
    if (versatileColors.includes(item.color?.toLowerCase())) score += 10;
    if (versatileStyles.includes(item.style?.toLowerCase())) score += 10;
    if (item.material === 'cotton' || item.material === 'denim') score += 5;
  });
  
  // Bonus for having essential categories
  const categories = outfitItems.map(item => item.category);
  if (categories.includes('top')) score += 20;
  if (categories.includes('bottom')) score += 20;
  if (categories.includes('shoes')) score += 15;
  
  return Math.min(100, score);
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Generate outfit description for sharing
 */
export function generateOutfitDescription(outfitItems: any[]): string {
  const itemDescriptions = outfitItems.map(item => 
    `${item.color} ${item.style} ${item.category}`
  ).join(', ');
  
  return `Stylish outfit featuring: ${itemDescriptions}`;
}