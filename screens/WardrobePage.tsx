import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, ActivityIndicator, Linking, Modal, Alert, Dimensions } from 'react-native';
import { WardrobeItem, LaundryStatus, useWardrobeData } from '../hooks/useWardrobeData';
import { LaundryAnalytics } from './components/LaundryAnalytics';
import { UnifiedWardrobeCard } from '../components/UnifiedWardrobeCard';
import { SafeImage } from '../utils/SafeImage';
import { AIOutfitAssistant } from '../components/AIOutfitAssistant';
import * as Haptics from 'expo-haptics';

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get('window');

// Apple's 8pt grid system spacing
const GRID_UNIT = 8;
const CONTAINER_MARGIN = GRID_UNIT * 2; // 16pt container margin
const CARD_GAP = GRID_UNIT; // 8pt gap between cards

interface WardrobePageProps {
  savedItems: WardrobeItem[];
  showSortFilterModal: boolean;
  setShowSortFilterModal: (show: boolean) => void;
  filterCategory: string;
  filterLaundryStatus: string;
  filterColorFamily: string;
  filterSeason: string;
  filterTemperature: string;
  filterCoordination: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  getSortedAndFilteredItems: () => WardrobeItem[];
  getCategoryDisplayName: (category: string) => string;
  getLaundryStatusDisplayName: (status: string) => string;
  getSortDisplayName: (sortType: string) => string;
  getColorFamilyDisplayName: (colorFamily: string) => string;
  getSeasonDisplayName: (season: string) => string;
  getTemperatureDisplayName: (temperature: string) => string;
  getCoordinationDisplayName: (coordination: string) => string;
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
  // Smart suggestions hook for modal coordination
  smartSuggestionsHook?: any;
  // Wishlist data and functions
  wishlistItems?: any[];
  removeFromWishlist?: (itemId: string) => void;
  updateWishlistPurchaseStatus?: (itemId: string, purchased: boolean) => void;
  // Function to add purchased items to wardrobe
  addItemToWardrobe?: (item: any) => void;
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
  filterColorFamily,
  filterSeason,
  filterTemperature,
  filterCoordination,
  sortBy,
  sortOrder,
  getSortedAndFilteredItems,
  getCategoryDisplayName,
  getLaundryStatusDisplayName,
  getSortDisplayName,
  getColorFamilyDisplayName,
  getSeasonDisplayName,
  getTemperatureDisplayName,
  getCoordinationDisplayName,
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
  // Smart suggestions hook
  smartSuggestionsHook,
  // Wishlist data and functions
  wishlistItems = [],
  removeFromWishlist = () => {},
  updateWishlistPurchaseStatus = () => {},
  addItemToWardrobe = () => {},
}) => {
  // Add wishlist tab state
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'analytics' | 'wishlist'>('wardrobe');
  
  console.log('💖 WardrobePage received wishlist items:', wishlistItems.length, 'items');
  console.log('💖 WardrobePage wishlist data:', wishlistItems);
  
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
          smartSuggestionsHook={smartSuggestionsHook}
          onOutfitGenerated={(outfit) => {
            console.log('✅ Empty wardrobe: AI generated outfit:', outfit?.outfitName);
            // For empty wardrobe, we can navigate to show the user how to use the builder
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

  // REMOVED: Legacy showLaundryAnalytics conditional - now using unified tab system

  return (
    <View style={{ flex: 1 }}>
      {/* Tab Header */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          onPress={() => {
            setActiveTab('wardrobe');
            setShowLaundryAnalytics(false);
          }}
          style={[styles.tabButton, activeTab === 'wardrobe' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'wardrobe' && styles.activeTabText]}>👔 Wardrobe</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => {
            console.log('💖 Wishlist tab clicked!');
            console.log('💖 Current wishlist items length:', wishlistItems.length);
            console.log('💖 Wishlist items:', wishlistItems);
            setActiveTab('wishlist');
            setShowLaundryAnalytics(false);
          }}
          style={[styles.tabButton, activeTab === 'wishlist' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'wishlist' && styles.activeTabText]}>💖 Wishlist</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => {
            setActiveTab('analytics');
            setShowLaundryAnalytics(true);
          }}
          style={[styles.tabButton, activeTab === 'analytics' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>🧺 Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* Unified Smart Outfit Generator for populated wardrobe */}
      <View style={styles.smartGeneratorContainer}>
        <AIOutfitAssistant
          context="wardrobe"
          size="large"
          smartSuggestionsHook={smartSuggestionsHook}
          onOutfitGenerated={(outfit) => {
            console.log('✅ WardrobePage: AI generated outfit:', outfit?.outfitName);
            // Don't auto-navigate - let user see results and choose to navigate
            // The Smart Suggestions Modal will show the outfit suggestions
            console.log('🎭 Outfit suggestions should now be visible in modal');
          }}
        />
      </View>

      {/* Tab Content */}
      {activeTab === 'wardrobe' && (
        <WardrobeTabContent 
          getSortedAndFilteredItems={getSortedAndFilteredItems}
          savedItems={savedItems}
          filterCategory={filterCategory}
          filterLaundryStatus={filterLaundryStatus}
          filterColorFamily={filterColorFamily}
          filterSeason={filterSeason}
          filterTemperature={filterTemperature}
          filterCoordination={filterCoordination}
          sortBy={sortBy}
          sortOrder={sortOrder}
          getCategoryDisplayName={getCategoryDisplayName}
          getLaundryStatusDisplayName={getLaundryStatusDisplayName}
          getSortDisplayName={getSortDisplayName}
          getColorFamilyDisplayName={getColorFamilyDisplayName}
          getSeasonDisplayName={getSeasonDisplayName}
          getTemperatureDisplayName={getTemperatureDisplayName}
          getCoordinationDisplayName={getCoordinationDisplayName}
          setShowSortFilterModal={setShowSortFilterModal}
          openWardrobeItemView={openWardrobeItemView}
          categorizeItem={categorizeItem}
        />
      )}

      {activeTab === 'wishlist' && (
        <WishlistTabContent 
          wishlistItems={wishlistItems}
          removeFromWishlist={removeFromWishlist}
          updateWishlistPurchaseStatus={updateWishlistPurchaseStatus}
          addItemToWardrobe={addItemToWardrobe}
        />
      )}

      {activeTab === 'analytics' && (
        <LaundryAnalytics
          stats={getLaundryStats()}
          suggestions={getSmartWashSuggestions()}
          savedItems={savedItems}
          onItemPress={openWardrobeItemView}
          getItemsByLaundryStatus={getItemsByLaundryStatus}
        />
      )}
    </View>
  );
};

// Wardrobe Tab Content Component
const WardrobeTabContent: React.FC<{
  getSortedAndFilteredItems: () => WardrobeItem[];
  savedItems: WardrobeItem[];
  filterCategory: string;
  filterLaundryStatus: string;
  filterColorFamily: string;
  filterSeason: string;
  filterTemperature: string;
  filterCoordination: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  getCategoryDisplayName: (category: string) => string;
  getLaundryStatusDisplayName: (status: string) => string;
  getSortDisplayName: (sortType: string) => string;
  getColorFamilyDisplayName: (colorFamily: string) => string;
  getSeasonDisplayName: (season: string) => string;
  getTemperatureDisplayName: (temperature: string) => string;
  getCoordinationDisplayName: (coordination: string) => string;
  setShowSortFilterModal: (show: boolean) => void;
  openWardrobeItemView: (item: WardrobeItem) => void;
  categorizeItem: (item: WardrobeItem) => string;
}> = ({
  getSortedAndFilteredItems,
  savedItems,
  filterCategory,
  filterLaundryStatus,
  filterColorFamily,
  filterSeason,
  filterTemperature,
  filterCoordination,
  sortBy,
  sortOrder,
  getCategoryDisplayName,
  getLaundryStatusDisplayName,
  getSortDisplayName,
  getColorFamilyDisplayName,
  getSeasonDisplayName,
  getTemperatureDisplayName,
  getCoordinationDisplayName,
  setShowSortFilterModal,
  openWardrobeItemView,
  categorizeItem,
}) => {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ marginTop: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: CONTAINER_MARGIN, marginBottom: GRID_UNIT * 2 }}>
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
        {(filterCategory !== 'all' || filterLaundryStatus !== 'all' || filterColorFamily !== 'all' || filterSeason !== 'all' || filterTemperature !== 'all' || filterCoordination !== 'all' || sortBy !== 'recent' || sortOrder !== 'desc') && (
          <View style={styles.currentFilterContainer}>
            <Text style={styles.currentFilterText}>
              📊 {getCategoryDisplayName(filterCategory)} • {getLaundryStatusDisplayName(filterLaundryStatus)}
              {filterColorFamily !== 'all' && ` • ${getColorFamilyDisplayName(filterColorFamily)}`}
              {filterSeason !== 'all' && ` • ${getSeasonDisplayName(filterSeason)}`}
              {filterTemperature !== 'all' && ` • ${getTemperatureDisplayName(filterTemperature)}`}
              {filterCoordination !== 'all' && ` • ${getCoordinationDisplayName(filterCoordination)}`}
              • {getSortDisplayName(sortBy)} • {sortOrder === 'asc' ? '↑' : '↓'}
            </Text>
          </View>
        )}
        
        <ScrollView style={styles.wardrobeScrollView} showsVerticalScrollIndicator={false}>
          {/* Unified grid for all items */}
          <View style={styles.wardrobeInventoryGrid}>
            {getSortedAndFilteredItems().map((item, index) => (
              <UnifiedWardrobeCard
                key={`item-${index}`}
                item={item}
                onPress={() => openWardrobeItemView(item)}
                categorizeItem={categorizeItem}
                style={styles.wardrobeInventoryItem}
              />
            ))}
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </View>
  );
};

