import React, { useState, useEffect } from 'react';
import { View, Image, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { WardrobeItem } from '../../hooks/useWardrobeData';
import { SafeImage } from '../../utils/SafeImage';
import { useStyleRecommendations } from '../../hooks/useStyleRecommendations';
import { OnlineItemCard } from './StyleAdvice/OnlineItemCard';
import { StyleRecommendation } from '../../types/StyleAdvice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface ItemDetailViewProps {
  item: WardrobeItem;
  onBack: () => void;
  onSaveField: (field: string, value: string | string[]) => Promise<WardrobeItem>;
  onCategoryPress: () => void;
  onGenerateOutfitSuggestions: (item: WardrobeItem) => void;
  onDelete: (item: WardrobeItem) => Promise<void>;
  categorizeItem: (item: WardrobeItem) => string;
  
  // Editing states
  editingTitle: boolean;
  setEditingTitle: (editing: boolean) => void;
  editingColor: boolean;
  setEditingColor: (editing: boolean) => void;
  editingMaterial: boolean;
  setEditingMaterial: (editing: boolean) => void;
  editingStyle: boolean;
  setEditingStyle: (editing: boolean) => void;
  editingFit: boolean;
  setEditingFit: (editing: boolean) => void;
  editingTags: boolean;
  setEditingTags: (editing: boolean) => void;
  
  // Temp values
  tempTitle: string;
  setTempTitle: (value: string) => void;
  tempColor: string;
  setTempColor: (value: string) => void;
  tempMaterial: string;
  setTempMaterial: (value: string) => void;
  tempStyle: string;
  setTempStyle: (value: string) => void;
  tempFit: string;
  setTempFit: (value: string) => void;
  tempTags: string[];
  setTempTags: (tags: string[]) => void;
  newTagInput: string;
  setNewTagInput: (value: string) => void;
}

