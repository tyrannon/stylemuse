import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Linking, Alert } from 'react-native';
import { SafeImage } from '../../../utils/SafeImage';
import { IncompleteOutfit, OnlineItem } from '../../../types/StyleAdvice';
import * as Haptics from 'expo-haptics';

interface OutfitComparisonCardProps {
  incompleteOutfit: IncompleteOutfit;
  onCompleteOutfit: (selectedItem: OnlineItem) => void;
  isFirst?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 40; // Full width with padding

export const OutfitComparisonCard: React.FC<OutfitComparisonCardProps> = ({
  incompleteOutfit,
  onCompleteOutfit,
  isFirst = false,
}) => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<OnlineItem | null>(null);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  const handleSuggestionSelect = async (item: OnlineItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSuggestion(item);
  };

  const handleViewOnAmazon = async (item: OnlineItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await Linking.openURL(item.affiliateUrl || item.productUrl);
    } catch (error) {
      console.error('Error opening Amazon link:', error);
      Alert.alert('Unable to open link', 'Please try again later.');
    }
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const renderCurrentItems = () => (
    <View style={styles.currentItemsContainer}>
      <Text style={styles.sectionLabel}>Current Outfit</Text>
      <View style={styles.itemsRow}>
        {incompleteOutfit.currentItems.map((item, index) => (
          <View key={index} style={styles.currentItem}>
            <SafeImage
              uri={item.image}
              style={styles.currentItemImage}
              resizeMode="cover"
            />
            <Text style={styles.currentItemTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderMissingSlots = () => (
    <View style={styles.missingContainer}>
      <Text style={styles.sectionLabel}>Missing Pieces</Text>
      <View style={styles.missingSlots}>
        {incompleteOutfit.missingSlots.map((slot, index) => (
          <View key={index} style={styles.missingSlot}>
            <Text style={styles.missingSlotIcon}>❓</Text>
            <Text style={styles.missingSlotText}>{slot}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSuggestions = () => {
    const displaySuggestions = showAllSuggestions 
      ? incompleteOutfit.suggestions 
      : incompleteOutfit.suggestions.slice(0, 2);

    return (
      <View style={styles.suggestionsContainer}>
        <View style={styles.suggestionsHeader}>
          <Text style={styles.sectionLabel}>Suggested Completions</Text>
          {incompleteOutfit.suggestions.length > 2 && (
            <TouchableOpacity
              onPress={() => setShowAllSuggestions(!showAllSuggestions)}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleButtonText}>
                {showAllSuggestions ? 'Show Less' : `+${incompleteOutfit.suggestions.length - 2} More`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.suggestionsGrid}>
          {displaySuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSuggestionSelect(suggestion)}
              style={[
                styles.suggestionCard,
                selectedSuggestion?.id === suggestion.id && styles.selectedSuggestionCard
              ]}
            >
              <SafeImage
                uri={suggestion.imageUrl}
                style={styles.suggestionImage}
                resizeMode="cover"
              />
              <View style={styles.suggestionInfo}>
                <Text style={styles.suggestionTitle} numberOfLines={2}>
                  {suggestion.title}
                </Text>
                <Text style={styles.suggestionPrice}>
                  {formatPrice(suggestion.price, suggestion.currency)}
                </Text>
                <View style={styles.suggestionMeta}>
                  <Text style={styles.suggestionRating}>
                    ⭐ {suggestion.rating.toFixed(1)}
                  </Text>
                  <Text style={styles.suggestionMerchant}>
                    {suggestion.merchant.name}
                  </Text>
                </View>
              </View>
              
              {selectedSuggestion?.id === suggestion.id && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderCompletionActions = () => {
    if (!selectedSuggestion) return null;

    return (
      <View style={styles.actionsContainer}>
        <View style={styles.completionPreview}>
          <Text style={styles.previewLabel}>Complete with:</Text>
          <Text style={styles.previewItemName} numberOfLines={1}>
            {selectedSuggestion.title}
          </Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => handleViewOnAmazon(selectedSuggestion)}
            style={styles.viewButton}
          >
            <Text style={styles.viewButtonText}>View on Amazon</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => onCompleteOutfit(selectedSuggestion)}
            style={styles.completeButton}
          >
            <Text style={styles.completeButtonText}>Complete Outfit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getCompletionConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#4CAF50';
    if (confidence >= 60) return '#FF9800';
    return '#FF5722';
  };

  const getCompletionConfidenceText = (confidence: number) => {
    if (confidence >= 80) return 'High Confidence';
    if (confidence >= 60) return 'Good Match';
    return 'Needs Work';
  };

  return (
    <View style={[styles.card, isFirst && styles.firstCard]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.outfitTitle}>{incompleteOutfit.styleGoal}</Text>
          <Text style={styles.outfitOccasion}>
            {incompleteOutfit.occasion} • {incompleteOutfit.season}
          </Text>
        </View>
        
        <View style={styles.confidenceBadge}>
          <View style={[
            styles.confidenceIndicator,
            { backgroundColor: getCompletionConfidenceColor(incompleteOutfit.completionConfidence) }
          ]}>
            <Text style={styles.confidenceText}>
              {incompleteOutfit.completionConfidence}%
            </Text>
          </View>
          <Text style={styles.confidenceLabel}>
            {getCompletionConfidenceText(incompleteOutfit.completionConfidence)}
          </Text>
        </View>
      </View>

      {/* Current Items */}
      {renderCurrentItems()}

      {/* Missing Slots */}
      {renderMissingSlots()}

      {/* Suggestions */}
      {renderSuggestions()}

      {/* Completion Actions */}
      {renderCompletionActions()}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  firstCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  outfitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  outfitOccasion: {
    fontSize: 14,
    color: '#666',
  },
  confidenceBadge: {
    alignItems: 'center',
  },
  confidenceIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 4,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  confidenceLabel: {
    fontSize: 10,
    color: '#666',
  },
  currentItemsContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  currentItem: {
    width: 80,
    marginRight: 12,
    marginBottom: 8,
  },
  currentItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 4,
  },
  currentItemTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  missingContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  missingSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  missingSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  missingSlotIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  missingSlotText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  suggestionsContainer: {
    padding: 16,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  suggestionCard: {
    width: (cardWidth - 32 - 12) / 2, // Two cards per row with gap
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  selectedSuggestionCard: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  suggestionImage: {
    width: '100%',
    height: 120,
  },
  suggestionInfo: {
    padding: 8,
  },
  suggestionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 16,
  },
  suggestionPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  suggestionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionRating: {
    fontSize: 10,
    color: '#666',
  },
  suggestionMerchant: {
    fontSize: 10,
    color: '#666',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionsContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  completionPreview: {
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  previewItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});