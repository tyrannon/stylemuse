import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { WardrobeItem, LaundryStatus } from '../hooks/useWardrobeData';
import { LaundryAnalytics } from './components/LaundryAnalytics';
import { TextItemCard } from '../components/TextItemCard';
import { SafeImage } from '../utils/SafeImage';
import { AIOutfitAssistant } from '../components/AIOutfitAssistant';
import { UnifiedLoadingOverlay } from '../components/UnifiedLoadingOverlay';
import { useUnifiedLoading } from '../hooks/useUnifiedLoading';
import { useTheme } from '../contexts/ThemeContext';
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
  openWardrobeItemView: (item: WardrobeItem, index?: number) => void;
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
  // Bulk operations
  deleteBulkWardrobeItems?: (items: WardrobeItem[]) => Promise<void>;
  // New items tracking
  newWardrobeItemCount?: number;
  markAllWardrobeItemsAsViewed?: () => Promise<number>;
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
  // Bulk operations
  deleteBulkWardrobeItems,
  // New items tracking
  newWardrobeItemCount,
  markAllWardrobeItemsAsViewed,
}) => {
  const { theme } = useTheme();
  const unifiedLoading = useUnifiedLoading();
  const styles = createStyles(theme);
  
  // Multi-select state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<WardrobeItem[]>([]);
  
  // Handle marking all items as seen
  const handleMarkAllAsSeen = async () => {
    if (!markAllWardrobeItemsAsViewed) return;
    
    try {
      const markedCount = await markAllWardrobeItemsAsViewed();
      if (markedCount > 0) {
        Alert.alert(
          'Success',
          `Marked ${markedCount} item${markedCount > 1 ? 's' : ''} as seen.`,
          [{ text: 'OK' }]
        );
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error marking all items as seen:', error);
      Alert.alert('Error', 'Failed to mark items as seen. Please try again.');
    }
  };
  
  // Handle multi-select functions
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedItems([]); // Clear selection when toggling mode
  };
  
  const toggleItemSelection = (item: WardrobeItem) => {
    if (selectedItems.some(selected => selected.image === item.image)) {
      setSelectedItems(selectedItems.filter(selected => selected.image !== item.image));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const selectAllItems = () => {
    const filteredItems = getSortedAndFilteredItems();
    setSelectedItems(filteredItems);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  const clearSelection = () => {
    setSelectedItems([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    Alert.alert(
      'Delete Items',
      `Are you sure you want to delete ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} from your wardrobe? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (deleteBulkWardrobeItems) {
                await deleteBulkWardrobeItems(selectedItems);
                setSelectedItems([]);
                setIsMultiSelectMode(false);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              console.error('Error deleting items:', error);
              Alert.alert('Error', 'Failed to delete items. Please try again.');
            }
          }
        }
      ]
    );
  };
  
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
          sharedLoading={unifiedLoading} // Pass the shared loading instance
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

      <View style={{ marginTop: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', flex: 1 }}>
            👔 Wardrobe Inventory ({getSortedAndFilteredItems().length} of {savedItems.length} items)
          </Text>
          
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              onPress={toggleMultiSelectMode}
              style={[styles.actionButton, isMultiSelectMode && styles.activeActionButton, { marginRight: 8 }]}
            >
              <Text style={[styles.actionButtonText, isMultiSelectMode && styles.activeActionButtonText]}>
                {isMultiSelectMode ? '✅ Multi' : '☑️ Select'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowSortFilterModal(true)}
              style={styles.sortFilterButton}
            >
              <Text style={styles.sortFilterButtonText}>🔍 Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      
      {/* Mark All as Seen button - only show when there are new items */}
      {newWardrobeItemCount && newWardrobeItemCount > 0 && (
        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <TouchableOpacity
            onPress={handleMarkAllAsSeen}
            style={[styles.actionButton, { width: '100%' }]}
          >
            <Text style={[styles.actionButtonText, { textAlign: 'center' }]}>
              👁️ Mark All as Seen ({newWardrobeItemCount} new item{newWardrobeItemCount > 1 ? 's' : ''})
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Multi-select actions */}
      {isMultiSelectMode && (
        <View style={styles.multiSelectActions}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionText}>
              {selectedItems.length} selected
            </Text>
          </View>
          
          <View style={styles.bulkActionButtons}>
            <TouchableOpacity
              onPress={selectAllItems}
              style={styles.bulkActionButton}
              disabled={selectedItems.length === getSortedAndFilteredItems().length}
            >
              <Text style={styles.bulkActionButtonText}>Select All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={clearSelection}
              style={styles.bulkActionButton}
              disabled={selectedItems.length === 0}
            >
              <Text style={styles.bulkActionButtonText}>Clear</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleBulkDelete}
              style={[styles.bulkActionButton, styles.deleteButton]}
              disabled={selectedItems.length === 0}
            >
              <Text style={[styles.bulkActionButtonText, styles.deleteButtonText]}>
                🗑️ Delete ({selectedItems.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Current filter display */}
      {(filterCategory !== 'all' || filterLaundryStatus !== 'all' || sortBy !== 'recent' || sortOrder !== 'desc') && (
        <View style={styles.currentFilterContainer}>
          <Text style={styles.currentFilterText}>
            📊 {getCategoryDisplayName(filterCategory)} • {getLaundryStatusDisplayName(filterLaundryStatus)} • {getSortDisplayName(sortBy)} • {sortOrder === 'asc' ? '↑' : '↓'}
          </Text>
        </View>
      )}
      
      <ScrollView style={styles.wardrobeScrollView} showsVerticalScrollIndicator={false}>
        {/* Unified display - all items together respecting sort order */}
        <View style={styles.wardrobeInventoryGrid}>
          {getSortedAndFilteredItems().map((item, index) => (
            item.image === 'text-only' ? (
              <TextItemCard
                key={`text-${index}`}
                item={item}
                onPress={() => openWardrobeItemView(item)}
                category={categorizeItem(item)}
                laundryStatus={getLaundryStatusDisplay(item.laundryStatus)}
              />
            ) : (
              <TouchableOpacity
                key={`photo-${index}`}
                onPress={() => isMultiSelectMode ? toggleItemSelection(item) : openWardrobeItemView(item)}
                style={[
                  styles.wardrobeInventoryItem,
                  isMultiSelectMode && selectedItems.some(selected => selected.image === item.image) && styles.selectedWardrobeItem
                ]}
                activeOpacity={0.7}
              >
                <View>
                  <SafeImage
                    uri={item.image}
                    style={styles.wardrobeInventoryItemImage}
                    resizeMode="cover"
                    placeholder="item"
                    category={categorizeItem(item)}
                  />
                  
                  {/* New item indicator - red dot for items not yet viewed */}
                  {item.isNew && (
                    <View style={styles.newItemDot} />
                  )}
                </View>
                
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
                  
                  {/* Edit indicator or multi-select indicator */}
                  {isMultiSelectMode ? (
                    <View style={styles.selectIndicator}>
                      <Text style={styles.selectIndicatorText}>
                        {selectedItems.some(selected => selected.image === item.image) ? '✅ Selected' : '☑️ Tap to select'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.editIndicator}>
                      <Text style={styles.editIndicatorText}>✏️ Tap to edit</Text>
                    </View>
                  )}
                </View>
                
                {/* Selection overlay for multi-select mode */}
                {isMultiSelectMode && selectedItems.some(selected => selected.image === item.image) && (
                  <View style={styles.selectionOverlay}>
                    <View style={styles.selectionCheckmark}>
                      <Text style={styles.selectionCheckmarkText}>✓</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            )
          ))}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
      </View>
      
      {/* Unified Loading Overlay */}
      <UnifiedLoadingOverlay
        visible={unifiedLoading.isLoading}
        title={unifiedLoading.loadingConfig?.title || ''}
        subtitle={unifiedLoading.loadingConfig?.subtitle}
        steps={unifiedLoading.loadingConfig?.steps}
        style={unifiedLoading.loadingConfig?.style}
      />
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
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
    color: theme.colors.text,
  },
  emptyWardrobeContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginTop: 60,
  },
  emptyWardrobeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyWardrobeSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
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
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  sortFilterButton: {
    backgroundColor: theme.colors.primary,
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
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    ...theme.shadows.medium,
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
    color: theme.colors.text,
    marginBottom: 6,
  },
  wardrobeInventoryItemTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  wardrobeInventoryItemTag: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  wardrobeInventoryItemTagText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
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
  // Multi-select styles
  actionButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeActionButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  activeActionButtonText: {
    color: 'white',
  },
  multiSelectActions: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectionInfo: {
    alignItems: 'center',
    marginBottom: 10,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  bulkActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bulkActionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  bulkActionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  deleteButtonText: {
    color: 'white',
  },
  selectedWardrobeItem: {
    borderWidth: 3,
    borderColor: theme.colors.primary,
    backgroundColor: theme.mode === 'dark' ? '#1a2332' : '#e3f2fd',
  },
  selectIndicator: {
    alignItems: 'center',
  },
  selectIndicatorText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  selectionCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCheckmarkText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Tab Styles
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
    ...theme.shadows.medium,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: 'white',
  },
  // Red dot indicator for new wardrobe items that haven't been viewed
  newItemDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.error || '#FF3B30',
    zIndex: 1,
  },
});