/**
 * Multi-Model Image Selector Component
 * 
 * Displays multiple AI-generated outfit images for user selection
 * and preference tracking.
 */

import React, { useState } from 'react';
import {
  View,
  Modal,
  Image,
  TouchableOpacity,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { ModelResult, multiModelGenerator } from '../utils/multiModelOutfitGenerator';
import { AIModel } from '../services/aiRouter';

const { width: screenWidth } = Dimensions.get('window');

interface MultiModelImageSelectorProps {
  visible: boolean;
  results: ModelResult[];
  recommendedIndex: number;
  onSelect: (result: ModelResult, rating: number) => void;
  onSaveAll?: (results: ModelResult[]) => void;
  onClose: () => void;
  context?: {
    occasion?: string;
    weather?: string;
    style?: string;
  };
}

export const MultiModelImageSelector: React.FC<MultiModelImageSelectorProps> = ({
  visible,
  results,
  recommendedIndex,
  onSelect,
  onSaveAll,
  onClose,
  context,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const isDarkMode = theme.isDarkMode;
  const [selectedIndex, setSelectedIndex] = useState<number>(recommendedIndex);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [showDetails, setShowDetails] = useState(false);

  const getModelBadgeColor = (model: AIModel) => {
    switch (model) {
      case AIModel.GPT5:
        return '#FF6B6B'; // Red for Pro
      case AIModel.GPT5_MINI:
        return '#4ECDC4'; // Teal for Mini
      case AIModel.GPT5_NANO:
        return '#45B7D1'; // Blue for Nano
      default:
        return colors.primary;
    }
  };

  const getModelDisplayName = (model: AIModel) => {
    switch (model) {
      case AIModel.GPT5:
        return 'GPT-5 Pro';
      case AIModel.GPT5_MINI:
        return 'GPT-5 Mini';
      case AIModel.GPT5_NANO:
        return 'GPT-5 Nano';
      default:
        return model;
    }
  };

  const handleRating = (index: number, rating: number) => {
    setRatings({ ...ratings, [index]: rating });
  };

  const handleConfirmSelection = async () => {
    const selected = results[selectedIndex];
    const rating = ratings[selectedIndex] || 0; // 0 means no rating provided

    // Only track preference if user provided a rating
    if (rating > 0) {
      await multiModelGenerator.trackUserPreference(
        selected.model,
        rating,
        context
      );
    }

    onSelect(selected, rating);
  };

  const handleSaveAll = async () => {
    if (onSaveAll) {
      onSaveAll(results);
    }
  };

  const renderStars = (index: number) => {
    const rating = ratings[index] || 0;
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRating(index, star)}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={20}
              color="#FFD700"
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderModelCard = (result: ModelResult, index: number) => {
    const isSelected = selectedIndex === index;
    const isRecommended = index === recommendedIndex;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.modelCard,
          {
            backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
            borderColor: isSelected ? colors.primary : '#E0E0E0',
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => setSelectedIndex(index)}
        activeOpacity={0.8}
      >
        {/* Model Badge */}
        <View
          style={[
            styles.modelBadge,
            { backgroundColor: getModelBadgeColor(result.model) },
          ]}
        >
          <Text style={styles.modelBadgeText}>
            {getModelDisplayName(result.model)}
          </Text>
          {isRecommended && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>RECOMMENDED</Text>
            </View>
          )}
        </View>

        {/* Image */}
        {result.imageUrl ? (
          <Image
            source={{ uri: result.imageUrl }}
            style={styles.outfitImage}
            resizeMode="cover"
          />
        ) : result.error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={40} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.text }]}>
              Generation failed
            </Text>
            <Text style={[styles.errorDetail, { color: colors.secondaryText }]}>
              {result.error}
            </Text>
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Rating */}
        {result.imageUrl && renderStars(index)}

        {/* Stats */}
        {showDetails && (
          <View style={styles.statsContainer}>
            <Text style={[styles.statText, { color: colors.secondaryText }]}>
              Time: {result.generationTime.toFixed(1)}s
            </Text>
            <Text style={[styles.statText, { color: colors.secondaryText }]}>
              Cost: ${result.cost.toFixed(3)}
            </Text>
          </View>
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF' },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Choose Your Favorite Outfit
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            We generated 3 versions with different AI models. Select the one you like best!
          </Text>

          {/* Options Bar */}
          <View style={styles.optionsBar}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => setShowDetails(!showDetails)}
            >
              <Ionicons
                name={showDetails ? 'information-circle' : 'information-circle-outline'}
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.optionText, { color: colors.primary }]}>
                {showDetails ? 'Hide' : 'Show'} Details
              </Text>
            </TouchableOpacity>
          </View>

          {/* Images */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imagesContainer}
          >
            {results.map((result, index) => renderModelCard(result, index))}
          </ScrollView>

          {/* Analytics Summary */}
          {showDetails && (
            <View style={[styles.analyticsBox, { backgroundColor: colors.surface }]}>
              <Text style={[styles.analyticsTitle, { color: colors.text }]}>
                Performance Comparison
              </Text>
              <View style={styles.analyticsRow}>
                <Text style={[styles.analyticsLabel, { color: colors.secondaryText }]}>
                  Total Cost:
                </Text>
                <Text style={[styles.analyticsValue, { color: colors.text }]}>
                  ${results.reduce((sum, r) => sum + r.cost, 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.analyticsRow}>
                <Text style={[styles.analyticsLabel, { color: colors.secondaryText }]}>
                  Avg Time:
                </Text>
                <Text style={[styles.analyticsValue, { color: colors.text }]}>
                  {(results.reduce((sum, r) => sum + r.generationTime, 0) / results.length).toFixed(1)}s
                </Text>
              </View>
              <View style={styles.analyticsRow}>
                <Text style={[styles.analyticsLabel, { color: colors.secondaryText }]}>
                  Success Rate:
                </Text>
                <Text style={[styles.analyticsValue, { color: colors.text }]}>
                  {((results.filter(r => r.imageUrl).length / results.length) * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            {onSaveAll && (
              <TouchableOpacity
                style={[
                  styles.saveAllButton,
                  { backgroundColor: colors.secondary || '#6B7280' }
                ]}
                onPress={handleSaveAll}
              >
                <Text style={styles.saveAllButtonText}>
                  Save All 3
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                { 
                  backgroundColor: colors.primary,
                  opacity: selectedIndex !== null ? 1 : 0.5,
                },
              ]}
              onPress={handleConfirmSelection}
              disabled={selectedIndex === null}
            >
              <Text style={styles.confirmButtonText}>
                Use This Outfit
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    maxHeight: '90%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 15,
  },
  optionsBar: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  optionText: {
    marginLeft: 5,
    fontSize: 14,
  },
  imagesContainer: {
    paddingVertical: 10,
  },
  modelCard: {
    width: screenWidth * 0.7,
    marginHorizontal: 10,
    borderRadius: 15,
    overflow: 'hidden',
  },
  modelBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  recommendedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  outfitImage: {
    width: '100%',
    height: 300,
  },
  errorContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  errorDetail: {
    marginTop: 5,
    fontSize: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  star: {
    marginHorizontal: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  statText: {
    fontSize: 12,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  analyticsBox: {
    marginVertical: 15,
    padding: 15,
    borderRadius: 10,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  analyticsLabel: {
    fontSize: 14,
  },
  analyticsValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 5,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
  },
  saveAllButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveAllButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    marginLeft: 5,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});