import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Linking } from 'react-native';
import { SafeImage } from '../../../utils/SafeImage';
import * as Haptics from 'expo-haptics';
import { WebBrowser } from 'expo-web-browser';
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
      // Open external link using WebBrowser for better UX
      const result = await WebBrowser.openBrowserAsync(onlineItem.affiliateUrl || onlineItem.productUrl, {
        toolbarColor: '#007AFF',
        showTitle: true,
        enableBarCollapsing: true,
      });
    } catch (error) {
      console.error('Error opening browser:', error);
      // Fallback to Linking
      Linking.openURL(onlineItem.affiliateUrl || onlineItem.productUrl);
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
      {/* Product Image */}
      <TouchableOpacity onPress={onViewDetails} activeOpacity={0.8}>
        <View style={styles.imageContainer}>
          <SafeImage
            uri={onlineItem.imageUrl}
            style={styles.productImage}
            resizeMode="cover"
          />
          
          {/* Similarity Badge */}
          <View style={[styles.similarityBadge, { backgroundColor: getSimilarityColor(similarityScore) }]}>
            <Text style={styles.similarityText}>{Math.round(similarityScore)}%</Text>
          </View>
          
          {/* Merchant Logo */}
          <View style={styles.merchantBadge}>
            <Text style={styles.merchantText}>{onlineItem.merchant.name}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {onlineItem.title}
        </Text>
        
        {/* Price and Rating */}
        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {formatPrice(onlineItem.price, onlineItem.currency)}
            </Text>
            {onlineItem.originalPrice && onlineItem.originalPrice > onlineItem.price && (
              <Text style={styles.originalPrice}>
                {formatPrice(onlineItem.originalPrice, onlineItem.currency)}
              </Text>
            )}
          </View>
          
          {onlineItem.rating > 0 && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {onlineItem.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

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
          <Text style={styles.buyButtonText}>View Item</Text>
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
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: cardWidth * 1.2, // Aspect ratio for clothing items
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  similarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  similarityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  merchantBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  merchantText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
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
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
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