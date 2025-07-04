import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export interface PhotoQualityMetrics {
  overall: number; // 0-1 overall quality score
  brightness: number; // 0-1 brightness adequacy
  contrast: number; // 0-1 contrast quality
  sharpness: number; // 0-1 sharpness/focus quality
  composition: number; // 0-1 composition quality
  multipleItems: boolean; // true if multiple clothing items detected
  issues: string[]; // array of detected issues
  recommendations: string[]; // array of improvement suggestions
}

export interface PhotoQualityOptions {
  mode: 'wardrobe' | 'profile' | 'outfit';
  strictMode?: boolean; // more rigorous quality requirements
  minimumScore?: number; // minimum acceptable quality score
}

/**
 * Comprehensive photo quality assessment for clothing photography
 */
export async function assessPhotoQuality(
  photoUri: string,
  options: PhotoQualityOptions = { mode: 'wardrobe' }
): Promise<PhotoQualityMetrics> {
  console.log('📊 Starting comprehensive photo quality assessment...');
  
  try {
    // Create a smaller version for analysis to improve performance
    const analysisPhoto = await manipulateAsync(
      photoUri,
      [{ resize: { width: 512 } }],
      {
        compress: 0.8,
        format: SaveFormat.JPEG,
      }
    );

    // Get image data for analysis
    const imageData = await getImagePixelData(analysisPhoto.uri);
    
    // Perform individual quality assessments
    const brightnessScore = await assessBrightness(imageData);
    const contrastScore = await assessContrast(imageData);
    const sharpnessScore = await assessSharpness(imageData);
    const compositionScore = await assessComposition(imageData, options.mode);
    const multipleItemsDetected = await detectMultipleItems(imageData, options.mode);
    
    // Calculate overall quality score
    const weights = getQualityWeights(options.mode);
    const overallScore = 
      (brightnessScore * weights.brightness) +
      (contrastScore * weights.contrast) +
      (sharpnessScore * weights.sharpness) +
      (compositionScore * weights.composition);
    
    // Identify issues and recommendations
    const issues = identifyIssues({
      brightness: brightnessScore,
      contrast: contrastScore,
      sharpness: sharpnessScore,
      composition: compositionScore,
      multipleItems: multipleItemsDetected,
    }, options);
    
    const recommendations = generateRecommendations(issues, options.mode);
    
    // Clean up temporary files
    await FileSystem.deleteAsync(analysisPhoto.uri);
    
    const metrics: PhotoQualityMetrics = {
      overall: overallScore,
      brightness: brightnessScore,
      contrast: contrastScore,
      sharpness: sharpnessScore,
      composition: compositionScore,
      multipleItems: multipleItemsDetected,
      issues,
      recommendations,
    };
    
    console.log('✅ Photo quality assessment completed:', {
      overall: Math.round(overallScore * 100) + '%',
      issues: issues.length,
      recommendations: recommendations.length,
    });
    
    return metrics;
    
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
      issues: ['Assessment failed - image may be corrupted'],
      recommendations: ['Please try taking a new photo'],
    };
  }
}

/**
 * Extract pixel data from image for analysis
 */
async function getImagePixelData(photoUri: string): Promise<ImageData> {
  // Note: This is a simplified version. In a real implementation,
  // you'd use a library like react-native-image-filter-kit or similar
  // to extract actual pixel data. For now, we'll simulate this.
  
  const fileInfo = await FileSystem.getInfoAsync(photoUri);
  const imageBase64 = await FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  // Create mock ImageData for demonstration
  // In reality, you'd decode the image and extract pixel values
  return {
    data: new Uint8ClampedArray(512 * 512 * 4), // Mock RGBA data
    width: 512,
    height: 512,
  } as ImageData;
}

/**
 * Assess brightness levels in the image
 */
