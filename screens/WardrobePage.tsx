import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { WardrobeItem } from '../hooks/useWardrobeData';

interface WardrobePageProps {
  savedItems: WardrobeItem[];
  showSortFilterModal: boolean;
  setShowSortFilterModal: (show: boolean) => void;
  filterCategory: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  getSortedAndFilteredItems: () => WardrobeItem[];
  getCategoryDisplayName: (category: string) => string;
  getSortDisplayName: (sortType: string) => string;
  openWardrobeItemView: (item: WardrobeItem) => void;
  categorizeItem: (item: WardrobeItem) => string;
  generateOutfitSuggestions: (item: WardrobeItem) => void;
}

export const WardrobePage: React.FC<WardrobePageProps> = ({
  savedItems,
  showSortFilterModal,
  setShowSortFilterModal,
  filterCategory,
  sortBy,
  sortOrder,
  getSortedAndFilteredItems,
  getCategoryDisplayName,
  getSortDisplayName,
  openWardrobeItemView,
  categorizeItem,
  generateOutfitSuggestions,
}) => {
  if (savedItems.length === 0) {
    return (
      <View style={styles.emptyWardrobeContainer}>
        <Text style={styles.emptyWardrobeTitle}>
          👔 Your Wardrobe Awaits!
        </Text>
        <Text style={styles.emptyWardrobeSubtitle}>
          Start building your digital wardrobe by adding your first clothing item using the + button below.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 40 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', flex: 1 }}>
          👔 Wardrobe Inventory ({getSortedAndFilteredItems().length} of {savedItems.length} items)
        </Text>
        
        <TouchableOpacity
          onPress={() => setShowSortFilterModal(true)}
          style={styles.sortFilterButton}
        >
          <Text style={styles.sortFilterButtonText}>🔍 Sort & Filter</Text>
        </TouchableOpacity>
      </View>
      
      {/* Current filter display */}
      {(filterCategory !== 'all' || sortBy !== 'recent' || sortOrder !== 'desc') && (
        <View style={styles.currentFilterContainer}>
          <Text style={styles.currentFilterText}>
            📊 {getCategoryDisplayName(filterCategory)} • {getSortDisplayName(sortBy)} • {sortOrder === 'asc' ? '↑' : '↓'}
          </Text>
        </View>
      )}
      
      <View style={styles.wardrobeInventoryGrid}>
        {getSortedAndFilteredItems().map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => openWardrobeItemView(item)}
            style={styles.wardrobeInventoryItem}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.wardrobeInventoryItemImage}
              resizeMode="cover"
            />
            
            <View style={styles.wardrobeInventoryItemInfo}>
              <Text style={styles.wardrobeInventoryItemTitle}>
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
              
              {/* Outfit Suggestions Button */}
              <TouchableOpacity
                onPress={() => generateOutfitSuggestions(item)}
                style={styles.outfitSuggestionsButton}
              >
                <Text style={styles.outfitSuggestionsButtonText}>🎨 Outfit Ideas</Text>
              </TouchableOpacity>
              
              {/* Edit indicator */}
              <View style={styles.editIndicator}>
                <Text style={styles.editIndicatorText}>✏️ Tap to edit</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    numberOfLines: 2,
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
});