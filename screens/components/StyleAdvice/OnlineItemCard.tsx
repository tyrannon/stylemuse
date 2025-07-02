import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Linking, Alert } from 'react-native';
import { SafeImage } from '../../../utils/SafeImage';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { StyleRecommendation } from '../../../types/StyleAdvice';

interface OnlineItemCardProps {
  recommendation: StyleRecommendation;
  onSaveToWishlist: () => void;
  onViewDetails: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 60) / 2; // 2 cards per row with padding

export const OnlineItemCard: React.FC<OnlineItemCardProps> = ({
  recommendation,
  onSaveToWishlist,
  onViewDetails,
}) => {
  const { onlineItem, similarityScore, wardrobeContext, reasoning } = recommendation;

  const handleBuyNow = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Use Linking to open in native browser app instead of in-app browser
      await Linking.openURL(onlineItem.affiliateUrl || onlineItem.productUrl);
    } catch (error) {
      console.error('Error opening browser:', error);
      // Show user-friendly error
      Alert.alert('Unable to open link', 'Please try again later.');
    }
  };

  const handleSaveToWishlist = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSaveToWishlist();
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#FF9800'; // Orange
    return '#9E9E9E'; // Gray
  };

  const getSimilarityLabel = (score: number) => {
    if (score >= 80) return 'Great Match';
    if (score >= 60) return 'Good Match';
    return 'Similar Style';
  };

  return (
    <View style={styles.card}>
      {/* Header with merchant and similarity */}
      <View style={styles.cardHeader}>
        <View style={styles.merchantBadge}>
          <Text style={styles.merchantText}>{onlineItem.merchant.name}</Text>
        </View>
        <View style={[styles.similarityBadge, { backgroundColor: getSimilarityColor(similarityScore) }]}>
          <Text style={styles.similarityText}>{Math.round(similarityScore)}% match</Text>
        </View>
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {onlineItem.title}
        </Text>
        
        {/* Search Info */}
        <View style={styles.searchInfo}>
          <Text style={styles.searchInfoText}>
            🔍 This will search Amazon for similar items
          </Text>
        </View>
        
        {onlineItem.rating > 0 && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>⭐ {onlineItem.rating.toFixed(1)} ({onlineItem.reviewCount || 0} reviews)</Text>
          </View>
        )}

        {/* Context Info */}
        <View style={styles.contextContainer}>
          <Text style={styles.contextLabel}>Similar to your:</Text>
          <Text style={styles.contextItem} numberOfLines={1}>
            {wardrobeContext.title}
          </Text>
        </View>

        {/* Similarity Explanation */}
        <View style={styles.reasoningContainer}>
          <Text style={styles.reasoningLabel}>{getSimilarityLabel(similarityScore)}</Text>
          <Text style={styles.reasoningText} numberOfLines={2}>
            {reasoning}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          onPress={handleSaveToWishlist}
          style={styles.wishlistButton}
          activeOpacity={0.7}
        >
          <Text style={styles.wishlistButtonText}>💝</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleBuyNow}
          style={styles.buyButton}
          activeOpacity={0.7}
        >
          <Text style={styles.buyButtonText}>Search Amazon</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  similarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  similarityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  merchantBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  merchantText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    lineHeight: 18,
    marginBottom: 8,
  },
  searchInfo: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchInfoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  contextContainer: {
    marginBottom: 8,
  },
  contextLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  contextItem: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  reasoningContainer: {
    marginBottom: 8,
  },
  reasoningLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  reasoningText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 12,
    paddingTop: 0,
  },
  wishlistButton: {
    width: 40,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  wishlistButtonText: {
    fontSize: 16,
  },
  buyButton: {
    flex: 1,
    height: 32,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});