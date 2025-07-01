import { useState, useCallback } from 'react';
import { StyleRecommendation, OnlineItem, SearchQuery, APIError } from '../types/StyleAdvice';
import { WardrobeItem } from './useWardrobeData';
import { useAmazonAPI } from './useAmazonAPI';
import { generateItemSearchQuery } from '../utils/openai';

interface UseStyleRecommendationsReturn {
  recommendations: StyleRecommendation[];
  loading: boolean;
  error: string | null;
  refreshRecommendations: () => Promise<void>;
  getItemRecommendations: (wardrobeItem: WardrobeItem) => Promise<OnlineItem[]>;
  getSimilarItems: (description: string, category: string) => Promise<OnlineItem[]>;
  analyzeWardrobeForRecommendations: (wardrobe: WardrobeItem[]) => Promise<StyleRecommendation[]>;
}

export const useStyleRecommendations = (): UseStyleRecommendationsReturn => {
  const [recommendations, setRecommendations] = useState<StyleRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { searchProducts, getProductDetails } = useAmazonAPI();

  // Generate search query using AI
  const generateSearchQuery = async (wardrobeItem: WardrobeItem): Promise<SearchQuery> => {
    try {
      const searchQuery = await generateItemSearchQuery(wardrobeItem);
      return searchQuery;
    } catch (error) {
      console.error('Error generating search query:', error);
      // Fallback to basic search terms
      return {
        primaryTerms: [wardrobeItem.title || 'clothing item'],
        alternativeTerms: wardrobeItem.tags || [],
        category: wardrobeItem.category || 'Fashion',
        keyAttributes: [wardrobeItem.color, wardrobeItem.material, wardrobeItem.style].filter(Boolean),
        attributesToAvoid: [],
      };
    }
  };

  // Convert Amazon product to OnlineItem
  const convertAmazonToOnlineItem = (product: any, category: string): OnlineItem => {
    return {
      id: product.asin || product.id || Math.random().toString(36),
      title: product.title || 'Untitled Item',
      description: product.features?.join(', ') || product.description || '',
      imageUrl: product.imageUrl || product.Images?.Primary?.Large?.URL || '',
      price: product.price || 0,
      currency: product.currency || 'USD',
      merchant: {
        id: 'amazon',
        name: 'Amazon',
        logoUrl: '',
        baseUrl: 'https://amazon.com',
        affiliateProgram: true,
        supportedCategories: ['Fashion', 'FashionWomen', 'FashionMen'],
      },
      rating: product.rating || product.CustomerReviews?.StarRating?.Value || 0,
      reviewCount: product.reviewCount || product.CustomerReviews?.Count || 0,
      category: category,
      sizes: [],
      colors: [],
      affiliateUrl: product.detailPageURL || product.DetailPageURL || '',
      productUrl: product.detailPageURL || product.DetailPageURL || '',
      asin: product.asin || product.ASIN,
    };
  };

  // Calculate similarity score between wardrobe item and online item
  const calculateSimilarityScore = (wardrobeItem: WardrobeItem, onlineItem: OnlineItem): number => {
    let score = 0;
    let factors = 0;

    // Title/description similarity (basic keyword matching)
    const wardrobeWords = (wardrobeItem.title + ' ' + wardrobeItem.description).toLowerCase().split(' ');
    const onlineWords = (onlineItem.title + ' ' + onlineItem.description).toLowerCase().split(' ');
    const commonWords = wardrobeWords.filter(word => onlineWords.includes(word) && word.length > 3);
    
    if (wardrobeWords.length > 0) {
      score += (commonWords.length / wardrobeWords.length) * 40;
      factors++;
    }

    // Category match
    if (wardrobeItem.category && onlineItem.category) {
      if (wardrobeItem.category.toLowerCase() === onlineItem.category.toLowerCase()) {
        score += 30;
      }
      factors++;
    }

    // Color similarity (if available)
    if (wardrobeItem.color && onlineItem.colors.length > 0) {
      const hasColorMatch = onlineItem.colors.some(color => 
        color.toLowerCase().includes(wardrobeItem.color!.toLowerCase()) ||
        wardrobeItem.color!.toLowerCase().includes(color.toLowerCase())
      );
      if (hasColorMatch) {
        score += 20;
      }
      factors++;
    }

    // Style/material tags
    if (wardrobeItem.tags && wardrobeItem.tags.length > 0) {
      const styleWords = onlineItem.title.toLowerCase() + ' ' + onlineItem.description.toLowerCase();
      const matchingTags = wardrobeItem.tags.filter(tag => 
        styleWords.includes(tag.toLowerCase())
      );
      if (matchingTags.length > 0) {
        score += (matchingTags.length / wardrobeItem.tags.length) * 10;
      }
      factors++;
    }

    // Normalize score
    return factors > 0 ? Math.min(score / factors * (factors > 1 ? 1.2 : 1), 100) : 50;
  };

  // Generate reasoning for the recommendation
  const generateReasoning = (wardrobeItem: WardrobeItem, onlineItem: OnlineItem, score: number): string => {
    const reasons = [];

    if (score >= 80) {
      reasons.push('Excellent style match');
    } else if (score >= 60) {
      reasons.push('Good style compatibility');
    } else {
      reasons.push('Similar aesthetic');
    }

    if (wardrobeItem.color && onlineItem.colors.some(c => c.toLowerCase().includes(wardrobeItem.color!.toLowerCase()))) {
      reasons.push('matching color palette');
    }

    if (wardrobeItem.style && onlineItem.title.toLowerCase().includes(wardrobeItem.style.toLowerCase())) {
      reasons.push('similar style elements');
    }

    return reasons.join(', ');
  };

  // Get recommendations for a specific wardrobe item
  const getItemRecommendations = useCallback(async (wardrobeItem: WardrobeItem): Promise<OnlineItem[]> => {
    try {
      const searchQuery = await generateSearchQuery(wardrobeItem);
      const searchTerm = searchQuery.primaryTerms.join(' ');
      
      // Search Amazon for similar items
      const amazonProducts = await searchProducts(searchTerm, wardrobeItem.category);
      
      // Convert to OnlineItems
      const onlineItems = amazonProducts.map(product => 
        convertAmazonToOnlineItem(product, wardrobeItem.category || 'Fashion')
      );

      return onlineItems;
    } catch (error) {
      console.error('Error getting item recommendations:', error);
      return [];
    }
  }, [searchProducts]);

  // Get similar items by description and category
  const getSimilarItems = useCallback(async (description: string, category: string): Promise<OnlineItem[]> => {
    try {
      const amazonProducts = await searchProducts(description, category);
      return amazonProducts.map(product => convertAmazonToOnlineItem(product, category));
    } catch (error) {
      console.error('Error getting similar items:', error);
      return [];
    }
  }, [searchProducts]);

  // Analyze entire wardrobe for recommendations
  const analyzeWardrobeForRecommendations = useCallback(async (wardrobe: WardrobeItem[]): Promise<StyleRecommendation[]> => {
    const allRecommendations: StyleRecommendation[] = [];

    // Limit to 5 most recent items to avoid overwhelming the API
    const recentItems = wardrobe.slice(0, 5);

    for (const wardrobeItem of recentItems) {
      try {
        const onlineItems = await getItemRecommendations(wardrobeItem);
        
        // Convert to recommendations with scoring
        const itemRecommendations = onlineItems.slice(0, 3).map((onlineItem, index): StyleRecommendation => {
          const similarityScore = calculateSimilarityScore(wardrobeItem, onlineItem);
          const reasoning = generateReasoning(wardrobeItem, onlineItem, similarityScore);
          
          return {
            id: `${wardrobeItem.image}-${onlineItem.id}-${index}`,
            type: 'similar',
            wardrobeContext: wardrobeItem,
            onlineItem,
            similarityScore,
            reasoning,
            confidenceLevel: Math.min(similarityScore + 10, 100),
            aiInsight: `Found this ${onlineItem.category} item that matches your ${wardrobeItem.title}'s style`,
            generatedAt: new Date(),
          };
        });

        allRecommendations.push(...itemRecommendations);
      } catch (error) {
        console.error(`Error processing recommendations for item ${wardrobeItem.title}:`, error);
      }
    }

    // Sort by similarity score and limit results
    return allRecommendations
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 12); // Limit to 12 recommendations
  }, [getItemRecommendations]);

  // Refresh recommendations
  const refreshRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get wardrobe items from storage or context
      // For now, we'll use empty array and let the component pass the wardrobe
      // This will be connected to the actual wardrobe data
      
      setRecommendations([]);
      
    } catch (error: any) {
      console.error('Error refreshing recommendations:', error);
      setError(error.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Method to set recommendations from external source
  const setRecommendationsFromWardrobe = useCallback(async (wardrobe: WardrobeItem[]) => {
    setLoading(true);
    setError(null);

    try {
      const newRecommendations = await analyzeWardrobeForRecommendations(wardrobe);
      setRecommendations(newRecommendations);
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      setError(error.message || 'Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  }, [analyzeWardrobeForRecommendations]);

  // Expose the method to set recommendations
  const refreshRecommendationsWithWardrobe = useCallback(async (wardrobe?: WardrobeItem[]) => {
    if (wardrobe && wardrobe.length > 0) {
      await setRecommendationsFromWardrobe(wardrobe);
    } else {
      await refreshRecommendations();
    }
  }, [setRecommendationsFromWardrobe, refreshRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refreshRecommendations: refreshRecommendationsWithWardrobe,
    getItemRecommendations,
    getSimilarItems,
    analyzeWardrobeForRecommendations,
  };
};