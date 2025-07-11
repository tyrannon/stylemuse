import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { WardrobeItem } from './useWardrobeData';
import { GearSlots } from './useOutfitGeneration';
import { RandomOutfitGenerator, RandomOutfitOptions, GenerationResult } from '../utils/RandomOutfitGenerator';
import { StyleCompatibility } from '../utils/StyleCompatibility';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

export interface RandomOutfitState {
  isGenerating: boolean;
  lastGeneration: GenerationResult | null;
  availableStyles: string[];
  wardrobeStats: any;
  error: string | null;
}

export interface RandomOutfitActions {
  generateRandomOutfit: (options?: RandomOutfitOptions) => Promise<GearSlots | null>;
  generateAroundItem: (centerItem: WardrobeItem, options?: RandomOutfitOptions) => Promise<GearSlots | null>;
  shuffleSlot: (slotName: keyof GearSlots, currentOutfit: GearSlots, options?: RandomOutfitOptions) => Promise<GearSlots | null>;
  getWardrobeStats: () => void;
  clearRecentlyUsed: () => void;
  setError: (error: string | null) => void;
}

export const useRandomOutfit = (
  savedItems: WardrobeItem[]
): RandomOutfitState & RandomOutfitActions => {
  const [state, setState] = useState<RandomOutfitState>({
    isGenerating: false,
    lastGeneration: null,
    availableStyles: StyleCompatibility.getAvailableStyles(),
    wardrobeStats: null,
    error: null
  });

  /**
   * Generate a completely random outfit
   */
  const generateRandomOutfit = useCallback(async (
    options: RandomOutfitOptions = {}
  ): Promise<GearSlots | null> => {
    if (savedItems.length === 0) {
      const errorMsg = 'No items in wardrobe to generate outfit from';
      setState(prev => ({ ...prev, error: errorMsg }));
      Alert.alert('Empty Wardrobe', 'Add some clothes to your wardrobe first!');
      return null;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    
    try {
      // Generate the outfit
      const result = RandomOutfitGenerator.generate(savedItems, options);
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      setState(prev => ({
        ...prev,
        isGenerating: false,
        lastGeneration: result,
        error: null
      }));

      return result.outfit;

    } catch (error) {
      const errorMsg = `Failed to generate random outfit: ${error}`;
      console.error('❌ [RandomOutfit] Generation failed:', error);
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMsg
      }));

      Alert.alert('Generation Failed', 'Could not generate a random outfit. Please try again.');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return null;
    }
  }, [savedItems]);

  /**
   * Generate an outfit built around a specific item
   */
  const generateAroundItem = useCallback(async (
    centerItem: WardrobeItem,
    options: RandomOutfitOptions = {}
  ): Promise<GearSlots | null> => {
    if (savedItems.length < 3) {
      const errorMsg = 'Need at least 3 items in wardrobe to build complete outfits';
      setState(prev => ({ ...prev, error: errorMsg }));
      Alert.alert('Insufficient Items', 'Add more clothes to build complete outfits!');
      return null;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      logger.info(LogCategories.OUTFIT_GENERATION, 'Starting outfit generation around item', {
        centerItem: centerItem.title,
        centerItemColor: centerItem.color,
        centerItemCategory: StyleCompatibility.categorizeItem(centerItem),
        wardrobeSize: savedItems.length
      });

      const result = RandomOutfitGenerator.generateAroundItem(centerItem, savedItems, options);
      
      logger.info(LogCategories.OUTFIT_GENERATION, 'Outfit around item generated successfully', {
        style: result.style,
        colorHarmony: result.colorHarmony,
        completeness: result.completeness,
        generationTime: result.generationTime
      });

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      setState(prev => ({
        ...prev,
        isGenerating: false,
        lastGeneration: result,
        error: null
      }));

      return result.outfit;

    } catch (error) {
      const errorMsg = `Failed to generate outfit around item: ${error}`;
      logger.error(LogCategories.OUTFIT_GENERATION, 'Outfit around item generation failed', error as Error);
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMsg
      }));

      Alert.alert('Generation Failed', 'Could not build outfit around this item. Please try again.');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return null;
    }
  }, [savedItems]);

  /**
   * Shuffle/re-roll a specific slot in an existing outfit
   */
  const shuffleSlot = useCallback(async (
    slotName: keyof GearSlots,
    currentOutfit: GearSlots,
    options: RandomOutfitOptions = {}
  ): Promise<GearSlots | null> => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      logger.debug(LogCategories.OUTFIT_GENERATION, 'Shuffling outfit slot', {
        slot: slotName,
        currentItem: currentOutfit[slotName].itemTitle
      });

      // Determine style from current outfit or options
      const targetStyle = options.style || state.lastGeneration?.style || 'casual';
      
      // Filter wardrobe by compatibility
      const compatibleItems = StyleCompatibility.filterByStyle(savedItems, targetStyle);
      
      // Get current outfit items for color harmony checking
      const currentItems = Object.values(currentOutfit)
        .filter(slot => slot.itemId && slot.itemTitle)
        .map(slot => savedItems.find(item => 
          item.image === slot.itemId || item.title === slot.itemTitle
        ))
        .filter(item => item !== undefined) as WardrobeItem[];

      // Get items for the slot we're shuffling
      const slotKey = slotName === 'accessories' ? 'accessories' : 
                     slotName === 'jacket' ? 'jackets' : 
                     slotName + 's' as keyof typeof compatibleItems;
      
      const availableItems = compatibleItems[slotKey] || [];
      
      if (availableItems.length === 0) {
        throw new Error(`No compatible items available for ${slotName}`);
      }

      // Find items that work well with the current outfit colors
      const otherItems = currentItems.filter(item => {
        const currentSlotItem = savedItems.find(i => 
          i.image === currentOutfit[slotName].itemId || i.title === currentOutfit[slotName].itemTitle
        );
        return item !== currentSlotItem;
      });

      let newItem: WardrobeItem | null = null;
      
      if (otherItems.length > 0) {
        // Try to find an item that harmonizes with existing colors
        const harmonizedItems = availableItems.filter(item =>
          otherItems.every(otherItem =>
            StyleCompatibility.areColorsCompatible(item.color || '', otherItem.color || '')
          )
        );
        
        if (harmonizedItems.length > 0) {
          newItem = harmonizedItems[Math.floor(Math.random() * harmonizedItems.length)];
        }
      }
      
      // Fall back to any available item if no harmonized options
      if (!newItem) {
        newItem = availableItems[Math.floor(Math.random() * availableItems.length)];
      }

      // Create new outfit with shuffled slot
      const newOutfit: GearSlots = {
        ...currentOutfit,
        [slotName]: {
          itemId: newItem.image,
          itemImage: newItem.image,
          itemTitle: newItem.title || 'Untitled Item'
        }
      };

      logger.debug(LogCategories.OUTFIT_GENERATION, 'Slot shuffled successfully', {
        slot: slotName,
        newItem: newItem.title,
        newItemColor: newItem.color
      });

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: null
      }));

      return newOutfit;

    } catch (error) {
      const errorMsg = `Failed to shuffle ${slotName}: ${error}`;
      logger.error(LogCategories.OUTFIT_GENERATION, 'Slot shuffle failed', error as Error, {
        slot: slotName
      });

      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMsg
      }));

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return null;
    }
  }, [savedItems, state.lastGeneration?.style]);

  /**
   * Get wardrobe statistics for random generation
   */
  const getWardrobeStats = useCallback(() => {
    try {
      const stats = RandomOutfitGenerator.getWardrobeStats(savedItems);
      
      setState(prev => ({
        ...prev,
        wardrobeStats: stats
      }));

      logger.debug(LogCategories.WARDROBE, 'Wardrobe stats calculated', {
        totalItems: stats.totalItems,
        estimatedCombinations: stats.estimatedCombinations,
        categoryCounts: stats.byCategory
      });

    } catch (error) {
      logger.error(LogCategories.WARDROBE, 'Failed to calculate wardrobe stats', error as Error);
    }
  }, [savedItems]);

  /**
   * Clear recently used items to allow repetition
   */
  const clearRecentlyUsed = useCallback(() => {
    RandomOutfitGenerator.clearRecentlyUsed();
    logger.info(LogCategories.OUTFIT_GENERATION, 'Recently used items cleared');
  }, []);

  /**
   * Set error state
   */
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    generateRandomOutfit,
    generateAroundItem,
    shuffleSlot,
    getWardrobeStats,
    clearRecentlyUsed,
    setError
  };
};