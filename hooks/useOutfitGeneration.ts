import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { WardrobeItem } from './useWardrobeData';
import { generateIntelligentOutfitSelection } from '../utils/openai';
import { generateClothingItemImage } from '../utils/openai';

export interface GearSlot {
  itemId: string | null;
  itemImage: string | null;
  itemTitle: string | null;
}

export interface GearSlots {
  top: GearSlot;
  bottom: GearSlot;
  shoes: GearSlot;
  jacket: GearSlot;
  hat: GearSlot;
  accessories: GearSlot;
}

export interface OutfitGenerationState {
  generatedOutfit: string | null;
  setGeneratedOutfit: (outfit: string | null) => void;
  generatingOutfit: boolean;
  setGeneratingOutfit: (generating: boolean) => void;
  generatingSuggestions: boolean;
  setGeneratingSuggestions: (generating: boolean) => void;
  isSelectionMode: boolean;
  setIsSelectionMode: (mode: boolean) => void;
  selectedItemsForOutfit: string[];
  setSelectedItemsForOutfit: (items: string[]) => void;
  gearSlots: GearSlots;
  setGearSlots: (slots: GearSlots) => void;
  generateOutfitSuggestions: (selectedItem: WardrobeItem, styleDNA?: any, context?: any) => Promise<void>;
  clearGearSlots: () => void;
  setGearSlotItem: (slotType: keyof GearSlots, item: WardrobeItem | null) => void;
}

