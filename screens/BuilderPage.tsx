import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Animated, LayoutAnimation, UIManager, Platform } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { WardrobeItem, LovedOutfit } from '../hooks/useWardrobeData';
import { AIOutfitAssistant } from '../components/AIOutfitAssistant';

interface BuilderPageProps {
  savedItems: WardrobeItem[];
  selectedGender: 'male' | 'female' | 'nonbinary' | null;
  onSetShowGenderSelector: (show: boolean) => void;
  onGenerateOutfit: () => void;
  onGenerateWeatherOutfit: () => void;
  generatingOutfit: boolean;
  generatedOutfit: string | null;
  isSelectionMode: boolean;
  setIsSelectionMode: (mode: boolean) => void;
  selectedItemsForOutfit: string[];
  setSelectedItemsForOutfit: (items: string[]) => void;
  spinValue: Animated.Value;
  onToggleItemSelection: (imageUri: string) => void;
  userProfile?: any;
  styleDNA?: any;
  categorizeItem: (item: WardrobeItem) => string;
}

export const BuilderPage: React.FC<BuilderPageProps> = ({
  savedItems,
  selectedGender,
  onSetShowGenderSelector,
  onGenerateOutfit,
  onGenerateWeatherOutfit,
  generatingOutfit,
  generatedOutfit,
  isSelectionMode,
  setIsSelectionMode,
  selectedItemsForOutfit,
  setSelectedItemsForOutfit,
  spinValue,
  onToggleItemSelection,
  userProfile,
  styleDNA,
  categorizeItem,
}) => {
  // Sorting state for the builder
  const [sortBy, setSortBy] = useState<'recent-newest' | 'recent-oldest' | 'category' | 'name'>('recent-newest');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const sortAnimationValue = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  // Function to get sorted items for the builder
  const getSortedItems = () => {
    let sortedItems = [...savedItems];
    
    switch (sortBy) {
      case 'recent-newest':
        // Since we don't have timestamps, use array order (newest items are typically added last)
        sortedItems = [...savedItems].reverse();
        break;
      case 'recent-oldest':
        // Original array order (oldest first)
        sortedItems = [...savedItems];
        break;
      case 'category':
        sortedItems.sort((a, b) => categorizeItem(a).localeCompare(categorizeItem(b)));
        break;
      case 'name':
        sortedItems.sort((a, b) => (a.title || 'Untitled').localeCompare(b.title || 'Untitled'));
        break;
    }
    
    return sortedItems;
  };

  // Function to get sort display name
  const getSortDisplayName = (sortType: string) => {
    const displayNames: { [key: string]: string } = {
      'recent-newest': 'Recently Added (Newest First)',
      'recent-oldest': 'Recently Added (Oldest First)',
      'category': 'Category',
      'name': 'Name'
    };
    return displayNames[sortType] || sortType;
  };

  // Function to toggle sort options with animation
  const toggleSortOptions = () => {
    if (isAnimating) return; // Prevent rapid tapping
    
    setIsAnimating(true);
    const toValue = showSortOptions ? 0 : 1;
    
    // Use LayoutAnimation for smooth expand/collapse
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleXY,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    
    Animated.timing(sortAnimationValue, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setIsAnimating(false);
    });
    
    setShowSortOptions(!showSortOptions);
  };

  // Function to handle sort selection
  const handleSortSelection = (sortType: 'recent-newest' | 'recent-oldest' | 'category' | 'name') => {
    if (isAnimating) return; // Prevent selection during animation
    
    setSortBy(sortType);
    
    // Close sort options with animation
    setTimeout(() => {
      toggleSortOptions();
    }, 150); // Small delay to show selection feedback
  };

  return (
    <View style={{ marginTop: 20 }}>
      {/* Gender Selection */}
      {!selectedGender && (
        <View style={styles.genderSelectionContainer}>
          <Text style={styles.genderSelectionTitle}>
            🎯 First, let's personalize your outfits!
          </Text>
          <Text style={styles.genderSelectionSubtitle}>
            Choose your style preference to get perfectly tailored outfit suggestions
          </Text>
          
          <TouchableOpacity
            onPress={() => onSetShowGenderSelector(true)}
            style={styles.genderSelectionButton}
          >
            <Text style={styles.genderSelectionButtonText}>
              👤 Choose Style Preference
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Show outfit builder only after gender is selected */}
      {selectedGender && (
        <>
          {/* AI Outfit Assistant - Unified Smart Suggestions */}
          <View style={styles.aiAssistantSection}>
            <AIOutfitAssistant
              userProfile={{
                ...userProfile,
                gender: selectedGender,
              }}
              styleDNA={styleDNA}
              context="builder"
              size="large"
              onOutfitGenerated={(outfit) => {
                console.log('✅ AI Outfit Assistant generated outfit:', outfit);
              }}
            />
          </View>

          {/* Weather-Based Outfit Generation */}
          <View style={styles.weatherOutfitSection}>
            <Text style={styles.weatherOutfitTitle}>
              🌤️ Weather-Based Outfit
            </Text>
            <Text style={styles.weatherOutfitSubtitle}>
              Generate an outfit perfect for today's weather
            </Text>
            
            <TouchableOpacity
              onPress={onGenerateWeatherOutfit}
              disabled={generatingOutfit || savedItems.length < 2}
              style={[
                styles.weatherOutfitButton,
                (generatingOutfit || savedItems.length < 2) && styles.disabledButton
              ]}
            >
              {generatingOutfit ? (
                <Animated.View style={{
                  transform: [{
                    rotate: spinValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }]
                }}>
                  <Text style={styles.weatherOutfitButtonText}>🌪️</Text>
                </Animated.View>
              ) : (
                <Text style={styles.weatherOutfitButtonText}>
                  {savedItems.length < 2 ? '🚫 Need 2+ items' : '🌤️ Generate Weather Outfit'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Custom Outfit Builder */}
          <View style={styles.customOutfitSection}>
            <Text style={styles.customOutfitTitle}>
              🎨 Custom Outfit Builder
            </Text>
            <Text style={styles.customOutfitSubtitle}>
              Select specific items to create your perfect outfit
            </Text>

            {/* Selection Mode Toggle */}
            <View style={styles.selectionModeContainer}>
              <TouchableOpacity
                onPress={() => {
                  setIsSelectionMode(!isSelectionMode);
                  if (!isSelectionMode) {
                    setSelectedItemsForOutfit([]);
                  }
                }}
                style={[
                  styles.selectionModeButton,
                  isSelectionMode && styles.selectionModeButtonActive
                ]}
              >
                <Text style={[
                  styles.selectionModeButtonText,
                  isSelectionMode && styles.selectionModeButtonTextActive
                ]}>
                  {isSelectionMode ? '✅ Selection Mode ON' : '🎯 Enter Selection Mode'}
                </Text>
              </TouchableOpacity>

              {isSelectionMode && (
                <Text style={styles.selectionCounter}>
                  {selectedItemsForOutfit.length} items selected
                </Text>
              )}
            </View>

            {/* Generate Button */}
            {isSelectionMode && selectedItemsForOutfit.length > 0 && (
              <TouchableOpacity
                onPress={onGenerateOutfit}
                disabled={generatingOutfit}
                style={[
                  styles.generateSelectedButton,
                  generatingOutfit && styles.disabledButton
                ]}
              >
                {generatingOutfit ? (
                  <Animated.View style={{
                    transform: [{
                      rotate: spinValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg']
                      })
                    }]
                  }}>
                    <Text style={styles.generateSelectedButtonText}>🌪️</Text>
                  </Animated.View>
                ) : (
                  <Text style={styles.generateSelectedButtonText}>
                    ✨ Generate Outfit from {selectedItemsForOutfit.length} items
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* Wardrobe Items Grid (when in selection mode) */}
            {isSelectionMode && savedItems.length > 0 && (
              <View style={styles.selectionGrid}>
                <View style={styles.selectionHeader}>
                  <Text style={styles.selectionGridTitle}>
                    👕 Tap items to select:
                  </Text>
                  <TouchableOpacity
                    onPress={toggleSortOptions}
                    style={[
                      styles.sortButton,
                      showSortOptions && styles.sortButtonActive
                    ]}
                    disabled={isAnimating}
                  >
                    <Animated.View style={{
                      transform: [{
                        rotate: sortAnimationValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '180deg']
                        })
                      }]
                    }}>
                      <Text style={[styles.sortButtonText, showSortOptions && styles.sortButtonTextActive]}>🔍</Text>
                    </Animated.View>
                    <Text style={[styles.sortButtonText, showSortOptions && styles.sortButtonTextActive]}>Sort</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Current sort display */}
                <View style={styles.currentSortContainer}>
                  <Text style={styles.currentSortText}>
                    📊 {getSortDisplayName(sortBy)} • {getSortedItems().length} items
                  </Text>
                </View>
                
                {/* Inline Sort Options */}
                {showSortOptions && (
                  <Animated.View 
                    style={[
                      styles.sortOptionsContainer,
                      {
                        opacity: sortAnimationValue,
                        transform: [{
                          scaleY: sortAnimationValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1]
                          })
                        }]
                      }
                    ]}
                  >
                    <View style={styles.sortOptionsHeader}>
                      <Text style={styles.sortOptionsTitle}>Sort by:</Text>
                    </View>
                    
                    <View style={styles.sortOptionsList}>
                      {[
                        { key: 'recent-newest', icon: '🕐', label: 'Recently Added (Newest First)' },
                        { key: 'recent-oldest', icon: '🕑', label: 'Recently Added (Oldest First)' },
                        { key: 'category', icon: '📂', label: 'Category' },
                        { key: 'name', icon: '🔤', label: 'Name' }
                      ].map(({ key, icon, label }) => (
                        <TouchableOpacity
                          key={key}
                          onPress={() => handleSortSelection(key as any)}
                          style={[
                            styles.sortOption,
                            sortBy === key && styles.sortOptionActive
                          ]}
                          disabled={isAnimating}
                        >
                          <View style={styles.sortOptionContent}>
                            <Text style={styles.sortOptionIcon}>{icon}</Text>
                            <Text style={[
                              styles.sortOptionText,
                              sortBy === key && styles.sortOptionTextActive
                            ]}>
                              {label}
                            </Text>
                          </View>
                          {sortBy === key && (
                            <Animated.View style={{
                              transform: [{
                                scale: sortAnimationValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.5, 1]
                                })
                              }]
                            }}>
                              <Text style={styles.sortOptionCheck}>✓</Text>
                            </Animated.View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Animated.View>
                )}
                
                <View style={styles.wardrobeGrid}>
                  {getSortedItems().map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => onToggleItemSelection(item.image)}
                      style={[
                        styles.wardrobeItem,
                        selectedItemsForOutfit.includes(item.image) && styles.wardrobeItemSelected
                      ]}
                    >
                      <Image
                        source={{ uri: item.image }}
                        style={styles.wardrobeItemImage}
                        resizeMode="cover"
                      />
                      
                      {selectedItemsForOutfit.includes(item.image) && (
                        <View style={styles.selectionOverlay}>
                          <Text style={styles.selectionCheckmark}>✓</Text>
                        </View>
                      )}
                      
                      <Text style={styles.wardrobeItemTitle}>
                        {item.title || 'Untitled'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* First outfit prompt when no items */}
          {savedItems.length === 0 && (
            <View style={styles.noItemsContainer}>
              <Text style={styles.noItemsTitle}>
                📸 Ready to build amazing outfits?
              </Text>
              <Text style={styles.noItemsSubtitle}>
                Start by adding some clothing items to your wardrobe using the + button below!
              </Text>
            </View>
          )}
        </>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  genderSelectionContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  genderSelectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  genderSelectionSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  genderSelectionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  genderSelectionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  aiAssistantSection: {
    marginVertical: 8,
  },
  weatherOutfitSection: {
    backgroundColor: '#e8f5e8',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    alignItems: 'center',
  },
  weatherOutfitTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  weatherOutfitSubtitle: {
    fontSize: 14,
    color: '#4caf50',
    textAlign: 'center',
    marginBottom: 15,
  },
  weatherOutfitButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherOutfitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  customOutfitSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  customOutfitTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  customOutfitSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  selectionModeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  selectionModeButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  selectionModeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  selectionModeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  selectionModeButtonTextActive: {
    color: 'white',
  },
  selectionCounter: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 8,
    fontWeight: '600',
  },
  generateSelectedButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  generateSelectedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  selectionGrid: {
    marginTop: 10,
  },
  selectionGridTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  wardrobeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wardrobeItem: {
    width: '48%',
    marginBottom: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  wardrobeItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  wardrobeItemImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  wardrobeItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCheckmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noItemsContainer: {
    backgroundColor: '#fff5f5',
    borderRadius: 16,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffcdd2',
  },
  noItemsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 10,
  },
  noItemsSubtitle: {
    fontSize: 16,
    color: '#f57c00',
    textAlign: 'center',
    lineHeight: 22,
  },
  // New sorting styles
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sortButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: '#0056b3',
    shadowOpacity: 0.2,
  },
  sortButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sortButtonTextActive: {
    color: '#e3f2fd',
  },
  currentSortContainer: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 15,
  },
  currentSortText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
    textAlign: 'center',
  },
  // Inline sort options styles
  sortOptionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  sortOptionsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortOptionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  sortOptionsList: {
    paddingVertical: 8,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  sortOptionActive: {
    backgroundColor: '#e3f2fd',
  },
  sortOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sortOptionIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  sortOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  sortOptionTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  sortOptionCheck: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});