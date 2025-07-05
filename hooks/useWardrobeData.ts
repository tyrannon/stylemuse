import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { StorageService } from '../services/StorageService';
import { WishlistItem } from '../types/StyleAdvice';
import { SuggestedItem } from '../services/SmartSuggestionsService';

// Storage keys for AsyncStorage (legacy - migrating to StorageService)
const STORAGE_KEYS = {
  WARDROBE_ITEMS: 'stylemuse_wardrobe_items',
  LOVED_OUTFITS: 'stylemuse_loved_outfits',
  STYLE_DNA: 'stylemuse_style_dna',
  SELECTED_GENDER: 'stylemuse_selected_gender',
  PROFILE_IMAGE: 'stylemuse_profile_image',
  OUTFIT_WEAR_HISTORY: 'stylemuse_outfit_wear_history',
};

// Type definitions
export type LaundryStatus = 'clean' | 'dirty' | 'in-laundry' | 'drying' | 'needs-ironing' | 'out-of-rotation';

export interface LaundryRecord {
  status: LaundryStatus;
  changedAt: Date;
  previousStatus?: LaundryStatus;
  washType?: 'regular' | 'delicate' | 'hand-wash' | 'dry-clean';
  dryingMethod?: 'air-dry' | 'tumble-dry' | 'hang-dry';
  notes?: string;
}

export interface WardrobeItem {
  image: string;
  title?: string;
  description: string;
  tags?: string[];
  color?: string;
  material?: string;
  style?: string;
  fit?: string;
  category?: string;
  // Laundry tracking fields
  laundryStatus?: LaundryStatus;
  laundryHistory?: LaundryRecord[];
  lastWashed?: Date;
  timesWashed?: number;
  washFrequency?: number; // days between typical washes
  needsSpecialCare?: boolean;
}

export interface WearRecord {
  wornAt: Date;
  location?: string;
  event?: string;
  rating?: number; // 1-5 stars for how much they liked wearing it
}

export interface LovedOutfit {
  id: string;
  image: string;
  weatherData?: any;
  styleDNA?: any;
  selectedItems: string[];
  gender: string | null;
  createdAt: Date;
  isLoved?: boolean;
  // New wear tracking fields
  wearHistory: WearRecord[];
  lastWorn?: Date;
  timesWorn: number;
  suggestedForReWear?: boolean;
  nextSuggestedDate?: Date;
}

// Smart Suggestions Types
export interface SuggestedWardrobeItem extends WardrobeItem {
  isSuggested: boolean;
  amazonUrl?: string;
  price?: number;
  reasoning?: string;
  searchTerms?: string[];
  dateAdded?: Date;
  purchaseStatus?: 'wishlist' | 'in_cart' | 'purchased' | 'not_interested';
}

