import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { 
  generateSmartOutfitSuggestions, 
  generateItemRecommendations,
  analyzeWardrobeGaps,
  SmartSuggestion, 
  SuggestedItem, 
  UserStyleProfile 
} from '../services/SmartSuggestionsService';
import { WardrobeItem, useWardrobeData } from './useWardrobeData';

export interface SmartSuggestionsState {
  // State
  isGenerating: boolean;
  suggestions: SmartSuggestion[];
  currentSuggestion: SmartSuggestion | null;
  showSuggestionsModal: boolean;
  wardrobeGaps: {
    essentialMissing: string[];
    recommendations: SuggestedItem[];
    priorities: { category: string; priority: number; reasoning: string }[];
  } | null;
  
  // Actions
  generateSuggestions: (userProfile: UserStyleProfile, existingItems: WardrobeItem[], styleDNA?: any) => Promise<SmartSuggestion | null>;
  selectSuggestion: (suggestion: SmartSuggestion) => void;
  closeSuggestionsModal: () => void;
  addSuggestedItemToWishlist: (item: SuggestedItem) => void;
  generateItemsForCategory: (category: string, existingOutfitItems: WardrobeItem[], userProfile: UserStyleProfile) => Promise<SuggestedItem[]>;
  analyzeCurrentWardrobe: (existingItems: WardrobeItem[], userProfile: UserStyleProfile) => Promise<void>;
  
  // Smart button logic
  shouldShowSmartButton: (wardrobeItems: WardrobeItem[]) => boolean;
  getSmartButtonText: (wardrobeItems: WardrobeItem[]) => string;
  getSmartButtonIcon: (wardrobeItems: WardrobeItem[]) => string;
}

