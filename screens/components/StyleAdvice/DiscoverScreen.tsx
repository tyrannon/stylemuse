import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { OnlineItemCard } from './OnlineItemCard';
import { useStyleRecommendations } from '../../../hooks/useStyleRecommendations';
import { useWardrobeData } from '../../../hooks/useWardrobeData';
import * as Haptics from 'expo-haptics';

export const DiscoverScreen: React.FC = () => {
  const { savedItems } = useWardrobeData();
  const { 
    recommendations, 
    loading, 
    error, 
    refreshRecommendations,
    getItemRecommendations 
  } = useStyleRecommendations();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const categories = ['all', 'tops', 'bottoms', 'shoes', 'jackets', 'accessories'];

  useEffect(() => {
    // Generate initial recommendations when component mounts
    if (savedItems.length > 0) {
      refreshRecommendations(savedItems);
    }
  }, [savedItems]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await refreshRecommendations(savedItems);
    setRefreshing(false);
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
});