export const ItemDetailView: React.FC<ItemDetailViewProps> = ({
  item,
  onBack,
  onSaveField,
  onCategoryPress,
  onGenerateOutfitSuggestions,
  onDelete,
  categorizeItem,
  editingTitle,
  setEditingTitle,
  editingColor,
  setEditingColor,
  editingMaterial,
  setEditingMaterial,
  editingStyle,
  setEditingStyle,
  editingFit,
  setEditingFit,
  editingTags,
  setEditingTags,
  tempTitle,
  setTempTitle,
  tempColor,
  setTempColor,
  tempMaterial,
  setTempMaterial,
  tempStyle,
  setTempStyle,
  tempFit,
  setTempFit,
  tempTags,
  setTempTags,
  newTagInput,
  setNewTagInput,
}) => {
  // Amazon search state
  const [amazonSuggestions, setAmazonSuggestions] = useState<StyleRecommendation[]>([]);
  const [loadingAmazon, setLoadingAmazon] = useState(false);
  const [showAmazonSuggestions, setShowAmazonSuggestions] = useState(false);
  const [lastSearchTimestamp, setLastSearchTimestamp] = useState<Date | null>(null);
  
  // Image state
  const [imageError, setImageError] = useState(false);

  const { getItemRecommendations } = useStyleRecommendations();

  // Storage keys for item-specific caching
  const ITEM_STORAGE_KEYS = {
    AMAZON_SUGGESTIONS: `stylemuse_amazon_suggestions_${item.image}`,
    SEARCH_TIMESTAMP: `stylemuse_search_timestamp_${item.image}`,
  };

  // Load cached Amazon suggestions on mount
  useEffect(() => {
    loadCachedAmazonSuggestions();
  }, [item]);

  // Reset image error when item changes
  useEffect(() => {
    setImageError(false);
  }, [item.image]);

  const loadCachedAmazonSuggestions = async () => {
    try {
      const [cachedSuggestions, cachedTimestamp] = await Promise.all([
        AsyncStorage.getItem(ITEM_STORAGE_KEYS.AMAZON_SUGGESTIONS),
        AsyncStorage.getItem(ITEM_STORAGE_KEYS.SEARCH_TIMESTAMP),
      ]);

      if (cachedSuggestions && cachedTimestamp) {
        const timestampDate = new Date(cachedTimestamp);
        const hoursOld = (Date.now() - timestampDate.getTime()) / (1000 * 60 * 60);
        
        // Use cached suggestions if less than 24 hours old
        if (hoursOld < 24) {
          try {
            const parsedSuggestions = JSON.parse(cachedSuggestions);
            if (Array.isArray(parsedSuggestions) && parsedSuggestions.length > 0) {
              console.log('✅ Loading cached Amazon suggestions for item:', parsedSuggestions.length, 'items');
              setAmazonSuggestions(parsedSuggestions);
              setLastSearchTimestamp(timestampDate);
              setShowAmazonSuggestions(true); // Show if we have cached data
            }
          } catch (parseError) {
            console.error('Error parsing cached Amazon suggestions:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Error loading cached Amazon suggestions:', error);
    }
  };

  const saveCachedAmazonSuggestions = async (suggestions: StyleRecommendation[]) => {
    try {
      await AsyncStorage.setItem(ITEM_STORAGE_KEYS.AMAZON_SUGGESTIONS, JSON.stringify(suggestions));
      await AsyncStorage.setItem(ITEM_STORAGE_KEYS.SEARCH_TIMESTAMP, new Date().toISOString());
    } catch (error) {
      console.error('Error saving Amazon suggestions:', error);
    }
  };




  const findSimilarOnAmazon = async () => {
    if (loadingAmazon) return;

    setLoadingAmazon(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log('🔍 Finding similar items on Amazon for:', item.title);
      
      // Get recommendations using the existing hook
      const onlineItems = await getItemRecommendations(item);
      
      if (onlineItems.length === 0) {
        Alert.alert(
          'No Similar Items Found',
          'We couldn\'t find any similar items on Amazon right now. Try again later or update your item details for better results.',
          [{ text: 'OK' }]
        );
        setLoadingAmazon(false);
        return;
      }

      // Convert to StyleRecommendation format for consistent display
      const recommendations: StyleRecommendation[] = onlineItems.map((onlineItem, index) => ({
        id: `${item.image}-amazon-${onlineItem.id}-${index}`,
        type: 'similar' as const,
        wardrobeContext: item,
        onlineItem,
        similarityScore: 75 + Math.random() * 25, // Random score between 75-100
        reasoning: `Similar style and category to your ${item.title}`,
        confidenceLevel: 80,
        aiInsight: `Found this ${onlineItem.category} item that matches your style`,
        generatedAt: new Date(),
      }));

      setAmazonSuggestions(recommendations);
      setShowAmazonSuggestions(true);
      setLastSearchTimestamp(new Date());
      
      // Save to cache
      await saveCachedAmazonSuggestions(recommendations);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error('Error finding similar items:', error);
      Alert.alert(
        'Search Failed',
        'Unable to search for similar items. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoadingAmazon(false);
    }
  };

  const handleWishlistSave = (recommendation: StyleRecommendation) => {
    // TODO: Implement wishlist functionality
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Added to Wishlist', 'Item saved to your wishlist!');
  };

  const handleViewDetails = (recommendation: StyleRecommendation) => {
    // TODO: Implement item details modal
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Item Details', 'Item details feature coming soon!');
  };

  const handleDeleteItem = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.title || 'this item'}" from your wardrobe? This action cannot be undone.`,
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
              await onDelete(item);
              onBack(); // Go back to wardrobe after deletion
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item. Please try again.');
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
          <Text style={styles.backButtonText}>← Back to Wardrobe</Text>
        </TouchableOpacity>
        <Text style={styles.itemDetailTitle}>
          {item.title || 'Clothing Item'}
        </Text>
        <TouchableOpacity onPress={handleDeleteItem} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Item Image Display */}
      <View style={styles.itemDetailImageContainer}>
        {imageError || !item.image || item.image === '' || item.image === 'text-only' ? (
          <View style={styles.missingImagePlaceholder}>
            <Text style={styles.missingImageIcon}>👔</Text>
            <Text style={styles.missingImageText}>No Image Available</Text>
          </View>
        ) : (
          <SafeImage
            uri={item.image}
            style={styles.itemDetailImage}
            resizeMode="contain"
            placeholder="item"
            category={categorizeItem(item)}
            onError={() => setImageError(true)}
          />
        )}
      </View>


      {/* Item Information */}
      <View style={styles.itemDetailInfo}>
        {/* Editable Title */}
        <View style={styles.itemDetailField}>
          <Text style={styles.itemDetailLabel}>Title:</Text>
          {editingTitle ? (
            <View style={styles.editFieldContainer}>
              <TextInput
                style={styles.editFieldInput}
                value={tempTitle}
                onChangeText={setTempTitle}
                placeholder="Item title"
                autoFocus
                onBlur={async () => {
                  await onSaveField('title', tempTitle);
                  setEditingTitle(false);
                }}
                onSubmitEditing={async () => {
                  await onSaveField('title', tempTitle);
                  setEditingTitle(false);
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setTempTitle(item.title || '');
                setEditingTitle(true);
              }}
              style={styles.editableField}
            >
              <Text style={styles.itemDetailValue}>
                {item.title || 'Tap to add title'}
              </Text>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.itemDetailDescription}>
          {item.description}
        </Text>
        
        {/* Category with dropdown */}
        <View style={styles.itemDetailField}>
          <Text style={styles.itemDetailLabel}>Category:</Text>
          <TouchableOpacity onPress={onCategoryPress} style={styles.categoryDropdownButton}>
            <Text style={styles.categoryDropdownText}>
              {categorizeItem(item).toUpperCase()}
            </Text>
            <Text style={styles.categoryDropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Editable Color */}
        <View style={styles.itemDetailField}>
          <Text style={styles.itemDetailLabel}>Color:</Text>
          {editingColor ? (
            <View style={styles.editFieldContainer}>
              <TextInput
                style={styles.editFieldInput}
                value={tempColor}
                onChangeText={setTempColor}
                placeholder="Color"
                autoFocus
                onBlur={async () => {
                  await onSaveField('color', tempColor);
                  setEditingColor(false);
                }}
                onSubmitEditing={async () => {
                  await onSaveField('color', tempColor);
                  setEditingColor(false);
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setTempColor(item.color || '');
                setEditingColor(true);
              }}
              style={styles.editableField}
            >
              <Text style={styles.itemDetailValue}>
                {item.color || 'Tap to add color'}
              </Text>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Editable Material */}
        <View style={styles.itemDetailField}>
          <Text style={styles.itemDetailLabel}>Material:</Text>
          {editingMaterial ? (
            <View style={styles.editFieldContainer}>
              <TextInput
                style={styles.editFieldInput}
                value={tempMaterial}
                onChangeText={setTempMaterial}
                placeholder="Material"
                autoFocus
                onBlur={async () => {
                  await onSaveField('material', tempMaterial);
                  setEditingMaterial(false);
                }}
                onSubmitEditing={async () => {
                  await onSaveField('material', tempMaterial);
                  setEditingMaterial(false);
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setTempMaterial(item.material || '');
                setEditingMaterial(true);
              }}
              style={styles.editableField}
            >
              <Text style={styles.itemDetailValue}>
                {item.material || 'Tap to add material'}
              </Text>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Editable Style */}
        <View style={styles.itemDetailField}>
          <Text style={styles.itemDetailLabel}>Style:</Text>
          {editingStyle ? (
            <View style={styles.editFieldContainer}>
              <TextInput
                style={styles.editFieldInput}
                value={tempStyle}
                onChangeText={setTempStyle}
                placeholder="Style"
                autoFocus
                onBlur={async () => {
                  await onSaveField('style', tempStyle);
                  setEditingStyle(false);
                }}
                onSubmitEditing={async () => {
                  await onSaveField('style', tempStyle);
                  setEditingStyle(false);
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setTempStyle(item.style || '');
                setEditingStyle(true);
              }}
              style={styles.editableField}
            >
              <Text style={styles.itemDetailValue}>
                {item.style || 'Tap to add style'}
              </Text>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Editable Fit */}
        <View style={styles.itemDetailField}>
          <Text style={styles.itemDetailLabel}>Fit:</Text>
          {editingFit ? (
            <View style={styles.editFieldContainer}>
              <TextInput
                style={styles.editFieldInput}
                value={tempFit}
                onChangeText={setTempFit}
                placeholder="Fit"
                autoFocus
                onBlur={async () => {
                  await onSaveField('fit', tempFit);
                  setEditingFit(false);
                }}
                onSubmitEditing={async () => {
                  await onSaveField('fit', tempFit);
                  setEditingFit(false);
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setTempFit(item.fit || '');
                setEditingFit(true);
              }}
              style={styles.editableField}
            >
              <Text style={styles.itemDetailValue}>
                {item.fit || 'Tap to add fit'}
              </Text>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Editable Tags */}
        <View style={styles.itemDetailField}>
          <Text style={styles.itemDetailLabel}>Tags:</Text>
          {editingTags ? (
            <View style={styles.editTagsContainer}>
              <View style={styles.tagsEditContainer}>
                {tempTags.map((tag: string, index: number) => (
                  <View key={index} style={styles.editableTag}>
                    <Text style={styles.editableTagText}>{tag}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newTags = tempTags.filter((_, i) => i !== index);
                        setTempTags(newTags);
                      }}
                      style={styles.removeTagButton}
                    >
                      <Text style={styles.removeTagText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.addTagContainer}>
                <TextInput
                  style={styles.addTagInput}
                  value={newTagInput}
                  onChangeText={setNewTagInput}
                  placeholder="Add tag"
                  onSubmitEditing={() => {
                    if (newTagInput.trim()) {
                      setTempTags([...tempTags, newTagInput.trim()]);
                      setNewTagInput('');
                    }
                  }}
                />
                <TouchableOpacity
                  onPress={async () => {
                    await onSaveField('tags', tempTags);
                    setEditingTags(false);
                    setNewTagInput('');
                  }}
                  style={styles.saveTagsButton}
                >
                  <Text style={styles.saveTagsText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setTempTags(item.tags || []);
                setEditingTags(true);
              }}
              style={styles.editableField}
            >
              <View style={styles.itemDetailTagsContainer}>
                {(item.tags || []).length > 0 ? (
                  item.tags!.map((tag: string, index: number) => (
                    <View key={index} style={styles.itemDetailTag}>
                      <Text style={styles.itemDetailTagText}>{tag}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.itemDetailValue}>Tap to add tags</Text>
                )}
              </View>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.itemDetailActions}>
          <TouchableOpacity
            onPress={() => onGenerateOutfitSuggestions(item)}
            style={[styles.itemDetailActionButton, { marginRight: 8, flex: 1 }]}
          >
            <Text style={styles.itemDetailActionButtonText}>🎨 Outfit Ideas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={findSimilarOnAmazon}
            disabled={loadingAmazon}
            style={[
              styles.itemDetailActionButton, 
              styles.amazonButton,
              { flex: 1 },
              loadingAmazon && styles.disabledButton
            ]}
          >
            {loadingAmazon ? (
              <View style={styles.smartSuggestionsLoading}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.itemDetailActionButtonText}>🔍 Finding Similar Items...</Text>
              </View>
            ) : (
              <Text style={styles.itemDetailActionButtonText}>
                🛒 Find on Amazon
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Amazon Suggestions Section */}
        {showAmazonSuggestions && amazonSuggestions.length > 0 && (
          <View style={styles.amazonSuggestionsSection}>
            <View style={styles.amazonSuggestionsHeader}>
              <Text style={styles.amazonSuggestionsTitle}>
                🔍 Amazon Search Suggestions
              </Text>
              <Text style={styles.amazonSuggestionsDescription}>
                These are search terms that will help you find similar items on Amazon
              </Text>
              {lastSearchTimestamp && (
                <Text style={styles.amazonSuggestionsSubtitle}>
                  {amazonSuggestions.length} search suggestions • Last updated {lastSearchTimestamp.toLocaleDateString()}
                </Text>
              )}
              <TouchableOpacity
                onPress={findSimilarOnAmazon}
                disabled={loadingAmazon}
                style={styles.refreshAmazonButton}
              >
                {loadingAmazon ? (
                  <View style={styles.refreshLoadingContainer}>
                    <ActivityIndicator size="small" color="#666" />
                    <Text style={styles.refreshAmazonButtonText}>Refreshing...</Text>
                  </View>
                ) : (
                  <Text style={styles.refreshAmazonButtonText}>🔄 Refresh</Text>
                )}
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.amazonSuggestionsScroll}
              contentContainerStyle={styles.amazonSuggestionsContent}
            >
              {amazonSuggestions.map((recommendation, index) => (
                <View key={recommendation.id} style={styles.amazonSuggestionCard}>
                  <OnlineItemCard
                    recommendation={recommendation}
                    onSaveToWishlist={() => handleWishlistSave(recommendation)}
                    onViewDetails={() => handleViewDetails(recommendation)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  itemDetailContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    flex: 0,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  itemDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fee',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fbb',
    flex: 0,
  },
  deleteButtonText: {
    fontSize: 18,
    color: '#d32f2f',
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
  itemDetailDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
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
    color: '#333',
    marginRight: 8,
    minWidth: 80,
  },
  itemDetailValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  itemDetailTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  itemDetailTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  itemDetailTagText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  itemDetailActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemDetailActionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDetailActionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Editable field styles
  editableField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
  },
  editIcon: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  editFieldContainer: {
    flex: 1,
  },
  editFieldInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
  },
  categoryDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginLeft: 8,
    minWidth: 100,
  },
  categoryDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  categoryDropdownArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  // Tag editing styles
  editTagsContainer: {
    flex: 1,
  },
  tagsEditContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  editableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  editableTagText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  removeTagButton: {
    marginLeft: 4,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeTagText: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTagInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    marginRight: 8,
  },
  saveTagsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveTagsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  // Amazon suggestions styles
  amazonButton: {
    backgroundColor: '#FF9500',
  },
  disabledButton: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smartSuggestionsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  amazonSuggestionsSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  amazonSuggestionsHeader: {
    marginBottom: 16,
  },
  amazonSuggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  amazonSuggestionsDescription: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  amazonSuggestionsSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  refreshAmazonButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  refreshAmazonButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  refreshLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amazonSuggestionsScroll: {
    marginHorizontal: -20,
  },
  amazonSuggestionsContent: {
    paddingHorizontal: 20,
  },
  amazonSuggestionCard: {
    marginRight: 16,
    width: 180,
  },
  // Text-only item styles
  textOnlyImagePlaceholder: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  textOnlyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  textOnlyLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  textOnlyDescription: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    maxWidth: '100%',
  },
  textOnlyDescriptionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Regular image container styles
  regularImageContainer: {
    flex: 1,
  },
  missingImagePlaceholder: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    minHeight: 200,
  },
  missingImageIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  missingImageText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginBottom: 20,
  },
  imageWithGenerateContainer: {
    flex: 1,
    position: 'relative',
  },
  generateOverlayButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  generateOverlayButtonText: {
    fontSize: 20,
  },
});