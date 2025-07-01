import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeImage } from '../../../utils/SafeImage';
import { WishlistItem } from '../../../types/StyleAdvice';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';

export const WishlistScreen: React.FC = () => {
  // Mock wishlist data for Phase 1
  const [wishlistItems] = useState<WishlistItem[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'price' | 'name'>('recent');

  const handleRemoveItem = async (itemId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement wishlist removal
            console.log('Remove item:', itemId);
          },
        },
      ]
    );
  };

  const handleViewItem = async (item: WishlistItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // Use Linking to open in native browser app instead of in-app browser
      await Linking.openURL(item.onlineItem.affiliateUrl || item.onlineItem.productUrl);
    } catch (error) {
      console.error('Error opening browser:', error);
      Alert.alert('Unable to open link', 'Please try again later.');
    }
  };

  const handleMarkAsPurchased = async (item: WishlistItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Mark as Purchased',
      'Did you purchase this item?',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, Purchased!',
          style: 'default',
          onPress: () => {
            // TODO: Implement purchase tracking
            console.log('Mark as purchased:', item.id);
          },
        },
      ]
    );
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const getPriceStatus = (item: WishlistItem) => {
    if (item.priceHistory.length <= 1) {
      return { status: 'stable', message: 'Price stable' };
    }

    const currentPrice = item.priceHistory[item.priceHistory.length - 1].price;
    const previousPrice = item.priceHistory[item.priceHistory.length - 2].price;

    if (currentPrice < previousPrice) {
      const savings = previousPrice - currentPrice;
      return { 
        status: 'dropped', 
        message: `Price dropped by ${formatPrice(savings)}!`,
        color: '#4CAF50'
      };
    } else if (currentPrice > previousPrice) {
      const increase = currentPrice - previousPrice;
      return { 
        status: 'increased', 
        message: `Price increased by ${formatPrice(increase)}`,
        color: '#FF5722'
      };
    }

    return { status: 'stable', message: 'Price stable', color: '#9E9E9E' };
  };

  const renderSortButtons = () => (
    <View style={styles.sortContainer}>
      <Text style={styles.sortLabel}>Sort by:</Text>
      {(['recent', 'price', 'name'] as const).map((sort) => (
        <TouchableOpacity
          key={sort}
          onPress={() => setSortBy(sort)}
          style={[
            styles.sortButton,
            sortBy === sort && styles.activeSortButton
          ]}
        >
          <Text style={[
            styles.sortButtonText,
            sortBy === sort && styles.activeSortButtonText
          ]}>
            {sort.charAt(0).toUpperCase() + sort.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderWishlistItem = (item: WishlistItem) => {
    const priceStatus = getPriceStatus(item);
    
    return (
      <View key={item.id} style={styles.wishlistItem}>
        <TouchableOpacity onPress={() => handleViewItem(item)} activeOpacity={0.8}>
          <View style={styles.itemImageContainer}>
            <SafeImage
              uri={item.onlineItem.imageUrl}
              style={styles.itemImage}
              resizeMode="cover"
            />
            
            {/* Purchase Status Badge */}
            {item.purchaseStatus === 'purchased' && (
              <View style={styles.purchasedBadge}>
                <Text style={styles.purchasedText}>✓ Purchased</Text>
              </View>
            )}
            
            {/* Out of Stock Badge */}
            {item.purchaseStatus === 'out_of_stock' && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.onlineItem.title}
          </Text>
          
          <Text style={styles.merchantName}>
            {item.onlineItem.merchant.name}
          </Text>

          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>
              {formatPrice(item.onlineItem.price, item.onlineItem.currency)}
            </Text>
            
            {priceStatus.status !== 'stable' && (
              <Text style={[styles.priceStatus, { color: priceStatus.color }]}>
                {priceStatus.message}
              </Text>
            )}
          </View>

          {/* Context */}
          <Text style={styles.contextText} numberOfLines={1}>
            Similar to: {item.context.wardrobeItem.title}
          </Text>

          {/* Saved Date */}
          <Text style={styles.savedDate}>
            Saved {new Date(item.savedAt).toLocaleDateString()}
          </Text>

          {/* Action Buttons */}
          <View style={styles.itemActions}>
            <TouchableOpacity
              onPress={() => handleViewItem(item)}
              style={styles.viewButton}
            >
              <Text style={styles.viewButtonText}>View Item</Text>
            </TouchableOpacity>
            
            {item.purchaseStatus === 'saved' && (
              <TouchableOpacity
                onPress={() => handleMarkAsPurchased(item)}
                style={styles.purchasedButton}
              >
                <Text style={styles.purchasedButtonText}>Mark Purchased</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={() => handleRemoveItem(item.id)}
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>💝</Text>
      <Text style={styles.emptyStateTitle}>Your Wishlist is Empty</Text>
      <Text style={styles.emptyStateText}>
        Save items you love from the Discover tab to track prices and remember your favorites!
      </Text>
      <Text style={styles.emptyStateHint}>
        💡 Tip: Use the heart icon on any item to add it to your wishlist
      </Text>
    </View>
  );

  if (wishlistItems.length === 0) {
    return (
      <View style={styles.container}>
        {renderEmptyState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{wishlistItems.length}</Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {formatPrice(wishlistItems.reduce((sum, item) => sum + item.onlineItem.price, 0))}
          </Text>
          <Text style={styles.statLabel}>Total Value</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {wishlistItems.filter(item => item.purchaseStatus === 'purchased').length}
          </Text>
          <Text style={styles.statLabel}>Purchased</Text>
        </View>
      </View>

      {renderSortButtons()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.itemsContainer}>
          {wishlistItems.map(renderWishlistItem)}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeSortButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeSortButtonText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  itemsContainer: {
    padding: 20,
  },
  wishlistItem: {
    flexDirection: 'row',
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
    overflow: 'hidden',
  },
  itemImageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  purchasedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  purchasedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF5722',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemDetails: {
    flex: 1,
    padding: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  merchantName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 2,
  },
  priceStatus: {
    fontSize: 11,
    fontWeight: '500',
  },
  contextText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  savedDate: {
    fontSize: 10,
    color: '#999',
    marginBottom: 12,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  purchasedButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    alignItems: 'center',
  },
  purchasedButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  removeButtonText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  emptyStateHint: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});