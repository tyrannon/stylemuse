import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert, Modal, Dimensions } from 'react-native';
import { OnlineItemCard } from './OnlineItemCard';
import { SafeImage } from '../../../utils/SafeImage';
import { useStyleRecommendations } from '../../../hooks/useStyleRecommendations';
import { useWardrobeData } from '../../../hooks/useWardrobeData';
import { generatePersonalizedOutfitImage } from '../../../utils/openai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');

export const DiscoverScreen: React.FC = () => {
  const { savedItems, styleDNA, selectedGender } = useWardrobeData();
  const { 
    recommendations, 
    loading, 
    error, 
    refreshRecommendations,
    getItemRecommendations,
    setCachedRecommendations
  } = useStyleRecommendations();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [generatedOutfitImage, setGeneratedOutfitImage] = useState<string | null>(null);
  const [generatingOutfit, setGeneratingOutfit] = useState(false);
  const [showOutfitModal, setShowOutfitModal] = useState(false);
  const [lastRecommendationsUpdate, setLastRecommendationsUpdate] = useState<Date | null>(null);

  const categories = ['all', 'tops', 'bottoms', 'shoes', 'jackets', 'accessories'];

  // Storage keys
  const STORAGE_KEYS = {
    LAST_RECOMMENDATIONS: 'stylemuse_last_recommendations',
    LAST_OUTFIT_IMAGE: 'stylemuse_last_outfit_image',
    RECOMMENDATIONS_TIMESTAMP: 'stylemuse_recommendations_timestamp',
  };

  useEffect(() => {
    loadPersistedData();
  }, []);

  useEffect(() => {
    // Only generate initial recommendations if we don't have any cached data
    // and the component has been mounted for at least 1 second (to allow cache loading)
    const timeoutId = setTimeout(() => {
      if (savedItems.length > 0 && recommendations.length === 0) {
        console.log('🔄 No cached recommendations found, generating new ones...');
        refreshRecommendations(savedItems);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [savedItems]);

  // Save recommendations to storage whenever they change
  useEffect(() => {
    if (recommendations.length > 0) {
      console.log('💾 Saving recommendations to storage:', recommendations.length, 'items');
      saveRecommendations(recommendations);
    }
  }, [recommendations]);

  const loadPersistedData = async () => {
    try {
      const [lastImage, lastTimestamp, lastRecommendations] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LAST_OUTFIT_IMAGE),
        AsyncStorage.getItem(STORAGE_KEYS.RECOMMENDATIONS_TIMESTAMP),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_RECOMMENDATIONS),
      ]);

      if (lastImage) {
        setGeneratedOutfitImage(lastImage);
      }

      if (lastTimestamp) {
        setLastRecommendationsUpdate(new Date(lastTimestamp));
      }

      // Load persisted recommendations if available and not too old (24 hours)
      if (lastRecommendations && lastTimestamp) {
        const timestampDate = new Date(lastTimestamp);
        const hoursOld = (Date.now() - timestampDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursOld < 24) { // Only use cached recommendations if less than 24 hours old
          try {
            const parsedRecommendations = JSON.parse(lastRecommendations);
            if (Array.isArray(parsedRecommendations) && parsedRecommendations.length > 0) {
              console.log('✅ Loading cached recommendations:', parsedRecommendations.length, 'items');
              setCachedRecommendations(parsedRecommendations);
            }
          } catch (parseError) {
            console.error('Error parsing cached recommendations:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  };

  const saveOutfitImage = async (imageUrl: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_OUTFIT_IMAGE, imageUrl);
      await AsyncStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS_TIMESTAMP, new Date().toISOString());
    } catch (error) {
      console.error('Error saving outfit image:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('🔄 Manual refresh triggered');
    await refreshRecommendations(savedItems);
    const now = new Date();
    setLastRecommendationsUpdate(now);
    setRefreshing(false);
  };

  // Save recommendations to storage whenever they change
  const saveRecommendations = async (recommendationsToSave: any[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_RECOMMENDATIONS, JSON.stringify(recommendationsToSave));
      await AsyncStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS_TIMESTAMP, new Date().toISOString());
    } catch (error) {
      console.error('Error saving recommendations:', error);
    }
  };

  const generateOutfitFromRecommendations = async () => {
    if (recommendations.length === 0) {
      Alert.alert('No Recommendations', 'Please refresh to get some recommendations first!');
      return;
    }

    setGeneratingOutfit(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Create a sample outfit using top recommendations
      const topRecommendations = recommendations.slice(0, 4);
      const outfitItems = topRecommendations.map(rec => ({
        image: rec.onlineItem.imageUrl,
        title: rec.onlineItem.title,
        description: rec.onlineItem.description,
        category: rec.onlineItem.category,
      }));

      console.log('🎨 Generating outfit image from recommendations...');
      const imageUrl = await generatePersonalizedOutfitImage(outfitItems, styleDNA, selectedGender);
      
      if (imageUrl) {
        setGeneratedOutfitImage(imageUrl);
        await saveOutfitImage(imageUrl);
        setShowOutfitModal(true);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error('Failed to generate outfit image');
      }

    } catch (error) {
      console.error('Error generating outfit:', error);
      Alert.alert('Generation Failed', 'Unable to generate outfit image. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGeneratingOutfit(false);
    }
  };

  const handleCategoryFilter = async (category: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.onlineItem.category === selectedCategory);

  const renderCategoryFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      style={styles.categoryContainer}
      contentContainerStyle={styles.categoryContent}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          onPress={() => handleCategoryFilter(category)}
          style={[
            styles.categoryButton,
            selectedCategory === category && styles.activeCategoryButton
          ]}
        >
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === category && styles.activeCategoryButtonText
          ]}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🔍</Text>
      <Text style={styles.emptyStateTitle}>No Items Found</Text>
      <Text style={styles.emptyStateText}>
        {savedItems.length === 0 
          ? "Add some items to your wardrobe first to get personalized recommendations!"
          : "We'll find similar items online based on your wardrobe. Pull down to refresh!"
        }
      </Text>
      {savedItems.length > 0 && (
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>🔄 Find Recommendations</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <Text style={styles.loadingIcon}>✨</Text>
      <Text style={styles.loadingTitle}>Finding Similar Items...</Text>
      <Text style={styles.loadingText}>AI is analyzing your wardrobe style</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        {renderCategoryFilter()}
        {renderLoadingState()}
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        {renderCategoryFilter()}
        {renderErrorState()}
      </View>
    );
  }

  if (filteredRecommendations.length === 0) {
    return (
      <View style={styles.container}>
        {renderCategoryFilter()}
        {renderEmptyState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderCategoryFilter()}
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
            title="Finding new recommendations..."
          />
        }
      >
        {/* Outfit Generation Section */}
        {recommendations.length > 0 && (
          <View style={styles.outfitGenerationSection}>
            <Text style={styles.outfitSectionTitle}>✨ Create Outfit from Recommendations</Text>
            <Text style={styles.outfitSectionSubtitle}>
              Generate a stylized outfit image using your top recommendations
            </Text>
            
            {generatedOutfitImage && (
              <TouchableOpacity 
                onPress={() => setShowOutfitModal(true)}
                style={styles.generatedOutfitContainer}
                activeOpacity={0.8}
              >
                <SafeImage
                  uri={generatedOutfitImage}
                  style={styles.generatedOutfitImage}
                  resizeMode="cover"
                  placeholder="outfit"
                />
                <View style={styles.outfitOverlay}>
                  <Text style={styles.outfitOverlayText}>Tap to View</Text>
                </View>
                {lastRecommendationsUpdate && (
                  <Text style={styles.lastUpdateText}>
                    Generated {lastRecommendationsUpdate.toLocaleDateString()}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={generateOutfitFromRecommendations}
              disabled={generatingOutfit || recommendations.length === 0}
              style={[
                styles.generateOutfitButton,
                (generatingOutfit || recommendations.length === 0) && styles.disabledButton
              ]}
            >
              <Text style={styles.generateOutfitButtonText}>
                {generatingOutfit 
                  ? '🎨 Generating Outfit...' 
                  : generatedOutfitImage 
                    ? '🔄 Generate New Outfit'
                    : '🎨 Generate Outfit Image'
                }
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.recommendationsContainer}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'Recommended for You' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Recommendations`}
          </Text>
          <Text style={styles.sectionSubtitle}>
            Based on your wardrobe style • {filteredRecommendations.length} items found
          </Text>
          
          <View style={styles.itemsGrid}>
            {filteredRecommendations.map((recommendation, index) => (
              <OnlineItemCard
                key={`${recommendation.id}-${index}`}
                recommendation={recommendation}
                onSaveToWishlist={() => {
                  // TODO: Implement wishlist functionality
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                onViewDetails={() => {
                  // TODO: Implement item details modal
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Outfit Modal */}
      <Modal
        visible={showOutfitModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowOutfitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generated Outfit</Text>
              <TouchableOpacity
                onPress={() => setShowOutfitModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {generatedOutfitImage && (
              <View style={styles.modalImageContainer}>
                <SafeImage
                  uri={generatedOutfitImage}
                  style={styles.modalOutfitImage}
                  resizeMode="contain"
                  placeholder="outfit"
                />
              </View>
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={generateOutfitFromRecommendations}
                disabled={generatingOutfit}
                style={[styles.regenerateButton, generatingOutfit && styles.disabledButton]}
              >
                <Text style={styles.regenerateButtonText}>
                  {generatingOutfit ? '🎨 Generating...' : '🔄 Generate New'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setShowOutfitModal(false)}
                style={styles.doneButton}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  categoryContainer: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeCategoryButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeCategoryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  recommendationsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // New outfit generation styles
  outfitGenerationSection: {
    backgroundColor: '#f8f9fa',
    margin: 20,
    marginBottom: 10,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  outfitSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  outfitSectionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  generatedOutfitContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  generatedOutfitImage: {
    width: screenWidth - 80,
    height: (screenWidth - 80) * 1.2,
    borderRadius: 12,
    marginBottom: 8,
  },
  outfitOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  outfitOverlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  generateOutfitButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateOutfitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    maxHeight: '90%',
    width: screenWidth - 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  modalImageContainer: {
    padding: 20,
    alignItems: 'center',
  },
  modalOutfitImage: {
    width: screenWidth - 80,
    height: (screenWidth - 80) * 1.2,
    borderRadius: 12,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  regenerateButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  regenerateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});