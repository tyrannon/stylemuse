import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native';
import { SafeImage } from '../utils/SafeImage';

const { width: screenWidth } = Dimensions.get('window');

interface BoundingBox {
  top_left: [number, number];
  bottom_right: [number, number];
}

interface BoundingBoxOverlayProps {
  imageUri: string;
  boundingBoxes: Array<{
    id: number;
    itemType: string;
    description: string;
    boundingBox: BoundingBox;
    confidence: number;
    color?: string;
  }>;
  imageWidth?: number;
  imageHeight?: number;
  showLabels?: boolean;
}

export const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
  imageUri,
  boundingBoxes,
  imageWidth = screenWidth - 40,
  imageHeight = 300,
  showLabels = true,
}) => {
  // Color palette for different bounding boxes
  const getBoxColor = (index: number): string => {
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#96CEB4', // Green
      '#FFEAA7', // Yellow
      '#DDA0DD', // Plum
      '#98D8C8', // Mint
      '#F7DC6F', // Light Yellow
      '#BB8FCE', // Light Purple
      '#85C1E9', // Light Blue
    ];
    return colors[index % colors.length];
  };

  const renderBoundingBox = (box: any, index: number) => {
    const { boundingBox, itemType, confidence } = box;
    const { top_left, bottom_right } = boundingBox;
    
    // Convert from 0-100 scale to actual pixel positions
    const left = (top_left[0] / 100) * imageWidth;
    const top = (top_left[1] / 100) * imageHeight;
    const width = ((bottom_right[0] - top_left[0]) / 100) * imageWidth;
    const height = ((bottom_right[1] - top_left[1]) / 100) * imageHeight;
    
    const boxColor = box.color || getBoxColor(index);
    
    return (
      <View key={`box-${index}`}>
        {/* Bounding box rectangle */}
        <View
          style={[
            styles.boundingBox,
            {
              left: left,
              top: top,
              width: width,
              height: height,
              borderColor: boxColor,
            },
          ]}
        />
        
        {/* Label */}
        {showLabels && (
          <View
            style={[
              styles.label,
              {
                left: left,
                top: top - 25,
                backgroundColor: boxColor,
              },
            ]}
          >
            <Text style={styles.labelText}>
              {itemType} ({confidence}%)
            </Text>
          </View>
        )}
        
        {/* Corner indicators for better visibility */}
        <View style={[styles.corner, styles.topLeft, { left, top, borderColor: boxColor }]} />
        <View style={[styles.corner, styles.topRight, { left: left + width - 8, top, borderColor: boxColor }]} />
        <View style={[styles.corner, styles.bottomLeft, { left, top: top + height - 8, borderColor: boxColor }]} />
        <View style={[styles.corner, styles.bottomRight, { left: left + width - 8, top: top + height - 8, borderColor: boxColor }]} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { width: imageWidth, height: imageHeight }]}>
      {/* Base image */}
      <SafeImage
        uri={imageUri}
        style={[styles.image, { width: imageWidth, height: imageHeight }]}
        resizeMode="cover"
      />
      
      {/* Overlay container for bounding boxes */}
      <View style={[styles.overlay, { width: imageWidth, height: imageHeight }]}>
        {boundingBoxes.map((box, index) => renderBoundingBox(box, index))}
      </View>
      
      {/* Detection count indicator */}
      {boundingBoxes.length > 0 && (
        <View style={styles.detectionCount}>
          <Text style={styles.detectionCountText}>
            🔍 {boundingBoxes.length} item{boundingBoxes.length !== 1 ? 's' : ''} detected
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  image: {
    borderRadius: 12,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
  },
  label: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  labelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  corner: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderWidth: 2,
    backgroundColor: 'white',
  },
  topLeft: {
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  detectionCount: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detectionCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});