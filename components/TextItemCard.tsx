import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { WardrobeItem, LaundryStatus } from '../hooks/useWardrobeData';
import * as Haptics from 'expo-haptics';

interface TextItemCardProps {
  item: WardrobeItem;
  onPress: () => void;
  category: string;
  laundryStatus: { emoji: string; text: string; color: string };
  onGenerateImage?: (item: WardrobeItem) => void;
  isGeneratingImage?: boolean;
}

const extractBrandFromTags = (tags?: string[]): string | null => {
  if (!tags) return null;
  const brandTag = tags.find(tag => tag.startsWith('brand:'));
  return brandTag ? brandTag.replace('brand:', '') : null;
};

export const TextItemCard: React.FC<TextItemCardProps> = ({
  item,
  onPress,
  category,
  laundryStatus,
  onGenerateImage,
  isGeneratingImage = false,
}) => {
  const handleGenerateImage = async (e: any) => {
    e.stopPropagation(); // Prevent card tap
    if (onGenerateImage && !isGeneratingImage) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onGenerateImage(item);
    }
  };
  const getColorCircle = (color: string) => {
    const colorMap: { [key: string]: string } = {
      black: '#000000',
      white: '#FFFFFF',
      gray: '#808080',
      grey: '#808080',
      navy: '#000080',
      blue: '#0066CC',
      red: '#DC143C',
      green: '#228B22',
      yellow: '#FFD700',
      orange: '#FF8C00',
      purple: '#8B008B',
      pink: '#FF69B4',
      brown: '#8B4513',
      beige: '#F5DEB3',
      khaki: '#C3B091',
    };

    const normalizedColor = color?.toLowerCase() || '';
    const bgColor = colorMap[normalizedColor] || '#E0E0E0';

    return (
      <View style={[styles.colorCircle, { backgroundColor: bgColor }]}>
        {normalizedColor === 'white' && <View style={styles.whiteColorBorder} />}
      </View>
    );
  };

  const getInitials = (text: string) => {
    const words = text.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.7}
    >
      <View style={styles.visualContainer}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>
            {getInitials(item.title || item.description)}
          </Text>
        </View>
        {item.color && getColorCircle(item.color)}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title || item.description}
        </Text>

        {extractBrandFromTags(item.tags) && (
          <Text style={styles.brand} numberOfLines={1}>
            {extractBrandFromTags(item.tags)}
          </Text>
        )}

        <View style={styles.metadataRow}>
          {item.material && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataText}>{item.material}</Text>
            </View>
          )}
          {item.style && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataText}>{item.style}</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{category.toUpperCase()}</Text>
          </View>

          <View style={[styles.laundryBadge, { backgroundColor: laundryStatus.color }]}>
            <Text style={styles.laundryEmoji}>{laundryStatus.emoji}</Text>
            <Text style={styles.laundryText}>{laundryStatus.text}</Text>
          </View>
        </View>
      </View>

      <View style={styles.textOnlyIndicator}>
        <Text style={styles.textOnlyIndicatorText}>📝</Text>
      </View>

      {/* Generate Image Button */}
      {onGenerateImage && (
        <TouchableOpacity
          onPress={handleGenerateImage}
          style={[styles.generateImageButton, isGeneratingImage && styles.generateImageButtonDisabled]}
          disabled={isGeneratingImage}
        >
          {isGeneratingImage ? (
            <View style={styles.generateImageLoading}>
              <ActivityIndicator size="small" color="white" />
            </View>
          ) : (
            <Text style={styles.generateImageButtonIcon}>📸</Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 10,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    position: 'relative',
  },
  visualContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  whiteColorBorder: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  brand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metadataItem: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#666',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  laundryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  laundryEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  laundryText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
  },
  textOnlyIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  textOnlyIndicatorText: {
    fontSize: 14,
  },
  generateImageButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    backgroundColor: '#007AFF',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  generateImageButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  generateImageButtonIcon: {
    fontSize: 16,
  },
  generateImageLoading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});