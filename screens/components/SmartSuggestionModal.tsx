import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Pressable,
  Alert
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useWardrobeData } from '../../hooks/useWardrobeData';
import { generateIntelligentOutfitSelection } from '../../utils/openai';

interface SmartSuggestionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuggestionsGenerated: (suggestions: OutfitSuggestion) => void;
}

interface OutfitSuggestion {
  top?: any;
  bottom?: any;
  shoes?: any;
  jacket?: any;
  hat?: any;
  accessories?: any;
  context: SuggestionContext;
  confidence: number;
  reasoning: string;
  missingItems?: Array<{
    category: string;
    description: string;
    reason: string;
  }>;
  styleScore?: number;
  colorPalette?: string[];
  formality?: string;
}

interface SuggestionContext {
  occasion: string;
  location: string;
  weather: string;
  time: string;
  style: string;
  temperature?: number;
  description?: string;
}

export const SmartSuggestionModal: React.FC<SmartSuggestionModalProps> = ({
  visible,
  onClose,
  onSuggestionsGenerated,
}) => {
  const { savedItems, categorizeItem, styleDNA } = useWardrobeData();
  
  // Context states
  const [selectedOccasion, setSelectedOccasion] = useState('casual');
  const [selectedLocation, setSelectedLocation] = useState('general');
  const [selectedWeather, setSelectedWeather] = useState('current');
  const [selectedTime, setSelectedTime] = useState('any');
  const [selectedStyle, setSelectedStyle] = useState('comfortable');
  
  // Weather data
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  
  // Loading state
  const [generating, setGenerating] = useState(false);

  const occasions = [
    { id: 'casual', label: 'Casual Day', icon: '😎', description: 'Relaxed and comfortable' },
    { id: 'work', label: 'Work/Office', icon: '💼', description: 'Professional and polished' },
    { id: 'date', label: 'Date Night', icon: '💕', description: 'Romantic and stylish' },
    { id: 'formal', label: 'Formal Event', icon: '🎩', description: 'Elegant and sophisticated' },
    { id: 'workout', label: 'Gym/Exercise', icon: '💪', description: 'Active and functional' },
    { id: 'travel', label: 'Travel', icon: '✈️', description: 'Comfortable and versatile' },
    { id: 'weekend', label: 'Weekend Fun', icon: '🎉', description: 'Fun and expressive' },
  ];

  const locations = [
    { id: 'general', label: 'Anywhere', icon: '🌍' },
    { id: 'office', label: 'Office', icon: '🏢' },
    { id: 'restaurant', label: 'Restaurant', icon: '🍽️' },
    { id: 'outdoors', label: 'Outdoors', icon: '🌳' },
    { id: 'home', label: 'At Home', icon: '🏠' },
    { id: 'city', label: 'City Walk', icon: '🏙️' },
    { id: 'beach', label: 'Beach/Water', icon: '🏖️' },
    { id: 'club', label: 'Club/Bar', icon: '🎵' },
  ];

  const weatherOptions = [
    { id: 'current', label: 'Current Weather', icon: '🌤️' },
    { id: 'hot', label: 'Hot (80°F+)', icon: '☀️' },
    { id: 'warm', label: 'Warm (70-80°F)', icon: '🌞' },
    { id: 'mild', label: 'Mild (60-70°F)', icon: '⛅' },
    { id: 'cool', label: 'Cool (50-60°F)', icon: '🌥️' },
    { id: 'cold', label: 'Cold (Below 50°F)', icon: '🧊' },
    { id: 'rainy', label: 'Rainy', icon: '🌧️' },
  ];

  const timeOptions = [
    { id: 'any', label: 'Any Time', icon: '🕐' },
    { id: 'morning', label: 'Morning', icon: '🌅' },
    { id: 'afternoon', label: 'Afternoon', icon: '☀️' },
    { id: 'evening', label: 'Evening', icon: '🌆' },
    { id: 'night', label: 'Night', icon: '🌙' },
  ];

  const styleGoals = [
    { id: 'comfortable', label: 'Comfortable', icon: '😌', description: 'Prioritize comfort and ease' },
    { id: 'professional', label: 'Professional', icon: '👔', description: 'Polished and business-appropriate' },
    { id: 'trendy', label: 'Trendy', icon: '✨', description: 'Fashion-forward and current' },
    { id: 'classic', label: 'Classic', icon: '👗', description: 'Timeless and elegant' },
    { id: 'bold', label: 'Bold', icon: '🔥', description: 'Eye-catching and confident' },
    { id: 'minimal', label: 'Minimal', icon: '⚪', description: 'Clean and understated' },
  ];

  useEffect(() => {
    if (visible && selectedWeather === 'current') {
      getCurrentWeather();
    }
  }, [visible, selectedWeather]);

  const getCurrentWeather = async () => {
    setLoadingWeather(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        setLoadingWeather(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // You would call your weather API here
      // For now, we'll simulate weather data
      const mockWeather = {
        temperature: 72,
        description: 'Partly cloudy',
        condition: 'mild',
      };
      
      setCurrentWeather(mockWeather);
    } catch (error) {
      console.error('Error getting weather:', error);
    } finally {
      setLoadingWeather(false);
    }
  };

  const generateSmartSuggestions = async () => {
    setGenerating(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Create suggestion context
      const context: SuggestionContext = {
        occasion: selectedOccasion,
        location: selectedLocation,
        weather: selectedWeather,
        time: selectedTime,
        style: selectedStyle,
        temperature: currentWeather?.temperature,
        description: `${selectedOccasion} outfit for ${selectedLocation} in ${selectedWeather} weather`,
      };

      // Generate outfit using smart algorithms
      const suggestion = await generateContextualOutfit(context);
      
      if (suggestion) {
        onSuggestionsGenerated(suggestion);
        onClose();
      } else {
        Alert.alert(
          'No Suggestions Available',
          'Could not generate outfit suggestions with current filters. Try adjusting your preferences or add more items to your wardrobe.'
        );
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      Alert.alert('Error', 'Failed to generate suggestions. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const generateContextualOutfit = async (context: SuggestionContext): Promise<OutfitSuggestion | null> => {
    // Check if we have minimum items
    if (savedItems.length === 0) {
      return null;
    }

    try {
      // Use AI to generate intelligent outfit selection
      const aiSelection = await generateIntelligentOutfitSelection(savedItems, context, styleDNA);
      
      if (!aiSelection || !aiSelection.outfit) {
        // Fallback to basic selection if AI fails
        return generateBasicOutfit(context);
      }

      // Convert AI selection to our format by finding actual items
      const selectedItems: any = {};
      
      for (const [category, itemTitle] of Object.entries(aiSelection.outfit)) {
        if (itemTitle && itemTitle !== 'null') {
          // Find the actual item by title
          const foundItem = savedItems.find(item => 
            (item.title && item.title.toLowerCase().includes(itemTitle.toLowerCase())) ||
            (item.description && item.description.toLowerCase().includes(itemTitle.toLowerCase()))
          );
          
          if (foundItem) {
            selectedItems[category] = foundItem;
          }
        }
      }

      return {
        ...selectedItems,
        context,
        confidence: aiSelection.confidence || 85,
        reasoning: aiSelection.reasoning || 'AI-curated outfit based on style analysis',
        missingItems: aiSelection.missingItems || [],
        styleScore: aiSelection.styleScore || 85,
        colorPalette: aiSelection.colorPalette || [],
        formality: aiSelection.formality || context.occasion,
      };

    } catch (error) {
      console.error('AI outfit generation failed:', error);
      // Fallback to basic selection
      return generateBasicOutfit(context);
    }
  };

  // Fallback basic outfit generation
  const generateBasicOutfit = (context: SuggestionContext): OutfitSuggestion | null => {
    // Categorize wardrobe items
    const categories = {
      tops: savedItems.filter(item => ['tops', 'top'].includes(categorizeItem(item))),
      bottoms: savedItems.filter(item => ['bottoms', 'bottom'].includes(categorizeItem(item))),
      shoes: savedItems.filter(item => categorizeItem(item) === 'shoes'),
      jackets: savedItems.filter(item => categorizeItem(item) === 'jackets'),
      hats: savedItems.filter(item => categorizeItem(item) === 'hats'),
      accessories: savedItems.filter(item => categorizeItem(item) === 'accessories'),
    };

    // Check if we have minimum items
    if (categories.tops.length === 0 && categories.bottoms.length === 0) {
      return null;
    }

    // Basic selection logic as fallback
    let selectedItems: any = {};
    let reasoning = [];

    // Simple occasion-based selection
    if (context.occasion === 'work' || context.occasion === 'formal') {
      selectedItems.top = selectByStyle(categories.tops, ['formal', 'business', 'professional']);
      selectedItems.bottom = selectByStyle(categories.bottoms, ['formal', 'professional']);
      selectedItems.shoes = selectByStyle(categories.shoes, ['formal', 'professional']);
      reasoning.push('Basic professional selection');
    } else {
      selectedItems.top = selectRandomItem(categories.tops);
      selectedItems.bottom = selectRandomItem(categories.bottoms);
      selectedItems.shoes = selectRandomItem(categories.shoes);
      reasoning.push('Basic casual selection');
    }

    return {
      ...selectedItems,
      context,
      confidence: 70,
      reasoning: reasoning.join('. ') + ' (Basic fallback mode)',
    };
  };

  const selectByStyle = (items: any[], keywords: string[]): any | null => {
    for (const keyword of keywords) {
      const match = items.find(item => 
        item.title?.toLowerCase().includes(keyword) ||
        item.description?.toLowerCase().includes(keyword) ||
        item.style?.toLowerCase().includes(keyword) ||
        item.tags?.some((tag: string) => tag.toLowerCase().includes(keyword))
      );
      if (match) return match;
    }
    return selectRandomItem(items);
  };

  const selectRandomItem = (items: any[]): any | null => {
    return items.length > 0 ? items[Math.floor(Math.random() * items.length)] : null;
  };

  const renderSelector = (
    title: string,
    options: any[],
    selected: string,
    onSelect: (id: string) => void,
    showDescription = false
  ) => (
    <View style={styles.selectorSection}>
      <Text style={styles.selectorTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(option.id);
            }}
            style={[
              styles.optionButton,
              selected === option.id && styles.selectedOptionButton
            ]}
          >
            <Text style={styles.optionIcon}>{option.icon}</Text>
            <Text style={[
              styles.optionLabel,
              selected === option.id && styles.selectedOptionLabel
            ]}>
              {option.label}
            </Text>
            {showDescription && option.description && (
              <Text style={styles.optionDescription}>{option.description}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Smart Outfit Suggestions</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            Tell us about your plans and we'll suggest the perfect outfit from your wardrobe!
          </Text>

          {/* Occasion Selector */}
          {renderSelector('What\'s the occasion?', occasions, selectedOccasion, setSelectedOccasion, true)}

          {/* Location Selector */}
          {renderSelector('Where are you going?', locations, selectedLocation, setSelectedLocation)}

          {/* Weather Selector */}
          {renderSelector('What\'s the weather like?', weatherOptions, selectedWeather, setSelectedWeather)}
          
          {currentWeather && selectedWeather === 'current' && (
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherText}>
                📍 Current: {currentWeather.temperature}°F, {currentWeather.description}
              </Text>
            </View>
          )}

          {/* Time Selector */}
          {renderSelector('What time of day?', timeOptions, selectedTime, setSelectedTime)}

          {/* Style Goal Selector */}
          {renderSelector('What\'s your style goal?', styleGoals, selectedStyle, setSelectedStyle, true)}

          {/* Preview */}
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>Outfit Preview</Text>
            <Text style={styles.previewText}>
              {occasions.find(o => o.id === selectedOccasion)?.label} outfit for{' '}
              {locations.find(l => l.id === selectedLocation)?.label.toLowerCase()} in{' '}
              {weatherOptions.find(w => w.id === selectedWeather)?.label.toLowerCase()} weather.{' '}
              Style goal: {styleGoals.find(s => s.id === selectedStyle)?.label.toLowerCase()}.
            </Text>
          </View>
        </ScrollView>

        {/* Generate Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={generateSmartSuggestions}
            style={[styles.generateButton, generating && styles.generatingButton]}
            disabled={generating}
          >
            <Text style={styles.generateButtonText}>
              {generating ? '✨ Generating...' : '🎯 Generate Smart Outfit'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 24,
  },
  selectorSection: {
    marginBottom: 24,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  selectorScroll: {
    flexDirection: 'row',
  },
  optionButton: {
    minWidth: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  selectedOptionButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  selectedOptionLabel: {
    color: '#fff',
  },
  optionDescription: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  weatherInfo: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  weatherText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
  },
  previewSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  generatingButton: {
    backgroundColor: '#999',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});