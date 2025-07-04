import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

const REMOVEBG_API_KEY = Constants.expoConfig?.extra?.removeBgApiKey;

export interface BackgroundRemovalOptions {
  size?: 'auto' | 'preview' | 'full';
  type?: 'auto' | 'person' | 'product' | 'animal' | 'car' | 'other';
  type_level?: '1' | '2' | 'latest';
  format?: 'auto' | 'png' | 'jpg' | 'zip';
  roi?: string; // Region of interest
  crop?: boolean;
  crop_margin?: string;
  scale?: string;
  position?: string;
  channels?: 'rgba' | 'alpha';
  add_shadow?: boolean;
  semitransparency?: boolean;
  bg_color?: string;
  bg_image_file?: string;
}

export interface BackgroundRemovalResult {
  success: boolean;
  processedImageUri?: string;
  error?: string;
  originalSize?: number;
  processedSize?: number;
  creditsUsed?: number;
}

/**
 * Remove background from image using Remove.bg API
 * Optimized for clothing items and product photography
 */
export async function removeBackground(
  imageUri: string,
  options: BackgroundRemovalOptions = {}
): Promise<BackgroundRemovalResult> {
  if (!REMOVEBG_API_KEY) {
    console.warn('⚠️ Remove.bg API key not found - skipping background removal');
    return {
      success: false,
      error: 'Remove.bg API key not configured',
    };
  }

  try {
    console.log('🎨 Starting background removal process...');
    
    // Default options optimized for clothing items
    const defaultOptions: BackgroundRemovalOptions = {
      size: 'auto',
      type: 'product', // Optimized for clothing/products
      format: 'png',
      crop: false,
      channels: 'rgba',
      semitransparency: true, // Better for clothing edges
      ...options,
    };

    // Read image as base64
    const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Prepare form data
    const formData = new FormData();
    formData.append('image_file_b64', imageBase64);
    formData.append('size', defaultOptions.size!);
    formData.append('type', defaultOptions.type!);
    formData.append('format', defaultOptions.format!);
    formData.append('crop', defaultOptions.crop!.toString());
    formData.append('channels', defaultOptions.channels!);
    formData.append('semitransparency', defaultOptions.semitransparency!.toString());

    // Add optional parameters
    if (defaultOptions.type_level) {
      formData.append('type_level', defaultOptions.type_level);
    }
    if (defaultOptions.roi) {
      formData.append('roi', defaultOptions.roi);
    }
    if (defaultOptions.crop_margin) {
      formData.append('crop_margin', defaultOptions.crop_margin);
    }
    if (defaultOptions.scale) {
      formData.append('scale', defaultOptions.scale);
    }
    if (defaultOptions.position) {
      formData.append('position', defaultOptions.position);
    }
    if (defaultOptions.add_shadow) {
      formData.append('add_shadow', defaultOptions.add_shadow.toString());
    }
    if (defaultOptions.bg_color) {
      formData.append('bg_color', defaultOptions.bg_color);
    }

    // Make API request
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVEBG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🚨 Remove.bg API Error:', response.status, errorText);
      
      // Handle specific error codes
      if (response.status === 402) {
        return {
          success: false,
          error: 'Insufficient credits for background removal',
        };
      } else if (response.status === 400) {
        return {
          success: false,
          error: 'Invalid image format or size',
        };
      } else if (response.status === 403) {
        return {
          success: false,
          error: 'Invalid API key for background removal',
        };
      }
      
      return {
        success: false,
        error: `Background removal failed with status ${response.status}`,
      };
    }

    // Get processed image as array buffer
    const processedImageBuffer = await response.arrayBuffer();
    const processedImageBase64 = btoa(
      new Uint8Array(processedImageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Save processed image to cache
    const processedImageUri = `${FileSystem.cacheDirectory}bg_removed_${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(processedImageUri, processedImageBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Get credits used from response headers
    const creditsUsed = response.headers.get('x-credits-charged');
    
    console.log('✅ Background removal completed successfully');
    console.log(`💰 Credits used: ${creditsUsed || 'unknown'}`);

    return {
      success: true,
      processedImageUri,
      originalSize: imageBase64.length,
      processedSize: processedImageBuffer.byteLength,
      creditsUsed: creditsUsed ? parseInt(creditsUsed) : undefined,
    };

  } catch (error) {
    console.error('❌ Background removal error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Enhanced background removal with quality assessment
 * Includes fallback options and quality optimization
 */
export async function removeBackgroundEnhanced(
  imageUri: string,
  options: BackgroundRemovalOptions = {}
): Promise<BackgroundRemovalResult> {
  console.log('🎯 Starting enhanced background removal...');
  
  // First attempt with product-optimized settings
  const productResult = await removeBackground(imageUri, {
    type: 'product',
    size: 'auto',
    semitransparency: true,
    crop: false,
    ...options,
  });

  if (productResult.success) {
    console.log('✅ Product-optimized background removal successful');
    return productResult;
  }

  // Fallback to auto detection if product type fails
  console.log('🔄 Falling back to auto detection...');
  const autoResult = await removeBackground(imageUri, {
    type: 'auto',
    size: 'auto',
    semitransparency: true,
    crop: false,
    ...options,
  });

  if (autoResult.success) {
    console.log('✅ Auto-detection background removal successful');
    return autoResult;
  }

  // Final fallback to person detection (in case clothing is on a person)
  console.log('🔄 Final fallback to person detection...');
  const personResult = await removeBackground(imageUri, {
    type: 'person',
    size: 'auto',
    semitransparency: true,
    crop: false,
    ...options,
  });

  console.log('🏁 Enhanced background removal completed');
  return personResult;
}

/**
 * Batch background removal for multiple images
 */
export async function removeBackgroundBatch(
  imageUris: string[],
  options: BackgroundRemovalOptions = {}
): Promise<BackgroundRemovalResult[]> {
  console.log(`🎨 Starting batch background removal for ${imageUris.length} images...`);
  
  const results: BackgroundRemovalResult[] = [];
  
  for (let i = 0; i < imageUris.length; i++) {
    const imageUri = imageUris[i];
    console.log(`Processing image ${i + 1}/${imageUris.length}`);
    
    const result = await removeBackgroundEnhanced(imageUri, options);
    results.push(result);
    
    // Add small delay to avoid rate limiting
    if (i < imageUris.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('✅ Batch background removal completed');
  return results;
}

/**
 * Clean up processed background removal files
 */
export async function cleanupBackgroundRemovalFiles(): Promise<void> {
  try {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) return;
    
    const files = await FileSystem.readDirectoryAsync(cacheDir);
    const bgRemovedFiles = files.filter(file => file.startsWith('bg_removed_'));
    
    // Remove files older than 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const file of bgRemovedFiles) {
      const filePath = `${cacheDir}${file}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists && fileInfo.modificationTime && fileInfo.modificationTime < oneDayAgo) {
        await FileSystem.deleteAsync(filePath);
        console.log(`🗑️ Cleaned up old background removal file: ${file}`);
      }
    }
  } catch (error) {
    console.error('❌ Failed to cleanup background removal files:', error);
  }
}