import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import { WardrobeItem, LovedOutfit } from '../hooks/useWardrobeData';
import { EnhancedStyleDNA } from '../types/Avatar';
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