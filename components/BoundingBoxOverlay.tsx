import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DetectedItem {
  id: number;
  itemType: string;
  description: string;
  boundingBox: {
    top_left: [number, number];
    bottom_right: [number, number];
  };
  confidence: number;
  suitable: boolean;
  reason: string;
  uniqueFeatures?: string;
  originalImageUri?: string;
}

interface BoundingBoxOverlayProps {
  imageUri: string;
  detectedItems: DetectedItem[];
  onItemSelect: (item: DetectedItem) => void;
  visible: boolean;
  imageWidth: number;
  imageHeight: number;
}

export const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
  imageUri,
  detectedItems,
  onItemSelect,
  visible,
  imageWidth,
  imageHeight,
}) => {
  if (!visible || !detectedItems.length) {
    return null;
  }

  const convertBoundingBox = (bbox: DetectedItem['boundingBox']) => {
    // Convert 0-100 coordinate system to actual pixel coordinates
    const x = (bbox.top_left[0] / 100) * imageWidth;
    const y = (bbox.top_left[1] / 100) * imageHeight;
    const width = ((bbox.bottom_right[0] - bbox.top_left[0]) / 100) * imageWidth;
    const height = ((bbox.bottom_right[1] - bbox.top_left[1]) / 100) * imageHeight;
    
    return { x, y, width, height };
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return '#00FF88'; // High confidence - green
    if (confidence >= 70) return '#FFD700'; // Medium confidence - yellow
    return '#FF6B35'; // Lower confidence - orange
  };

  const handleItemPress = async (item: DetectedItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onItemSelect(item);
  };

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image 
        source={{ uri: imageUri }} 
        style={[styles.backgroundImage, { width: imageWidth, height: imageHeight }]}
        resizeMode="contain"
      />
      
      {/* Bounding Boxes */}
      {detectedItems.map((item, index) => {
        const bbox = convertBoundingBox(item.boundingBox);
        const confidenceColor = getConfidenceColor(item.confidence);
        
        return (
          <TouchableOpacity
            key={item.id || index}
            style={[
              styles.boundingBox,
              {
                left: bbox.x,
                top: bbox.y,
                width: bbox.width,
                height: bbox.height,
                borderColor: confidenceColor,
              }
            ]}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.8}
          >
            {/* Item Label */}
            <View style={[styles.itemLabel, { backgroundColor: confidenceColor }]}>
              <Text style={styles.itemLabelText} numberOfLines={1}>
                {item.itemType}
              </Text>
              <Text style={styles.confidenceText}>
                {item.confidence}%
              </Text>
            </View>
            
            {/* Selection Indicator */}
            <View style={[styles.selectionIndicator, { borderColor: confidenceColor }]}>
              <Text style={styles.selectionText}>TAP</Text>
            </View>
          </TouchableOpacity>
        );
      })}
      
      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          {detectedItems.length} item{detectedItems.length !== 1 ? 's' : ''} detected
        </Text>
        <Text style={styles.instructionsSubtext}>
          Tap any item to select and crop it
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 3,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
  },
  itemLabel: {
    position: 'absolute',
    top: -30,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 150,
  },
  itemLabelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginRight: 6,
  },
  confidenceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.9,
  },
  selectionIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  instructionsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructionsSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default BoundingBoxOverlay;