import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { WardrobeItem } from './useWardrobeData';
import { generateIntelligentOutfitSelection } from '../utils/openai';
import { generateClothingItemImage } from '../utils/openai';
import { useUnifiedLoading, LOADING_CONFIGS } from './useUnifiedLoading';
import { useTierManagement } from './useTierManagement';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
// import { useBackgroundTasks } from '../contexts/BackgroundTaskContext';

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
  generateOutfitSuggestions: (selectedItem: WardrobeItem | null, styleDNA?: any, context?: any) => Promise<void>;
  clearGearSlots: () => void;
  setGearSlotItem: (slotType: keyof GearSlots, item: WardrobeItem | null) => void;
  // Store the last generated outfit metadata
  lastGeneratedMetadata?: {
    occasion?: 'work' | 'casual' | 'formal' | 'party' | 'athletic' | 'date';
    style?: string[];
    colorPaletteType?: 'monochrome' | 'earth' | 'pastels' | 'brights' | 'neutrals' | 'jewel';
    season?: string[];
    formality?: string;
    confidence?: number;
    styleScore?: number;
    tags?: string[];
    weatherAppropriateness?: string;
  };
  setLastGeneratedMetadata: (metadata: OutfitGenerationState['lastGeneratedMetadata']) => void;
  // Unified loading state
  unifiedLoading: {
    isLoading: boolean;
    loadingConfig: any;
    showLoading: (config: any) => void;
    hideLoading: () => void;
    updateSteps: (steps: any[]) => void;
  };
}

