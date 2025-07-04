import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Platform, Alert } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { removeBackgroundEnhanced, BackgroundRemovalResult, cleanupBackgroundRemovalFiles } from '../utils/backgroundRemoval';
import { assessPhotoQuality as comprehensivePhotoQualityAssessment, PhotoQualityMetrics, quickQualityCheck } from '../utils/photoQualityAssessment';

interface PhotoMetadata {
  originalUri: string;
  editedUri?: string;
  captureTimestamp: Date;
  editTimestamp?: Date;
  cameraSettings: any;
  editHistory: any[];
  aiAnalysisReady: boolean;
  qualityMetrics?: PhotoQualityMetrics;
}

export const useCameraIntegration = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const capturePhoto = async (cameraRef: any, options: any = {}) => {
    if (!cameraRef?.current) {
      throw new Error('Camera not ready');
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: true,
        exif: true,
        ...options,
      });

      return photo;
    } catch (error) {
      console.error('Photo capture failed:', error);
      throw error;
    }
  };

  const processForAI = async (photoUri: string, mode: 'wardrobe' | 'profile' | 'outfit'): Promise<string> => {
    setIsProcessing(true);
    
    try {
      // Create optimized version for AI analysis
      const processedPhoto = await manipulateAsync(
        photoUri,
        [
          { resize: { width: 1024 } }, // Resize for AI processing
        ],
        {
          compress: 0.8,
          format: SaveFormat.JPEG,
        }
      );

      // Enhanced processing for clothing items with background removal
      if (mode === 'wardrobe') {
        console.log('🎯 Processing wardrobe item with background removal...');
        const enhancedPhoto = await enhanceForClothing(processedPhoto.uri);
        return enhancedPhoto;
      }

      return processedPhoto.uri;
    } catch (error) {
      console.error('Photo processing failed:', error);
      // Return original if processing fails
      return photoUri;
    } finally {
      setIsProcessing(false);
    }
  };

  const enhanceForClothing = async (photoUri: string): Promise<string> => {
    try {
      console.log('🎨 Enhancing image for clothing analysis...');
      
      // Step 1: Apply basic image optimizations
      const basicEnhanced = await manipulateAsync(
        photoUri,
        [
          // Optimize for clothing photography
          { resize: { width: 1024 } }, // Ensure optimal size for background removal
        ],
        {
          compress: 0.9,
          format: SaveFormat.JPEG,
        }
      );

      // Step 2: Remove background for better clothing isolation
      console.log('🔄 Attempting background removal for clothing item...');
      const bgRemovalResult: BackgroundRemovalResult = await removeBackgroundEnhanced(
        basicEnhanced.uri,
        {
          type: 'product', // Optimized for clothing items
          size: 'auto',
          semitransparency: true, // Better for clothing edges
          crop: false, // Keep full item visible
          format: 'png', // Preserve transparency
        }
      );

      if (bgRemovalResult.success && bgRemovalResult.processedImageUri) {
        console.log('✅ Background removal successful - using processed image');
        return bgRemovalResult.processedImageUri;
      } else {
        console.warn('⚠️ Background removal failed, using original enhanced image');
        console.warn('Background removal error:', bgRemovalResult.error);
        return basicEnhanced.uri;
      }

    } catch (error) {
      console.error('❌ Clothing enhancement failed:', error);
      return photoUri;
    }
  };

  const saveToGallery = async (photoUri: string): Promise<boolean> => {
    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to save photos to your gallery.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(photoUri);
      
      // Create album for StyleMuse photos (iOS only)
      if (Platform.OS === 'ios') {
        try {
          const albums = await MediaLibrary.getAlbumsAsync();
          const styleMuseAlbum = albums.find(album => album.title === 'StyleMuse');
          
          if (styleMuseAlbum) {
            await MediaLibrary.addAssetsToAlbumAsync([photoUri], styleMuseAlbum.id, false);
          } else {
            await MediaLibrary.createAlbumAsync('StyleMuse', photoUri, false);
          }
        } catch (error) {
          console.warn('Failed to create album:', error);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to save to gallery:', error);
      Alert.alert('Error', 'Failed to save photo to gallery.');
      return false;
    }
  };

  const savePhotoMetadata = async (metadata: PhotoMetadata): Promise<void> => {
    try {
      const metadataPath = `${FileSystem.documentDirectory}photo_metadata.json`;
      
      // Load existing metadata
      let existingMetadata: PhotoMetadata[] = [];
      try {
        const existingData = await FileSystem.readAsStringAsync(metadataPath);
        existingMetadata = JSON.parse(existingData);
      } catch (error) {
        // File doesn't exist or is invalid, start with empty array
      }

      // Add new metadata
      existingMetadata.push(metadata);

      // Save updated metadata
      await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(existingMetadata));
    } catch (error) {
      console.error('Failed to save photo metadata:', error);
    }
  };

  const getPhotoMetadata = async (): Promise<PhotoMetadata[]> => {
    try {
      const metadataPath = `${FileSystem.documentDirectory}photo_metadata.json`;
      const data = await FileSystem.readAsStringAsync(metadataPath);
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load photo metadata:', error);
      return [];
    }
  };

  const cleanupTempFiles = async (): Promise<void> => {
    try {
      const tempDir = `${FileSystem.cacheDirectory}camera/`;
      const tempFiles = await FileSystem.readDirectoryAsync(tempDir);
      
      // Remove files older than 24 hours
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      for (const file of tempFiles) {
        const filePath = `${tempDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (fileInfo.exists && fileInfo.modificationTime && fileInfo.modificationTime < oneDayAgo) {
          await FileSystem.deleteAsync(filePath);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup temp files:', error);
    }
  };

  const assessPhotoQuality = async (photoUri: string, mode: 'wardrobe' | 'profile' | 'outfit' = 'wardrobe'): Promise<PhotoQualityMetrics> => {
    try {
      console.log('📊 Assessing photo quality...');
      
      // Use comprehensive photo quality assessment
      const qualityMetrics = await comprehensivePhotoQualityAssessment(photoUri, { 
        mode,
        strictMode: true,
        minimumScore: 0.6
      });
      
      console.log('✅ Photo quality assessment completed:', {
        overall: Math.round(qualityMetrics.overall * 100) + '%',
        issues: qualityMetrics.issues.length,
        multipleItems: qualityMetrics.multipleItems
      });
      
      return qualityMetrics;
    } catch (error) {
      console.error('❌ Photo quality assessment failed:', error);
      
      // Return default metrics on error
      return {
        overall: 0.5,
        brightness: 0.5,
        contrast: 0.5,
        sharpness: 0.5,
        composition: 0.5,
        multipleItems: false,
        issues: ['Assessment failed'],
        recommendations: ['Please try taking a new photo'],
      };
    }
  };

  return {
    capturePhoto,
    processForAI,
    saveToGallery,
    savePhotoMetadata,
    getPhotoMetadata,
    cleanupTempFiles,
    assessPhotoQuality,
    quickQualityCheck,
    isProcessing,
    cleanupBackgroundRemovalFiles,
  };
}; 