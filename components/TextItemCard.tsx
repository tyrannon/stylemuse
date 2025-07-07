import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { WardrobeItem, LaundryStatus } from '../hooks/useWardrobeData';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

interface TextItemCardProps {
  item: WardrobeItem;
  onPress: () => void;
  category: string;
  laundryStatus: { emoji: string; text: string; color: string };
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
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
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
      {/* Image area with initials */}
      <View style={styles.imageArea}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>
            {getInitials(item.title || item.description)}
          </Text>
        </View>
        <View style={styles.textOnlyIndicator}>
          <Text style={styles.textOnlyIndicatorText}>📝</Text>
        </View>
      </View>

      {/* Info area - similar to regular wardrobe items */}
      <View style={styles.infoArea}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title || item.description}
        </Text>

        {/* Tags row */}
        <View style={styles.tagsContainer}>
          {item.tags?.slice(0, 3).map((tag, tagIndex) => (
            <View key={tagIndex} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Category badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category.toUpperCase()}</Text>
        </View>

        {/* Laundry Status Indicator */}
        <View style={[styles.laundryBadge, { backgroundColor: laundryStatus.color }]}>
          <Text style={styles.laundryEmoji}>{laundryStatus.emoji}</Text>
          <Text style={styles.laundryText}>{laundryStatus.text}</Text>
        </View>

        {/* Edit indicator */}
        <View style={styles.editIndicator}>
          <Text style={styles.editIndicatorText}>✏️ Tap to edit</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    width: '48%',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    ...theme.shadows.medium,
  },
  imageArea: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary + '40',
  },
  iconText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  textOnlyIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.warning + '30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  textOnlyIndicatorText: {
    fontSize: 12,
  },
  infoArea: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  tagText: {
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
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  laundryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  laundryEmoji: {
    fontSize: 10,
    marginRight: 4,
  },
  laundryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  editIndicator: {
    alignItems: 'center',
  },
  editIndicatorText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});