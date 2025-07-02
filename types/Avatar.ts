// Enhanced Avatar and Style DNA types

export interface BodyMeasurements {
  height?: string; // e.g., "5'6\"" or "168cm"
  weight?: string; // e.g., "140lbs" or "65kg"
  chest_bust?: string; // e.g., "36\"" or "91cm"
  waist?: string; // e.g., "28\"" or "71cm"
  hips?: string; // e.g., "38\"" or "97cm"
  shoulders?: string; // e.g., "15\"" or "38cm"
  inseam?: string; // e.g., "30\"" or "76cm"
  arm_length?: string; // e.g., "24\"" or "61cm"
  neck?: string; // e.g., "14\"" or "36cm"
}

export interface ClothingSizes {
  tops?: 'XXS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | string;
  bottoms?: '24' | '25' | '26' | '27' | '28' | '29' | '30' | '31' | '32' | '33' | '34' | '36' | '38' | '40' | string;
  dresses?: 'XXS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | string;
  shoes?: '5' | '5.5' | '6' | '6.5' | '7' | '7.5' | '8' | '8.5' | '9' | '9.5' | '10' | '10.5' | '11' | '11.5' | '12' | string;
  bra?: '30A' | '30B' | '30C' | '30D' | '32A' | '32B' | '32C' | '32D' | '34A' | '34B' | '34C' | '34D' | '36A' | '36B' | '36C' | '36D' | '38A' | '38B' | '38C' | '38D' | string;
  ring?: '4' | '4.5' | '5' | '5.5' | '6' | '6.5' | '7' | '7.5' | '8' | '8.5' | '9' | '9.5' | '10' | string;
  jacket?: 'XXS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | string;
}

export interface PersonalStyle {
  style_archetypes?: ('Classic' | 'Bohemian' | 'Minimalist' | 'Edgy' | 'Romantic' | 'Trendy' | 'Preppy' | 'Artsy' | 'Sporty' | 'Glamorous')[];
  fashion_goals?: ('Look Professional' | 'Express Creativity' | 'Feel Comfortable' | 'Stand Out' | 'Fit In' | 'Look Younger' | 'Look Sophisticated' | 'Save Money' | 'Be Sustainable')[];
  color_preferences?: {
    favorite_colors?: string[];
    colors_to_avoid?: string[];
    neutral_preferences?: ('Black' | 'White' | 'Gray' | 'Beige' | 'Navy' | 'Brown')[];
  };
  pattern_preferences?: ('Solid Colors' | 'Stripes' | 'Polka Dots' | 'Floral' | 'Geometric' | 'Animal Print' | 'Plaid' | 'Abstract')[];
  fabric_preferences?: ('Cotton' | 'Linen' | 'Silk' | 'Wool' | 'Cashmere' | 'Denim' | 'Leather' | 'Synthetic Blends' | 'Organic Materials')[];
  fit_preferences?: {
    tops?: ('Tight' | 'Fitted' | 'Regular' | 'Loose' | 'Oversized')[];
    bottoms?: ('Skinny' | 'Slim' | 'Straight' | 'Boot Cut' | 'Wide Leg' | 'Relaxed')[];
    overall_preference?: 'Form-fitting' | 'Balanced' | 'Relaxed' | 'Varies by item';
  };
}

export interface LifestyleFactors {
  occupation?: string;
  lifestyle?: ('Active' | 'Professional' | 'Creative' | 'Student' | 'Parent' | 'Retired' | 'Travel Often' | 'Work from Home')[];
  budget_range?: '$' | '$$' | '$$$' | '$$$$';
  shopping_frequency?: 'Weekly' | 'Monthly' | 'Seasonally' | 'Rarely' | 'As Needed';
  wardrobe_goals?: ('Build Capsule Wardrobe' | 'Refresh Current Style' | 'Professional Upgrade' | 'Special Occasions' | 'Everyday Comfort' | 'Express Personality')[];
  body_confidence_areas?: {
    love?: ('Arms' | 'Legs' | 'Waist' | 'Chest/Bust' | 'Shoulders' | 'Hips' | 'Overall Shape')[];
    want_to_highlight?: ('Arms' | 'Legs' | 'Waist' | 'Chest/Bust' | 'Shoulders' | 'Hips' | 'Eyes' | 'Smile')[];
    prefer_to_minimize?: ('Arms' | 'Legs' | 'Waist' | 'Chest/Bust' | 'Shoulders' | 'Hips' | 'Midsection')[];
  };
}

export interface SeasonalPreferences {
  spring?: {
    favorite_items?: string[];
    colors?: string[];
    activities?: string[];
  };
  summer?: {
    favorite_items?: string[];
    colors?: string[];
    activities?: string[];
  };
  fall?: {
    favorite_items?: string[];
    colors?: string[];
    activities?: string[];
  };
  winter?: {
    favorite_items?: string[];
    colors?: string[];
    activities?: string[];
  };
}

export interface EnhancedStyleDNA {
  // Personal Information
  personal_info?: {
    name?: string;
    age_range?: '18-25' | '26-35' | '36-45' | '46-55' | '56-65' | '65+';
    gender?: 'male' | 'female' | 'nonbinary' | 'prefer-not-to-say';
    pronouns?: 'she/her' | 'he/him' | 'they/them' | 'other';
  };

  // Physical Attributes
  physical_attributes?: {
    body_measurements?: BodyMeasurements;
    clothing_sizes?: ClothingSizes;
    hair_color?: string;
    hair_length?: 'Very Short' | 'Short' | 'Medium' | 'Long' | 'Very Long' | 'Bald';
    hair_style?: 'Straight' | 'Wavy' | 'Curly' | 'Coily' | 'Buzz Cut' | 'Pixie' | 'Bob' | 'Layers' | 'Bangs' | 'Updo' | 'Braids' | 'Locs';
    eye_color?: string;
    skin_tone?: 'Fair' | 'Light' | 'Medium' | 'Olive' | 'Dark' | 'Deep';
    body_type?: 'Pear' | 'Apple' | 'Hourglass' | 'Rectangle' | 'Athletic' | 'Inverted Triangle' | 'Not Sure';
  };

  // Style & Preferences
  style_profile?: PersonalStyle;

  // Lifestyle & Context
  lifestyle?: LifestyleFactors;

  // Seasonal Preferences
  seasonal_preferences?: SeasonalPreferences;

  // AI Analysis Results (from image analysis)
  ai_analysis?: {
    appearance?: {
      hair_color?: string;
      build?: string;
      complexion?: string;
      approximate_age_range?: string;
    };
    style_preferences?: {
      current_style_visible?: string;
      preferred_styles?: string[];
      color_palette?: string[];
      fit_preferences?: string;
    };
    outfit_generation_notes?: string;
    analyzed_at?: Date;
  };

  // Generated Avatar
  avatar_image_url?: string | null;

  // Metadata
  created_at?: Date;
  updated_at?: Date;
  version?: number;
}

export interface AvatarCustomizationSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  completed: boolean;
  fields: AvatarField[];
}

export interface AvatarField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'slider' | 'toggle' | 'color' | 'measurement';
  value?: any;
  options?: string[] | { label: string; value: any }[];
  placeholder?: string;
  required?: boolean;
  validation?: (value: any) => string | null;
}