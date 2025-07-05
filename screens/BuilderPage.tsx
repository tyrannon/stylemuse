import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Animated } from 'react-native';
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
}) => {
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
                <Text style={styles.selectionGridTitle}>
                  👕 Tap items to select:
                </Text>
                <View style={styles.wardrobeGrid}>
                  {savedItems.map((item, index) => (
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
});