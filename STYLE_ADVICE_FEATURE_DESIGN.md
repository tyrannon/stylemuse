# ✨ Style Advice Tab - Online Item Discovery Feature

## Overview
A dedicated tab that analyzes your wardrobe items and suggested outfits to find similar products online, starting with Amazon integration and expanding to other merchants. This helps users discover new items that match their style and fill wardrobe gaps.

## Core Functionality

### Primary Features
- **Similar Item Discovery**: Find online products matching wardrobe items
- **Outfit Completion**: Suggest missing pieces for incomplete outfits  
- **Style Enhancement**: Recommend upgrades or variations of existing items
- **Multi-Merchant Integration**: Start with Amazon, expand to other retailers
- **Price Comparison**: Show options across different price ranges
- **Wishlist Management**: Save items for later purchase consideration

## Components/Screens Architecture

### Main Screens

#### `StyleAdviceTab.tsx`
```typescript
interface StyleAdviceTabProps {
  // Main container with sub-navigation
  activeSubTab: 'discover' | 'complete' | 'wishlist';
  onSubTabChange: (tab: string) => void;
}
```
- Tab navigation: Discover | Complete Outfits | Wishlist
- Search bar for specific item queries
- Filter controls (price range, merchant, category)
- Refresh button for new recommendations

#### `DiscoverScreen.tsx`
```typescript
interface DiscoverScreenProps {
  // Shows similar items based on wardrobe analysis
  recommendedItems: StyleRecommendation[];
  onItemPress: (item: OnlineItem) => void;
  onRefresh: () => void;
}
```
- Grid of recommended items with product images
- "Based on your [item name]" context cards
- Swipeable cards for easy browsing
- Filter by category (tops, bottoms, shoes, etc.)

#### `OutfitCompletionScreen.tsx`
```typescript
interface OutfitCompletionScreenProps {
  // Suggests missing pieces for outfits
  incompleteOutfits: IncompleteOutfit[];
  onCompleteOutfit: (outfit: IncompleteOutfit, item: OnlineItem) => void;
}
```
- Shows AI-generated outfits with missing pieces highlighted
- "Complete this look" suggestions
- Side-by-side comparison (current vs suggested)
- One-tap outfit completion flow

#### `WishlistScreen.tsx`
```typescript
interface WishlistScreenProps {
  // Saved items and purchase tracking
  wishlistItems: WishlistItem[];
  onRemoveItem: (itemId: string) => void;
  onPurchaseTracking: (item: WishlistItem) => void;
}
```
- Saved items with price tracking
- Purchase status tracking
- Outfit integration preview
- Share wishlist functionality

### Component Library

#### `OnlineItemCard.tsx`
```typescript
interface OnlineItemCardProps {
  item: OnlineItem;
  similarityScore: number;
  wardrobeContext: WardrobeItem;
  onSaveToWishlist: () => void;
  onViewDetails: () => void;
}
```
- Product image with merchant logo
- Price and rating display
- Similarity percentage badge
- Quick save and share buttons
- "Buy Now" / "View on Amazon" CTA

#### `OutfitComparisonCard.tsx`
```typescript
interface OutfitComparisonCardProps {
  currentOutfit: WardrobeItem[];
  suggestedItem: OnlineItem;
  missingSlot: string;
  onPreviewComplete: () => void;
}
```
- Split view: current outfit | completed outfit
- Highlight missing piece placement
- AI confidence score
- Style compatibility indicator

#### `PriceComparisonView.tsx`
```typescript
interface PriceComparisonViewProps {
  items: OnlineItem[];
  sortBy: 'price' | 'rating' | 'similarity';
  onSortChange: (sort: string) => void;
}
```
- Horizontal scrollable price options
- Merchant badges and ratings
- Quick comparison table
- Filter by price range slider

#### `StyleInsightCard.tsx`
```typescript
interface StyleInsightCardProps {
  insight: StyleInsight;
  onLearnMore: () => void;
  onApplyRecommendation: () => void;
}
```
- AI-generated style tips
- Trend insights and recommendations
- Color/pattern compatibility advice
- Seasonal appropriateness tips

## Custom Hooks & State Management

### `useStyleRecommendations.ts`
```typescript
interface UseStyleRecommendationsReturn {
  // Core recommendation logic
  recommendations: StyleRecommendation[];
  loading: boolean;
  error: string | null;
  refreshRecommendations: () => Promise<void>;
  getItemRecommendations: (wardrobeItem: WardrobeItem) => Promise<OnlineItem[]>;
  getSimilarItems: (description: string, category: string) => Promise<OnlineItem[]>;
}
```

