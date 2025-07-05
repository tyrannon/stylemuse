import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeImage } from '../utils/SafeImage';
import { WardrobeItem } from '../hooks/useWardrobeData';
import { getColorFamilyEmoji } from '../utils/colorIntelligence';

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get('window');

// Apple's 8pt grid system spacing
const GRID_UNIT = 8;
const CARD_MARGIN = GRID_UNIT * 2; // 16pt total horizontal margin
const CARD_GAP = GRID_UNIT; // 8pt gap between cards

// Calculate card width for exactly 2 per row
// Ensure minimum width for smaller screens
const CARD_WIDTH = Math.max(
  (screenWidth - (CARD_MARGIN * 2) - CARD_GAP) / 2,
  140 // Minimum card width for usability
);

// Helper function to get laundry status display info
const getLaundryStatusDisplay = (status: any) => {
  switch (status || 'clean') {
    case 'clean':
      return { emoji: '✨', text: 'Clean', color: '#4CAF50' };
    case 'dirty':
      return { emoji: '🧺', text: 'Dirty', color: '#FF5722' };
    case 'in-laundry':
      return { emoji: '🌊', text: 'Washing', color: '#2196F3' };
    case 'drying':
      return { emoji: '🌬️', text: 'Drying', color: '#FF9800' };
    case 'needs-ironing':
      return { emoji: '🔥', text: 'Iron', color: '#9C27B0' };
    case 'out-of-rotation':
      return { emoji: '📦', text: 'Stored', color: '#607D8B' };
    default:
      return { emoji: '✨', text: 'Clean', color: '#4CAF50' };
  }
};

interface UnifiedWardrobeCardProps {
  item: WardrobeItem;
  onPress: () => void;
  categorizeItem: (item: WardrobeItem) => string;
  style?: any;
}

export const UnifiedWardrobeCard: React.FC<UnifiedWardrobeCardProps> = ({
  item,
  onPress,
  categorizeItem,
  style,
}) => {
  const isTextItem = item.image === 'text-only';
  const isMultiItem = item.multiItemData?.isFromMultiDetection;
  const statusDisplay = getLaundryStatusDisplay(item.laundryStatus);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, style]}
      activeOpacity={0.7}
    >
      {/* Image or Text Placeholder */}
      <View style={styles.imageContainer}>
        {isTextItem ? (
          <View style={styles.textOnlyPlaceholder}>
            <Text style={styles.textOnlyEmoji}>📝</Text>
            <Text style={styles.textOnlyLabel}>Text Item</Text>
          </View>
        ) : (
          <SafeImage
            uri={item.image}
            style={styles.itemImage}
            resizeMode="cover"
            placeholder="item"
            category={categorizeItem(item)}
          />
        )}
        
        {/* Special badges */}
        <View style={styles.badgeContainer}>
          {isMultiItem && (
            <View style={styles.multiItemBadge}>
              <Text style={styles.badgeText}>🔍</Text>
            </View>
          )}
          {item.colorIntelligence && (
            <View style={styles.colorIntelligenceBadge}>
              <Text style={styles.badgeText}>
                {getColorFamilyEmoji(item.colorIntelligence.colorFamily)}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Item Info */}
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title || 'Untitled Item'}
        </Text>
        
        <Text style={styles.itemDescription} numberOfLines={1}>
          {item.description || 'No description'}
        </Text>
        
        {/* Tags */}
        <View style={styles.tagsContainer}>
          {item.tags?.slice(0, 3).map((tag, tagIndex) => (
            <View key={tagIndex} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        
        {/* Bottom row with category and laundry status */}
        <View style={styles.bottomRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {categorizeItem(item).toUpperCase()}
            </Text>
          </View>
          
          <View style={[styles.laundryStatusBadge, { backgroundColor: statusDisplay.color }]}>
            <Text style={styles.laundryStatusEmoji}>{statusDisplay.emoji}</Text>
            <Text style={styles.laundryStatusText}>{statusDisplay.text}</Text>
          </View>
        </View>
        
        {/* Special info for multi-item or text items */}
        {isMultiItem && (
          <Text style={styles.specialInfo}>
            Multi-item detection • Tap to see details
          </Text>
        )}
        {isTextItem && (
          <Text style={styles.specialInfo}>
            Text-only item • No photo
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: GRID_UNIT * 2, // 16pt radius
    marginBottom: GRID_UNIT * 2, // 16pt bottom margin
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
    width: CARD_WIDTH,
  },
  imageContainer: {
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: CARD_WIDTH * 0.75, // Maintain aspect ratio
    borderTopLeftRadius: GRID_UNIT * 2,
    borderTopRightRadius: GRID_UNIT * 2,
  },
  textOnlyPlaceholder: {
    width: '100%',
    height: CARD_WIDTH * 0.75, // Maintain aspect ratio
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: GRID_UNIT * 2,
    borderTopRightRadius: GRID_UNIT * 2,
  },
  textOnlyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  textOnlyLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  badgeContainer: {
    position: 'absolute',
    top: GRID_UNIT,
    left: GRID_UNIT,
    flexDirection: 'row',
  },
  multiItemBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    paddingHorizontal: GRID_UNIT,
    paddingVertical: GRID_UNIT / 2,
    borderRadius: GRID_UNIT * 1.5,
    marginRight: GRID_UNIT / 2,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  colorIntelligenceBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.9)', // Gold background for color intelligence
    paddingHorizontal: GRID_UNIT,
    paddingVertical: GRID_UNIT / 2,
    borderRadius: GRID_UNIT * 1.5,
    marginRight: GRID_UNIT / 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  itemInfo: {
    padding: GRID_UNIT * 1.75, // 14pt padding
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: GRID_UNIT * 0.75, // 6pt
    lineHeight: 20,
  },
  itemDescription: {
    fontSize: 13,
    color: '#6e6e73',
    marginBottom: GRID_UNIT * 1.25, // 10pt
    lineHeight: 18,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: GRID_UNIT,
  },
  tag: {
    backgroundColor: '#e5e5ea',
    paddingHorizontal: GRID_UNIT,
    paddingVertical: GRID_UNIT / 2.5, // ~3pt
    borderRadius: GRID_UNIT * 1.25, // 10pt
    marginRight: GRID_UNIT / 2,
    marginBottom: GRID_UNIT / 2.5,
  },
  tagText: {
    fontSize: 10,
    color: '#3a3a3c',
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: GRID_UNIT / 2,
  },
  categoryBadge: {
    backgroundColor: '#f2f2f7',
    paddingHorizontal: GRID_UNIT,
    paddingVertical: GRID_UNIT / 2,
    borderRadius: GRID_UNIT,
    flex: 1,
    marginRight: GRID_UNIT * 0.75, // 6pt
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#007aff',
    textAlign: 'center',
  },
  laundryStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GRID_UNIT,
    paddingVertical: GRID_UNIT / 2,
    borderRadius: GRID_UNIT,
    minWidth: 55,
  },
  laundryStatusEmoji: {
    fontSize: 11,
    marginRight: GRID_UNIT / 2.5, // ~3pt
  },
  laundryStatusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  specialInfo: {
    fontSize: 11,
    color: '#007aff',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: GRID_UNIT * 0.75, // 6pt
    opacity: 0.8,
  },
});