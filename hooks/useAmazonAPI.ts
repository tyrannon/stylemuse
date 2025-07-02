import { useState, useCallback } from 'react';
import { AmazonProduct, AmazonProductDetails, APIError } from '../types/StyleAdvice';

interface UseAmazonAPIReturn {
  searchProducts: (query: string, category?: string) => Promise<AmazonProduct[]>;
  getProductDetails: (asin: string) => Promise<AmazonProductDetails | null>;
  generateAffiliateLink: (asin: string) => string;
  trackConversion: (asin: string, action: 'click' | 'purchase') => void;
  loading: boolean;
  error: APIError | null;
}

// Rate limiting configuration
interface RateLimiter {
  maxRequestsPerSecond: number;
  maxRequestsPerHour: number;
  currentHourlyCount: number;
  lastResetTime: number;
  lastRequestTime: number;
}

// Cache configuration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export const useAmazonAPI = (): UseAmazonAPIReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  // Rate limiter state
  const [rateLimiter] = useState<RateLimiter>({
    maxRequestsPerSecond: 1,
    maxRequestsPerHour: 8640, // Amazon PA-API limit
    currentHourlyCount: 0,
    lastResetTime: Date.now(),
    lastRequestTime: 0,
  });

  // In-memory cache for API responses
  const [cache] = useState<Map<string, CacheEntry<any>>>(new Map());

  // Cache TTL configurations (in milliseconds)
  const cacheTTL = {
    searchResults: 3600000, // 1 hour
    productDetails: 86400000, // 24 hours
  };

  // Check rate limits before making requests
  const checkRateLimit = (): boolean => {
    const now = Date.now();
    
    // Reset hourly counter if needed
    if (now - rateLimiter.lastResetTime > 3600000) { // 1 hour
      rateLimiter.currentHourlyCount = 0;
      rateLimiter.lastResetTime = now;
    }

    // Check hourly limit
    if (rateLimiter.currentHourlyCount >= rateLimiter.maxRequestsPerHour) {
      setError({
        type: 'RATE_LIMITED',
        message: 'Hourly rate limit exceeded. Please try again later.',
        retryAfter: 3600000 - (now - rateLimiter.lastResetTime),
      });
      return false;
    }

    // Check per-second limit
    if (now - rateLimiter.lastRequestTime < 1000) {
      setError({
        type: 'RATE_LIMITED',
        message: 'Rate limit: Please wait before making another request.',
        retryAfter: 1000 - (now - rateLimiter.lastRequestTime),
      });
      return false;
    }

    return true;
  };

  // Update rate limiter after successful request
  const updateRateLimit = () => {
    rateLimiter.currentHourlyCount++;
    rateLimiter.lastRequestTime = Date.now();
  };

  // Get cached data if available and not expired
  const getCachedData = <T>(key: string): T | null => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    if (cached) {
      cache.delete(key); // Remove expired cache
    }
    return null;
  };

  // Store data in cache
  const setCachedData = <T>(key: string, data: T, ttl: number) => {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  };

  // Convert category to Amazon search index
  const getSearchIndex = (category?: string): string => {
    const categoryMap: { [key: string]: string } = {
      'tops': 'FashionWomen',
      'bottoms': 'FashionWomen', 
      'shoes': 'Shoes',
      'jackets': 'FashionWomen',
      'accessories': 'Fashion',
      'men': 'FashionMen',
      'women': 'FashionWomen',
    };

    if (category) {
      const lowerCategory = category.toLowerCase();
      return categoryMap[lowerCategory] || 'Fashion';
    }
    
    return 'Fashion';
  };

  // Mock Amazon Product Advertising API response
  // In production, this would make actual API calls
  const mockAmazonAPICall = async (endpoint: string, params: any): Promise<any> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Mock product data - no images needed, text-only approach

    const mockProducts: AmazonProduct[] = [
      {
        asin: 'SEARCH1',
        title: `${params.Keywords} - Stylish Cotton Blend`,
        imageUrl: null,
        price: 29.99 + Math.random() * 70,
        currency: 'USD',
        rating: 4.0 + Math.random() * 1,
        reviewCount: Math.floor(Math.random() * 1000) + 50,
        detailPageURL: `https://amazon.com/s?k=${encodeURIComponent(params.Keywords + ' clothing')}`,
        features: ['Premium quality material', 'Comfortable fit', 'Machine washable'],
      },
      {
        asin: 'SEARCH2',
        title: `Premium ${params.Keywords} - Designer Style`,
        imageUrl: null,
        price: 45.99 + Math.random() * 50,
        currency: 'USD',
        rating: 4.2 + Math.random() * 0.8,
        reviewCount: Math.floor(Math.random() * 500) + 100,
        detailPageURL: `https://amazon.com/s?k=${encodeURIComponent(params.Keywords + ' premium')}`,
        features: ['Designer inspired', 'High-quality fabric', 'Versatile styling'],
      },
      {
        asin: 'SEARCH3',
        title: `Classic ${params.Keywords} - Essential Collection`,
        imageUrl: null,
        price: 19.99 + Math.random() * 30,
        currency: 'USD',
        rating: 3.8 + Math.random() * 1.2,
        reviewCount: Math.floor(Math.random() * 800) + 25,
        detailPageURL: `https://amazon.com/s?k=${encodeURIComponent(params.Keywords + ' basic')}`,
        features: ['Affordable price', 'Basic styling', 'Good for everyday wear'],
      },
    ];

    // Filter and modify based on search parameters
    const filteredProducts = mockProducts.map(product => ({
      ...product,
      title: product.title.replace(/Mock Product \d/, params.Keywords),
    }));

    if (endpoint.includes('GetItems')) {
      // Mock product details call
      return {
        ItemsResult: {
          Items: filteredProducts.slice(0, 1).map(product => ({
            ...product,
            ItemInfo: {
              Title: { DisplayValue: product.title },
              Features: { DisplayValues: product.features },
            },
            Images: {
              Primary: {
                Large: { URL: product.imageUrl }
              }
            },
            Offers: {
              Listings: [{
                Price: {
                  Amount: Math.round(product.price * 100),
                  Currency: product.currency,
                  DisplayAmount: `$${product.price.toFixed(2)}`
                }
              }]
            },
            CustomerReviews: {
              StarRating: { Value: product.rating },
              Count: product.reviewCount
            }
          }))
        }
      };
    } else {
      // Mock search call
      return {
        SearchResult: {
          Items: filteredProducts,
          TotalResultCount: filteredProducts.length
        }
      };
    }
  };

  // Search for products
  const searchProducts = useCallback(async (query: string, category?: string): Promise<AmazonProduct[]> => {
    if (!query.trim()) {
      return [];
    }

    const cacheKey = `search_${query}_${category || 'all'}`;
    
    // Check cache first
    const cachedResult = getCachedData<AmazonProduct[]>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Check rate limits
    if (!checkRateLimit()) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const searchIndex = getSearchIndex(category);
      
      const params = {
        Keywords: query,
        SearchIndex: searchIndex,
        ItemCount: 10,
        Resources: [
          'Images.Primary.Large',
          'ItemInfo.Title',
          'ItemInfo.Features',
          'Offers.Listings.Price',
          'CustomerReviews.StarRating',
          'CustomerReviews.Count'
        ]
      };

      // Mock API call (replace with actual Amazon PA-API call in production)
      const response = await mockAmazonAPICall('SearchItems', params);
      
      updateRateLimit();

      const products = response.SearchResult?.Items || [];
      const formattedProducts: AmazonProduct[] = products.map((item: any) => ({
        asin: item.asin || item.ASIN,
        title: item.title || item.ItemInfo?.Title?.DisplayValue || 'Untitled',
        imageUrl: item.imageUrl || item.Images?.Primary?.Large?.URL || null,
        price: item.price || (item.Offers?.Listings?.[0]?.Price?.Amount / 100) || 0,
        currency: item.currency || item.Offers?.Listings?.[0]?.Price?.Currency || 'USD',
        rating: item.rating || item.CustomerReviews?.StarRating?.Value || 0,
        reviewCount: item.reviewCount || item.CustomerReviews?.Count || 0,
        detailPageURL: item.detailPageURL || item.DetailPageURL || '',
        features: item.features || item.ItemInfo?.Features?.DisplayValues || [],
      }));

      // Cache the results
      setCachedData(cacheKey, formattedProducts, cacheTTL.searchResults);

      return formattedProducts;

    } catch (err: any) {
      console.error('Amazon API search error:', err);
      setError({
        type: 'NETWORK_ERROR',
        message: err.message || 'Failed to search products',
        merchant: 'amazon',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get detailed product information
  const getProductDetails = useCallback(async (asin: string): Promise<AmazonProductDetails | null> => {
    if (!asin) {
      return null;
    }

    const cacheKey = `details_${asin}`;
    
    // Check cache first
    const cachedResult = getCachedData<AmazonProductDetails>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Check rate limits
    if (!checkRateLimit()) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        ItemIds: [asin],
        Resources: [
          'Images.Primary.Large',
          'ItemInfo.Title',
          'ItemInfo.Features',
          'ItemInfo.ContentInfo',
          'Offers.Listings.Price',
          'CustomerReviews.StarRating',
          'CustomerReviews.Count'
        ]
      };

      // Mock API call (replace with actual Amazon PA-API call in production)
      const response = await mockAmazonAPICall('GetItems', params);
      
      updateRateLimit();

      const item = response.ItemsResult?.Items?.[0];
      if (!item) {
        return null;
      }

      const productDetails: AmazonProductDetails = {
        asin: item.asin || item.ASIN,
        title: item.title || item.ItemInfo?.Title?.DisplayValue || 'Untitled',
        imageUrl: item.imageUrl || item.Images?.Primary?.Large?.URL || null,
        price: item.price || (item.Offers?.Listings?.[0]?.Price?.Amount / 100) || 0,
        currency: item.currency || item.Offers?.Listings?.[0]?.Price?.Currency || 'USD',
        rating: item.rating || item.CustomerReviews?.StarRating?.Value || 0,
        reviewCount: item.reviewCount || item.CustomerReviews?.Count || 0,
        detailPageURL: item.detailPageURL || item.DetailPageURL || '',
        features: item.features || item.ItemInfo?.Features?.DisplayValues || [],
        description: item.ItemInfo?.ContentInfo?.PublicationDate?.DisplayValue || '',
        dimensions: '',
        colors: [],
        sizes: [],
        brand: '',
        customerReviews: [],
      };

      // Cache the results
      setCachedData(cacheKey, productDetails, cacheTTL.productDetails);

      return productDetails;

    } catch (err: any) {
      console.error('Amazon API details error:', err);
      setError({
        type: 'NETWORK_ERROR',
        message: err.message || 'Failed to get product details',
        merchant: 'amazon',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate affiliate link
  const generateAffiliateLink = useCallback((asin: string): string => {
    const associateTag = process.env.EXPO_PUBLIC_AMAZON_ASSOCIATE_TAG || 'stylemuse-20';
    return `https://amazon.com/dp/${asin}?tag=${associateTag}`;
  }, []);

  // Track conversion events
  const trackConversion = useCallback((asin: string, action: 'click' | 'purchase') => {
    // In production, this would send analytics data
    console.log(`Amazon ${action} tracked for ASIN: ${asin}`);
    
    // Could integrate with analytics services like:
    // - Google Analytics
    // - Mixpanel
    // - Custom analytics endpoint
  }, []);

  return {
    searchProducts,
    getProductDetails,
    generateAffiliateLink,
    trackConversion,
    loading,
    error,
  };
};