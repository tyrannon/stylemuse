import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LovedOutfit, WardrobeItem } from '../../hooks/useWardrobeData';

interface OutfitDetailViewProps {
  outfit: LovedOutfit;
  savedItems: WardrobeItem[];
  onBack: () => void;
  onToggleLove: (outfitId: string) => void;
  onDownloadImage: (imageUri: string) => void;
  onItemTap: (item: WardrobeItem) => void;
  categorizeItem: (item: WardrobeItem) => string;
}

export const OutfitDetailView: React.FC<OutfitDetailViewProps> = ({
  outfit,
  savedItems,
  onBack,
  onToggleLove,
  onDownloadImage,
  onItemTap,
  categorizeItem,
}) => {
  return (
    <View style={styles.itemDetailContainer}>
      {/* Header with back button */}
      <View style={styles.itemDetailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Outfits</Text>
        </TouchableOpacity>
        <Text style={styles.itemDetailTitle}>
          Generated Outfit
        </Text>
      </View>

      {/* Outfit Image */}
      <View style={styles.itemDetailImageContainer}>
        <Image
          source={{ uri: outfit.image }}
          style={styles.itemDetailImage}
          resizeMode="contain"
        />
      </View>

      {/* Outfit Information */}
      <View style={styles.itemDetailInfo}>
        {/* Creation Date */}
        <View style={styles.itemDetailField}>
          <Text style={styles.itemDetailLabel}>Created:</Text>
          <Text style={styles.itemDetailValue}>
            {outfit.createdAt.toLocaleDateString()}
          </Text>
        </View>

        {/* Weather Info */}
        {outfit.weatherData && (
          <View style={styles.itemDetailField}>
            <Text style={styles.itemDetailLabel}>Weather:</Text>
            <Text style={styles.itemDetailValue}>
              🌡️ {outfit.weatherData.temperature}°F
            </Text>
          </View>
        )}

        {/* Style DNA */}
        {outfit.styleDNA && (
          <View style={styles.itemDetailField}>
            <Text style={styles.itemDetailLabel}>Style:</Text>
            <Text style={styles.itemDetailValue}>
              🧬 Personalized to your Style DNA
            </Text>
          </View>
        )}

        {/* Gender */}
        <View style={styles.itemDetailField}>
          <Text style={styles.itemDetailLabel}>Style:</Text>
          <Text style={styles.itemDetailValue}>
            {outfit.gender === 'male' ? '👨 Masculine' : 
             outfit.gender === 'female' ? '👩 Feminine' : 
             outfit.gender === 'nonbinary' ? '🧑 Non-binary' : 
             '👤 Unisex'}
          </Text>
        </View>

        {/* Items Used Section */}
        <View style={styles.outfitItemsSection}>
          <Text style={styles.outfitItemsSectionTitle}>
            👔 Items Used ({outfit.selectedItems.length})
          </Text>
          
          <View style={styles.outfitItemsGrid}>
            {outfit.selectedItems.map((itemUri: string, index: number) => {
              // Find the actual item data from savedItems
              const itemData = savedItems.find(item => item.image === itemUri);
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    if (itemData) {
                      // Go to item detail view
                      onBack(); // Close outfit detail first
                      onItemTap(itemData); // Open item detail
                    }
                  }}
                  style={styles.outfitItemCard}
                >
                  <Image
                    source={{ uri: itemUri }}
                    style={styles.outfitItemImage}
                    resizeMode="cover"
                  />
                  {itemData && (
                    <View style={styles.outfitItemInfo}>
                      <Text style={styles.outfitItemTitle}>
                        {itemData.title || 'Untitled'}
                      </Text>
                      <Text style={styles.outfitItemCategory}>
                        {categorizeItem(itemData).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.itemDetailActions}>
          <TouchableOpacity
            onPress={() => onToggleLove(outfit.id)}
            style={[
              styles.itemDetailActionButton,
              outfit.isLoved && { backgroundColor: '#ff6b6b' }
            ]}
          >
            <Text style={styles.itemDetailActionButtonText}>
              {outfit.isLoved ? '❤️ Loved' : '🤍 Love This'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => onDownloadImage(outfit.image)}
            style={styles.itemDetailActionButton}
          >
            <Text style={styles.itemDetailActionButtonText}>⬇️ Download</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  itemDetailContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemDetailHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  itemDetailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  itemDetailImageContainer: {
    padding: 20,
    alignItems: 'center',
  },
  itemDetailImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  itemDetailInfo: {
    padding: 20,
  },
  itemDetailField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  itemDetailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
    minWidth: 80,
  },
  itemDetailValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  itemDetailActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemDetailActionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDetailActionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Outfit detail view styles
  outfitItemsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  outfitItemsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  outfitItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  outfitItemCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  outfitItemImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  outfitItemInfo: {
    alignItems: 'center',
  },
  outfitItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  outfitItemCategory: {
    fontSize: 10,
    color: '#666',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
});