// Simplified StyleDNA type to replace removed Avatar types
export interface StyleDNA {
  avatar_image_url?: string;
  styleArchetypes?: string[];
  favoriteColors?: string[];
  personalityTraits?: string[];
  fashionGoals?: string[];
  [key: string]: any;
}

export type EnhancedStyleDNA = StyleDNA;