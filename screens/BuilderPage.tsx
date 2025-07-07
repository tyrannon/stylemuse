import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Animated } from 'react-native';
import { WardrobeItem, LovedOutfit } from '../hooks/useWardrobeData';
import { AIOutfitAssistant } from '../components/AIOutfitAssistant';
import { UnifiedLoadingOverlay } from '../components/UnifiedLoadingOverlay';
import { useUnifiedLoading, LOADING_CONFIGS } from '../hooks/useUnifiedLoading';
import { useTheme } from '../contexts/ThemeContext';

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
  // spinValue: Animated.Value; // Legacy prop removed - now using unified loading
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
  // spinValue, // Legacy prop removed
  onToggleItemSelection,
  userProfile,
  styleDNA,
}) => {
  const { theme } = useTheme();
  const unifiedLoading = useUnifiedLoading();
  
  const styles = createStyles(theme);
  
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
              sharedLoading={unifiedLoading} // Pass the shared loading instance
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
              onPress={() => {
                // Show unified loading when generating weather outfit
                unifiedLoading.showLoading(LOADING_CONFIGS.WEATHER_OUTFIT_GENERATION);
                
                // Call the actual generation function
                onGenerateWeatherOutfit();
              }}
              disabled={generatingOutfit || savedItems.length < 2}
              style={[
                styles.weatherOutfitButton,
                (generatingOutfit || savedItems.length < 2) && styles.disabledButton
              ]}
            >
              <Text style={styles.weatherOutfitButtonText}>
                {savedItems.length < 2 ? '🚫 Need 2+ items' : '🌤️ Generate Weather Outfit'}
              </Text>
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
                onPress={() => {
                  // Show unified loading when generating outfit from selected items
                  unifiedLoading.showLoading(LOADING_CONFIGS.OUTFIT_GENERATION);
                  
                  // Call the actual generation function
                  onGenerateOutfit();
                }}
                disabled={generatingOutfit}
                style={[
                  styles.generateSelectedButton,
                  generatingOutfit && styles.disabledButton
                ]}
              >
                <Text style={styles.generateSelectedButtonText}>
                  {generatingOutfit 
                    ? '✨ Generating...' 
                    : `✨ Generate Outfit from ${selectedItemsForOutfit.length} items`
                  }
                </Text>
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
      
      {/* Unified Loading Overlay */}
      <UnifiedLoadingOverlay
        visible={unifiedLoading.isLoading}
        title={unifiedLoading.loadingConfig?.title || ''}
        subtitle={unifiedLoading.loadingConfig?.subtitle}
        steps={unifiedLoading.loadingConfig?.steps}
        style={unifiedLoading.loadingConfig?.style}
      />
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  genderSelectionContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    margin: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  genderSelectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  genderSelectionSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  genderSelectionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    ...theme.shadows.medium,
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
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    margin: 20,
    ...theme.shadows.large,
  },
  customOutfitTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  customOutfitSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  selectionModeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  selectionModeButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  selectionModeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  selectionModeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  selectionModeButtonTextActive: {
    color: 'white',
  },
  selectionCounter: {
    fontSize: 14,
    color: theme.colors.primary,
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
    color: theme.colors.text,
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
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  wardrobeItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.mode === 'dark' ? '#1a2332' : '#e3f2fd',
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
    color: theme.colors.text,
    textAlign: 'center',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
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