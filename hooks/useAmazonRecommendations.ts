import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { WardrobeItem } from './useWardrobeData';
import { StyleRecommendation } from '../types/StyleAdvice';
import { useStyleRecommendations } from './useStyleRecommendations';

export const useAmazonRecommendations = () => {
  const [amazonSuggestions, setAmazonSuggestions] = useState<StyleRecommendation[]>([]);
  const [loadingAmazon, setLoadingAmazon] = useState(false);
  const [showAmazonSuggestions, setShowAmazonSuggestions] = useState(false);
  const [lastSearchTimestamp, setLastSearchTimestamp] = useState<Date | null>(null);
  const [amazonPreviewImage, setAmazonPreviewImage] = useState<string | null>(null);

  const { getItemRecommendations } = useStyleRecommendations();

  // Clean up old cache entries to prevent storage bloat
  const cleanupOldCache = async (item: WardrobeItem) => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const amazonKeys = allKeys.filter(key => 
        key.startsWith('stylemuse_amazon_suggestions_') && 
        !key.includes(item.image)
      );
      
      // Remove old cache entries (keep only last 10 items)
      if (amazonKeys.length > 10) {
        const keysToRemove = amazonKeys.slice(0, amazonKeys.length - 10);
        await AsyncStorage.multiRemove(keysToRemove);
        console.log(`🧹 Cleaned up ${keysToRemove.length} old Amazon cache entries`);
      }
    } catch (error) {
      console.error('Error cleaning up old cache:', error);
    }
  };

  // Load cached Amazon suggestions for an item
  const loadCachedAmazonSuggestions = useCallback(async (item: WardrobeItem) => {
    try {
      const cacheKey = `stylemuse_amazon_suggestions_${item.image}`;
      const timestampKey = `stylemuse_search_timestamp_${item.image}`;
      const previewKey = `stylemuse_amazon_preview_${item.image}`;
      
      const [cachedSuggestions, cachedTimestamp, cachedPreview] = await Promise.all([
        AsyncStorage.getItem(cacheKey),
        AsyncStorage.getItem(timestampKey),
        AsyncStorage.getItem(previewKey),
      ]);

      if (cachedSuggestions && cachedTimestamp) {
        const timestampDate = new Date(cachedTimestamp);
        const hoursOld = (Date.now() - timestampDate.getTime()) / (1000 * 60 * 60);
        
        // Use cached suggestions if less than 24 hours old
        if (hoursOld < 24) {
          try {
            const parsedSuggestions = JSON.parse(cachedSuggestions);
            if (Array.isArray(parsedSuggestions) && parsedSuggestions.length > 0) {
              console.log('✅ Loading cached Amazon suggestions for item:', parsedSuggestions.length, 'items');
              setAmazonSuggestions(parsedSuggestions);
              setLastSearchTimestamp(timestampDate);
              setShowAmazonSuggestions(true);
              
              if (cachedPreview) {
                setAmazonPreviewImage(cachedPreview);
              }
              
              // Clean up old cache entries
              await cleanupOldCache(item);
            }
          } catch (parseError) {
            console.error('Error parsing cached Amazon suggestions:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Error loading cached Amazon suggestions:', error);
    }
  }, []);

  // Save Amazon suggestions to cache
  const saveCachedAmazonSuggestions = async (
    item: WardrobeItem, 
    suggestions: StyleRecommendation[], 
    previewImage?: string
  ) => {
    try {
      const cacheKey = `stylemuse_amazon_suggestions_${item.image}`;
      const timestampKey = `stylemuse_search_timestamp_${item.image}`;
      const previewKey = `stylemuse_amazon_preview_${item.image}`;
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(suggestions));
      await AsyncStorage.setItem(timestampKey, new Date().toISOString());
      
      if (previewImage) {
        await AsyncStorage.setItem(previewKey, previewImage);
      }
    } catch (error) {
      console.error('Error saving Amazon suggestions:', error);
    }
  };

  // Find similar items on Amazon
  const findSimilarOnAmazon = async (item: WardrobeItem) => {
    if (loadingAmazon) return;

    setLoadingAmazon(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log('🔍 Finding similar items on Amazon for:', item.title);
      
      // Get recommendations using the existing hook
      const onlineItems = await getItemRecommendations(item);
      
      if (onlineItems.length === 0) {
        Alert.alert(
          'No Similar Items Found',
          'We couldn\'t find any similar items on Amazon right now. Try again later or update your item details for better results.',
          [{ text: 'OK' }]
        );
        setLoadingAmazon(false);
        return;
      }

      // Convert to StyleRecommendation format for consistent display
      const recommendations: StyleRecommendation[] = onlineItems.map((onlineItem, index) => ({
        id: `${item.image}-amazon-${onlineItem.id}-${index}`,
        type: 'similar' as const,
        wardrobeContext: item,
        onlineItem,
        similarityScore: 75 + Math.random() * 25, // Random score between 75-100
        reasoning: `Similar style and category to your ${item.title}`,
        confidenceLevel: 80,
        aiInsight: `Found this ${onlineItem.category} item that matches your style`,
        generatedAt: new Date(),
      }));

      setAmazonSuggestions(recommendations);
      setShowAmazonSuggestions(true);
      setLastSearchTimestamp(new Date());
      
      // Set preview image (first item's image)
      if (recommendations.length > 0 && recommendations[0].onlineItem.imageUrl) {
        setAmazonPreviewImage(recommendations[0].onlineItem.imageUrl);
      }
      
      // Save to cache
      await saveCachedAmazonSuggestions(
        item, 
        recommendations, 
        recommendations[0]?.onlineItem.imageUrl
      );
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error('Error finding similar items:', error);
      Alert.alert(
        'Search Failed',
        'Unable to search for similar items. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoadingAmazon(false);
    }
  };

  const handleWishlistSave = (recommendation: StyleRecommendation) => {
    // TODO: Implement wishlist functionality
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Added to Wishlist', 'Item saved to your wishlist!');
  };

  const handleViewDetails = (recommendation: StyleRecommendation) => {
    // TODO: Implement item details modal
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Item Details', 'Item details feature coming soon!');
  };

  return {
    // State
    amazonSuggestions,
    setAmazonSuggestions,
    loadingAmazon,
    setLoadingAmazon,
    showAmazonSuggestions,
    setShowAmazonSuggestions,
    lastSearchTimestamp,
    setLastSearchTimestamp,
    amazonPreviewImage,
    setAmazonPreviewImage,
    
    // Functions
    loadCachedAmazonSuggestions,
    saveCachedAmazonSuggestions,
    findSimilarOnAmazon,
    handleWishlistSave,
    handleViewDetails,
    cleanupOldCache,
  };
};