import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { WardrobeItem, LaundryStatus } from '../hooks/useWardrobeData';
import { LaundryAnalytics } from './components/LaundryAnalytics';
import { TextItemCard } from '../components/TextItemCard';
import { SafeImage } from '../utils/SafeImage';
import { AIOutfitAssistant } from '../components/AIOutfitAssistant';
import * as Haptics from 'expo-haptics';

interface WardrobePageProps {
  savedItems: WardrobeItem[];
  showSortFilterModal: boolean;
  setShowSortFilterModal: (show: boolean) => void;
  filterCategory: string;
  filterLaundryStatus: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  getSortedAndFilteredItems: () => WardrobeItem[];
  getCategoryDisplayName: (category: string) => string;
  getLaundryStatusDisplayName: (status: string) => string;
  getSortDisplayName: (sortType: string) => string;
  openWardrobeItemView: (item: WardrobeItem) => void;
  categorizeItem: (item: WardrobeItem) => string;
  generateOutfitSuggestions: (item: WardrobeItem) => void;
  // Laundry analytics
  showLaundryAnalytics: boolean;
  setShowLaundryAnalytics: (show: boolean) => void;
  getLaundryStats: () => any;
  getSmartWashSuggestions: () => any;
  getItemsByLaundryStatus: (status: LaundryStatus) => WardrobeItem[];
  // Navigation
  onNavigateToBuilder?: () => void;
}

// Helper function to get laundry status display info
const getLaundryStatusDisplay = (status: LaundryStatus | undefined) => {
  switch (status || 'clean') {
    case 'clean':
      return { emoji: '✨', text: 'Clean', color: '#4CAF50' };
    case 'dirty':
      return { emoji: '🧺', text: 'Dirty', color: '#FF5722' };
    case 'in-laundry':
      return { emoji: '🌊', text: 'Washing', color: '#2196F3' };
    case 'drying':
      return { emoji: '💨', text: 'Drying', color: '#FF9800' };
    case 'needs-ironing':
      return { emoji: '👔', text: 'Iron', color: '#9C27B0' };
    case 'out-of-rotation':
      return { emoji: '📦', text: 'Stored', color: '#607D8B' };
    default:
      return { emoji: '✨', text: 'Clean', color: '#4CAF50' };
  }
};


