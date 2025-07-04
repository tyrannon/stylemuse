import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeArea } from '../utils/SafeArea';
import { SmartSuggestion, SuggestedItem } from '../services/SmartSuggestionsService';
import { formatPrice } from '../utils/smartSuggestionsUtils';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SmartSuggestionsModalProps {
  visible: boolean;
  onClose: () => void;
  suggestions: SmartSuggestion[];
  currentSuggestion: SmartSuggestion | null;
  onSelectSuggestion: (suggestion: SmartSuggestion) => void;
  onAddToWishlist: (item: SuggestedItem) => void;
  isGenerating?: boolean;
}

export const SmartSuggestionsModal: React.FC<SmartSuggestionsModalProps> = ({
  visible,
  onClose,
  suggestions,
  currentSuggestion,
  onSelectSuggestion,
  onAddToWishlist,
  isGenerating = false,
}) => {
  const [selectedItemDetail, setSelectedItemDetail] = useState<SuggestedItem | null>(null);

  const handleItemPress = (item: any) => {
    if (item.isPlaceholder) {
      setSelectedItemDetail(item as SuggestedItem);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleBuyOnAmazon = async (item: SuggestedItem) => {
    try {
      // In a real implementation, this would use the Amazon API to find the item
      const searchQuery = item.searchTerms?.join(' ') || item.title;
      const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`;
      
      await Linking.openURL(amazonUrl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error opening Amazon:', error);
    }
  };

  const handleAddToWishlist = (item: SuggestedItem) => {
    onAddToWishlist(item);
    setSelectedItemDetail(null);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeArea style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>✨ Smart Outfit Suggestions</Text>
          <View style={styles.placeholder} />
        </View>

        {isGenerating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>🧠 AI is creating your perfect outfits...</Text>
            <Text style={styles.loadingSubtext}>This might take a moment</Text>
          </View>
        ) : (
          <>
            {/* Suggestion Tabs */}
            {suggestions.length > 1 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.tabsContainer}
                contentContainerStyle={styles.tabsContent}
              >
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={suggestion.id}
                    style={[
                      styles.tab,
                      currentSuggestion?.id === suggestion.id && styles.activeTab
                    ]}
                    onPress={() => onSelectSuggestion(suggestion)}
                  >
                    <Text style={[
                      styles.tabText,
                      currentSuggestion?.id === suggestion.id && styles.activeTabText
                    ]}>
                      Outfit {index + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {currentSuggestion && (
                <>
                  {/* Outfit Header */}
                  <View style={styles.outfitHeader}>
                    <Text style={styles.outfitName}>{currentSuggestion.outfitName}</Text>
                    <Text style={styles.occasion}>Perfect for: {currentSuggestion.occasion}</Text>
                    <View style={styles.confidenceContainer}>
                      <Text style={styles.confidenceText}>
                        Confidence: {currentSuggestion.confidence}%
                      </Text>
                      <View style={styles.confidenceBar}>
                        <View 
                          style={[
                            styles.confidenceFill, 
                            { width: `${currentSuggestion.confidence}%` }
                          ]} 
                        />
                      </View>
                    </View>
                  </View>

                  {/* AI Explanation */}
                  <View style={styles.explanationContainer}>
                    <Text style={styles.explanationTitle}>🧠 Why This Works</Text>
                    <Text style={styles.explanationText}>{currentSuggestion.explanation}</Text>
                  </View>

                  {/* Style Tips */}
                  {currentSuggestion.styleTips && currentSuggestion.styleTips.length > 0 && (
                    <View style={styles.tipsContainer}>
                      <Text style={styles.tipsTitle}>💡 Style Tips</Text>
                      {currentSuggestion.styleTips.map((tip, index) => (
                        <Text key={index} style={styles.tipText}>• {tip}</Text>
                      ))}
                    </View>
                  )}

                  {/* Outfit Items */}
                  <View style={styles.itemsContainer}>
                    <Text style={styles.itemsTitle}>👔 Complete Outfit</Text>
                    <View style={styles.itemsGrid}>
                      {currentSuggestion.items.map((item, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.itemCard}
                          onPress={() => handleItemPress(item)}
                          activeOpacity={0.7}
                        >
                          {/* Item Image Placeholder */}
                          <View style={styles.itemImageContainer}>
                            {item.imageUrl ? (
                              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                            ) : (
                              <View style={styles.itemImagePlaceholder}>
                                <Text style={styles.itemImagePlaceholderText}>
                                  {getCategoryEmoji(item.category)}
                                </Text>
                              </View>
                            )}
                            {item.isPlaceholder && (
                              <View style={styles.suggestedBadge}>
                                <Text style={styles.suggestedBadgeText}>AI ✨</Text>
                              </View>
                            )}
                          </View>

                          {/* Item Details */}
                          <Text style={styles.itemTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <Text style={styles.itemCategory}>{item.category}</Text>
                          <Text style={styles.itemDetails}>
                            {item.color} • {item.material}
                          </Text>
                          
                          {item.isPlaceholder && (
                            <>
                              <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                              <View style={styles.itemActions}>
                                <TouchableOpacity
                                  style={styles.amazonButton}
                                  onPress={() => handleBuyOnAmazon(item)}
                                >
                                  <Text style={styles.amazonButtonText}>🛒 Amazon</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.wishlistButton}
                                  onPress={() => handleAddToWishlist(item)}
                                >
                                  <Text style={styles.wishlistButtonText}>💖</Text>
                                </TouchableOpacity>
                              </View>
                            </>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => {
                        // Add all suggested items to wishlist
                        currentSuggestion.missingItems.forEach(item => onAddToWishlist(item));
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }}
                    >
                      <Text style={styles.primaryButtonText}>💖 Add All to Wishlist</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={onClose}
                    >
                      <Text style={styles.secondaryButtonText}>Maybe Later</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </>
        )}

        {/* Item Detail Modal */}
        {selectedItemDetail && (
          <Modal
            visible={!!selectedItemDetail}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setSelectedItemDetail(null)}
          >
            <View style={styles.itemDetailOverlay}>
              <View style={styles.itemDetailModal}>
                <TouchableOpacity
                  style={styles.itemDetailClose}
                  onPress={() => setSelectedItemDetail(null)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                
                <Text style={styles.itemDetailTitle}>{selectedItemDetail.title}</Text>
                <Text style={styles.itemDetailDescription}>{selectedItemDetail.description}</Text>
                
                <View style={styles.itemDetailInfo}>
                  <Text style={styles.itemDetailLabel}>Color: {selectedItemDetail.color}</Text>
                  <Text style={styles.itemDetailLabel}>Material: {selectedItemDetail.material}</Text>
                  <Text style={styles.itemDetailLabel}>Style: {selectedItemDetail.style}</Text>
                  <Text style={styles.itemDetailPrice}>{formatPrice(selectedItemDetail.price)}</Text>
                </View>

                <Text style={styles.itemDetailReasoning}>
                  💡 {selectedItemDetail.reasoning}
                </Text>

                <View style={styles.itemDetailActions}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handleBuyOnAmazon(selectedItemDetail)}
                  >
                    <Text style={styles.primaryButtonText}>🛒 Buy on Amazon</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => handleAddToWishlist(selectedItemDetail)}
                  >
                    <Text style={styles.secondaryButtonText}>💖 Add to Wishlist</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </SafeArea>
    </Modal>
  );
};

// Helper function to get category emoji
function getCategoryEmoji(category: string): string {
  switch (category.toLowerCase()) {
    case 'top': return '👕';
    case 'bottom': return '👖';
    case 'shoes': return '👟';
    case 'jacket': return '🧥';
    case 'hat': return '👒';
    case 'accessories': return '👜';
    default: return '👔';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  tabsContainer: {
    maxHeight: 60,
  },
  tabsContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  activeTab: {
    backgroundColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  outfitHeader: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    margin: 20,
    borderRadius: 12,
  },
  outfitName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  occasion: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  confidenceContainer: {
    marginTop: 8,
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  explanationContainer: {
    margin: 20,
    marginTop: 0,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
  },
  tipsContainer: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#FFF3CD',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
    marginBottom: 4,
  },
  itemsContainer: {
    margin: 20,
    marginTop: 0,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    width: (screenWidth - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  itemImageContainer: {
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImagePlaceholderText: {
    fontSize: 40,
  },
  suggestedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  suggestedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amazonButton: {
    backgroundColor: '#FF9500',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flex: 1,
    marginRight: 4,
  },
  amazonButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  wishlistButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
  },
  wishlistButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  actionButtons: {
    padding: 20,
    paddingTop: 10,
  },
  primaryButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  // Item Detail Modal Styles
  itemDetailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  itemDetailModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxWidth: 350,
    width: '100%',
    maxHeight: '80%',
  },
  itemDetailClose: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  itemDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    paddingRight: 40,
  },
  itemDetailDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 15,
  },
  itemDetailInfo: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  itemDetailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  itemDetailPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 5,
  },
  itemDetailReasoning: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#667eea',
  },
  itemDetailActions: {
    gap: 10,
  },
});