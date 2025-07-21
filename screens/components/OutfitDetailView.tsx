import React, { useState } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView } from 'react-native';
import { LovedOutfit, WardrobeItem } from '../../hooks/useWardrobeData';
import { MarkAsWornModal } from './MarkAsWornModal';
import { SafeImage } from '../../utils/SafeImage';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { MetadataDisplay } from './MetadataDisplay';
import { OCCASION_OPTIONS } from '../../contexts/OutfitFilterContext';

// Helper function to safely format dates
const formatDate = (date: any): string => {
  try {
    if (!date) return 'Never';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString();
  } catch (error) {
    console.warn('Invalid date in outfit detail:', error);
    return 'Invalid date';
  }
};

interface OutfitDetailViewProps {
  outfit: LovedOutfit;
  savedItems: WardrobeItem[];
  onBack: () => void;
  onToggleLove: (outfitId: string) => void;
  onDownloadImage: (imageUri: string) => void;
  onItemTap: (item: WardrobeItem) => void;
  onMarkAsWorn: (outfitId: string, rating?: number, event?: string, location?: string) => void;
  onDelete: (outfitId: string) => Promise<void>;
  categorizeItem: (item: WardrobeItem) => string;
  onUpdateOccasion?: (outfitId: string, occasion: string) => void;
}

export const OutfitDetailView: React.FC<OutfitDetailViewProps> = ({
  outfit,
  savedItems,
  onBack,
  onToggleLove,
  onDownloadImage,
  onItemTap,
  onMarkAsWorn,
  onDelete,
  categorizeItem,
  onUpdateOccasion,
}) => {
  const [showMarkAsWornModal, setShowMarkAsWornModal] = useState(false);
  const [showOccasionDropdown, setShowOccasionDropdown] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState(outfit.metadata?.occasion || 'casual');
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const handleDeleteOutfit = () => {
    Alert.alert(
      'Delete Outfit',
      'Are you sure you want to delete this outfit? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(outfit.id);
              onBack(); // Go back to outfits list after deletion
            } catch (error) {
              Alert.alert('Error', 'Failed to delete outfit. Please try again.');
            }
          },
        },
      ]
    );
  };
  return (
    <View style={styles.itemDetailContainer}>
      {/* Header with back and delete buttons */}
      <View style={styles.itemDetailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Outfits</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteOutfit} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
      {/* Title on its own row */}
      <View style={styles.itemDetailTitleContainer}>
        <Text style={styles.itemDetailTitle}>
          Generated Outfit
        </Text>
      </View>

      {/* Occasion Dropdown */}
      <View style={styles.occasionSection}>
        <Text style={styles.occasionLabel}>Occasion:</Text>
        <TouchableOpacity 
          style={styles.occasionDropdown}
          onPress={() => setShowOccasionDropdown(true)}
        >
          {OCCASION_OPTIONS.find(opt => opt.value === selectedOccasion) && (
            <>
              <Text style={styles.occasionEmoji}>
                {OCCASION_OPTIONS.find(opt => opt.value === selectedOccasion)?.emoji}
              </Text>
              <Text style={styles.occasionText}>
                {OCCASION_OPTIONS.find(opt => opt.value === selectedOccasion)?.label}
              </Text>
            </>
          )}
          <Text style={styles.occasionArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Outfit Image */}
      <View style={styles.itemDetailImageContainer}>
        <SafeImage
          uri={outfit.image}
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
            {formatDate(outfit.createdAt)}
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

        {/* Metadata Display */}
        {outfit.metadata && <MetadataDisplay metadata={outfit.metadata} />}

        {/* Wear History Section */}
        {outfit.timesWorn > 0 && (
          <View style={styles.itemDetailField}>
            <Text style={styles.itemDetailLabel}>Worn:</Text>
            <Text style={styles.itemDetailValue}>
              {outfit.timesWorn} time{outfit.timesWorn !== 1 ? 's' : ''}
              {outfit.lastWorn && ` • Last: ${formatDate(outfit.lastWorn)}`}
            </Text>
          </View>
        )}

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
                  <SafeImage
                    uri={itemUri}
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
            onPress={() => setShowMarkAsWornModal(true)}
            style={[styles.itemDetailActionButton, styles.markAsWornButton]}
          >
            <Text style={styles.itemDetailActionButtonText}>👔 Mark as Worn</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => onDownloadImage(outfit.image)}
            style={styles.itemDetailActionButton}
          >
            <Text style={styles.itemDetailActionButtonText}>⬇️ Download</Text>
          </TouchableOpacity>
        </View>
        
        {/* Occasion Selection Modal */}
        <Modal
          visible={showOccasionDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowOccasionDropdown(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowOccasionDropdown(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Occasion</Text>
                <TouchableOpacity 
                  onPress={() => setShowOccasionDropdown(false)}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalContent}>
                {OCCASION_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.occasionOption,
                      selectedOccasion === option.value && styles.occasionOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedOccasion(option.value);
                      onUpdateOccasion?.(outfit.id, option.value);
                      setShowOccasionDropdown(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={styles.occasionOptionEmoji}>{option.emoji}</Text>
                    <Text style={[
                      styles.occasionOptionText,
                      selectedOccasion === option.value && styles.occasionOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
        
        {/* Mark as Worn Modal */}
        <MarkAsWornModal
          visible={showMarkAsWornModal}
          onClose={() => setShowMarkAsWornModal(false)}
          onMarkAsWorn={(rating, event, location) => {
            onMarkAsWorn(outfit.id, rating, event, location);
          }}
          outfitId={outfit.id}
        />
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  itemDetailContainer: {
    marginTop: 20,
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    margin: 20,
    ...theme.shadows.large,
  },
  itemDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  itemDetailTitleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    flex: 0,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  itemDetailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.error + '15',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.error + '40',
    flex: 0,
  },
  deleteButtonText: {
    fontSize: 18,
    color: theme.colors.error,
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
    color: theme.colors.text,
    marginRight: 8,
    minWidth: 80,
  },
  itemDetailValue: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  itemDetailActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 8,
  },
  itemDetailActionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '30%',
    justifyContent: 'center',
  },
  markAsWornButton: {
    backgroundColor: theme.colors.success,
  },
  itemDetailActionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Outfit detail view styles
  outfitItemsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  outfitItemsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  outfitItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  outfitItemCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
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
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  outfitItemCategory: {
    fontSize: 10,
    color: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
    fontWeight: '600',
  },
  // Occasion dropdown styles
  occasionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  occasionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: 12,
    minWidth: 80,
  },
  occasionDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flex: 1,
  },
  occasionEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  occasionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  occasionArrow: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    margin: 20,
    maxHeight: '70%',
    width: '80%',
    ...theme.shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
  },
  modalContent: {
    maxHeight: 300,
  },
  occasionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '50',
  },
  occasionOptionSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  occasionOptionEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  occasionOptionText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  occasionOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});