**Key Functions:**
- `analyzeWardrobeForRecommendations()`: Identify gaps and opportunities
- `generateOutfitCompletionSuggestions()`: Find missing pieces
- `rankItemsBySimilarity()`: Score recommendations by relevance
- `filterByUserPreferences()`: Apply user style and budget filters

### `useAmazonAPI.ts`
```typescript
interface UseAmazonAPIReturn {
  // Amazon Product Advertising API integration
  searchProducts: (query: string, category?: string) => Promise<AmazonProduct[]>;
  getProductDetails: (asin: string) => Promise<AmazonProductDetails>;
  generateAffiliateLink: (asin: string) => string;
  trackConversion: (asin: string, action: 'click' | 'purchase') => void;
}
```

**Key Functions:**
- `buildSearchQuery()`: Convert item descriptions to search terms
- `parseProductResponse()`: Extract relevant product data
- `handleRateLimit()`: Manage API call quotas
- `cachingStrategy()`: Store frequent searches locally

### `useMerchantIntegration.ts`
```typescript
interface UseMerchantIntegrationReturn {
  // Multi-merchant support framework
  merchants: Merchant[];
  activeMerchants: string[];
  searchAcrossMerchants: (query: string) => Promise<OnlineItem[]>;
  comparePrices: (productId: string) => Promise<PriceComparison[]>;
  toggleMerchant: (merchantId: string) => void;
}
```

**Supported Merchants (Roadmap):**
- Amazon (Phase 1)
- Target, Walmart (Phase 2) 
- ASOS, Zara, H&M (Phase 3)
- Local boutiques via Google Shopping (Phase 4)

### `useWishlistManagement.ts`
```typescript
interface UseWishlistManagementReturn {
  // Wishlist and purchase tracking
  wishlist: WishlistItem[];
  addToWishlist: (item: OnlineItem, context: WardrobeContext) => Promise<void>;
  removeFromWishlist: (itemId: string) => Promise<void>;
  markAsPurchased: (itemId: string, purchaseDetails: PurchaseInfo) => Promise<void>;
  trackPriceChanges: (itemId: string) => Promise<PriceHistory>;
  getWishlistInsights: () => WishlistAnalytics;
}
```

### `useStyleInsights.ts`
```typescript
interface UseStyleInsightsReturn {
  // AI-powered style analysis
  generateStyleInsights: (wardrobe: WardrobeItem[]) => Promise<StyleInsight[]>;
  analyzeOutfitCompatibility: (outfit: WardrobeItem[], newItem: OnlineItem) => Promise<CompatibilityScore>;
  getTrendRecommendations: () => Promise<TrendInsight[]>;
  getSeasonalSuggestions: (season: string) => Promise<SeasonalRecommendation[]>;
}
```

## Data Types & Interfaces

### Core Data Models

```typescript
interface OnlineItem {
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

interface StyleRecommendation {
  id: string;
  type: 'similar' | 'complement' | 'upgrade' | 'trend';
  wardrobeContext: WardrobeItem;
  onlineItem: OnlineItem;
  similarityScore: number;
  reasoning: string;
  confidenceLevel: number;
  aiInsight: string;
}

interface WishlistItem {
  id: string;
  onlineItem: OnlineItem;
  savedAt: Date;
  context: WardrobeContext;
  priceHistory: PricePoint[];
  purchaseStatus: 'saved' | 'purchased' | 'out_of_stock';
  purchaseDate?: Date;
  notes?: string;
}

interface IncompleteOutfit {
  id: string;
  currentItems: WardrobeItem[];
  missingSlots: string[];
  suggestions: OnlineItem[];
  completionConfidence: number;
  styleGoal: string;
}

interface Merchant {
  id: string;
  name: string;
  logoUrl: string;
  baseUrl: string;
  affiliateProgram: boolean;
  apiEndpoint?: string;
  supportedCategories: string[];
}
```

## AI Integration & Inputs

### GPT-4o Vision Integration

#### `generateItemSearchQuery(wardrobeItem: WardrobeItem): Promise<SearchQuery>`
```typescript
// Convert wardrobe item to optimized search terms
const prompt = `
Analyze this clothing item and generate optimal search terms for finding similar items online:

Item: ${item.title}
Description: ${item.description}  
Color: ${item.color}
Material: ${item.material}
Style: ${item.style}
Tags: ${item.tags.join(', ')}