// Wishlist Tab Content Component
const WishlistTabContent: React.FC<{
  wishlistItems: any[];
  removeFromWishlist: (itemId: string) => void;
  updateWishlistPurchaseStatus: (itemId: string, purchased: boolean) => void;
  addItemToWardrobe: (item: any) => void;
}> = ({ wishlistItems, removeFromWishlist, updateWishlistPurchaseStatus, addItemToWardrobe }) => {
  console.log('💖 WishlistTabContent rendered with:', wishlistItems.length, 'items');
  console.log('💖 Wishlist items data:', wishlistItems);
  
  const [selectedItemDetail, setSelectedItemDetail] = useState<any | null>(null);
  const handleBuyOnAmazon = async (item: any) => {
    try {
      // Extract search query from various possible sources
      let searchQuery = '';
      
      if (item.searchTerms && Array.isArray(item.searchTerms) && item.searchTerms.length > 0) {
        searchQuery = item.searchTerms.join(' ');
      } else if (item.onlineItem?.title) {
        searchQuery = item.onlineItem.title;
      } else if (item.title) {
        searchQuery = item.title;
      } else {
        // Fallback: construct from available data
        const category = item.onlineItem?.category || item.category || '';
        const color = item.onlineItem?.colors?.[0] || item.color || '';
        const material = item.material || '';
        searchQuery = `${color} ${material} ${category}`.trim();
      }
      
      console.log('🛒 Amazon search query:', searchQuery);
      
      if (!searchQuery) {
        console.warn('⚠️ No search query available for Amazon');
        searchQuery = 'clothing'; // Ultimate fallback
      }
      
      const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`;
      await Linking.openURL(amazonUrl);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('❌ Error opening Amazon:', error);
    }
  };

  const markAsPurchased = async (item: any) => {
    try {
      console.log('✅ Marking item as purchased and adding to wardrobe');
      console.log('💖 Item data structure:', JSON.stringify(item, null, 2));
      
      // Convert wishlist item to wardrobe item format
      const wardrobeItem = {
        image: 'text-only', // Since these are AI suggestions without real photos
        title: item.onlineItem?.title || item.title,
        description: item.onlineItem?.description || item.description || 'AI suggested item',
        category: item.onlineItem?.category || item.category,
        color: item.onlineItem?.colors?.[0] || item.color,
        material: item.material || 'Not specified',
        style: item.style || 'Not specified',
        fit: item.fit || 'Not specified',
        tags: [
          item.onlineItem?.category || item.category,
          'ai-suggested',
          'purchased',
          ...(item.searchTerms || [])
        ].filter(Boolean),
        laundryStatus: 'clean',
        // Add metadata about purchase
        purchaseSource: 'wishlist',
        purchaseDate: new Date(),
        originalPrice: item.onlineItem?.price || item.price,
        aiReasoning: item.reasoning,
      };
      
      console.log('👔 Adding purchased item to wardrobe:', wardrobeItem);
      
      // Add to wardrobe
      addItemToWardrobe(wardrobeItem);
      
      // Mark as purchased in wishlist
      updateWishlistPurchaseStatus(item.id, true);
      
      // Remove from wishlist since it's now in wardrobe
      removeFromWishlist(item.id);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Extract title for confirmation message
      const itemTitle = item.onlineItem?.title || item.title || 'This item';
      
      // Show confirmation
      Alert.alert(
        '🎉 Added to Wardrobe!',
        `"${itemTitle}" has been marked as purchased and added to your wardrobe. You can now use it in outfit combinations!`,
        [{ text: 'Awesome!' }]
      );
    } catch (error) {
      console.error('❌ Error marking item as purchased:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        '❌ Error',
        'Sorry, there was an error adding this item to your wardrobe. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const removeItem = (item: any) => {
    removeFromWishlist(item.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  if (wishlistItems.length === 0) {
    return (
      <View style={styles.emptyWishlistContainer}>
        <Text style={styles.emptyWishlistIcon}>💖</Text>
        <Text style={styles.emptyWishlistTitle}>Your Wishlist is Empty</Text>
        <Text style={styles.emptyWishlistSubtitle}>
          Items you love from AI outfit suggestions will appear here.
          Use the AI Outfit Assistant above to discover new pieces!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.wishlistScrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.wishlistHeader}>
        <Text style={styles.wishlistTitle}>💖 Your Wishlist ({wishlistItems.length} items)</Text>
        <Text style={styles.wishlistSubtitle}>Items from AI suggestions you want to buy</Text>
      </View>
      
      <View style={styles.wishlistGrid}>
        {wishlistItems.map((item, index) => (
          <TouchableOpacity 
            key={`wishlist-${index}`} 
            style={styles.wishlistItemCard}
            onPress={() => {
              console.log('💖 Wishlist item tapped:', item.title);
              setSelectedItemDetail(item);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            {/* Item Image Placeholder */}
            <View style={styles.wishlistItemImageContainer}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.wishlistItemImage} />
              ) : (
                <View style={styles.wishlistItemImagePlaceholder}>
                  <Text style={styles.wishlistItemImagePlaceholderText}>
                    {getCategoryEmoji(item.category)}
                  </Text>
                </View>
              )}
              <View style={styles.aiSuggestedBadge}>
                <Text style={styles.aiSuggestedBadgeText}>AI ✨</Text>
              </View>
            </View>

            {/* Item Details */}
            <View style={styles.wishlistItemInfo}>
              <Text style={styles.wishlistItemTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.wishlistItemCategory}>{item.category}</Text>
              <Text style={styles.wishlistItemDetails}>
                {item.color} • {item.material}
              </Text>
              <Text style={styles.wishlistItemPrice}>${item.price}</Text>
              
              {item.reasoning && (
                <Text style={styles.wishlistItemReasoning} numberOfLines={2}>
                  💡 {item.reasoning}
                </Text>
              )}
            </View>
            
            {/* Action Buttons */}
            <View style={styles.wishlistItemActions}>
              <TouchableOpacity
                style={styles.buyButton}
                onPress={() => handleBuyOnAmazon(item)}
              >
                <Text style={styles.buyButtonText}>🛒 Buy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.purchasedButton}
                onPress={() => markAsPurchased(item)}
              >
                <Text style={styles.purchasedButtonText}>✅</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeItem(item)}
              >
                <Text style={styles.removeButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={{ height: 20 }} />
      
      {/* Wishlist Item Detail Modal */}
      {selectedItemDetail && (
        <Modal
          visible={!!selectedItemDetail}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedItemDetail(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedItemDetail(null)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>💖 Wishlist Item</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Item Image */}
              <View style={styles.detailImageContainer}>
                {selectedItemDetail.imageUrl ? (
                  <Image source={{ uri: selectedItemDetail.imageUrl }} style={styles.detailImage} />
                ) : (
                  <View style={styles.detailImagePlaceholder}>
                    <Text style={styles.detailImageEmoji}>
                      {getCategoryEmoji(selectedItemDetail.onlineItem?.category || selectedItemDetail.category)}
                    </Text>
                  </View>
                )}
                <View style={styles.aiSuggestedBadge}>
                  <Text style={styles.aiSuggestedBadgeText}>AI ✨</Text>
                </View>
              </View>

              {/* Item Details */}
              <View style={styles.detailInfo}>
                <Text style={styles.detailTitle}>
                  {selectedItemDetail.onlineItem?.title || selectedItemDetail.title}
                </Text>
                <Text style={styles.detailCategory}>
                  {selectedItemDetail.onlineItem?.category || selectedItemDetail.category}
                </Text>
                <Text style={styles.detailDescription}>
                  {selectedItemDetail.onlineItem?.description || selectedItemDetail.description}
                </Text>
                
                <View style={styles.detailSpecs}>
                  <Text style={styles.detailSpec}>Color: {selectedItemDetail.onlineItem?.colors?.[0] || selectedItemDetail.color}</Text>
                  <Text style={styles.detailSpec}>Material: {selectedItemDetail.material || 'Not specified'}</Text>
                  <Text style={styles.detailSpec}>Style: {selectedItemDetail.style || 'Not specified'}</Text>
                </View>

                <Text style={styles.detailPrice}>
                  ${selectedItemDetail.onlineItem?.price || selectedItemDetail.price}
                </Text>

                {selectedItemDetail.reasoning && (
                  <View style={styles.reasoningContainer}>
                    <Text style={styles.reasoningTitle}>💡 Why AI Suggested This</Text>
                    <Text style={styles.reasoningText}>{selectedItemDetail.reasoning}</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    handleBuyOnAmazon(selectedItemDetail);
                    setSelectedItemDetail(null);
                  }}
                >
                  <Text style={styles.primaryButtonText}>🛒 Buy on Amazon</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    markAsPurchased(selectedItemDetail);
                    setSelectedItemDetail(null);
                  }}
                >
                  <Text style={styles.secondaryButtonText}>✅ Mark as Purchased</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => {
                    removeItem(selectedItemDetail);
                    setSelectedItemDetail(null);
                  }}
                >
                  <Text style={styles.removeButtonText}>🗑️ Remove from Wishlist</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

// Helper function to get category emoji
function getCategoryEmoji(category: string): string {
  switch (category?.toLowerCase()) {
    case 'top': return '👕';
    case 'bottom': return '👖';
    case 'shoes': return '👟';
    case 'jacket': return '🧥';
    case 'outerwear': return '🧥';
    case 'hat': return '👒';
    case 'accessories': return '👜';
    default: return '👔';
  }
}

const styles = StyleSheet.create({
  smartGeneratorContainer: {
    paddingHorizontal: CONTAINER_MARGIN,
    paddingVertical: GRID_UNIT,
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
    borderRadius: CONTAINER_MARGIN,
    padding: GRID_UNIT * 4,
    margin: CONTAINER_MARGIN + GRID_UNIT / 2,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    marginTop: GRID_UNIT * 7.5,
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
    paddingHorizontal: GRID_UNIT * 1.5,
    paddingVertical: GRID_UNIT,
    borderRadius: GRID_UNIT * 2.5,
    marginLeft: GRID_UNIT * 1.25,
  },
  sortFilterButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentFilterContainer: {
    backgroundColor: '#e3f2fd',
    paddingVertical: GRID_UNIT,
    paddingHorizontal: CONTAINER_MARGIN,
    marginHorizontal: CONTAINER_MARGIN,
    borderRadius: GRID_UNIT * 1.5,
    marginBottom: GRID_UNIT * 2,
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
    paddingHorizontal: CONTAINER_MARGIN,
    paddingTop: GRID_UNIT,
    gap: CARD_GAP,
  },
  wardrobeInventoryItem: {
    // Spacing handled by UnifiedWardrobeCard and grid gap
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
    marginHorizontal: CONTAINER_MARGIN + GRID_UNIT / 2,
    marginTop: CONTAINER_MARGIN + GRID_UNIT / 2,
    borderRadius: GRID_UNIT * 1.5,
    padding: GRID_UNIT / 2,
    marginBottom: GRID_UNIT * 1.25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: GRID_UNIT * 1.5,
    alignItems: 'center',
    borderRadius: GRID_UNIT,
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
  // Wishlist Styles
  emptyWishlistContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyWishlistIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyWishlistTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyWishlistSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  wishlistScrollView: {
    flex: 1,
  },
  wishlistHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  wishlistTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  wishlistSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  wishlistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  wishlistItemCard: {
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
  wishlistItemImageContainer: {
    position: 'relative',
  },
  wishlistItemImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  wishlistItemImagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistItemImagePlaceholderText: {
    fontSize: 40,
  },
  aiSuggestedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiSuggestedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  wishlistItemInfo: {
    marginTop: 8,
  },
  wishlistItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  wishlistItemCategory: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  wishlistItemDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  wishlistItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 6,
  },
  wishlistItemReasoning: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 14,
  },
  wishlistItemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buyButton: {
    backgroundColor: '#FF9500',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flex: 1,
    marginRight: 4,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  purchasedButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginHorizontal: 2,
  },
  purchasedButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  removeButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 4,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  // Detail Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    fontWeight: 'bold',
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailImageContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 20,
  },
  detailImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  detailImagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailImageEmoji: {
    fontSize: 80,
  },
  detailInfo: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailCategory: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  detailDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  detailSpecs: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailSpec: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'center',
  },
  reasoningContainer: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
    marginBottom: 20,
  },
  reasoningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  reasoningText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  detailActions: {
    gap: 12,
    paddingBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#FF9500',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});