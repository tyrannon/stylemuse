import * as ImageManipulator from 'expo-image-manipulator';

interface BoundingBox {
  top_left: [number, number];
  bottom_right: [number, number];
}

interface CropResult {
  uri: string;
  width: number;
  height: number;
}

export const cropImageWithBounds = async (
  imageUri: string, 
  boundingBox: BoundingBox,
  imageWidth: number,
  imageHeight: number,
  itemType?: string
): Promise<CropResult> => {
  try {
    // Convert 0-100 coordinate system to actual pixel coordinates
    const x = (boundingBox.top_left[0] / 100) * imageWidth;
    const y = (boundingBox.top_left[1] / 100) * imageHeight;
    const width = ((boundingBox.bottom_right[0] - boundingBox.top_left[0]) / 100) * imageWidth;
    const height = ((boundingBox.bottom_right[1] - boundingBox.top_left[1]) / 100) * imageHeight;

    // Add generous padding based on item type - more space for better cropping
    let paddingPercent = 0.35; // Default 35% padding - much more generous
    
    if (itemType?.toLowerCase().includes('shoe') || 
        itemType?.toLowerCase().includes('sneaker') ||
        itemType?.toLowerCase().includes('boot') ||
        itemType?.toLowerCase().includes('sandal') ||
        itemType?.toLowerCase().includes('heel')) {
      paddingPercent = 0.45; // 45% padding for shoes - very generous
    } else if (itemType?.toLowerCase().includes('accessory') ||
               itemType?.toLowerCase().includes('jewelry') ||
               itemType?.toLowerCase().includes('watch')) {
      paddingPercent = 0.5; // 50% padding for small accessories
    } else if (itemType?.toLowerCase().includes('top') ||
               itemType?.toLowerCase().includes('shirt') ||
               itemType?.toLowerCase().includes('blouse') ||
               itemType?.toLowerCase().includes('jacket')) {
      paddingPercent = 0.3; // 30% padding for tops
    } else if (itemType?.toLowerCase().includes('bottom') ||
               itemType?.toLowerCase().includes('pants') ||
               itemType?.toLowerCase().includes('jeans') ||
               itemType?.toLowerCase().includes('skirt')) {
      paddingPercent = 0.4; // 40% padding for bottoms
    }
    
    const paddingX = width * paddingPercent;
    const paddingY = height * paddingPercent;
    
    // Apply padding to crop area
    const paddedX = x - paddingX;
    const paddedY = y - paddingY;
    const paddedWidth = width + (paddingX * 2);
    const paddedHeight = height + (paddingY * 2);

    // Ensure crop dimensions are within image bounds
    const cropX = Math.max(0, Math.min(paddedX, imageWidth - 1));
    const cropY = Math.max(0, Math.min(paddedY, imageHeight - 1));
    const cropWidth = Math.max(1, Math.min(paddedWidth, imageWidth - cropX));
    const cropHeight = Math.max(1, Math.min(paddedHeight, imageHeight - cropY));

    console.log('🔍 Cropping image:', {
      originalSize: { width: imageWidth, height: imageHeight },
      cropArea: { x: cropX, y: cropY, width: cropWidth, height: cropHeight },
      boundingBox,
    });

    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          crop: {
            originX: cropX,
            originY: cropY,
            width: cropWidth,
            height: cropHeight,
          },
        },
      ],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    console.log('✅ Crop successful:', result);
    return result;
  } catch (error) {
    console.error('❌ Error cropping image:', error);
    throw new Error(`Failed to crop image: ${error}`);
  }
};

export const cropMultipleItems = async (
  imageUri: string,
  detectedItems: Array<{
    id: number;
    boundingBox: BoundingBox;
    itemType: string;
    description: string;
  }>,
  imageWidth: number,
  imageHeight: number
): Promise<Array<{
  id: number;
  itemType: string;
  description: string;
  croppedUri: string;
  originalBoundingBox: BoundingBox;
}>> => {
  const results = [];

  for (const item of detectedItems) {
    try {
      const croppedResult = await cropImageWithBounds(
        imageUri,
        item.boundingBox,
        imageWidth,
        imageHeight,
        item.itemType
      );

      results.push({
        id: item.id,
        itemType: item.itemType,
        description: item.description,
        croppedUri: croppedResult.uri,
        originalBoundingBox: item.boundingBox,
      });

      console.log(`✅ Successfully cropped item ${item.id}: ${item.itemType}`);
    } catch (error) {
      console.error(`❌ Failed to crop item ${item.id}:`, error);
      // Continue with other items even if one fails
    }
  }

  return results;
};

export const getImageDimensions = async (imageUri: string): Promise<{ width: number; height: number }> => {
  try {
    // Use ImageManipulator to get image info without modifying it
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [], // No manipulations, just get info
      {
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    
    return {
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('❌ Error getting image dimensions:', error);
    // Fallback to reasonable defaults
    return {
      width: 1024,
      height: 1024,
    };
  }
};

export const validateBoundingBox = (
  boundingBox: BoundingBox,
  imageWidth: number,
  imageHeight: number
): boolean => {
  const [x1, y1] = boundingBox.top_left;
  const [x2, y2] = boundingBox.bottom_right;

  // Check if coordinates are within valid range (0-100)
  if (x1 < 0 || x1 > 100 || y1 < 0 || y1 > 100 ||
      x2 < 0 || x2 > 100 || y2 < 0 || y2 > 100) {
    return false;
  }

  // Check if bounding box has positive area
  if (x2 <= x1 || y2 <= y1) {
    return false;
  }

  // Check if the resulting crop area would be reasonable
  const width = ((x2 - x1) / 100) * imageWidth;
  const height = ((y2 - y1) / 100) * imageHeight;

  // Minimum reasonable crop size (20x20 pixels)
  if (width < 20 || height < 20) {
    return false;
  }

  return true;
};