export const useOutfitGeneration = (
  savedItems: WardrobeItem[],
  categorizeItem: (item: WardrobeItem) => string,
  navigateToBuilder?: () => void
): OutfitGenerationState => {
  const [generatedOutfit, setGeneratedOutfit] = useState<string | null>(null);
  const [generatingOutfit, setGeneratingOutfit] = useState(false);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItemsForOutfit, setSelectedItemsForOutfit] = useState<string[]>([]);
  
  // Initialize gear slots
  const [gearSlots, setGearSlots] = useState<GearSlots>({
    top: { itemId: null, itemImage: null, itemTitle: null },
    bottom: { itemId: null, itemImage: null, itemTitle: null },
    shoes: { itemId: null, itemImage: null, itemTitle: null },
    jacket: { itemId: null, itemImage: null, itemTitle: null },
    hat: { itemId: null, itemImage: null, itemTitle: null },
    accessories: { itemId: null, itemImage: null, itemTitle: null },
  });

  // Function to generate outfit suggestions based on a selected item
  const generateOutfitSuggestions = async (selectedItem: WardrobeItem, styleDNA?: any, context?: any) => {
    try {
      console.log('🎨 generateOutfitSuggestions called with item:', selectedItem.title);
      
      // Navigate to builder page first
      if (navigateToBuilder) {
        console.log('🚀 Calling navigateToBuilder function...');
        navigateToBuilder();
        // Small delay to let navigation complete
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        console.log('⚠️ No navigateToBuilder function provided');
      }
      
      // Show loading state for suggestions (separate from outfit generation)
      setGeneratingSuggestions(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('🎨 Generating smart outfit suggestions and opening builder...');
      
      // Use AI to generate intelligent outfit selection
      const outfitContext = context || {
        occasion: 'casual',
        location: 'general',
        weather: 'moderate',
        time: 'day',
        style: 'coordinated'
      };
      
      const aiOutfit = await generateIntelligentOutfitSelection(savedItems, outfitContext, styleDNA);
      
      if (!aiOutfit) {
        throw new Error('AI outfit generation failed');
      }
      
      console.log('🤖 AI outfit result:', aiOutfit);
      
      const itemCategory = categorizeItem(selectedItem);
      const suggestions = {
        top: null as WardrobeItem | null,
        bottom: null as WardrobeItem | null,
        shoes: null as WardrobeItem | null,
        jacket: null as WardrobeItem | null,
        hat: null as WardrobeItem | null,
        accessories: null as WardrobeItem | null,
      };
      
      // Start with the selected item
      suggestions[itemCategory as keyof typeof suggestions] = selectedItem;
      
      // Use AI suggestions to fill outfit slots
      const findItemByTitle = (title: string | null) => {
        if (!title) return null;
        return savedItems.find(item => item.title === title) || null;
      };
      
      // Fill suggestions from AI recommendations
      if (itemCategory !== 'top' && aiOutfit.outfit.top) {
        suggestions.top = findItemByTitle(aiOutfit.outfit.top);
      }
      if (itemCategory !== 'bottom' && aiOutfit.outfit.bottom) {
        suggestions.bottom = findItemByTitle(aiOutfit.outfit.bottom);
      }
      if (itemCategory !== 'shoes' && aiOutfit.outfit.shoes) {
        suggestions.shoes = findItemByTitle(aiOutfit.outfit.shoes);
      }
      if (itemCategory !== 'jacket' && aiOutfit.outfit.jacket) {
        suggestions.jacket = findItemByTitle(aiOutfit.outfit.jacket);
      }
      if (itemCategory !== 'hat' && aiOutfit.outfit.hat) {
        suggestions.hat = findItemByTitle(aiOutfit.outfit.hat);
      }
      if (itemCategory !== 'accessories' && aiOutfit.outfit.accessories) {
        suggestions.accessories = findItemByTitle(aiOutfit.outfit.accessories);
      }
      
      // Handle AI-suggested items for missing slots
      const suggestedItems: WardrobeItem[] = [];
      if (aiOutfit.suggestedItems && aiOutfit.suggestedItems.length > 0) {
        for (const suggestedItem of aiOutfit.suggestedItems) {
          try {
            console.log(`🎨 Creating suggested item: ${suggestedItem.title}`);
            
            // Generate image for the suggested item
            const generatedImageUrl = await generateClothingItemImage(suggestedItem);
            
            // Create wardrobe item from AI suggestion
            const newWardrobeItem: WardrobeItem = {
              image: generatedImageUrl || 'ai-generated',
              title: suggestedItem.title,
              description: suggestedItem.description,
              color: suggestedItem.color,
              material: suggestedItem.material,
              style: suggestedItem.style,
              fit: suggestedItem.fit,
              category: suggestedItem.category,
              tags: [...(suggestedItem.searchTerms || []), 'ai-suggested', `priority-${suggestedItem.priority}`],
            };
            
            suggestedItems.push(newWardrobeItem);
            
            // Add to appropriate suggestion slot if empty
            const category = suggestedItem.category as keyof typeof suggestions;
            if (!suggestions[category] && category !== itemCategory) {
              suggestions[category] = newWardrobeItem;
            }
            
          } catch (error) {
            console.error('Error creating suggested item:', error);
          }
        }
      }
      
      // Update gear slots with suggestions
      const newGearSlots: GearSlots = {
        top: suggestions.top ? {
          itemId: suggestions.top.image,
          itemImage: suggestions.top.image,
          itemTitle: suggestions.top.title || 'Untitled Item',
        } : { itemId: null, itemImage: null, itemTitle: null },
        bottom: suggestions.bottom ? {
          itemId: suggestions.bottom.image,
          itemImage: suggestions.bottom.image,
          itemTitle: suggestions.bottom.title || 'Untitled Item',
        } : { itemId: null, itemImage: null, itemTitle: null },
        shoes: suggestions.shoes ? {
          itemId: suggestions.shoes.image,
          itemImage: suggestions.shoes.image,
          itemTitle: suggestions.shoes.title || 'Untitled Item',
        } : { itemId: null, itemImage: null, itemTitle: null },
        jacket: suggestions.jacket ? {
          itemId: suggestions.jacket.image,
          itemImage: suggestions.jacket.image,
          itemTitle: suggestions.jacket.title || 'Untitled Item',
        } : { itemId: null, itemImage: null, itemTitle: null },
        hat: suggestions.hat ? {
          itemId: suggestions.hat.image,
          itemImage: suggestions.hat.image,
          itemTitle: suggestions.hat.title || 'Untitled Item',
        } : { itemId: null, itemImage: null, itemTitle: null },
        accessories: suggestions.accessories ? {
          itemId: suggestions.accessories.image,
          itemImage: suggestions.accessories.image,
          itemTitle: suggestions.accessories.title || 'Untitled Item',
        } : { itemId: null, itemImage: null, itemTitle: null },
      };
      
      setGearSlots(newGearSlots);
      
      // Count existing and suggested items
      const suggestedCount = Object.values(suggestions).filter(item => item !== null).length;
      const newItemsCount = suggestedItems.length;
      
      console.log(`✅ Generated outfit with ${suggestedCount} items (${newItemsCount} AI-suggested)`);
      
      // Success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Log AI reasoning for debugging
      if (aiOutfit.reasoning) {
        console.log('🤖 AI Reasoning:', aiOutfit.reasoning);
      }
      
      // Add suggested items to wardrobe if any
      if (suggestedItems.length > 0) {
        console.log(`📦 Added ${suggestedItems.length} AI-suggested items to builder`);
      }
      
    } catch (error) {
      console.error('Error generating outfit suggestions:', error);
      Alert.alert('Failed to generate outfit suggestions. Please try again.');
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  // Clear all gear slots
  const clearGearSlots = () => {
    setGearSlots({
      top: { itemId: null, itemImage: null, itemTitle: null },
      bottom: { itemId: null, itemImage: null, itemTitle: null },
      shoes: { itemId: null, itemImage: null, itemTitle: null },
      jacket: { itemId: null, itemImage: null, itemTitle: null },
      hat: { itemId: null, itemImage: null, itemTitle: null },
      accessories: { itemId: null, itemImage: null, itemTitle: null },
    });
  };

  // Set item for specific gear slot
  const setGearSlotItem = (slot: keyof GearSlots, item: WardrobeItem | null) => {
    setGearSlots(prev => ({
      ...prev,
      [slot]: item ? {
        itemId: item.image,
        itemImage: item.image,
        itemTitle: item.title || 'Untitled Item',
      } : { itemId: null, itemImage: null, itemTitle: null }
    }));
  };

  return {
    // State
    generatedOutfit,
    setGeneratedOutfit,
    generatingOutfit,
    setGeneratingOutfit,
    generatingSuggestions,
    setGeneratingSuggestions,
    isSelectionMode,
    setIsSelectionMode,
    selectedItemsForOutfit,
    setSelectedItemsForOutfit,
    gearSlots,
    setGearSlots,
    
    // Functions
    generateOutfitSuggestions,
    clearGearSlots,
    setGearSlotItem,
  };
};