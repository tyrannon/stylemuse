import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// Storage keys for AsyncStorage
const STORAGE_KEYS = {
  WARDROBE_ITEMS: 'stylemuse_wardrobe_items',
  LOVED_OUTFITS: 'stylemuse_loved_outfits',
  STYLE_DNA: 'stylemuse_style_dna',
  SELECTED_GENDER: 'stylemuse_selected_gender',
  PROFILE_IMAGE: 'stylemuse_profile_image',
};

// Type definitions
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
}

export const useWardrobeData = () => {
  // Wardrobe items state
  const [savedItems, setSavedItems] = useState<WardrobeItem[]>([]);
  
  // Outfit state
  const [lovedOutfits, setLovedOutfits] = useState<LovedOutfit[]>([]);
  
  // Profile state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [styleDNA, setStyleDNA] = useState<any | null>(null);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'nonbinary' | null>(null);

  // Available categories for dropdown
  const AVAILABLE_CATEGORIES = ['top', 'bottom', 'shoes', 'jacket', 'hat', 'accessories'];

  // Load data from AsyncStorage on mount
  useEffect(() => {
    loadWardrobeData();
  }, []);

  const loadWardrobeData = async () => {
    try {
      const [items, outfits, dna, gender, profile] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.WARDROBE_ITEMS),
        AsyncStorage.getItem(STORAGE_KEYS.LOVED_OUTFITS),
        AsyncStorage.getItem(STORAGE_KEYS.STYLE_DNA),
        AsyncStorage.getItem(STORAGE_KEYS.SELECTED_GENDER),
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE),
      ]);

      if (items) setSavedItems(JSON.parse(items));
      if (outfits) {
        const parsedOutfits = JSON.parse(outfits).map((outfit: any) => ({
          ...outfit,
          createdAt: new Date(outfit.createdAt)
        }));
        setLovedOutfits(parsedOutfits);
      }
      if (dna) setStyleDNA(JSON.parse(dna));
      if (gender) setSelectedGender(gender as any);
      if (profile) setProfileImage(profile);
    } catch (error) {
      console.error('Error loading wardrobe data:', error);
    }
  };

  // Function to automatically categorize clothing items
  const categorizeItem = (item: WardrobeItem): string => {
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
  };

  // Function to update item category
  const updateItemCategory = async (item: WardrobeItem, newCategory: string) => {
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
  };

  // Function to save field updates
  const saveFieldUpdate = async (item: WardrobeItem, field: string, value: string | string[]) => {
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
  };

  // Function to toggle outfit love status
  const toggleOutfitLove = async (outfitId: string) => {
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
  };

  // Function to get unique categories from wardrobe
  const getUniqueCategories = () => {
    const categories = savedItems.map(item => categorizeItem(item));
    return ['all', ...Array.from(new Set(categories))];
  };

  // Function to get items filtered by category
  const getItemsByCategory = (category: string) => {
    return savedItems.filter(item => {
      const itemCategory = categorizeItem(item);
      return itemCategory === category;
    });
  };

  return {
    // State
    savedItems,
    setSavedItems,
    lovedOutfits,
    setLovedOutfits,
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
  };
};