export const useSmartSuggestions = (): SmartSuggestionsState => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [currentSuggestion, setCurrentSuggestion] = useState<SmartSuggestion | null>(null);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [wardrobeGaps, setWardrobeGaps] = useState<{
    essentialMissing: string[];
    recommendations: SuggestedItem[];
    priorities: { category: string; priority: number; reasoning: string }[];
  } | null>(null);

  // Access wardrobe data for storage functionality
  const { addSuggestedItem, moveToWishlistFromSuggestions } = useWardrobeData();

  // Determine if smart button should be shown
  const shouldShowSmartButton = useCallback((wardrobeItems: WardrobeItem[]): boolean => {
    // Always show the button - it's useful for everyone!
    return true;
  }, []);

  // Get dynamic text for smart button based on wardrobe state
  const getSmartButtonText = useCallback((wardrobeItems: WardrobeItem[]): string => {
    if (wardrobeItems.length === 0) {
      return "✨ Build My Wardrobe";
    } else if (wardrobeItems.length < 5) {
      return "✨ Get Smart Suggestions";
    } else if (wardrobeItems.length < 15) {
      return "✨ Complete My Style";
    } else {
      return "✨ Fresh Outfit Ideas";
    }
  }, []);

  // Get dynamic icon for smart button
  const getSmartButtonIcon = useCallback((wardrobeItems: WardrobeItem[]): string => {
    if (wardrobeItems.length === 0) {
      return "🏗️"; // Building icon
    } else if (wardrobeItems.length < 5) {
      return "🧠"; // Brain icon
    } else if (wardrobeItems.length < 15) {
      return "🎯"; // Target icon
    } else {
      return "✨"; // Sparkles icon
    }
  }, []);

  // Main function to generate smart suggestions
  const generateSuggestions = useCallback(async (
    userProfile: UserStyleProfile,
    existingItems: WardrobeItem[],
    styleDNA?: any
  ): Promise<SmartSuggestion | null> => {
    try {
      setIsGenerating(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      console.log('🧠 Starting smart suggestions generation...');
      console.log('User profile:', userProfile);
      console.log('Existing items:', existingItems.length);

      // Generate outfit suggestions
      const newSuggestions = await generateSmartOutfitSuggestions(
        existingItems,
        userProfile,
        styleDNA
      );

      if (newSuggestions.length > 0) {
        setSuggestions(newSuggestions);
        setCurrentSuggestion(newSuggestions[0]); // Set first suggestion as current
        setShowSuggestionsModal(true);

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        console.log('✅ Generated', newSuggestions.length, 'smart suggestions');
        console.log('🎭 Smart Suggestions Modal should now be visible:', true);
        console.log('📋 Current suggestion:', newSuggestions[0]?.outfitName);
        
        return newSuggestions[0]; // Return the first suggestion
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          '🤔 No Suggestions Available',
          'I couldn\'t generate outfit suggestions right now. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
        return null;
      }

    } catch (error) {
      console.error('❌ Error generating smart suggestions:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        '😔 Oops!',
        'Something went wrong while generating your outfit suggestions. Please try again in a moment.',
        [{ text: 'OK' }]
      );
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Select a specific suggestion to view
  const selectSuggestion = useCallback((suggestion: SmartSuggestion) => {
    setCurrentSuggestion(suggestion);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Close the suggestions modal
  const closeSuggestionsModal = useCallback(() => {
    setShowSuggestionsModal(false);
    setCurrentSuggestion(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Add a suggested item to wishlist/wardrobe
  const addSuggestedItemToWishlist = useCallback(async (item: SuggestedItem) => {
    console.log('💖 Adding suggested item to wishlist:', item.title);
    
    try {
      // Convert suggested item to wishlist item and save properly
      await moveToWishlistFromSuggestions(item, {
        source: 'smart_suggestions',
        outfitName: currentSuggestion?.outfitName,
        occasion: currentSuggestion?.occasion,
        addedAt: new Date()
      });
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Show confirmation
      Alert.alert(
        '✅ Added to Wishlist!',
        `"${item.title}" has been saved to your wishlist. You can view and purchase it in the 💖 Wishlist tab.`,
        [{ text: 'Great!' }]
      );
    } catch (error) {
      console.error('❌ Failed to save suggested item to wishlist:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        '❌ Save Failed',
        'Sorry, we couldn\'t save this item to your wishlist. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [moveToWishlistFromSuggestions, currentSuggestion]);

  // Generate specific items for a category
  const generateItemsForCategory = useCallback(async (
    category: string,
    existingOutfitItems: WardrobeItem[],
    userProfile: UserStyleProfile
  ): Promise<SuggestedItem[]> => {
    try {
      console.log(`🎯 Generating ${category} recommendations...`);
      
      const recommendations = await generateItemRecommendations(
        category,
        existingOutfitItems,
        userProfile
      );

      console.log(`✅ Generated ${recommendations.length} ${category} recommendations`);
      return recommendations;

    } catch (error) {
      console.error(`❌ Error generating ${category} recommendations:`, error);
      return [];
    }
  }, []);

  // Analyze current wardrobe for gaps
  const analyzeCurrentWardrobe = useCallback(async (
    existingItems: WardrobeItem[],
    userProfile: UserStyleProfile
  ): Promise<void> => {
    try {
      console.log('🔍 Analyzing wardrobe gaps...');
      
      const analysis = await analyzeWardrobeGaps(existingItems, userProfile);
      setWardrobeGaps(analysis);

      console.log('✅ Wardrobe analysis complete:', analysis);

    } catch (error) {
      console.error('❌ Error analyzing wardrobe:', error);
    }
  }, []);

  return {
    // State
    isGenerating,
    suggestions,
    currentSuggestion,
    showSuggestionsModal,
    wardrobeGaps,
    
    // Actions
    generateSuggestions,
    selectSuggestion,
    closeSuggestionsModal,
    addSuggestedItemToWishlist,
    generateItemsForCategory,
    analyzeCurrentWardrobe,
    
    // Smart button logic
    shouldShowSmartButton,
    getSmartButtonText,
    getSmartButtonIcon,
  };
};