Generate:
1. Primary search terms (2-4 words)
2. Alternative search terms (variations)
3. Category classification
4. Key attributes to match
5. Attributes to avoid
`;
```

#### `analyzeOutfitCompletion(outfit: WardrobeItem[]): Promise<CompletionAnalysis>`
```typescript
// Identify missing pieces in outfits
const prompt = `
Analyze this outfit and identify what's missing to make it complete:

Current items: ${outfit.map(item => item.description).join(', ')}
Occasion: ${occasion}
Season: ${season}

Identify:
1. Missing essential pieces
2. Complementary items that would enhance the look
3. Priority order of additions
4. Style consistency requirements
`;
```

#### `evaluateStyleCompatibility(wardrobeItem: WardrobeItem, onlineItem: OnlineItem): Promise<CompatibilityScore>`
```typescript
// Score how well items work together
const prompt = `
Evaluate the style compatibility between these two items:

Existing wardrobe item: ${wardrobeItem.description}
Potential new item: ${onlineItem.description}

Score compatibility (0-100) based on:
1. Color harmony
2. Style consistency  
3. Occasion appropriateness
4. Seasonal compatibility
5. Overall aesthetic match
`;
```

### Amazon Product Advertising API

#### API Integration Setup
```typescript
// Amazon PA-API 5.0 Configuration
const amazonConfig = {
  accessKey: process.env.AMAZON_ACCESS_KEY,
  secretKey: process.env.AMAZON_SECRET_KEY,
  partnerTag: process.env.AMAZON_ASSOCIATE_TAG,
  region: 'us-east-1',
  marketplace: 'www.amazon.com'
};

// Search Products
const searchParams = {
  Keywords: searchQuery,
  SearchIndex: category, // Fashion, FashionWomen, FashionMen
  ItemCount: 10,
  Resources: [
    'Images.Primary.Large',
    'ItemInfo.Title',
    'ItemInfo.Features', 
    'Offers.Listings.Price',
    'CustomerReviews.StarRating'
  ]
};
```

#### Rate Limiting & Caching
```typescript
// API call management
const rateLimiter = {
  maxRequestsPerSecond: 1,
  maxRequestsPerHour: 8640,
  currentHourlyCount: 0,
  lastResetTime: Date.now()
};

// Cache strategy
const cacheConfig = {
  searchResults: { ttl: 3600000 }, // 1 hour
  productDetails: { ttl: 86400000 }, // 24 hours
  priceHistory: { ttl: 1800000 } // 30 minutes
};
```

## Firebase Integration

### Firestore Collections

#### `/users/{userId}/styleRecommendations`
```typescript
{
  id: string;
  userId: string;
  generatedAt: Timestamp;
  wardrobeSnapshot: WardrobeItem[];
  recommendations: StyleRecommendation[];
  userFeedback?: {
    helpful: boolean;
    purchased: string[];
    dismissed: string[];
  };
  expiresAt: Timestamp; // 7 days
}
```

#### `/users/{userId}/wishlist`
```typescript
{
  id: string;
  onlineItem: OnlineItem;
  savedAt: Timestamp;
  context: WardrobeContext;
  priceAlerts: {
    enabled: boolean;
    targetPrice: number;
    lastChecked: Timestamp;
  };
  status: 'active' | 'purchased' | 'removed';
}
```

#### `/globalData/merchants`
```typescript
{
  id: string;
  name: string;
  config: MerchantConfig;
  status: 'active' | 'maintenance' | 'disabled';
  lastHealthCheck: Timestamp;
  supportedRegions: string[];
}
```

### Cloud Functions

#### `generateStyleRecommendations`
```typescript
// Triggered when wardrobe changes significantly
exports.generateStyleRecommendations = functions.firestore
  .document('users/{userId}/wardrobe/{itemId}')
  .onWrite(async (change, context) => {
    // Analyze wardrobe changes
    // Generate new recommendations
    // Update user's recommendation cache
  });
```

#### `trackPriceChanges`
```typescript
// Scheduled function to monitor wishlist prices
exports.trackPriceChanges = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async (context) => {
    // Check prices for all active wishlist items
    // Send notifications for price drops
    // Update price history
  });
```

## Edge Cases & Platform Considerations

### iOS Considerations

#### App Store Guidelines
- **No direct purchase**: Link to merchant websites, don't process payments
- **Affiliate disclosure**: Clear labeling of affiliate relationships
- **Content appropriateness**: Filter adult/inappropriate content
- **Data usage**: Clear privacy policy for merchant data sharing