async function assessBrightness(imageData: ImageData): Promise<number> {
  try {
    const pixels = imageData.data;
    let totalBrightness = 0;
    let pixelCount = 0;
    
    // Sample pixels for brightness analysis
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // Calculate luminance using standard formula
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      totalBrightness += luminance;
      pixelCount++;
    }
    
    const avgBrightness = totalBrightness / pixelCount;
    
    // Optimal brightness range for clothing photos: 80-180 (out of 255)
    const optimalMin = 80;
    const optimalMax = 180;
    
    let score = 1.0;
    
    if (avgBrightness < optimalMin) {
      // Too dark
      score = Math.max(0, avgBrightness / optimalMin);
    } else if (avgBrightness > optimalMax) {
      // Too bright
      score = Math.max(0, 1 - (avgBrightness - optimalMax) / (255 - optimalMax));
    }
    
    return Math.min(1.0, Math.max(0, score));
    
  } catch (error) {
    console.error('Brightness assessment failed:', error);
    return 0.5;
  }
}

/**
 * Assess contrast levels in the image
 */
async function assessContrast(imageData: ImageData): Promise<number> {
  try {
    const pixels = imageData.data;
    const luminances: number[] = [];
    
    // Calculate luminance for each pixel
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      luminances.push(luminance);
    }
    
    // Calculate standard deviation (measure of contrast)
    const mean = luminances.reduce((sum, val) => sum + val, 0) / luminances.length;
    const variance = luminances.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / luminances.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize contrast score (good contrast typically has stdDev > 30)
    const contrastScore = Math.min(1.0, stdDev / 60);
    
    return Math.max(0, contrastScore);
    
  } catch (error) {
    console.error('Contrast assessment failed:', error);
    return 0.5;
  }
}

/**
 * Assess sharpness/focus quality using edge detection
 */
async function assessSharpness(imageData: ImageData): Promise<number> {
  try {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    let edgeStrength = 0;
    let edgeCount = 0;
    
    // Apply simple edge detection (Sobel operator simulation)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Get current pixel luminance
        const current = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
        
        // Get neighboring pixels
        const right = 0.299 * pixels[idx + 4] + 0.587 * pixels[idx + 5] + 0.114 * pixels[idx + 6];
        const bottom = 0.299 * pixels[idx + width * 4] + 0.587 * pixels[idx + width * 4 + 1] + 0.114 * pixels[idx + width * 4 + 2];
        
        // Calculate edge strength
        const gx = Math.abs(right - current);
        const gy = Math.abs(bottom - current);
        const edge = Math.sqrt(gx * gx + gy * gy);
        
        edgeStrength += edge;
        edgeCount++;
      }
    }
    
    const avgEdgeStrength = edgeStrength / edgeCount;
    
    // Normalize sharpness score (good sharpness typically has avgEdgeStrength > 15)
    const sharpnessScore = Math.min(1.0, avgEdgeStrength / 30);
    
    return Math.max(0, sharpnessScore);
    
  } catch (error) {
    console.error('Sharpness assessment failed:', error);
    return 0.5;
  }
}

/**
 * Assess composition quality based on photography rules
 */
async function assessComposition(imageData: ImageData, mode: string): Promise<number> {
  try {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    let compositionScore = 0.7; // Base score
    
    // Rule of thirds analysis
    const thirdWidth = width / 3;
    const thirdHeight = height / 3;
    
    // Check if subject is positioned along rule of thirds lines
    // This is simplified - in reality you'd need object detection
    const centerRegionDensity = calculateRegionDensity(pixels, width, height, 
      thirdWidth, thirdHeight, thirdWidth * 2, thirdHeight * 2);
    
    // Clothing photos should have subject in center region
    if (mode === 'wardrobe' && centerRegionDensity > 0.3) {
      compositionScore += 0.2;
    }
    
    // Check for proper margins/padding
    const edgeRegionDensity = calculateEdgeRegionDensity(pixels, width, height);
    if (edgeRegionDensity < 0.1) {
      compositionScore += 0.1; // Good - subject not cut off at edges
    }
    
    return Math.min(1.0, Math.max(0, compositionScore));
    
  } catch (error) {
    console.error('Composition assessment failed:', error);
    return 0.5;
  }
}

