import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeImage } from '../../../utils/SafeImage';
import { useWardrobeData } from '../../../hooks/useWardrobeData';
import { useStyleRecommendations } from '../../../hooks/useStyleRecommendations';
import { analyzeOutfitCompletion } from '../../../utils/openai';
import { IncompleteOutfit, OnlineItem } from '../../../types/StyleAdvice';
import { OutfitComparisonCard } from './OutfitComparisonCard';
import * as Haptics from 'expo-haptics';

export const OutfitCompletionScreen: React.FC = () => {
  const { savedItems } = useWardrobeData();
  const { getSimilarItems } = useStyleRecommendations();
  
  const [loading, setLoading] = useState(false);
  const [incompleteOutfits, setIncompleteOutfits] = useState<IncompleteOutfit[]>([]);
  const [selectedOccasion, setSelectedOccasion] = useState<string>('casual');
  const [selectedSeason, setSelectedSeason] = useState<string>('current');

  const occasions = ['casual', 'work', 'formal', 'date', 'workout', 'travel'];
  const seasons = ['current', 'spring', 'summer', 'fall', 'winter'];

  useEffect(() => {
    if (savedItems.length > 0) {
      analyzeIncompleteOutfits();
    }
  }, [savedItems, selectedOccasion, selectedSeason]);

  const analyzeIncompleteOutfits = async () => {
    setLoading(true);
    
    try {
      // Group wardrobe items by potential outfit combinations
      const outfitCombinations = generateOutfitCombinations(savedItems);
      const analyzedOutfits: IncompleteOutfit[] = [];

      for (const combination of outfitCombinations.slice(0, 3)) { // Limit to 3 for performance
        try {
          // Use AI to analyze what's missing from this outfit
          const analysis = await analyzeOutfitCompletion(combination, selectedOccasion, selectedSeason);
          
          if (analysis.missingSlots.length > 0) {
            // Get suggestions for missing pieces
            const suggestions: OnlineItem[] = [];
            
            for (const suggestion of analysis.suggestions.slice(0, 2)) { // Limit suggestions
              const searchResults = await getSimilarItems(suggestion.recommendation, suggestion.slot);
              suggestions.push(...searchResults.slice(0, 2)); // 2 items per missing slot
            }

            const incompleteOutfit: IncompleteOutfit = {
              id: `outfit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              currentItems: combination,
              missingSlots: analysis.missingSlots,
              suggestions: suggestions,
              completionConfidence: analysis.completionConfidence,
              styleGoal: `Complete ${selectedOccasion} outfit`,
              occasion: selectedOccasion,
              season: selectedSeason,
            };

            analyzedOutfits.push(incompleteOutfit);
          }
        } catch (error) {
          console.error('Error analyzing outfit combination:', error);
        }
      }

      setIncompleteOutfits(analyzedOutfits);
    } catch (error) {
      console.error('Error analyzing incomplete outfits:', error);
      Alert.alert('Analysis Error', 'Unable to analyze outfits. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateOutfitCombinations = (items: any[]) => {
    const combinations = [];
    const categories = {
      tops: items.filter(item => ['tops', 'top'].includes(item.category?.toLowerCase())),
      bottoms: items.filter(item => ['bottoms', 'bottom', 'pants', 'jeans'].includes(item.category?.toLowerCase())),
      shoes: items.filter(item => ['shoes', 'shoe'].includes(item.category?.toLowerCase())),
      jackets: items.filter(item => ['jackets', 'jacket', 'outerwear'].includes(item.category?.toLowerCase())),
    };

    // Generate combinations of tops + bottoms (core outfit base)
    for (const top of categories.tops.slice(0, 3)) { // Limit for performance
      for (const bottom of categories.bottoms.slice(0, 3)) {
        const combination = [top, bottom];
        
        // Sometimes add a jacket
        if (categories.jackets.length > 0 && Math.random() > 0.5) {
          combination.push(categories.jackets[0]);
        }
        
        combinations.push(combination);
      }
    }

    // Generate top-only combinations (for dresses, long shirts, etc.)
    for (const top of categories.tops.slice(0, 2)) {
      if (top.description?.toLowerCase().includes('dress') || 
          top.style?.toLowerCase().includes('long')) {
        combinations.push([top]);
      }
    }

    return combinations;
  };

  const handleCompleteOutfit = async (outfit: IncompleteOutfit, selectedItem: OnlineItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Complete Outfit',
      `Would you like to view this ${selectedItem.title} on Amazon to complete your ${outfit.styleGoal.toLowerCase()}?`,
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'View Item',
          onPress: () => {
            // Open the item URL
            // This will be handled by the OnlineItemCard component
          }
        }
      ]
    );
  };

  const handleRefresh = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await analyzeIncompleteOutfits();
  };

  const renderOccasionSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Occasion:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
        {occasions.map((occasion) => (
          <TouchableOpacity
            key={occasion}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedOccasion(occasion);
            }}
            style={[
              styles.selectorButton,
              selectedOccasion === occasion && styles.activeSelectorButton
            ]}
          >
            <Text style={[
              styles.selectorButtonText,
              selectedOccasion === occasion && styles.activeSelectorButtonText
            ]}>
              {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSeasonSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Season:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
        {seasons.map((season) => (
          <TouchableOpacity
            key={season}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedSeason(season);
            }}
            style={[
              styles.selectorButton,
              selectedSeason === season && styles.activeSelectorButton
            ]}
          >
            <Text style={[
              styles.selectorButtonText,
              selectedSeason === season && styles.activeSelectorButtonText
            ]}>
              {season.charAt(0).toUpperCase() + season.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <Text style={styles.loadingIcon}>🔍</Text>
      <Text style={styles.loadingTitle}>Analyzing Outfits...</Text>
      <Text style={styles.loadingText}>AI is finding missing pieces for your {selectedOccasion} looks</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>✨</Text>
      <Text style={styles.emptyStateTitle}>Complete Outfits Available</Text>
      <Text style={styles.emptyStateText}>
        {savedItems.length === 0 
          ? "Add more items to your wardrobe to get outfit completion suggestions!"
          : `Your ${selectedOccasion} outfits look complete! Try a different occasion or add more wardrobe items.`
        }
      </Text>
      {savedItems.length > 0 && (
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>🔄 Analyze Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {renderOccasionSelector()}
        {renderSeasonSelector()}
        {renderLoadingState()}
      </View>
    );
  }

  if (incompleteOutfits.length === 0) {
    return (
      <View style={styles.container}>
        {renderOccasionSelector()}
        {renderSeasonSelector()}
        {renderEmptyState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderOccasionSelector()}
      {renderSeasonSelector()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.sectionTitle}>Complete Your Outfits</Text>
            <Text style={styles.sectionSubtitle}>
              {incompleteOutfits.length} outfit{incompleteOutfits.length !== 1 ? 's' : ''} ready for completion
            </Text>
            <TouchableOpacity onPress={handleRefresh} style={styles.refreshHeaderButton}>
              <Text style={styles.refreshHeaderButtonText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>

          {incompleteOutfits.map((outfit, index) => (
            <OutfitComparisonCard
              key={outfit.id}
              incompleteOutfit={outfit}
              onCompleteOutfit={(selectedItem) => handleCompleteOutfit(outfit, selectedItem)}
              isFirst={index === 0}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  selectorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  selectorScroll: {
    flexDirection: 'row',
  },
  selectorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeSelectorButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  selectorButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeSelectorButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  headerContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    flex: 1,
  },
  refreshHeaderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 16,
  },
  refreshHeaderButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  refreshButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 24,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});