#### iOS-Specific Features
```typescript
// Haptic feedback for interactions
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Safari View Controller for external links
import { WebBrowser } from 'expo-web-browser';
const result = await WebBrowser.openBrowserAsync(affiliateUrl);

// Share functionality
import { Share } from 'react-native';
await Share.share({
  message: `Check out this item I found: ${item.title}`,
  url: item.affiliateUrl
});
```

### Android Considerations

#### Google Play Policies
- **Clear affiliate disclosure**: Prominent labeling required
- **No misleading pricing**: Accurate price and availability info
- **External link warnings**: Notify users leaving app

#### Android-Specific Features
```typescript
// Chrome Custom Tabs for better web experience
import { WebBrowser } from 'expo-web-browser';
const result = await WebBrowser.openBrowserAsync(affiliateUrl, {
  toolbarColor: '#007AFF',
  showTitle: true,
  enableBarCollapsing: true
});

// Android share intent
await Share.share({
  title: item.title,
  message: `Found this on StyleMuse: ${item.affiliateUrl}`
});
```

### Error Handling & Edge Cases

#### Network & API Issues
```typescript
// Graceful API failure handling
const handleAPIError = (error: APIError) => {
  switch (error.type) {
    case 'RATE_LIMITED':
      return showMessage('Too many requests, try again in a moment');
    case 'NETWORK_ERROR':
      return showMessage('Check your internet connection');
    case 'MERCHANT_UNAVAILABLE':
      return showMessage('Merchant temporarily unavailable');
    default:
      return showMessage('Something went wrong, please try again');
  }
};

// Offline mode
const useOfflineRecommendations = () => {
  // Show cached recommendations
  // Disable real-time features
  // Queue actions for when online
};
```

#### Content Filtering
```typescript
// Inappropriate content detection
const filterContent = (items: OnlineItem[]): OnlineItem[] => {
  return items.filter(item => {
    // Filter adult content
    // Remove inappropriate titles/descriptions
    // Validate image content (if possible)
    return isAppropriate(item);
  });
};

// Price validation
const validatePricing = (item: OnlineItem): boolean => {
  // Check for reasonable price ranges
  // Detect potential scams or errors
  // Validate currency consistency
  return isPriceReasonable(item);
};
```

#### User Privacy & Data
```typescript
// Anonymize search queries
const anonymizeQuery = (query: string, userId: string): string => {
  // Remove personally identifiable information
  // Hash user-specific data
  // Comply with GDPR/CCPA requirements
  return cleanQuery;
};

// Data retention policies
const dataRetentionConfig = {
  searchHistory: 30, // days
  recommendations: 7, // days  
  wishlistItems: 365, // days
  priceHistory: 90 // days
};
```

## Implementation Phases

### Phase 1: Foundation (2-3 weeks)
- [ ] Basic StyleAdviceTab with Amazon integration
- [ ] Core recommendation engine with GPT-4o
- [ ] Simple wishlist functionality
- [ ] Basic UI components

### Phase 2: Enhancement (2-3 weeks)
- [ ] Outfit completion suggestions
- [ ] Price comparison and tracking
- [ ] Enhanced filtering and sorting
- [ ] Improved AI recommendations

### Phase 3: Expansion (3-4 weeks)
- [ ] Multi-merchant integration
- [ ] Advanced analytics and insights
- [ ] Social features (sharing, reviews)
- [ ] Performance optimization

### Phase 4: Polish (1-2 weeks)
- [ ] Edge case handling
- [ ] Accessibility improvements
- [ ] Analytics and monitoring
- [ ] App store compliance review

## Success Metrics

### User Engagement
- **Daily active users** in Style Advice tab
- **Time spent** browsing recommendations
- **Click-through rate** to merchant sites
- **Wishlist save rate** and conversion

### Business Metrics
- **Affiliate commissions** generated
- **Cost per recommendation** (API costs vs revenue)
- **User retention** improvement
- **Premium feature adoption** (if applicable)

### AI Performance
- **Recommendation relevance** (user feedback)
- **Search query accuracy** (click-through rates)
- **Outfit completion success** (user satisfaction)
- **Style compatibility scores** (validation against purchases)

---

This comprehensive design provides a solid foundation for implementing the Style Advice Tab feature while maintaining the high-quality, AI-powered experience that StyleMuse users expect. The phased approach allows for iterative development and user feedback incorporation.