export const useOutfitGeneration = (
  savedItems: WardrobeItem[],
  categorizeItem: (item: WardrobeItem) => string,
  navigateToBuilder?: () => void,
  sharedLoading?: any
): OutfitGenerationState => {
  const localUnifiedLoading = useUnifiedLoading();
  const unifiedLoading = sharedLoading || localUnifiedLoading;
  const tierManagement = useTierManagement();
  // const backgroundTasks = useBackgroundTasks();
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
  const [lastGeneratedMetadata, setLastGeneratedMetadata] = useState<OutfitGenerationState['lastGeneratedMetadata']>();

  // Function to generate outfit suggestions based on a selected item (or general suggestions if selectedItem is null)
  const generateOutfitSuggestions = async (selectedItem: WardrobeItem | null, styleDNA?: any, context?: any) => {
    // Use AI to generate intelligent outfit selection
    const outfitContext = context || {
      occasion: 'casual',
      location: 'general',
      weather: 'moderate',
      time: 'day',
      style: 'coordinated'
    };

    try {
      // Check AI generation limits before proceeding
      const aiLimitCheck = await tierManagement.checkAIGeneration();
      
      if (!aiLimitCheck.allowed) {
        logger.warn(LogCategories.MONETIZATION, 'AI generation limit reached', {
          remaining: aiLimitCheck.remaining,
          limit: aiLimitCheck.limit,
          userTier: tierManagement.userTier
        });
        
        Alert.alert(
          'AI Limit Reached',
          `You've reached your AI generation limit of ${aiLimitCheck.limit} per month. Upgrade to StyleMuse Pro for unlimited AI outfit generation!`,
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade Now', onPress: () => {
              // TODO: Navigate to upgrade screen
              console.log('Navigate to upgrade screen');
            }}
          ]
        );
        return;
      }
      
      // Navigate to builder page first
      if (navigateToBuilder) {
        navigateToBuilder();
        // Small delay to let navigation complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Show unified loading overlay
      const itemType = selectedItem ? categorizeItem(selectedItem) : 'general';
      console.log('🎨 [OutfitGeneration] Showing unified loading overlay', {
        timestamp: Date.now(),
        itemType,
        selectedItem: selectedItem?.title || 'general outfit generation',
      });
      
      logger.info(LogCategories.OUTFIT_GENERATION, 'Starting outfit generation', {
        selectedItem: selectedItem?.title || 'general outfit generation',
        itemType,
        context: outfitContext,
        hasStyleDNA: !!styleDNA
      });
      logger.debug(LogCategories.OUTFIT_GENERATION, 'Outfit context prepared', outfitContext);
      
      unifiedLoading.showLoading({
        ...LOADING_CONFIGS.OUTFIT_GENERATION,
        subtitle: selectedItem ? `Building around your ${itemType}...` : 'Creating AI outfit suggestions...',
      });
      
      // Show loading state for suggestions (separate from outfit generation)
      setGeneratingSuggestions(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('🎨 Generating smart outfit suggestions and opening builder...');
      
      const startTime = logger.startPerformanceTracking('outfit-generation');
      const aiOutfit = await generateIntelligentOutfitSelection(savedItems, outfitContext, styleDNA);
      
      if (!aiOutfit) {
        throw new Error('AI outfit generation failed');
      }
      
      console.log('🤖 AI outfit result:', aiOutfit);
      logger.info(LogCategories.OUTFIT_GENERATION, 'AI outfit generated', {
        styleScore: aiOutfit.styleScore,
        confidence: aiOutfit.confidence,
        completionStatus: aiOutfit.completionStatus,
        formality: aiOutfit.formality,
        suggestedItemsCount: aiOutfit.suggestedItems?.length || 0
      });
      startTime();
      
      // Store the metadata from AI response
      if (aiOutfit.metadata) {
        setLastGeneratedMetadata({
          occasion: aiOutfit.metadata.occasion,
          style: aiOutfit.metadata.style,
          colorPaletteType: aiOutfit.metadata.colorPaletteType,
          season: aiOutfit.metadata.season,
          formality: aiOutfit.formality || aiOutfit.metadata.formality,
          confidence: aiOutfit.confidence,
          styleScore: aiOutfit.styleScore,
          tags: aiOutfit.metadata.tags,
          weatherAppropriateness: aiOutfit.metadata.weatherAppropriateness,
        });
        console.log('📊 Stored outfit metadata:', aiOutfit.metadata);
      }
      
      const suggestions = {
        top: null as WardrobeItem | null,
        bottom: null as WardrobeItem | null,
        shoes: null as WardrobeItem | null,
        jacket: null as WardrobeItem | null,
        hat: null as WardrobeItem | null,
        accessories: null as WardrobeItem | null,
      };
      
      // Start with the selected item if one is provided
      let itemCategory = null;
      if (selectedItem) {
        itemCategory = categorizeItem(selectedItem);
        suggestions[itemCategory as keyof typeof suggestions] = selectedItem;
      }
      
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
            logger.debug(LogCategories.OUTFIT_GENERATION, 'Generating image for suggested item', {
              title: suggestedItem.title,
              category: suggestedItem.category,
              priority: suggestedItem.priority
            });
            
            // Generate image for the suggested item in background (no await for speed)
            let generatedImageUrl = 'ai-generated';
            generateClothingItemImage(suggestedItem).then(url => {
              if (url) {
                // Update the item image in the background
                console.log(`🖼️ Generated image for ${suggestedItem.title}: ${url}`);
                // TODO: Update the gear slot with the real image URL
              }
            }).catch(err => {
              console.warn(`⚠️ Failed to generate image for ${suggestedItem.title}:`, err);
            });
            
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
      logger.info(LogCategories.OUTFIT_GENERATION, 'Outfit generation completed', {
        suggestedCount,
        newItemsCount,
        slots: Object.entries(newGearSlots).map(([slot, item]) => ({
          slot,
          hasItem: !!item.itemId,
          itemTitle: item.itemTitle
        }))
      });
      
      // Success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Increment AI usage counter after successful generation
      await tierManagement.incrementAIUsage();
      logger.info(LogCategories.MONETIZATION, 'AI usage incremented after successful outfit generation', {
        remainingAfterUse: aiLimitCheck.remaining - 1,
        userTier: tierManagement.userTier
      });
      
      // Log AI reasoning for debugging
      if (aiOutfit.reasoning) {
        console.log('🤖 AI Reasoning:', aiOutfit.reasoning);
      }
      
      // Add suggested items to wardrobe if any
      if (suggestedItems.length > 0) {
        console.log(`📦 Added ${suggestedItems.length} AI-suggested items to builder`);
      }
      
    } catch (error) {
      console.error('🎨 [OutfitGeneration] Error generating outfit suggestions:', error);
      logger.error(LogCategories.OUTFIT_GENERATION, 'Failed to generate outfit suggestions', error as Error, {
        selectedItem: selectedItem?.title || 'general outfit generation',
        context: outfitContext
      });
      Alert.alert('Failed to generate outfit suggestions. Please try again.');
    } finally {
      console.log('🎨 [OutfitGeneration] Finishing outfit generation', {
        timestamp: Date.now(),
        hidingLoading: true,
      });
      setGeneratingSuggestions(false);
      unifiedLoading.hideLoading();
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
    lastGeneratedMetadata,
    setLastGeneratedMetadata,
    
    // Functions
    generateOutfitSuggestions,
    clearGearSlots,
    setGearSlotItem,
    
    // Unified loading
    unifiedLoading,
  };
};