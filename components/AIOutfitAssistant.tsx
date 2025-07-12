import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSmartSuggestions } from '../hooks/useSmartSuggestions';
import { useWardrobeData, WardrobeItem } from '../hooks/useWardrobeData';
import { UserStyleProfile } from '../services/SmartSuggestionsService';
import { useTheme } from '../contexts/ThemeContext';
import { useUnifiedLoading, LOADING_CONFIGS } from '../hooks/useUnifiedLoading';

interface AIOutfitAssistantProps {
  userProfile?: UserStyleProfile;
  styleDNA?: any;
  context?: 'wardrobe' | 'builder' | 'standalone' | 'item';
  size?: 'large' | 'medium' | 'small';
  onOutfitGenerated?: (outfit: any) => void;
  currentItem?: WardrobeItem;
  sharedLoading?: any; // Optional shared loading instance to use instead of creating a new one
  renderButton?: boolean; // Optional prop to control if button should be rendered
}

export interface AIOutfitAssistantRef {
  openConfigModal: () => void;
}

export const AIOutfitAssistant = forwardRef<AIOutfitAssistantRef, AIOutfitAssistantProps>(({
  userProfile,
  styleDNA,
  context = 'standalone',
  currentItem,
  size = 'medium',
  onOutfitGenerated,
  sharedLoading,
  renderButton: shouldRenderButton = true,
}, ref) => {
  // Smart suggestions state
  const smartSuggestions = useSmartSuggestions();
  const { savedItems } = useWardrobeData();
  const { theme } = useTheme();
  const localUnifiedLoading = useUnifiedLoading();
  const unifiedLoading = sharedLoading || localUnifiedLoading; // Use shared loading if provided
  
  // Modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [includeNewItems, setIncludeNewItems] = useState(true);
  const [selectedOccasion, setSelectedOccasion] = useState<string>('casual');

  // Expose modal control to parent component
  useImperativeHandle(ref, () => ({
    openConfigModal: () => setShowConfigModal(true),
  }));
  const [selectedStyle, setSelectedStyle] = useState<string>('versatile');
  
  // Configuration options
  const occasions = [
    { value: 'casual', label: '👕 Casual', icon: '👕' },
    { value: 'work', label: '💼 Work', icon: '💼' },
    { value: 'date', label: '💕 Date Night', icon: '💕' },
    { value: 'party', label: '🎉 Party', icon: '🎉' },
    { value: 'workout', label: '💪 Workout', icon: '💪' },
    { value: 'travel', label: '✈️ Travel', icon: '✈️' },
  ];

  const stylePreferences = [
    { value: 'versatile', label: '🎯 Versatile' },
    { value: 'classic', label: '👔 Classic' },
    { value: 'trendy', label: '✨ Trendy' },
    { value: 'casual', label: '😎 Casual' },
    { value: 'formal', label: '🎩 Formal' },
    { value: 'minimalist', label: '⚪ Minimalist' },
  ];

  // Smart color function that ensures visibility across all themes
  const getSmartButtonColor = (baseColor: string) => {
    // Tokyo Kawaii mode fixes
    if (theme.colorScheme === 'tokyo' && theme.mode === 'light') {
      if (baseColor === theme.colors.accent) return '#FF1493'; // Use deeper pink instead of light pink
      if (baseColor === theme.colors.primary) return '#E91E63'; // Slightly darker hot pink
      if (baseColor === theme.colors.success) return '#2E7D32'; // Darker green for better visibility
      return baseColor;
    }
    
    // Cyber mode fixes  
    if (theme.colorScheme === 'tokyo' && theme.mode === 'dark') {
      if (baseColor === theme.colors.primary) return '#00FFFF'; // Use cyan instead of deep pink for better contrast
      if (baseColor === theme.colors.accent) return '#FF4081'; // Use brighter pink-red
      if (baseColor === theme.colors.success) return '#00C853'; // Brighter green for dark mode
      return baseColor;
    }
    
    // Default theme adjustments for bright green success color
    if (baseColor === theme.colors.success) {
      return theme.mode === 'dark' ? '#388E3C' : '#2E7D32'; // Darker green for better readability
    }
    
    return baseColor;
  };

  // Get dynamic button content based on wardrobe size and context
  const getButtonConfig = useCallback(() => {
    const itemCount = savedItems.length;
    
    if (context === 'wardrobe' && itemCount === 0) {
      return {
        text: '✨ Build My First Outfit',
        subtitle: 'AI will suggest items to get you started',
        icon: 'sparkles',
        color: getSmartButtonColor(theme.colors.primary),
      };
    }
    
    if (context === 'wardrobe' && itemCount < 5) {
      return {
        text: '🧠 Get Smart Suggestions',
        subtitle: 'Complete your wardrobe with AI recommendations',
        icon: 'bulb',
        color: getSmartButtonColor(theme.colors.accent),
      };
    }
    
    if (context === 'builder') {
      return {
        text: '🎯 AI Outfit Assistant',
        subtitle: 'Generate complete outfits with smart recommendations',
        icon: 'checkmark-circle',
        color: getSmartButtonColor(theme.colors.success), // Use success color for better visibility
      };
    }
    
    if (context === 'item' && currentItem) {
      const itemType = currentItem.category || currentItem.style || 'item';
      return {
        text: `🎯 Generate Complete Outfit`,
        subtitle: `AI will fill gear slots with this ${itemType} as centerpiece + matching pieces`,
        icon: 'layers',
        color: getSmartButtonColor(theme.colors.accent),
      };
    }
    
    return {
      text: '✨ Fresh Outfit Ideas',
      subtitle: 'AI-powered styling suggestions',
      icon: 'shirt',
      color: getSmartButtonColor(theme.colors.success),
    };
  }, [savedItems.length, context, theme.colors, theme.colorScheme, theme.mode]);

  const handleQuickGenerate = useCallback(async () => {
    console.log('🧪 [DEBUG] handleQuickGenerate called - BEFORE unifiedLoading.showLoading()', {
      isLoading: unifiedLoading.isLoading
    });
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Handle item-specific outfit generation
      if (context === 'item' && currentItem) {
        console.log(`🎨 Generating outfit around item: ${currentItem.title || currentItem.description}`);
        
        // Don't show loading here - let the actual outfit generation handle it
        // Create a focused outfit generation around this specific item
        const itemFocusedOutfit = {
          centerItem: currentItem,
          selectedItems: [currentItem.image], // Start with this item selected
          isItemFocused: true,
          focusItemType: currentItem.category || 'item',
        };
        
        if (onOutfitGenerated) {
          onOutfitGenerated(itemFocusedOutfit);
        }
        
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }
      
      const profile: UserStyleProfile = {
        ...userProfile,
        occasion: selectedOccasion as any,
        stylePreference: selectedStyle as any,
      };

      // For builder context, always call the outfit generation directly to fill slots
      if (context === 'builder') {
        console.log('🎯 Builder context - calling outfit generation to fill slots');
        
        if (onOutfitGenerated) {
          onOutfitGenerated({
            occasion: selectedOccasion,
            stylePreference: selectedStyle,
            includeNewItems: includeNewItems,
            profile: profile
          });
        }
        
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      if (includeNewItems) {
        // Show unified loading while generating suggestions
        unifiedLoading.showLoading(LOADING_CONFIGS.GENERATING_SUGGESTIONS);
        
        console.log('🧪 [DEBUG] showLoading() just called - AFTER unifiedLoading.showLoading()', {
          isLoading: unifiedLoading.isLoading
        });
        
        try {
          // Generate suggestions that include new items to purchase (Smart Suggestions)
          console.log('🛍️ Generating outfit suggestions with new items to purchase');
          const generatedOutfit = await smartSuggestions.generateSuggestions(
            profile,
            savedItems, // Pass existing wardrobe as context for building upon
            styleDNA
          );
          
          // Call the outfit generated callback with the generated suggestion
          if (generatedOutfit && onOutfitGenerated) {
            onOutfitGenerated(generatedOutfit);
          }
        } finally {
          unifiedLoading.hideLoading();
          
          console.log('🧪 [DEBUG] hideLoading() just called - AFTER unifiedLoading.hideLoading()', {
            isLoading: unifiedLoading.isLoading
          });
        }
      } else {
        // Generate outfits using only existing wardrobe items
        console.log('👔 Generating outfits from existing wardrobe only');
        
        if (savedItems.length < 2) {
          Alert.alert(
            '👕 Need More Items',
            'You need at least 2 wardrobe items to generate outfits without new purchases. Try enabling "Include New Items" or add more clothes to your wardrobe.',
            [{ text: 'OK' }]
          );
          return;
        }

        // For wardrobe-only mode, we can use a different approach
        // This would ideally call a different service that only uses existing items
        // For now, we'll pass empty array to Smart Suggestions which will suggest new items anyway
        // but show a message explaining this limitation
        Alert.alert(
          '🔄 Coming Soon',
          'Wardrobe-only outfit generation is coming soon! For now, try "Include New Items" to get AI suggestions that build upon your existing wardrobe.',
          [
            { text: 'Enable New Items', onPress: () => setIncludeNewItems(true) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }
    } catch (error) {
      console.error('Failed to generate outfit:', error);
      Alert.alert(
        '😔 Generation Failed',
        'Sorry, we couldn\'t generate outfit suggestions right now. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [userProfile, selectedOccasion, selectedStyle, includeNewItems, savedItems, styleDNA, smartSuggestions, onOutfitGenerated, setIncludeNewItems, context, currentItem]);

  const handleConfiguredGenerate = useCallback(async () => {
    setShowConfigModal(false);
    await handleQuickGenerate();
  }, [handleQuickGenerate]);

  const buttonConfig = getButtonConfig();
  const styles = createStyles(theme);

  const renderButton = () => {
    if (size === 'small') {
      const isItemContext = context === 'item' && currentItem;
      return (
        <TouchableOpacity
          style={[
            isItemContext ? styles.smallItemButton : styles.smallButton, 
            { backgroundColor: buttonConfig.color }
          ]}
          onPress={handleQuickGenerate}
          disabled={smartSuggestions.isGenerating || unifiedLoading.isLoading}
        >
          <Ionicons name={buttonConfig.icon as any} size={isItemContext ? 18 : 16} color="white" />
          <Text style={isItemContext ? styles.smallItemButtonText : styles.smallButtonText}>
            {isItemContext ? 'Complete Outfit' : 'AI'}
          </Text>
        </TouchableOpacity>
      );
    }

    if (size === 'medium') {
      return (
        <TouchableOpacity
          style={[styles.mediumButton, { backgroundColor: buttonConfig.color }]}
          onPress={() => setShowConfigModal(true)}
          disabled={smartSuggestions.isGenerating || unifiedLoading.isLoading}
        >
          <View style={styles.buttonContent}>
            <Ionicons name={buttonConfig.icon as any} size={20} color="white" />
            <Text style={styles.mediumButtonText}>{buttonConfig.text}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Large button
    return (
      <TouchableOpacity
        style={[styles.largeButton, { backgroundColor: buttonConfig.color }]}
        onPress={() => setShowConfigModal(true)}
        disabled={smartSuggestions.isGenerating || unifiedLoading.isLoading}
      >
        <View style={styles.largeButtonContent}>
          <Ionicons name={buttonConfig.icon as any} size={24} color="white" />
          <View style={styles.textContainer}>
            <Text style={styles.largeButtonText}>{buttonConfig.text}</Text>
            <Text style={styles.subtitleText}>{buttonConfig.subtitle}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {shouldRenderButton && renderButton()}
      
      {/* Configuration Modal */}
      <Modal
        visible={showConfigModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowConfigModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>🎯 AI Outfit Assistant</Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleConfiguredGenerate}
              disabled={smartSuggestions.isGenerating || unifiedLoading.isLoading}
            >
              <Text style={styles.generateButtonText}>
                {(smartSuggestions.isGenerating || unifiedLoading.isLoading) ? '✨ Generating Magic...' : '🎯 Generate Outfit'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Include New Items Toggle */}
            <View style={styles.section}>
              <View style={styles.toggleContainer}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleTitle}>🛍️ Include New Items</Text>
                  <Text style={styles.toggleSubtitle}>
                    {includeNewItems 
                      ? 'Generate outfit ideas with items to purchase'
                      : 'Use only your existing wardrobe items'
                    }
                  </Text>
                </View>
                <Switch
                  value={includeNewItems}
                  onValueChange={setIncludeNewItems}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={includeNewItems ? '#ffffff' : theme.colors.surface}
                />
              </View>
            </View>

            {/* Occasion Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎭 Occasion</Text>
              <View style={styles.optionsGrid}>
                {occasions.map((occasion) => (
                  <TouchableOpacity
                    key={occasion.value}
                    style={[
                      styles.optionButton,
                      selectedOccasion === occasion.value && styles.selectedOption,
                    ]}
                    onPress={() => setSelectedOccasion(occasion.value)}
                  >
                    <Text style={styles.optionIcon}>{occasion.icon}</Text>
                    <Text style={[
                      styles.optionText,
                      selectedOccasion === occasion.value && styles.selectedOptionText,
                    ]}>
                      {occasion.label.replace(occasion.icon + ' ', '')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Style Preference */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✨ Style Preference</Text>
              <View style={styles.optionsGrid}>
                {stylePreferences.map((style) => (
                  <TouchableOpacity
                    key={style.value}
                    style={[
                      styles.optionButton,
                      selectedStyle === style.value && styles.selectedOption,
                    ]}
                    onPress={() => setSelectedStyle(style.value)}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedStyle === style.value && styles.selectedOptionText,
                    ]}>
                      {style.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
});

const createStyles = (theme: any) => StyleSheet.create({
  // Small button (replaces confusing AI button in wardrobe)
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  smallButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  smallItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    minWidth: 140,
    justifyContent: 'center',
  },
  smallItemButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Medium button (general use)
  mediumButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediumButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Large button (prominent placement)
  largeButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  largeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  largeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitleText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    color: theme.colors.text,
  },
  generateButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  generateButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },

  // Section styles
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: theme.colors.text,
  },

  // Toggle styles
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: theme.colors.text,
  },
  toggleSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },

  // Options grid
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: '30%',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#ede9fe',
    borderColor: '#6366f1',
  },
  optionIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  optionText: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
  },
  selectedOptionText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});