import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { WardrobeItem } from './useWardrobeData';

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
  isSelectionMode: boolean;
  setIsSelectionMode: (mode: boolean) => void;
  selectedItemsForOutfit: string[];
  setSelectedItemsForOutfit: (items: string[]) => void;
  gearSlots: GearSlots;
  setGearSlots: (slots: GearSlots) => void;
  generateOutfitSuggestions: (selectedItem: WardrobeItem) => Promise<void>;
  clearGearSlots: () => void;
  setGearSlotItem: (slotType: keyof GearSlots, item: WardrobeItem | null) => void;
}

export const useOutfitGeneration = (
  savedItems: WardrobeItem[],
  categorizeItem: (item: WardrobeItem) => string
): OutfitGenerationState => {
  const [generatedOutfit, setGeneratedOutfit] = useState<string | null>(null);
  const [generatingOutfit, setGeneratingOutfit] = useState(false);
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
  const generateOutfitSuggestions = async (selectedItem: WardrobeItem) => {
    try {
      // Show loading state
      setGeneratingOutfit(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
      
      // Get all items in the wardrobe
      const allItems = [...savedItems];
      
      // Remove the selected item from consideration for other slots
      const remainingItems = allItems.filter(item => item.image !== selectedItem.image);
      
      // Suggest items for each category based on style compatibility
      const suggestItemForCategory = (category: string, excludeItems: WardrobeItem[] = []) => {
        const categoryItems = remainingItems.filter(item => {
          const itemCategory = categorizeItem(item);
          return itemCategory === category && !excludeItems.some(exclude => exclude.image === item.image);
        });
        
        if (categoryItems.length === 0) return null;
        
        // Simple scoring system based on style compatibility
        const scoredItems = categoryItems.map(item => {
          let score = 0;
          
          // Color compatibility
          if (selectedItem.color && item.color) {
            const selectedColor = selectedItem.color.toLowerCase();
            const itemColor = item.color.toLowerCase();
            
            // Same color family gets high score
            if (selectedColor === itemColor) score += 10;
            // Neutral colors work well together
            else if ((selectedColor.includes('black') || selectedColor.includes('white') || selectedColor.includes('gray')) &&
                     (itemColor.includes('black') || itemColor.includes('white') || itemColor.includes('gray'))) score += 8;
            // Complementary colors
            else if ((selectedColor.includes('blue') && itemColor.includes('brown')) ||
                     (selectedColor.includes('brown') && itemColor.includes('blue'))) score += 7;
          }
          
          // Style compatibility
          if (selectedItem.style && item.style) {
            const selectedStyle = selectedItem.style.toLowerCase();
            const itemStyle = item.style.toLowerCase();
            
            if (selectedStyle.includes('casual') && itemStyle.includes('casual')) score += 5;
            if (selectedStyle.includes('formal') && itemStyle.includes('formal')) score += 5;
            if (selectedStyle.includes('sport') && itemStyle.includes('sport')) score += 5;
          }
          
          // Material compatibility
          if (selectedItem.material && item.material) {
            const selectedMaterial = selectedItem.material.toLowerCase();
            const itemMaterial = item.material.toLowerCase();
            
            if (selectedMaterial === itemMaterial) score += 3;
            if ((selectedMaterial.includes('denim') && itemMaterial.includes('denim')) ||
                (selectedMaterial.includes('cotton') && itemMaterial.includes('cotton'))) score += 2;
          }
          
          // Random factor to add variety
          score += Math.random() * 3;
          
          return { item, score };
        });
        
        // Sort by score and return the best match
        scoredItems.sort((a, b) => b.score - a.score);
        return scoredItems[0]?.item || null;
      };
      
      // Suggest items for each category
      if (itemCategory !== 'top') suggestions.top = suggestItemForCategory('top');
      if (itemCategory !== 'bottom') suggestions.bottom = suggestItemForCategory('bottom');
      if (itemCategory !== 'shoes') suggestions.shoes = suggestItemForCategory('shoes');
      if (itemCategory !== 'jacket') suggestions.jacket = suggestItemForCategory('jacket');
      if (itemCategory !== 'hat') suggestions.hat = suggestItemForCategory('hat');
      if (itemCategory !== 'accessories') suggestions.accessories = suggestItemForCategory('accessories');
      
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
      
      // Count how many items were suggested
      const suggestedCount = Object.values(suggestions).filter(item => item !== null).length;
      
      Alert.alert(
        '✨ Outfit Suggestion Ready!',
        `I've created an outfit with ${suggestedCount} items that work well with your ${selectedItem.title || 'selected item'}! 🎨`
      );
      
    } catch (error) {
      console.error('Error generating outfit suggestions:', error);
      Alert.alert('Failed to generate outfit suggestions. Please try again.');
    } finally {
      setGeneratingOutfit(false);
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