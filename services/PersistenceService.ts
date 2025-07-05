import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import { WardrobeItem, LovedOutfit } from '../hooks/useWardrobeData';
import { EnhancedStyleDNA } from '../types/Avatar';
import { WishlistItem } from '../types/StyleAdvice';
import { SuggestedItem } from '../services/SmartSuggestionsService';
import { STORAGE_KEYS } from '../constants/storage';

export interface StyleMuseBackup {
  version: string;
  timestamp: string;
  data: {
    wardrobeItems: WardrobeItem[];
    lovedOutfits: LovedOutfit[];
    styleDNA: EnhancedStyleDNA | null;
    profileImage: string | null;
    selectedGender: 'male' | 'female' | 'nonbinary' | null;
    wishlistItems: WishlistItem[];
    suggestedItems: SuggestedItem[];
  };
}

export class PersistenceService {
  private static readonly BACKUP_FILENAME = 'stylemuse-backup.json';
  private static readonly BACKUP_VERSION = '1.0.0';

  /**
   * 🔥 ULTIMATE BACKUP: Create complete app data backup
   */
  static async createFullBackup(): Promise<StyleMuseBackup> {
    try {
      console.log('📦 Creating full StyleMuse backup...');

      // Gather all data from AsyncStorage
      const [
        wardrobeItems,
        lovedOutfits,
        styleDNA,
        profileImage,
        selectedGender,
        wishlistItems,
        suggestedItems
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.WARDROBE_ITEMS).then(data => data ? JSON.parse(data) : []),
        AsyncStorage.getItem(STORAGE_KEYS.LOVED_OUTFITS).then(data => data ? JSON.parse(data) : []),
        AsyncStorage.getItem(STORAGE_KEYS.STYLE_DNA).then(data => data ? JSON.parse(data) : null),
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE).then(data => data || null),
        AsyncStorage.getItem(STORAGE_KEYS.SELECTED_GENDER).then(data => data || null),
        AsyncStorage.getItem(STORAGE_KEYS.WISHLIST_ITEMS).then(data => data ? JSON.parse(data) : []),
        AsyncStorage.getItem(STORAGE_KEYS.SUGGESTED_ITEMS).then(data => data ? JSON.parse(data) : [])
      ]);

      const backup: StyleMuseBackup = {
        version: this.BACKUP_VERSION,
        timestamp: new Date().toISOString(),
        data: {
          wardrobeItems,
          lovedOutfits,
          styleDNA,
          profileImage,
          selectedGender,
          wishlistItems,
          suggestedItems
        }
      };

      console.log('✅ Full backup created successfully');
      console.log(`📊 Backup stats: ${wardrobeItems.length} wardrobe items, ${lovedOutfits.length} outfits`);
      
      return backup;
    } catch (error) {
      console.error('❌ Error creating full backup:', error);
      throw new Error('Failed to create backup');
    }
  }

  /**
   * 💾 SAVE TO PERSISTENT STORAGE: Platform-specific persistent storage
   */
  static async saveBackupToPersistentStorage(backup: StyleMuseBackup): Promise<string> {
    try {
      const backupJson = JSON.stringify(backup, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `stylemuse-backup-${timestamp}.json`;

      if (Platform.OS === 'ios') {
        // iOS: Save to Documents directory (iCloud synced if enabled)
        const documentsDir = FileSystem.documentDirectory;
        const filePath = `${documentsDir}${filename}`;
        
        await FileSystem.writeAsStringAsync(filePath, backupJson);
        console.log('📱 iOS: Backup saved to Documents directory (iCloud sync enabled)');
        return filePath;
        
      } else if (Platform.OS === 'android') {
        // Android: Save to external storage (survives app updates)
        const downloadsDir = FileSystem.documentDirectory;
        const filePath = `${downloadsDir}${filename}`;
        
        await FileSystem.writeAsStringAsync(filePath, backupJson);
        console.log('🤖 Android: Backup saved to app documents directory');
        return filePath;
      }
      
      throw new Error('Unsupported platform');
    } catch (error) {
      console.error('❌ Error saving backup to persistent storage:', error);
      throw new Error('Failed to save backup to persistent storage');
    }
  }

  /**
   * 🚀 EXPORT BACKUP: Let user save backup file anywhere
   */
  static async exportBackup(): Promise<void> {
    try {
      console.log('📤 Starting backup export...');
      
      // Create backup
      const backup = await this.createFullBackup();
      
      // Save to persistent storage
      const filePath = await this.saveBackupToPersistentStorage(backup);
      
      Alert.alert(
        '🎉 Backup Complete!',
        `Your StyleMuse data has been backed up successfully!\n\nLocation: ${filePath}\n\nThis backup includes all your wardrobe items, outfits, and preferences.`,
        [{ text: 'Great!' }]
      );

      return;
    } catch (error) {
      console.error('❌ Export backup failed:', error);
      Alert.alert(
        '😔 Backup Failed',
        'Sorry, we couldn\'t create your backup. Please try again or contact support if the issue persists.',
        [{ text: 'OK' }]
      );
      throw error;
    }
  }

  /**
   * 📁 IMPORT BACKUP: Restore from backup file
   */
  static async importBackup(): Promise<void> {
    try {
      console.log('📥 Starting backup import...');

      // Let user pick a backup file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        console.log('📄 User canceled file selection');
        return;
      }

      const asset = result.assets[0];
      console.log('📄 Selected file:', asset.name);

      // Read the backup file
      const backupContent = await FileSystem.readAsStringAsync(asset.uri);
      const backup: StyleMuseBackup = JSON.parse(backupContent);

      // Validate backup structure
      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup file format');
      }

      // Show confirmation dialog
      Alert.alert(
        '⚠️ Restore Backup?',
        `This will replace all your current StyleMuse data with the backup from ${new Date(backup.timestamp).toLocaleDateString()}.\n\nThis action cannot be undone!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Restore', 
            style: 'destructive',
            onPress: () => this.restoreBackupData(backup)
          }
        ]
      );

    } catch (error) {
      console.error('❌ Import backup failed:', error);
      Alert.alert(
        '😔 Import Failed',
        'Sorry, we couldn\'t restore your backup. Please check that the file is a valid StyleMuse backup.',
        [{ text: 'OK' }]
      );
      throw error;
    }
  }

  /**
   * 🔄 RESTORE BACKUP DATA: Apply backup to current app
   */
  private static async restoreBackupData(backup: StyleMuseBackup): Promise<void> {
    try {
      console.log('🔄 Restoring backup data...');

      // Restore all data to AsyncStorage
      const promises = [
        AsyncStorage.setItem(STORAGE_KEYS.WARDROBE_ITEMS, JSON.stringify(backup.data.wardrobeItems || [])),
        AsyncStorage.setItem(STORAGE_KEYS.LOVED_OUTFITS, JSON.stringify(backup.data.lovedOutfits || [])),
        AsyncStorage.setItem(STORAGE_KEYS.STYLE_DNA, JSON.stringify(backup.data.styleDNA)),
        AsyncStorage.setItem(STORAGE_KEYS.WISHLIST_ITEMS, JSON.stringify(backup.data.wishlistItems || [])),
        AsyncStorage.setItem(STORAGE_KEYS.SUGGESTED_ITEMS, JSON.stringify(backup.data.suggestedItems || []))
      ];

      if (backup.data.profileImage) {
        promises.push(AsyncStorage.setItem(STORAGE_KEYS.PROFILE_IMAGE, backup.data.profileImage));
      }

      if (backup.data.selectedGender) {
        promises.push(AsyncStorage.setItem(STORAGE_KEYS.SELECTED_GENDER, backup.data.selectedGender));
      }

      await Promise.all(promises);

      console.log('✅ Backup restored successfully');
      
      Alert.alert(
        '🎉 Restore Complete!',
        `Your StyleMuse data has been restored successfully!\n\nRestored: ${backup.data.wardrobeItems?.length || 0} wardrobe items, ${backup.data.lovedOutfits?.length || 0} outfits\n\nPlease restart the app to see all your restored data.`,
        [{ text: 'Great!' }]
      );

    } catch (error) {
      console.error('❌ Error restoring backup data:', error);
      throw new Error('Failed to restore backup data');
    }
  }

  /**
   * 🔍 AUTO BACKUP: Automatically create backups periodically
   */
  static async autoBackup(): Promise<void> {
    try {
      // Check when last backup was created
      const lastBackup = await AsyncStorage.getItem('last_auto_backup');
      const now = Date.now();
      const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      if (!lastBackup || (now - parseInt(lastBackup)) > oneWeek) {
        console.log('⏰ Creating automatic weekly backup...');
        
        const backup = await this.createFullBackup();
        await this.saveBackupToPersistentStorage(backup);
        await AsyncStorage.setItem('last_auto_backup', now.toString());
        
        console.log('✅ Automatic backup created successfully');
      }
    } catch (error) {
      console.error('❌ Auto backup failed:', error);
      // Don't throw - auto backup failures shouldn't break the app
    }
  }

  /**
   * 📋 GET BACKUP INFO: Show backup status to user
   */
  static async getBackupInfo(): Promise<{
    hasLocalBackup: boolean;
    lastBackupDate: Date | null;
    backupSize: string;
  }> {
    try {
      const lastBackup = await AsyncStorage.getItem('last_auto_backup');
      
      // Try to get backup file info
      let backupSize = '0 KB';
      let hasLocalBackup = false;

      // Count items for size estimation
      const wardrobeItems = await AsyncStorage.getItem(STORAGE_KEYS.WARDROBE_ITEMS);
      const lovedOutfits = await AsyncStorage.getItem(STORAGE_KEYS.LOVED_OUTFITS);
      
      const itemCount = (wardrobeItems ? JSON.parse(wardrobeItems).length : 0) + 
                       (lovedOutfits ? JSON.parse(lovedOutfits).length : 0);
      
      backupSize = `~${Math.max(1, Math.ceil(itemCount / 10))} KB`;
      hasLocalBackup = itemCount > 0;

      return {
        hasLocalBackup,
        lastBackupDate: lastBackup ? new Date(parseInt(lastBackup)) : null,
        backupSize
      };
    } catch (error) {
      console.error('❌ Error getting backup info:', error);
      return {
        hasLocalBackup: false,
        lastBackupDate: null,
        backupSize: '0 KB'
      };
    }
  }
}