/**
 * Detect if multiple clothing items are present in the image
 */
async function detectMultipleItems(imageData: ImageData, mode: string): Promise<boolean> {
  try {
    if (mode !== 'wardrobe') {
      return false; // Only relevant for wardrobe mode
    }
    
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Simple heuristic: detect distinct regions of similar colors
    // This is a simplified approach - in reality you'd use object detection
    const regions = detectColorRegions(pixels, width, height);
    
    // If we find more than 2 distinct regions, likely multiple items
    return regions.length > 2;
    
  } catch (error) {
    console.error('Multiple items detection failed:', error);
    return false;
  }
}

/**
 * Helper function to calculate region density
 */
function calculateRegionDensity(pixels: Uint8ClampedArray, width: number, height: number, 
  x1: number, y1: number, x2: number, y2: number): number {
  
  let nonTransparentPixels = 0;
  let totalPixels = 0;
  
  for (let y = Math.floor(y1); y < Math.floor(y2); y++) {
    for (let x = Math.floor(x1); x < Math.floor(x2); x++) {
      const idx = (y * width + x) * 4;
      const alpha = pixels[idx + 3];
      
      if (alpha > 128) { // Consider semi-transparent as content
        nonTransparentPixels++;
      }
      totalPixels++;
    }
  }
  
  return totalPixels > 0 ? nonTransparentPixels / totalPixels : 0;
}

/**
 * Helper function to calculate edge region density
 */
function calculateEdgeRegionDensity(pixels: Uint8ClampedArray, width: number, height: number): number {
  const edgeWidth = Math.floor(width * 0.05); // 5% of width as edge
  const edgeHeight = Math.floor(height * 0.05); // 5% of height as edge
  
  let edgePixels = 0;
  let totalEdgePixels = 0;
  
  // Top and bottom edges
  for (let y = 0; y < edgeHeight; y++) {
    for (let x = 0; x < width; x++) {
      const topIdx = (y * width + x) * 4;
      const bottomIdx = ((height - 1 - y) * width + x) * 4;
      
      if (pixels[topIdx + 3] > 128) edgePixels++;
      if (pixels[bottomIdx + 3] > 128) edgePixels++;
      totalEdgePixels += 2;
    }
  }
  
  // Left and right edges
  for (let y = edgeHeight; y < height - edgeHeight; y++) {
    for (let x = 0; x < edgeWidth; x++) {
      const leftIdx = (y * width + x) * 4;
      const rightIdx = (y * width + (width - 1 - x)) * 4;
      
      if (pixels[leftIdx + 3] > 128) edgePixels++;
      if (pixels[rightIdx + 3] > 128) edgePixels++;
      totalEdgePixels += 2;
    }
  }
  
  return totalEdgePixels > 0 ? edgePixels / totalEdgePixels : 0;
}

/**
 * Simple color region detection
 */
function detectColorRegions(pixels: Uint8ClampedArray, width: number, height: number): any[] {
  // Simplified implementation - in reality you'd use clustering algorithms
  const regions: any[] = [];
  
  // Sample colors at regular intervals
  const sampleSize = 16; // Sample every 16th pixel
  const colorTolerance = 30; // RGB tolerance for grouping
  
  for (let i = 0; i < pixels.length; i += sampleSize * 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const alpha = pixels[i + 3];
    
    if (alpha > 128) { // Only consider non-transparent pixels
      const existingRegion = regions.find(region => 
        Math.abs(region.r - r) < colorTolerance &&
        Math.abs(region.g - g) < colorTolerance &&
        Math.abs(region.b - b) < colorTolerance
      );
      
      if (existingRegion) {
        existingRegion.count++;
      } else {
        regions.push({ r, g, b, count: 1 });
      }
    }
  }
  
  // Filter out regions with too few pixels (likely noise)
  return regions.filter(region => region.count > 10);
}

