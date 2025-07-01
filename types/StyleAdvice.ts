import { WardrobeItem } from '../hooks/useWardrobeData';

// Online marketplace item
export interface OnlineItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  currency: string;
  merchant: Merchant;
  rating: number;
  reviewCount: number;
  category: string;
  sizes: string[];
  colors: string[];
  affiliateUrl: string;
  productUrl: string;
  asin?: string; // Amazon specific
  sku?: string;  // Other merchants
}

// Merchant/retailer information
export interface Merchant {
  id: string;
  name: string;
  logoUrl: string;
  baseUrl: string;
  affiliateProgram: boolean;
  apiEndpoint?: string;
  supportedCategories: string[];
}

// AI-generated style recommendation
export interface StyleRecommendation {
  id: string;
  type: 'similar' | 'complement' | 'upgrade' | 'trend';
  wardrobeContext: WardrobeItem;
  onlineItem: OnlineItem;
  similarityScore: number;
  reasoning: string;
  confidenceLevel: number;
  aiInsight: string;
  generatedAt: Date;
}

// Wishlist item with tracking
export interface WishlistItem {
  id: string;
  onlineItem: OnlineItem;
  savedAt: Date;
  context: WardrobeContext;
  priceHistory: PricePoint[];
  purchaseStatus: 'saved' | 'purchased' | 'out_of_stock';
  purchaseDate?: Date;
  notes?: string;
}

// Context about how item relates to wardrobe
export interface WardrobeContext {
  wardrobeItem: WardrobeItem;
  relationshipType: 'similar' | 'complement' | 'upgrade' | 'replacement';
  styleGoal: string;
}

// Price tracking
export interface PricePoint {
  price: number;
  currency: string;
  timestamp: Date;
  merchant: string;
}

// Price comparison across merchants
export interface PriceComparison {
  productId: string;
  prices: PricePoint[];
  lowestPrice: PricePoint;
  highestPrice: PricePoint;
  averagePrice: number;
}

// Incomplete outfit analysis
export interface IncompleteOutfit {
  id: string;
  currentItems: WardrobeItem[];
  missingSlots: string[];
  suggestions: OnlineItem[];
  completionConfidence: number;
  styleGoal: string;
  occasion?: string;
  season?: string;
}

// AI-generated style insights
export interface StyleInsight {
  id: string;
  type: 'tip' | 'trend' | 'compatibility' | 'seasonal';
  title: string;
  description: string;
  wardrobeItems: WardrobeItem[];
  recommendedActions: string[];
  confidenceLevel: number;
  relevanceScore: number;
}

// Search query optimization
export interface SearchQuery {
  primaryTerms: string[];
  alternativeTerms: string[];
  category: string;
  keyAttributes: string[];
  attributesToAvoid: string[];
  priceRange?: {
    min: number;
    max: number;
  };
}

// API response structures
export interface AmazonProduct {
  asin: string;
  title: string;
  imageUrl: string;
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  detailPageURL: string;
  features: string[];
}

export interface AmazonProductDetails extends AmazonProduct {
  description: string;
  dimensions: string;
  colors: string[];
  sizes: string[];
  brand: string;
  customerReviews: AmazonReview[];
}

export interface AmazonReview {
  rating: number;
  title: string;
  body: string;
  date: Date;
  helpful: number;
}

// Compatibility scoring
export interface CompatibilityScore {
  overall: number;
  colorHarmony: number;
  styleConsistency: number;
  occasionAppropriate: number;
  seasonalCompatibility: number;
  reasoning: string;
}

// Wishlist analytics
export interface WishlistAnalytics {
  totalItems: number;
  totalValue: number;
  averagePrice: number;
  categoriesBreakdown: { [category: string]: number };
  merchantsBreakdown: { [merchant: string]: number };
  priceTrends: PricePoint[];
  purchasedItems: number;
  savingsFromPriceDrops: number;
}

// Trend analysis
export interface TrendInsight {
  id: string;
  title: string;
  description: string;
  trendType: 'color' | 'style' | 'pattern' | 'silhouette';
  seasonality: string;
  popularityScore: number;
  wardrobeGaps: string[];
  recommendedItems: OnlineItem[];
}

// Seasonal recommendations
export interface SeasonalRecommendation {
  season: string;
  recommendations: StyleRecommendation[];
  weatherConsiderations: string[];
  trendHighlights: string[];
  wardrobeGaps: string[];
}

// API error types
export interface APIError {
  type: 'RATE_LIMITED' | 'NETWORK_ERROR' | 'MERCHANT_UNAVAILABLE' | 'INVALID_RESPONSE' | 'UNKNOWN';
  message: string;
  retryAfter?: number;
  merchant?: string;
}

// User preferences for recommendations
export interface UserPreferences {
  budgetRange: {
    min: number;
    max: number;
  };
  preferredMerchants: string[];
  excludedMerchants: string[];
  favoriteCategories: string[];
  sustainabilityFocus: boolean;
  brandPreferences: string[];
  sizePreferences: { [category: string]: string };
}

// Analytics and tracking
export interface RecommendationMetrics {
  totalRecommendations: number;
  clickThroughRate: number;
  conversionRate: number;
  averageSimilarityScore: number;
  userFeedback: {
    helpful: number;
    notHelpful: number;
    purchased: number;
  };
}