export const useWardrobeData = () => {
  // Wardrobe items state
  const [savedItems, setSavedItems] = useState<WardrobeItem[]>([]);
  
  // Outfit state
  const [lovedOutfits, setLovedOutfits] = useState<LovedOutfit[]>([]);
  
  // Wishlist and suggestions state
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [suggestedItems, setSuggestedItems] = useState<SuggestedItem[]>([]);
  
  // Profile state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [styleDNA, setStyleDNA] = useState<any | null>(null);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'nonbinary' | null>(null);

  // Available categories for dropdown
  const AVAILABLE_CATEGORIES = ['top', 'bottom', 'shoes', 'jacket', 'hat', 'accessories'];

  // Load wardrobe data function
  const loadWardrobeData = useCallback(async () => {
    try {
      const [items, outfits, dna, gender, profile, wishlist, suggestions] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.WARDROBE_ITEMS),
        AsyncStorage.getItem(STORAGE_KEYS.LOVED_OUTFITS),
        AsyncStorage.getItem(STORAGE_KEYS.STYLE_DNA),
        AsyncStorage.getItem(STORAGE_KEYS.SELECTED_GENDER),
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE),
        StorageService.loadWishlistItems(),
        StorageService.loadSuggestedItems(),
      ]);

      if (items) setSavedItems(JSON.parse(items));
      if (outfits) {
        const parsedOutfits = JSON.parse(outfits).map((outfit: any) => ({
          ...outfit,
          createdAt: outfit.createdAt instanceof Date ? outfit.createdAt : new Date(outfit.createdAt),
          // Initialize wear tracking fields for existing outfits (migration)
          wearHistory: outfit.wearHistory ? outfit.wearHistory.map((record: any) => ({
            ...record,
            wornAt: record.wornAt instanceof Date ? record.wornAt : new Date(record.wornAt)
          })) : [],
          lastWorn: outfit.lastWorn ? (
            outfit.lastWorn instanceof Date ? outfit.lastWorn : new Date(outfit.lastWorn)
          ) : undefined,
          timesWorn: typeof outfit.timesWorn === 'number' ? outfit.timesWorn : 0,
          suggestedForReWear: outfit.suggestedForReWear || false,
          nextSuggestedDate: outfit.nextSuggestedDate ? (
            outfit.nextSuggestedDate instanceof Date ? outfit.nextSuggestedDate : new Date(outfit.nextSuggestedDate)
          ) : undefined,
        }));
        setLovedOutfits(parsedOutfits);
      }
      if (dna) setStyleDNA(JSON.parse(dna));
      if (gender) setSelectedGender(gender as any);
      if (profile) setProfileImage(profile);
      
      // Load wishlist and suggested items
      setWishlistItems(wishlist);
      setSuggestedItems(suggestions);
    } catch (error) {
      console.error('Error loading wardrobe data:', error);
    }
  }, []);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    loadWardrobeData();
  }, []);

  // Function to automatically categorize clothing items
  const categorizeItem = useCallback((item: WardrobeItem): string => {
    // Check for explicit category first (from manual selection)
    if (item.category && AVAILABLE_CATEGORIES.includes(item.category)) {
      return item.category;
    }
    
    const tags = item.tags || [];
    const title = (item.title || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    const style = (item.style || '').toLowerCase();
    
    // Check for top items
    if (tags.some(tag => ['top', 't-shirt', 'shirt', 'blouse', 'tank', 'crop', 'sweater'].includes(tag.toLowerCase())) ||
        title.includes('shirt') || title.includes('top') || title.includes('blouse') || title.includes('t-shirt') ||
        description.includes('shirt') || description.includes('top') || description.includes('blouse') ||
        style.includes('shirt') || style.includes('top') || style.includes('blouse')) {
      return 'top';
    }
    
    // Check for bottom items
    if (tags.some(tag => ['bottom', 'pants', 'jeans', 'shorts', 'skirt', 'trousers'].includes(tag.toLowerCase())) ||
        title.includes('pants') || title.includes('jeans') || title.includes('shorts') || title.includes('skirt') ||
        description.includes('pants') || description.includes('jeans') || description.includes('shorts') ||
        style.includes('pants') || style.includes('jeans') || style.includes('shorts') || style.includes('skirt')) {
      return 'bottom';
    }
    
    // Check for shoes
    if (tags.some(tag => ['shoes', 'boots', 'sandals', 'sneakers', 'footwear'].includes(tag.toLowerCase())) ||
        title.includes('shoes') || title.includes('boots') || title.includes('sandals') || title.includes('sneakers') ||
        description.includes('shoes') || description.includes('boots') || description.includes('sandals') ||
        style.includes('shoes') || style.includes('boots') || style.includes('sandals')) {
      return 'shoes';
    }
    
    // Check for jacket/outerwear
    if (tags.some(tag => ['jacket', 'coat', 'blazer', 'cardigan', 'outerwear'].includes(tag.toLowerCase())) ||
        title.includes('jacket') || title.includes('coat') || title.includes('blazer') || title.includes('cardigan') ||
        description.includes('jacket') || description.includes('coat') || description.includes('blazer') ||
        style.includes('jacket') || style.includes('coat') || style.includes('blazer')) {
      return 'jacket';
    }
    
    // Check for hat/headwear
    if (tags.some(tag => ['hat', 'cap', 'beanie', 'headwear'].includes(tag.toLowerCase())) ||
        title.includes('hat') || title.includes('cap') || title.includes('beanie') ||
        description.includes('hat') || description.includes('cap') || description.includes('beanie') ||
        style.includes('hat') || style.includes('cap') || style.includes('beanie')) {
      return 'hat';
    }
    
    // Check for accessories
    if (tags.some(tag => ['accessories', 'jewelry', 'bag', 'scarf', 'belt', 'watch'].includes(tag.toLowerCase())) ||
        title.includes('accessories') || title.includes('jewelry') || title.includes('bag') || title.includes('scarf') ||
        description.includes('accessories') || description.includes('jewelry') || description.includes('bag') ||
        style.includes('accessories') || style.includes('jewelry') || style.includes('bag')) {
      return 'accessories';
    }
    
    // Default to top if no clear category found
    return 'top';
  }, [AVAILABLE_CATEGORIES]);

  // Function to update item category
  const updateItemCategory = useCallback(async (item: WardrobeItem, newCategory: string) => {
    try {
      console.log('Updating category from', categorizeItem(item), 'to', newCategory);
      
      const updatedItem = {
        ...item,
        category: newCategory,
        tags: [...(item.tags || []).filter((tag: string) => 
          !AVAILABLE_CATEGORIES.includes(tag.toLowerCase())
        ), newCategory]
      };
      
      const updatedItems = savedItems.map(savedItem => 
        savedItem.image === item.image && savedItem.description === item.description 
          ? updatedItem 
          : savedItem
      );
      
      setSavedItems(updatedItems);
      await AsyncStorage.setItem(STORAGE_KEYS.WARDROBE_ITEMS, JSON.stringify(updatedItems));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      return updatedItem;
    } catch (error) {
      console.error('Error updating category:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    }
  }, [savedItems, categorizeItem, AVAILABLE_CATEGORIES]);

  // Function to save field updates
  const saveFieldUpdate = useCallback(async (item: WardrobeItem, field: string, value: string | string[]) => {
    try {
      const updatedItem = {
        ...item,
        [field]: value
      };

      const updatedItems = savedItems.map(savedItem => 
        savedItem.image === item.image && savedItem.description === item.description 
          ? updatedItem 
          : savedItem
      );
      
      setSavedItems(updatedItems);
      await AsyncStorage.setItem(STORAGE_KEYS.WARDROBE_ITEMS, JSON.stringify(updatedItems));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      return updatedItem;
    } catch (error) {
      console.error('Error saving field update:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    }
  }, [savedItems]);

  // Function to toggle outfit love status
  const toggleOutfitLove = useCallback(async (outfitId: string) => {
    try {
      const updatedOutfits = lovedOutfits.map(outfit => 
        outfit.id === outfitId 
          ? { ...outfit, isLoved: !outfit.isLoved }
          : outfit
      );
      
      setLovedOutfits(updatedOutfits);
      await AsyncStorage.setItem(STORAGE_KEYS.LOVED_OUTFITS, JSON.stringify(updatedOutfits));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error toggling outfit love:', error);
    }
  }, [lovedOutfits]);

  // Function to get unique categories from wardrobe
  const getUniqueCategories = useCallback(() => {
    const categories = savedItems.map(item => categorizeItem(item));
    return ['all', ...Array.from(new Set(categories))];
  }, [savedItems, categorizeItem]);

  // Function to get items filtered by category
  const getItemsByCategory = useCallback((category: string) => {
    return savedItems.filter(item => {
      const itemCategory = categorizeItem(item);
      return itemCategory === category;
    });
  }, [savedItems, categorizeItem]);

  // OUTFIT MEMORY & RE-SUGGESTION FUNCTIONS
  
  // Function to mark an outfit as worn
  const markOutfitAsWorn = useCallback(async (outfitId: string, rating?: number, event?: string, location?: string) => {
    try {
      const wearRecord: WearRecord = {
        wornAt: new Date(),
        rating,
        event,
        location,
      };

      const updatedOutfits = lovedOutfits.map(outfit => {
        if (outfit.id === outfitId) {
          // Ensure wear tracking fields exist (for migration of old outfits)
          const currentWearHistory = Array.isArray(outfit.wearHistory) ? outfit.wearHistory : [];
          const currentTimesWorn = typeof outfit.timesWorn === 'number' ? outfit.timesWorn : 0;
          
          const updatedOutfit = {
            ...outfit,
            wearHistory: [...currentWearHistory, wearRecord],
            lastWorn: wearRecord.wornAt,
            timesWorn: currentTimesWorn + 1,
            nextSuggestedDate: calculateNextSuggestionDate(currentTimesWorn + 1, wearRecord.wornAt),
          };
          return updatedOutfit;
        }
        return outfit;
      });
      
      setLovedOutfits(updatedOutfits);
      await AsyncStorage.setItem(STORAGE_KEYS.LOVED_OUTFITS, JSON.stringify(updatedOutfits));
      
      // Automatically mark outfit items as dirty
      const wornOutfit = updatedOutfits.find(o => o.id === outfitId);
      if (wornOutfit) {
        await markOutfitItemsAsDirty(wornOutfit.selectedItems);
      }
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      return wornOutfit;
    } catch (error) {
      console.error('Error marking outfit as worn:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    }
  }, [lovedOutfits, calculateNextSuggestionDate, markOutfitItemsAsDirty]);
  
  // Calculate when an outfit should be suggested again
  const calculateNextSuggestionDate = useCallback((timesWorn: number, lastWornDate: Date): Date => {
    const now = new Date(lastWornDate);
    let daysToAdd = 7; // Default 1 week
    
    // Adjust suggestion frequency based on how often it's been worn
    if (timesWorn === 1) {
      daysToAdd = 14; // 2 weeks for first re-wear
    } else if (timesWorn <= 3) {
      daysToAdd = 10; // 10 days for lightly worn items
    } else if (timesWorn <= 6) {
      daysToAdd = 7; // 1 week for moderately worn items
    } else {
      daysToAdd = 14; // 2 weeks for heavily worn items
    }
    
    now.setDate(now.getDate() + daysToAdd);
    return now;
  }, []);
  
  // Get outfits that are ready to be re-suggested
  const getOutfitsReadyForReSuggestion = useCallback((): LovedOutfit[] => {
    const now = new Date();
    return lovedOutfits.filter(outfit => {
      // Defensive check for wear tracking fields
      const timesWorn = typeof outfit.timesWorn === 'number' ? outfit.timesWorn : 0;
      
      // Only suggest outfits that have been worn at least once
      if (timesWorn === 0) return false;
      
      // Check if enough time has passed since last suggestion date
      if (outfit.nextSuggestedDate) {
        try {
          const nextDate = outfit.nextSuggestedDate instanceof Date ? outfit.nextSuggestedDate : new Date(outfit.nextSuggestedDate);
          if (now >= nextDate) {
            return true;
          }
        } catch (error) {
          console.warn('Invalid nextSuggestedDate for outfit:', outfit.id, error);
        }
      }
      
      // Fallback: suggest if it's been more than 2 weeks since last worn
      if (outfit.lastWorn) {
        try {
          const lastWornDate = outfit.lastWorn instanceof Date ? outfit.lastWorn : new Date(outfit.lastWorn);
          const daysSinceWorn = (now.getTime() - lastWornDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceWorn >= 14;
        } catch (error) {
          console.warn('Invalid lastWorn date for outfit:', outfit.id, error);
          return false;
        }
      }
      
      return false;
    });
  }, [lovedOutfits]);
  
  // Get smart outfit suggestions (avoiding recently worn similar items)
  const getSmartOutfitSuggestions = useCallback((limit: number = 5): LovedOutfit[] => {
    const readyForReSuggestion = getOutfitsReadyForReSuggestion();
    const neverWorn = lovedOutfits.filter(outfit => {
      const timesWorn = typeof outfit.timesWorn === 'number' ? outfit.timesWorn : 0;
      return timesWorn === 0;
    });
    
    // Combine and prioritize: never worn first, then ready for re-suggestion
    const suggestions = [...neverWorn, ...readyForReSuggestion]
      .filter((outfit, index, self) => 
        index === self.findIndex(o => o.id === outfit.id) // Remove duplicates
      )
      .sort((a, b) => {
        // Get safe values for comparison
        const aTimesWorn = typeof a.timesWorn === 'number' ? a.timesWorn : 0;
        const bTimesWorn = typeof b.timesWorn === 'number' ? b.timesWorn : 0;
        
        // Prioritize never worn
        if (aTimesWorn === 0 && bTimesWorn > 0) return -1;
        if (bTimesWorn === 0 && aTimesWorn > 0) return 1;
        
        // For re-suggestions, prioritize less worn items
        if (aTimesWorn !== bTimesWorn) {
          return aTimesWorn - bTimesWorn;
        }
        
        // Finally, prioritize older creation dates
        try {
          const aCreated = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const bCreated = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return aCreated.getTime() - bCreated.getTime();
        } catch (error) {
          console.warn('Invalid createdAt dates in outfit comparison');
          return 0;
        }
      })
      .slice(0, limit);
      
    return suggestions;
  }, [lovedOutfits, getOutfitsReadyForReSuggestion]);
  
  // Check if outfit items are similar to recently worn outfits
  const isOutfitSimilarToRecentlyWorn = useCallback((outfitItems: string[], daysBack: number = 7): boolean => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    const recentlyWornOutfits = lovedOutfits.filter(outfit => {
      if (!outfit.lastWorn) return false;
      try {
        const lastWornDate = outfit.lastWorn instanceof Date ? outfit.lastWorn : new Date(outfit.lastWorn);
        return lastWornDate >= cutoffDate;
      } catch (error) {
        console.warn('Invalid lastWorn date in similarity check:', outfit.id);
        return false;
      }
    });
    
    for (const recentOutfit of recentlyWornOutfits) {
      const sharedItems = outfitItems.filter(item => 
        recentOutfit.selectedItems.includes(item)
      );
      
      // Consider similar if more than 50% of items are shared
      const similarityRatio = sharedItems.length / Math.max(outfitItems.length, recentOutfit.selectedItems.length);
      if (similarityRatio > 0.5) {
        return true;
      }
    }
    
    return false;
  }, [lovedOutfits]);
  
  // Get outfit wear statistics
  const getOutfitWearStats = useCallback(() => {
    const totalOutfits = lovedOutfits.length;
    const wornOutfits = lovedOutfits.filter(o => {
      const timesWorn = typeof o.timesWorn === 'number' ? o.timesWorn : 0;
      return timesWorn > 0;
    }).length;
    const neverWornOutfits = totalOutfits - wornOutfits;
    const totalWears = lovedOutfits.reduce((sum, o) => {
      const timesWorn = typeof o.timesWorn === 'number' ? o.timesWorn : 0;
      return sum + timesWorn;
    }, 0);
    const averageWearsPerOutfit = totalOutfits > 0 ? totalWears / totalOutfits : 0;
    
    // Find most worn outfit
    const mostWornOutfit = lovedOutfits.length > 0 ? lovedOutfits.reduce((prev, current) => {
      const prevWorn = typeof prev.timesWorn === 'number' ? prev.timesWorn : 0;
      const currentWorn = typeof current.timesWorn === 'number' ? current.timesWorn : 0;
      return (prevWorn > currentWorn) ? prev : current;
    }, lovedOutfits[0]) : null;
    
    const favoriteOutfits = lovedOutfits
      .filter(o => {
        const timesWorn = typeof o.timesWorn === 'number' ? o.timesWorn : 0;
        return timesWorn > 0;
      })
      .sort((a, b) => {
        const aWorn = typeof a.timesWorn === 'number' ? a.timesWorn : 0;
        const bWorn = typeof b.timesWorn === 'number' ? b.timesWorn : 0;
        return bWorn - aWorn;
      })
      .slice(0, 3);
    
    return {
      totalOutfits,
      wornOutfits,
      neverWornOutfits,
      totalWears,
      averageWearsPerOutfit: Math.round(averageWearsPerOutfit * 10) / 10,
      mostWornOutfit: mostWornOutfit && (typeof mostWornOutfit.timesWorn === 'number' ? mostWornOutfit.timesWorn : 0) > 0 ? mostWornOutfit : null,
      favoriteOutfits,
      readyForReSuggestion: getOutfitsReadyForReSuggestion().length,
    };
  }, [lovedOutfits, getOutfitsReadyForReSuggestion]);

  // LAUNDRY MANAGEMENT FUNCTIONS
  
  // Function to update item laundry status
  const updateLaundryStatus = useCallback(async (item: WardrobeItem, newStatus: LaundryStatus, washType?: string, dryingMethod?: string, notes?: string) => {
    try {
      const laundryRecord: LaundryRecord = {
        status: newStatus,
        changedAt: new Date(),
        previousStatus: item.laundryStatus,
        washType: washType as any,
        dryingMethod: dryingMethod as any,
        notes,
      };

      const currentHistory = Array.isArray(item.laundryHistory) ? item.laundryHistory : [];
      const currentTimesWashed = typeof item.timesWashed === 'number' ? item.timesWashed : 0;
      
      const updatedItem = {
        ...item,
        laundryStatus: newStatus,
        laundryHistory: [...currentHistory, laundryRecord],
        lastWashed: newStatus === 'clean' && item.laundryStatus !== 'clean' ? new Date() : item.lastWashed,
        timesWashed: newStatus === 'clean' && item.laundryStatus !== 'clean' ? currentTimesWashed + 1 : currentTimesWashed,
      };

      const updatedItems = savedItems.map(savedItem => 
        savedItem.image === item.image && savedItem.description === item.description 
          ? updatedItem 
          : savedItem
      );
      
      setSavedItems(updatedItems);
      await AsyncStorage.setItem(STORAGE_KEYS.WARDROBE_ITEMS, JSON.stringify(updatedItems));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      return updatedItem;
    } catch (error) {
      console.error('Error updating laundry status:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    }
  }, [savedItems]);

  // Function to automatically mark items as dirty when outfit is worn
  const markOutfitItemsAsDirty = useCallback(async (outfitItems: string[]) => {
    try {
      const itemsToUpdate = savedItems.filter(item => 
        outfitItems.includes(item.image) && item.laundryStatus !== 'dirty'
      );

      if (itemsToUpdate.length === 0) return;

      const updatedItems = savedItems.map(savedItem => {
        if (outfitItems.includes(savedItem.image) && savedItem.laundryStatus !== 'dirty') {
          const laundryRecord: LaundryRecord = {
            status: 'dirty',
            changedAt: new Date(),
            previousStatus: savedItem.laundryStatus || 'clean',
            notes: 'Auto-marked dirty from outfit wear',
          };

          return {
            ...savedItem,
            laundryStatus: 'dirty' as LaundryStatus,
            laundryHistory: [...(savedItem.laundryHistory || []), laundryRecord],
          };
        }
        return savedItem;
      });

      setSavedItems(updatedItems);
      await AsyncStorage.setItem(STORAGE_KEYS.WARDROBE_ITEMS, JSON.stringify(updatedItems));
    } catch (error) {
      console.error('Error marking outfit items as dirty:', error);
    }
  }, [savedItems]);

  // Function to get items by laundry status
  const getItemsByLaundryStatus = useCallback((status: LaundryStatus) => {
    return savedItems.filter(item => (item.laundryStatus || 'clean') === status);
  }, [savedItems]);

  // Function to get laundry analytics
  const getLaundryStats = useCallback(() => {
    const totalItems = savedItems.length;
    const cleanItems = getItemsByLaundryStatus('clean').length;
    const dirtyItems = getItemsByLaundryStatus('dirty').length;
    const inLaundryItems = getItemsByLaundryStatus('in-laundry').length;
    const dryingItems = getItemsByLaundryStatus('drying').length;
    const needsIroningItems = getItemsByLaundryStatus('needs-ironing').length;
    
    const totalWashes = savedItems.reduce((sum, item) => {
      const timesWashed = typeof item.timesWashed === 'number' ? item.timesWashed : 0;
      return sum + timesWashed;
    }, 0);
    
    const averageWashFrequency = totalItems > 0 ? totalWashes / totalItems : 0;
    
    // Find items that need washing soon (based on frequency)
    const needsWashingSoon = savedItems.filter(item => {
      if (item.laundryStatus !== 'clean' || !item.lastWashed || !item.washFrequency) return false;
      
      try {
        const lastWashed = item.lastWashed instanceof Date ? item.lastWashed : new Date(item.lastWashed);
        const daysSinceWash = (new Date().getTime() - lastWashed.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceWash >= (item.washFrequency * 0.8); // 80% of wash frequency
      } catch (error) {
        return false;
      }
    });

    return {
      totalItems,
      cleanItems,
      dirtyItems,
      inLaundryItems,
      dryingItems,
      needsIroningItems,
      totalWashes,
      averageWashFrequency: Math.round(averageWashFrequency * 10) / 10,
      needsWashingSoon: needsWashingSoon.length,
      cleanPercentage: totalItems > 0 ? Math.round((cleanItems / totalItems) * 100) : 0,
    };
  }, [savedItems, getItemsByLaundryStatus]);

  // Function to get smart wash suggestions
  const getSmartWashSuggestions = useCallback(() => {
    const dirtyItems = getItemsByLaundryStatus('dirty');
    
    // Group by wash type recommendations
    const delicateItems = dirtyItems.filter(item => 
      item.needsSpecialCare || 
      item.material?.toLowerCase().includes('silk') ||
      item.material?.toLowerCase().includes('wool') ||
      item.material?.toLowerCase().includes('cashmere')
    );
    
    const regularItems = dirtyItems.filter(item => !delicateItems.includes(item));
    
    return {
      regularLoad: regularItems.length,
      delicateLoad: delicateItems.length,
      canDoFullLoad: dirtyItems.length >= 8,
      suggestions: [
        ...(regularItems.length >= 6 ? ['You have enough items for a regular wash load!'] : []),
        ...(delicateItems.length >= 4 ? ['Consider doing a delicate wash cycle.'] : []),
        ...(dirtyItems.length >= 12 ? ['You have enough for multiple loads - consider sorting by color.'] : []),
      ],
    };
  }, [getItemsByLaundryStatus]);

  // Delete functions
  const deleteWardrobeItem = useCallback(async (itemToDelete: WardrobeItem): Promise<void> => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Remove item from wardrobe
      const updatedItems = savedItems.filter(item => item.image !== itemToDelete.image);
      setSavedItems(updatedItems);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.WARDROBE_ITEMS, JSON.stringify(updatedItems));
      
      // Clean up any outfits that used this item
      const updatedOutfits = lovedOutfits.map(outfit => ({
        ...outfit,
        selectedItems: outfit.selectedItems.filter(itemImage => itemImage !== itemToDelete.image)
      })).filter(outfit => outfit.selectedItems.length > 0); // Remove outfits with no items left
      
      if (updatedOutfits.length !== lovedOutfits.length) {
        setLovedOutfits(updatedOutfits);
        await AsyncStorage.setItem(STORAGE_KEYS.LOVED_OUTFITS, JSON.stringify(updatedOutfits));
      }
      
      console.log('✅ Wardrobe item deleted successfully');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error('❌ Error deleting wardrobe item:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    }
  }, [savedItems, lovedOutfits]);

  const deleteLovedOutfit = useCallback(async (outfitId: string): Promise<void> => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Remove outfit from loved outfits
      const updatedOutfits = lovedOutfits.filter(outfit => outfit.id !== outfitId);
      setLovedOutfits(updatedOutfits);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.LOVED_OUTFITS, JSON.stringify(updatedOutfits));
      
      console.log('✅ Outfit deleted successfully');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error('❌ Error deleting outfit:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    }
  }, [lovedOutfits]);

  const deleteBulkWardrobeItems = useCallback(async (itemsToDelete: WardrobeItem[]): Promise<void> => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      const imagesToDelete = itemsToDelete.map(item => item.image);
      
      // Remove items from wardrobe
      const updatedItems = savedItems.filter(item => !imagesToDelete.includes(item.image));
      setSavedItems(updatedItems);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.WARDROBE_ITEMS, JSON.stringify(updatedItems));
      
      // Clean up any outfits that used these items
      const updatedOutfits = lovedOutfits.map(outfit => ({
        ...outfit,
        selectedItems: outfit.selectedItems.filter(itemImage => !imagesToDelete.includes(itemImage))
      })).filter(outfit => outfit.selectedItems.length > 0);
      
      if (updatedOutfits.length !== lovedOutfits.length) {
        setLovedOutfits(updatedOutfits);
        await AsyncStorage.setItem(STORAGE_KEYS.LOVED_OUTFITS, JSON.stringify(updatedOutfits));
      }
      
      console.log(`✅ ${itemsToDelete.length} wardrobe items deleted successfully`);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error('❌ Error deleting bulk wardrobe items:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    }
  }, [savedItems, lovedOutfits]);

  // WISHLIST MANAGEMENT FUNCTIONS
  
  // Function to add item to wishlist
  const addToWishlist = useCallback(async (item: WishlistItem): Promise<void> => {
    try {
      const updatedWishlist = [...wishlistItems, item];
      setWishlistItems(updatedWishlist);
      await StorageService.saveWishlistItems(updatedWishlist);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('✅ Item added to wishlist:', item.onlineItem.title);
    } catch (error) {
      console.error('❌ Error adding to wishlist:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    }
  }, [wishlistItems]);

  // Function to remove item from wishlist
  const removeFromWishlist = useCallback(async (itemId: string): Promise<void> => {
    try {
      const updatedWishlist = wishlistItems.filter(item => item.id !== itemId);
      setWishlistItems(updatedWishlist);
      await StorageService.saveWishlistItems(updatedWishlist);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('✅ Item removed from wishlist');
    } catch (error) {
      console.error('❌ Error removing from wishlist:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    }
  }, [wishlistItems]);

  // Function to update wishlist item purchase status
  const updateWishlistPurchaseStatus = useCallback(async (
    itemId: string, 
    status: 'saved' | 'purchased' | 'out_of_stock',
    purchaseDate?: Date
  ): Promise<void> => {
    try {
      const updatedWishlist = wishlistItems.map(item => 
        item.id === itemId 
          ? { ...item, purchaseStatus: status, purchaseDate }
          : item
      );
      setWishlistItems(updatedWishlist);
      await StorageService.saveWishlistItems(updatedWishlist);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('❌ Error updating wishlist purchase status:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    }
  }, [wishlistItems]);

  // SUGGESTED ITEMS MANAGEMENT FUNCTIONS
  
  // Function to add suggested item
  const addSuggestedItem = useCallback(async (item: SuggestedItem): Promise<void> => {
    try {
      // Check if item already exists
      const exists = suggestedItems.some(existingItem => existingItem.id === item.id);
      if (exists) {
        console.log('Item already in suggestions:', item.title);
        return;
      }

      const updatedSuggestions = [...suggestedItems, item];
      setSuggestedItems(updatedSuggestions);
      await StorageService.saveSuggestedItems(updatedSuggestions);
      console.log('✅ Suggested item added:', item.title);
    } catch (error) {
      console.error('❌ Error adding suggested item:', error);
      throw error;
    }
  }, [suggestedItems]);

  // Function to remove suggested item
  const removeSuggestedItem = useCallback(async (itemId: string): Promise<void> => {
    try {
      const updatedSuggestions = suggestedItems.filter(item => item.id !== itemId);
      setSuggestedItems(updatedSuggestions);
      await StorageService.saveSuggestedItems(updatedSuggestions);
      console.log('✅ Suggested item removed');
    } catch (error) {
      console.error('❌ Error removing suggested item:', error);
      throw error;
    }
  }, [suggestedItems]);

  // Function to convert suggested item to wishlist item
  const moveToWishlistFromSuggestions = useCallback(async (
    suggestedItem: SuggestedItem,
    wardrobeContext: any
  ): Promise<void> => {
    try {
      // Create wishlist item from suggested item
      const wishlistItem: WishlistItem = {
        id: `wishlist_${suggestedItem.id}_${Date.now()}`,
        onlineItem: {
          id: suggestedItem.id,
          title: suggestedItem.title,
          description: suggestedItem.description,
          imageUrl: suggestedItem.imageUrl,
          price: suggestedItem.price,
          currency: 'USD',
          merchant: {
            id: 'amazon',
            name: 'Amazon',
            logoUrl: '',
            baseUrl: 'https://amazon.com',
            affiliateProgram: true,
            supportedCategories: ['clothing']
          },
          rating: 4.0,
          reviewCount: 100,
          category: suggestedItem.category,
          sizes: [],
          colors: [suggestedItem.color],
          affiliateUrl: suggestedItem.amazonUrl,
          productUrl: suggestedItem.amazonUrl,
        },
        savedAt: new Date(),
        context: wardrobeContext,
        priceHistory: [{
          price: suggestedItem.price,
          currency: 'USD',
          timestamp: new Date(),
          merchant: 'Amazon'
        }],
        purchaseStatus: 'saved',
      };

      // Add to wishlist and remove from suggestions
      await addToWishlist(wishlistItem);
      await removeSuggestedItem(suggestedItem.id);
      
      console.log('✅ Item moved from suggestions to wishlist');
    } catch (error) {
      console.error('❌ Error moving to wishlist:', error);
      throw error;
    }
  }, [addToWishlist, removeSuggestedItem]);

  // Function to clear old suggested items (older than 30 days)
  const clearOldSuggestions = useCallback(async (): Promise<void> => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentSuggestions = suggestedItems.filter(item => {
        // If no creation date, keep it (safety)
        if (!item.id.includes('_')) return true;
        
        try {
          const timestamp = parseInt(item.id.split('_').pop() || '0');
          const createdDate = new Date(timestamp);
          return createdDate > thirtyDaysAgo;
        } catch {
          return true; // Keep if can't parse date
        }
      });

      if (recentSuggestions.length !== suggestedItems.length) {
        setSuggestedItems(recentSuggestions);
        await StorageService.saveSuggestedItems(recentSuggestions);
        console.log(`✅ Cleared ${suggestedItems.length - recentSuggestions.length} old suggestions`);
      }
    } catch (error) {
      console.error('❌ Error clearing old suggestions:', error);
    }
  }, [suggestedItems]);

  return {
    // State
    savedItems,
    setSavedItems,
    lovedOutfits,
    setLovedOutfits,
    wishlistItems,
    setWishlistItems,
    suggestedItems,
    setSuggestedItems,
    profileImage,
    setProfileImage,
    styleDNA,
    setStyleDNA,
    selectedGender,
    setSelectedGender,
    
    // Constants
    AVAILABLE_CATEGORIES,
    STORAGE_KEYS,
    
    // Functions
    loadWardrobeData,
    categorizeItem,
    updateItemCategory,
    saveFieldUpdate,
    toggleOutfitLove,
    getUniqueCategories,
    getItemsByCategory,
    
    // Outfit Memory & Re-Suggestion Functions
    markOutfitAsWorn,
    calculateNextSuggestionDate,
    getOutfitsReadyForReSuggestion,
    getSmartOutfitSuggestions,
    isOutfitSimilarToRecentlyWorn,
    getOutfitWearStats,
    
    // Laundry Management Functions
    updateLaundryStatus,
    markOutfitItemsAsDirty,
    getItemsByLaundryStatus,
    getLaundryStats,
    getSmartWashSuggestions,
    
    // Delete Functions
    deleteWardrobeItem,
    deleteLovedOutfit,
    deleteBulkWardrobeItems,
    
    // Wishlist Management Functions
    addToWishlist,
    removeFromWishlist,
    updateWishlistPurchaseStatus,
    moveToWishlistFromSuggestions,
    
    // Suggested Items Management Functions
    addSuggestedItem,
    removeSuggestedItem,
    clearOldSuggestions,
  };
};