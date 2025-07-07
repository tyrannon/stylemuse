import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { WardrobeItem } from './useWardrobeData';
import { generateClothingItemImage } from '../utils/openai';
import { ImagePersistenceService } from '../services/ImagePersistenceService';

export interface ImageHandlingState {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  bulkUploading: boolean;
  setBulkUploading: (uploading: boolean) => void;
  bulkProgress: { current: number; total: number };
  setBulkProgress: (progress: { current: number; total: number }) => void;
  generatingImageForItem: string | null;
  setGeneratingImageForItem: (item: string | null) => void;
  pickImage: () => Promise<string | null>;
  takePhoto: () => Promise<string | null>;
  pickMultipleImages: () => Promise<string[]>;
  generateImageForItem: (item: WardrobeItem) => Promise<string | null>;
  downloadImage: (imageUrl: string) => Promise<string | null>;
  openCamera: () => Promise<string | null>;
  handleGenerateItemImage: (item: WardrobeItem) => Promise<string | null>;
  downloadAndSaveImage: (imageUrl: string, itemId: string) => Promise<string | null>;
}

export const useImageHandling = (): ImageHandlingState => {
  const [loading, setLoading] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [generatingImageForItem, setGeneratingImageForItem] = useState<string | null>(null);
  
  const imagePersistence = ImagePersistenceService.getInstance();

  // Pick a single image from the library
  const pickImage = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need camera roll permissions to select photos.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      try {
        // Persist the image to permanent storage
        const persistentImage = await imagePersistence.persistImage(result.assets[0].uri, 'wardrobe');
        return persistentImage.originalUri;
      } catch (error) {
        console.error('Failed to persist image:', error);
        // Fallback to original URI
        return result.assets[0].uri;
      }
    }
    return null;
  };

  // Pick multiple images from the library
  const pickMultipleImages = async (): Promise<string[]> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need camera roll permissions to select photos.');
      return [];
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const persistentUris: string[] = [];
      
      for (const asset of result.assets) {
        try {
          // Persist each image to permanent storage
          const persistentImage = await imagePersistence.persistImage(asset.uri, 'wardrobe');
          persistentUris.push(persistentImage.originalUri);
        } catch (error) {
          console.error('Failed to persist image:', error);
          // Fallback to original URI
          persistentUris.push(asset.uri);
        }
      }
      
      return persistentUris;
    }
    return [];
  };

  // Open camera to take a photo
  const openCamera = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need camera permissions to take photos.');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      try {
        // Persist the image to permanent storage
        const persistentImage = await imagePersistence.persistImage(result.assets[0].uri, 'wardrobe');
        return persistentImage.originalUri;
      } catch (error) {
        console.error('Failed to persist image:', error);
        // Fallback to original URI
        return result.assets[0].uri;
      }
    }
    return null;
  };

  // Download and save image to device storage
  const downloadAndSaveImage = async (imageUrl: string, itemId: string): Promise<string | null> => {
    try {
      const fileName = `generated_item_${itemId.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
      const tempFileUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      console.log('⬇️ Downloading generated image to:', tempFileUri);
      
      const downloadResult = await FileSystem.downloadAsync(imageUrl, tempFileUri);
      
      if (downloadResult.status === 200) {
        try {
          // Persist the downloaded image to permanent storage
          const persistentImage = await imagePersistence.persistImage(tempFileUri, 'wardrobe', itemId);
          console.log('✅ Image downloaded and persisted:', persistentImage.originalUri);
          return persistentImage.originalUri;
        } catch (error) {
          console.error('Failed to persist downloaded image:', error);
          // Fallback to temp file
          return tempFileUri;
        }
      } else {
        console.error('❌ Failed to download image:', downloadResult.status);
        return null;
      }
    } catch (error) {
      console.error('Error downloading and saving image:', error);
      return null;
    }
  };

  // Generate image for clothing item
  const handleGenerateItemImage = async (item: WardrobeItem): Promise<string | null> => {
    if (generatingImageForItem === item.image) return null;
    
    setGeneratingImageForItem(item.image);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log('🎨 Generating image for item:', item.title || item.description);
      
      // Create unique identifier for this specific item
      const uniqueId = `${item.title || item.description}_${item.category}_${item.color}_${Date.now()}`;
      
      const imageUrl = await generateClothingItemImage({
        description: item.description || item.title || 'clothing item',
        color: item.color,
        material: item.material,
        style: item.style,
        category: item.category
      });
      
      if (imageUrl) {
        // Download and save the image to device storage
        const savedImagePath = await downloadAndSaveImage(imageUrl, uniqueId);
        const finalImagePath = savedImagePath || imageUrl;
        
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log('✅ Image generated and saved successfully');
        return finalImagePath;
      } else {
        Alert.alert('Generation Failed', 'Unable to generate image. Please try again.');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return null;
      }
    } catch (error) {
      console.error('Error generating image:', error);
      Alert.alert('Error', 'Failed to generate image. Please check your connection and try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return null;
    } finally {
      setGeneratingImageForItem(null);
    }
  };

  return {
    // State
    loading,
    setLoading,
    bulkUploading,
    setBulkUploading,
    bulkProgress,
    setBulkProgress,
    generatingImageForItem,
    setGeneratingImageForItem,
    
    // Functions
    pickImage,
    takePhoto: openCamera, // Alias for backwards compatibility
    pickMultipleImages,
    openCamera,
    downloadAndSaveImage,
    handleGenerateItemImage,
    generateImageForItem: handleGenerateItemImage, // Alias for backwards compatibility
    downloadImage: downloadAndSaveImage, // Alias for backwards compatibility
  };
};