export const WardrobePage: React.FC<WardrobePageProps> = ({
  savedItems,
  showSortFilterModal,
  setShowSortFilterModal,
  filterCategory,
  filterLaundryStatus,
  sortBy,
  sortOrder,
  getSortedAndFilteredItems,
  getCategoryDisplayName,
  getLaundryStatusDisplayName,
  getSortDisplayName,
  openWardrobeItemView,
  categorizeItem,
  generateOutfitSuggestions,
  showLaundryAnalytics,
  setShowLaundryAnalytics,
  getLaundryStats,
  getSmartWashSuggestions,
  getItemsByLaundryStatus,
  // Navigation
  onNavigateToBuilder,
}) => {
  // Handle navigation to unified AI Outfit Assistant
  // Removed handleGoToAIAssistant - now using unified AIOutfitAssistant component

  if (savedItems.length === 0) {
    return (
      <View style={styles.emptyWardrobeContainer}>
        <Text style={styles.emptyWardrobeTitle}>
          👔 Your Wardrobe Awaits!
        </Text>
        <Text style={styles.emptyWardrobeSubtitle}>
          Don't know where to start? Let AI help you build the perfect wardrobe!
        </Text>
        
        {/* Unified Smart Outfit Generator */}
        <AIOutfitAssistant
          context="wardrobe"
          size="large"
          onOutfitGenerated={(outfit) => {
            // Navigate to builder with the generated outfit
            if (onNavigateToBuilder) {
              onNavigateToBuilder();
            }
          }}
        />

        <View style={styles.alternativeContainer}>
          <Text style={styles.orText}>or</Text>
          <Text style={styles.manualText}>
            Start manually by adding your first clothing item using the + button below.
          </Text>
        </View>
      </View>
    );
  }

  // Show analytics view if enabled
  if (showLaundryAnalytics) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.tabHeader}>
          <TouchableOpacity
            onPress={() => setShowLaundryAnalytics(false)}
            style={[styles.tabButton, !showLaundryAnalytics && styles.activeTab]}
          >
            <Text style={[styles.tabText, !showLaundryAnalytics && styles.activeTabText]}>👔 Wardrobe</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowLaundryAnalytics(true)}
            style={[styles.tabButton, showLaundryAnalytics && styles.activeTab]}
          >
            <Text style={[styles.tabText, showLaundryAnalytics && styles.activeTabText]}>🧺 Analytics</Text>
          </TouchableOpacity>
        </View>
        
        <LaundryAnalytics
          stats={getLaundryStats()}
          suggestions={getSmartWashSuggestions()}
          savedItems={savedItems}
          onItemPress={openWardrobeItemView}
          getItemsByLaundryStatus={getItemsByLaundryStatus}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Tab Header */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          onPress={() => setShowLaundryAnalytics(false)}
          style={[styles.tabButton, !showLaundryAnalytics && styles.activeTab]}
        >
          <Text style={[styles.tabText, !showLaundryAnalytics && styles.activeTabText]}>👔 Wardrobe</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowLaundryAnalytics(true)}
          style={[styles.tabButton, showLaundryAnalytics && styles.activeTab]}
        >
          <Text style={[styles.tabText, showLaundryAnalytics && styles.activeTabText]}>🧺 Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* Unified Smart Outfit Generator for populated wardrobe */}
      <View style={styles.smartGeneratorContainer}>
        <AIOutfitAssistant
          context="wardrobe"
          size="medium"
          onOutfitGenerated={(outfit) => {
            // Navigate to builder with the generated outfit
            if (onNavigateToBuilder) {
              onNavigateToBuilder();
            }
          }}
        />
      </View>

      <View style={{ marginTop: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', flex: 1 }}>
          👔 Wardrobe Inventory ({getSortedAndFilteredItems().length} of {savedItems.length} items)
        </Text>
        
        <TouchableOpacity
          onPress={() => setShowSortFilterModal(true)}
          style={styles.sortFilterButton}
        >
          <Text style={styles.sortFilterButtonText}>🔍 Filter</Text>
        </TouchableOpacity>
      </View>
      
      {/* Current filter display */}
      {(filterCategory !== 'all' || filterLaundryStatus !== 'all' || sortBy !== 'recent' || sortOrder !== 'desc') && (
        <View style={styles.currentFilterContainer}>
          <Text style={styles.currentFilterText}>
            📊 {getCategoryDisplayName(filterCategory)} • {getLaundryStatusDisplayName(filterLaundryStatus)} • {getSortDisplayName(sortBy)} • {sortOrder === 'asc' ? '↑' : '↓'}
          </Text>
        </View>
      )}
      
      <ScrollView style={styles.wardrobeScrollView} showsVerticalScrollIndicator={false}>
        {/* Show text-only items first if they exist */}
        {getSortedAndFilteredItems().filter(item => item.image === 'text-only').length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📝 Text Items</Text>
            {getSortedAndFilteredItems()
              .filter(item => item.image === 'text-only')
              .map((item, index) => (
                <TextItemCard
                  key={`text-${index}`}
                  item={item}
                  onPress={() => openWardrobeItemView(item)}
                  category={categorizeItem(item)}
                  laundryStatus={getLaundryStatusDisplay(item.laundryStatus)}
                />
              ))}
          </View>
        )}
        
        {/* Regular photo items in grid */}
        <View style={styles.wardrobeInventoryGrid}>
          {getSortedAndFilteredItems()
            .filter(item => item.image !== 'text-only')
            .map((item, index) => (
              <TouchableOpacity
                key={`photo-${index}`}
                onPress={() => openWardrobeItemView(item)}
                style={styles.wardrobeInventoryItem}
                activeOpacity={0.7}
              >
                <SafeImage
                  uri={item.image}
                  style={styles.wardrobeInventoryItemImage}
                  resizeMode="cover"
                  placeholder="item"
                  category={categorizeItem(item)}
                />
                
                <View style={styles.wardrobeInventoryItemInfo}>
                  <Text 
                    style={styles.wardrobeInventoryItemTitle}
                    numberOfLines={2}
                  >
                    {item.title || 'Untitled Item'}
                  </Text>
                  
                  <View style={styles.wardrobeInventoryItemTags}>
                    {item.tags?.slice(0, 3).map((tag, tagIndex) => (
                      <View key={tagIndex} style={styles.wardrobeInventoryItemTag}>
                        <Text style={styles.wardrobeInventoryItemTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {categorizeItem(item).toUpperCase()}
                    </Text>
                  </View>
                  
                  {/* Laundry Status Indicator */}
                  {(() => {
                    const statusDisplay = getLaundryStatusDisplay(item.laundryStatus);
                    return (
                      <View style={[styles.laundryStatusBadge, { backgroundColor: statusDisplay.color }]}>
                        <Text style={styles.laundryStatusEmoji}>{statusDisplay.emoji}</Text>
                        <Text style={styles.laundryStatusText}>{statusDisplay.text}</Text>
                      </View>
                    );
                  })()}
                  
                  {/* REMOVED: Individual outfit ideas buttons - now using unified Smart Outfit Generator */}
                  
                  {/* Edit indicator */}
                  <View style={styles.editIndicator}>
                    <Text style={styles.editIndicatorText}>✏️ Tap to edit</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  smartGeneratorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  wardrobeScrollView: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
    marginBottom: 10,
    color: '#333',
  },
  emptyWardrobeContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    marginTop: 60,
  },
  emptyWardrobeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyWardrobeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  // AI Assistant Button Styles
  aiAssistantButton: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonContent: {
    alignItems: 'center',
  },
  aiAssistantIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  aiAssistantButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  aiAssistantSubtext: {
    color: '#E8E8E8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  // Alternative container and text styles
  alternativeContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  orText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 15,
    fontWeight: '500',
  },
  manualText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  sortFilterButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  sortFilterButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentFilterContainer: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  currentFilterText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
    textAlign: 'center',
  },
  wardrobeInventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  wardrobeInventoryItem: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wardrobeInventoryItemImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  wardrobeInventoryItemInfo: {
    flex: 1,
  },
  wardrobeInventoryItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  wardrobeInventoryItemTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  wardrobeInventoryItemTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  wardrobeInventoryItemTagText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  categoryBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  laundryStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  laundryStatusEmoji: {
    fontSize: 10,
    marginRight: 4,
  },
  laundryStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  outfitSuggestionsButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 6,
  },
  outfitSuggestionsButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  editIndicator: {
    alignItems: 'center',
  },
  editIndicatorText: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  // Tab Styles
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
});