/**
 * Get quality assessment weights based on mode
 */
function getQualityWeights(mode: string): { brightness: number; contrast: number; sharpness: number; composition: number } {
  switch (mode) {
    case 'wardrobe':
      return {
        brightness: 0.3,
        contrast: 0.2,
        sharpness: 0.35,
        composition: 0.15,
      };
    case 'profile':
      return {
        brightness: 0.35,
        contrast: 0.25,
        sharpness: 0.25,
        composition: 0.15,
      };
    case 'outfit':
      return {
        brightness: 0.25,
        contrast: 0.2,
        sharpness: 0.3,
        composition: 0.25,
      };
    default:
      return {
        brightness: 0.3,
        contrast: 0.2,
        sharpness: 0.3,
        composition: 0.2,
      };
  }
}

/**
 * Identify specific issues with the photo
 */
function identifyIssues(
  scores: { brightness: number; contrast: number; sharpness: number; composition: number; multipleItems: boolean },
  options: PhotoQualityOptions
): string[] {
  const issues: string[] = [];
  
  if (scores.brightness < 0.4) {
    issues.push('Image is too dark - increase lighting or use flash');
  } else if (scores.brightness > 0.9) {
    issues.push('Image is overexposed - reduce lighting or avoid direct sunlight');
  }
  
  if (scores.contrast < 0.3) {
    issues.push('Low contrast - improve lighting or background separation');
  }
  
  if (scores.sharpness < 0.4) {
    issues.push('Image is blurry - ensure camera is steady and in focus');
  }
  
  if (scores.composition < 0.4) {
    issues.push('Poor composition - center the subject and avoid cutting off edges');
  }
  
  if (scores.multipleItems && options.mode === 'wardrobe') {
    issues.push('Multiple clothing items detected - photograph items separately for better accuracy');
  }
  
  return issues;
}

/**
 * Generate recommendations based on identified issues
 */
function generateRecommendations(issues: string[], mode: string): string[] {
  const recommendations: string[] = [];
  
  if (issues.some(issue => issue.includes('dark'))) {
    recommendations.push('Use natural lighting or a bright lamp');
    recommendations.push('Avoid shadows by using indirect lighting');
  }
  
  if (issues.some(issue => issue.includes('overexposed'))) {
    recommendations.push('Move away from direct sunlight');
    recommendations.push('Use diffused lighting');
  }
  
  if (issues.some(issue => issue.includes('blurry'))) {
    recommendations.push('Hold the camera steady or use a tripod');
    recommendations.push('Tap to focus before taking the photo');
    recommendations.push('Ensure adequate lighting to avoid motion blur');
  }
  
  if (issues.some(issue => issue.includes('composition'))) {
    recommendations.push('Center the clothing item in the frame');
    recommendations.push('Leave some space around the edges');
    recommendations.push('Use a clean, simple background');
  }
  
  if (issues.some(issue => issue.includes('Multiple'))) {
    recommendations.push('Photograph each clothing item separately');
    recommendations.push('Use a flat surface or hanger for individual items');
  }
  
  if (mode === 'wardrobe') {
    recommendations.push('Use a plain white or light-colored background');
    recommendations.push('Lay the item flat or hang it to show its shape');
  }
  
  return recommendations;
}

/**
 * Quick quality check - returns true if photo meets minimum standards
 */
export async function quickQualityCheck(photoUri: string, mode: 'wardrobe' | 'profile' | 'outfit'): Promise<boolean> {
  try {
    const metrics = await assessPhotoQuality(photoUri, { mode, minimumScore: 0.6 });
    return metrics.overall >= 0.6 && metrics.issues.length <= 2;
  } catch (error) {
    console.error('Quick quality check failed:', error);
    return false;
  }
}