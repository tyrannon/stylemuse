import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './DebugLogger';
import { LogCategories } from '../constants/LogCategories';

export class DataDebugger {
  static async logAllStorageKeys() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('=== ALL STORAGE KEYS ===');
      
      for (const key of allKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          let parsedValue;
          
          try {
            parsedValue = JSON.parse(value || '');
          } catch (e) {
            parsedValue = value;
          }
          
          console.log(`${key}:`, typeof parsedValue, Array.isArray(parsedValue) ? `Array(${parsedValue.length})` : parsedValue);
        } catch (error) {
          console.log(`${key}: ERROR reading`, error.message);
        }
      }
      
      console.log('=== END STORAGE KEYS ===');
    } catch (error) {
      console.error('Failed to debug storage:', error);
    }
  }

  static async checkUserDataStatus() {
    try {
      const [savedItems, lovedOutfits, profileImage, styleDNA, onboardingCompleted] = await Promise.all([
        AsyncStorage.getItem('savedItems'),
        AsyncStorage.getItem('lovedOutfits'),
        AsyncStorage.getItem('profileImage'),
        AsyncStorage.getItem('styleDNA'),
        AsyncStorage.getItem('onboardingCompleted')
      ]);

      const status = {
        savedItems: savedItems ? JSON.parse(savedItems) : null,
        lovedOutfits: lovedOutfits ? JSON.parse(lovedOutfits) : null,
        profileImage: !!profileImage,
        styleDNA: !!styleDNA,
        onboardingCompleted: onboardingCompleted === 'true'
      };

      console.log('=== USER DATA STATUS ===');
      console.log('Saved Items:', Array.isArray(status.savedItems) ? `${status.savedItems.length} items` : 'none');
      console.log('Loved Outfits:', Array.isArray(status.lovedOutfits) ? `${status.lovedOutfits.length} outfits` : 'none');
      console.log('Profile Image:', status.profileImage ? 'exists' : 'none');
      console.log('Style DNA:', status.styleDNA ? 'exists' : 'none');
      console.log('Onboarding Completed:', status.onboardingCompleted);
      
      const isExistingUser = (
        (Array.isArray(status.savedItems) && status.savedItems.length > 0) ||
        (Array.isArray(status.lovedOutfits) && status.lovedOutfits.length > 0) ||
        status.profileImage ||
        status.styleDNA
      );
      
      console.log('Should be existing user:', isExistingUser);
      console.log('=== END USER DATA STATUS ===');
      
      return status;
    } catch (error) {
      console.error('Failed to check user data status:', error);
      return null;
    }
  }
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).DataDebugger = DataDebugger;
}