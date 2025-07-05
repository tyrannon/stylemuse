import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import { WardrobeItem, LovedOutfit } from '../hooks/useWardrobeData';
import { EnhancedStyleDNA } from '../types/Avatar';
import { WishlistItem } from '../types/StyleAdvice';
import { SuggestedItem } from '../services/SmartSuggestionsService';
import { ensureDateObject } from '../utils/dateUtils';

export class StorageService {
  // Wardrobe items
  static async saveWardrobeItems(items: WardrobeItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WARDROBE_ITEMS, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving wardrobe items:', error);
      throw error;
    }
  }

  static async loadWardrobeItems(): Promise<WardrobeItem[]> {
    try {
      const itemsJson = await AsyncStorage.getItem(STORAGE_KEYS.WARDROBE_ITEMS);
      return itemsJson ? JSON.parse(itemsJson) : [];
    } catch (error) {
      console.error('Error loading wardrobe items:', error);
      return [];
    }
  }

  // Loved outfits
  static async saveLovedOutfits(outfits: LovedOutfit[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LOVED_OUTFITS, JSON.stringify(outfits));
    } catch (error) {
      console.error('Error saving loved outfits:', error);
      throw error;
    }
  }

  static async loadLovedOutfits(): Promise<LovedOutfit[]> {
    try {
      const outfitsJson = await AsyncStorage.getItem(STORAGE_KEYS.LOVED_OUTFITS);
      if (!outfitsJson) return [];
      
      const rawOutfits = JSON.parse(outfitsJson);
      return rawOutfits.map((outfit: any) => ({
        ...outfit,
        createdAt: ensureDateObject(outfit.createdAt) || new Date(),
        lastWorn: ensureDateObject(outfit.lastWorn),
        nextSuggestedDate: ensureDateObject(outfit.nextSuggestedDate),
        wearHistory: outfit.wearHistory ? outfit.wearHistory.map((record: any) => ({
          ...record,
          wornAt: ensureDateObject(record.wornAt) || new Date()
        })) : [],
      }));
    } catch (error) {
      console.error('Error loading loved outfits:', error);
      return [];
    }
  }

  // Style DNA
  static async saveStyleDNA(dna: EnhancedStyleDNA): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STYLE_DNA, JSON.stringify(dna));
    } catch (error) {
      console.error('Error saving style DNA:', error);
      throw error;
    }
  }

  static async loadStyleDNA(): Promise<EnhancedStyleDNA | null> {
    try {
      const dnaJson = await AsyncStorage.getItem(STORAGE_KEYS.STYLE_DNA);
      return dnaJson ? JSON.parse(dnaJson) : null;
    } catch (error) {
      console.error('Error loading style DNA:', error);
      return null;
    }
  }

  // Selected gender
  static async saveSelectedGender(gender: string | null): Promise<void> {
    try {
      if (gender) {
        await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_GENDER, gender);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_GENDER);
      }
    } catch (error) {
      console.error('Error saving selected gender:', error);
      throw error;
    }
  }

  static async loadSelectedGender(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_GENDER);
    } catch (error) {
      console.error('Error loading selected gender:', error);
      return null;
    }
  }

  // Profile image
  static async saveProfileImage(imageUri: string | null): Promise<void> {
    try {
      if (imageUri) {
        await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_IMAGE, imageUri);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE_IMAGE);
      }
    } catch (error) {
      console.error('Error saving profile image:', error);
      throw error;
    }
  }

  static async loadProfileImage(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE);
    } catch (error) {
      console.error('Error loading profile image:', error);
      return null;
    }
  }

  // Wishlist items
  static async saveWishlistItems(items: WishlistItem[]): Promise<void> {
    try {
      console.log('💖 Saving', items.length, 'wishlist items to storage');
      await AsyncStorage.setItem(STORAGE_KEYS.WISHLIST_ITEMS, JSON.stringify(items));
      console.log('💖 Successfully saved wishlist items to storage');
    } catch (error) {
      console.error('❌ Error saving wishlist items:', error);
      throw error;
    }
  }

  static async loadWishlistItems(): Promise<WishlistItem[]> {
    try {
      const itemsJson = await AsyncStorage.getItem(STORAGE_KEYS.WISHLIST_ITEMS);
      console.log('💖 Loading wishlist items from storage:', itemsJson ? 'found data' : 'no data found');
      
      if (!itemsJson) {
        console.log('💖 No wishlist items found in storage');
        return [];
      }
      
      const rawItems = JSON.parse(itemsJson);
      console.log('💖 Loaded', rawItems.length, 'wishlist items from storage');
      
      return rawItems.map((item: any) => ({
        ...item,
        savedAt: ensureDateObject(item.savedAt) || new Date(),
        purchaseDate: ensureDateObject(item.purchaseDate),
        priceHistory: item.priceHistory ? item.priceHistory.map((point: any) => ({
          ...point,
          timestamp: ensureDateObject(point.timestamp) || new Date()
        })) : [],
      }));
    } catch (error) {
      console.error('❌ Error loading wishlist items:', error);
      return [];
    }
  }

  // Suggested items
  static async saveSuggestedItems(items: SuggestedItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SUGGESTED_ITEMS, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving suggested items:', error);
      throw error;
    }
  }

  static async loadSuggestedItems(): Promise<SuggestedItem[]> {
    try {
      const itemsJson = await AsyncStorage.getItem(STORAGE_KEYS.SUGGESTED_ITEMS);
      return itemsJson ? JSON.parse(itemsJson) : [];
    } catch (error) {
      console.error('Error loading suggested items:', error);
      return [];
    }
  }

  // Generic methods for other storage needs
  static async setItem(key: string, value: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving item with key ${key}:`, error);
      throw error;
    }
  }

  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error loading item with key ${key}:`, error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item with key ${key}:`, error);
      throw error;
    }
  }
}