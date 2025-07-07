import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { PinchGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

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
  isPair?: boolean;
  pairAnalysis?: string;
}

interface BoundingBoxOverlayProps {
  imageUri: string;
  detectedItems: DetectedItem[];
  onItemSelect?: (item: DetectedItem) => void; // Made optional for new workflow
  onSaveAll?: (items: DetectedItem[]) => void; // New: Save all items
  onExcludeItem?: (itemId: number) => void; // New: Exclude specific items
  excludedItems?: number[]; // New: List of excluded item IDs
  visible: boolean;
  imageWidth: number;
  imageHeight: number;
  mode?: 'select' | 'save-all'; // New: Operation mode
}

export const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
  imageUri,
  detectedItems,
  onItemSelect,
  onSaveAll,
  onExcludeItem,
  excludedItems = [],
  visible,
  imageWidth,
  imageHeight,
  mode = 'save-all', // Default to new save-all mode
}) => {
  const [scale, setScale] = useState(1);
  const [lastScale, setLastScale] = useState(1);
  const scaleValue = new Animated.Value(1);

  if (!visible || !detectedItems.length) {
    return null;
  }

  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: scaleValue } }],
    { useNativeDriver: false }
  );

  const onPinchStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const newScale = lastScale * event.nativeEvent.scale;
      // Limit zoom between 1x and 3x
      const clampedScale = Math.max(1, Math.min(3, newScale));
      setScale(clampedScale);
      setLastScale(clampedScale);
      scaleValue.setValue(clampedScale);
      
      // Provide haptic feedback when zooming
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const getDisplayDimensions = () => {
    // Calculate dimensions to fit image in available space while maintaining aspect ratio
    // Leave more space for header (120px) and bottom controls (220px)
    const availableHeight = screenHeight - 340; // Even more conservative space for UI
    const availableWidth = screenWidth - 60; // More padding from edges
    
    const aspectRatio = imageWidth / imageHeight;
    const availableAspectRatio = availableWidth / availableHeight;
    
    let displayWidth, displayHeight;
    
    if (aspectRatio > availableAspectRatio) {
      // Image is wider than available space - fit to available width
      displayWidth = availableWidth;
      displayHeight = availableWidth / aspectRatio;
    } else {
      // Image is taller than available space - fit to available height
      displayHeight = availableHeight;
      displayWidth = availableHeight * aspectRatio;
    }
    
    // Center the image in available space
    const offsetX = (screenWidth - displayWidth) / 2;
    const offsetY = 120 + (availableHeight - displayHeight) / 2; // Start after header with more space
    
    return { displayWidth, displayHeight, offsetX, offsetY };
  };

  const convertBoundingBox = (bbox: DetectedItem['boundingBox']) => {
    const { displayWidth, displayHeight, offsetX, offsetY } = getDisplayDimensions();
    
    // Convert 0-100 coordinate system to display coordinates
    const x = offsetX + (bbox.top_left[0] / 100) * displayWidth;
    const y = offsetY + (bbox.top_left[1] / 100) * displayHeight;
    const width = ((bbox.bottom_right[0] - bbox.top_left[0]) / 100) * displayWidth;
    const height = ((bbox.bottom_right[1] - bbox.top_left[1]) / 100) * displayHeight;
    
    return { x, y, width, height };
  };

  const getConfidenceColor = (confidence: number, theme: any) => {
    if (confidence >= 90) return theme.colors.success; // High confidence - green
    if (confidence >= 70) return theme.colors.warning; // Medium confidence - yellow
    return theme.colors.error; // Lower confidence - orange
  };

  const handleItemPress = async (item: DetectedItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (mode === 'save-all') {
      // In save-all mode, toggle item exclusion instead of selecting
      if (excludedItems.includes(item.id)) {
        // Re-include the item
        onExcludeItem?.(item.id);
      } else {
        // Exclude the item
        onExcludeItem?.(item.id);
      }
    } else {
      // Legacy select mode
      onItemSelect?.(item);
    }
  };

  const handleSaveAllPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const includedItems = detectedItems.filter(item => !excludedItems.includes(item.id));
    onSaveAll?.(includedItems);
  };

  const getIncludedItemsCount = () => {
    return detectedItems.filter(item => !excludedItems.includes(item.id)).length;
  };

  const { displayWidth, displayHeight, offsetX, offsetY } = getDisplayDimensions();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <GestureHandlerRootView style={styles.container}>
      <PinchGestureHandler
        onGestureEvent={onPinchEvent}
        onHandlerStateChange={onPinchStateChange}
      >
        <Animated.View style={[styles.zoomableContainer, { transform: [{ scale: scaleValue }] }]}>
          {/* Background Image - Full screen fit */}
          <Image 
            source={{ uri: imageUri }} 
            style={[
              styles.backgroundImage, 
              {
                width: displayWidth,
                height: displayHeight,
                left: offsetX,
                top: offsetY,
              }
            ]}
            resizeMode="contain"
          />
          
          {/* Bounding Boxes */}
          {detectedItems.map((item, index) => {
        const bbox = convertBoundingBox(item.boundingBox);
        const confidenceColor = getConfidenceColor(item.confidence, theme);
        const isExcluded = excludedItems.includes(item.id);
        
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
                borderColor: isExcluded ? theme.colors.textMuted : confidenceColor,
                opacity: isExcluded ? 0.5 : 1,
              }
            ]}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.8}
          >
            {/* Item Label */}
            <View style={[
              styles.itemLabel, 
              { 
                backgroundColor: isExcluded ? theme.colors.textMuted : confidenceColor 
              }
            ]}>
              <Text style={styles.itemLabelText} numberOfLines={1}>
                {isExcluded ? '❌ ' : ''}
                {item.itemType}
                {item.isPair ? ' 👟' : ''}
              </Text>
              <Text style={styles.confidenceText}>
                {item.confidence}%
              </Text>
            </View>
            
            {/* Status Indicator */}
            <View style={[
              styles.selectionIndicator, 
              { 
                borderColor: isExcluded ? theme.colors.textMuted : confidenceColor,
                backgroundColor: isExcluded ? theme.colors.textMuted : 'transparent'
              }
            ]}>
              <Text style={[
                styles.selectionText,
                { color: isExcluded ? theme.colors.background : theme.colors.text }
              ]}>
                {mode === 'save-all' 
                  ? (isExcluded ? 'SKIP' : 'SAVE')
                  : 'TAP'
                }
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
        </Animated.View>
      </PinchGestureHandler>
      
      {/* Bottom Control Panel - Only show for legacy select mode */}
      {mode === 'select' && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            {detectedItems.length} item{detectedItems.length !== 1 ? 's' : ''} detected
          </Text>
          <Text style={styles.instructionsSubtext}>
            Tap any item to crop and save it instantly • Pinch to zoom
          </Text>
          {detectedItems.some(item => item.isPair) && (
            <Text style={styles.pairInfoText}>
              👟 Shoe pairs detected and grouped together
            </Text>
          )}
        </View>
      )}
    </GestureHandlerRootView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    width: screenWidth,
    height: screenHeight,
  },
  zoomableContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
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
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginRight: 6,
  },
  confidenceText: {
    color: theme.colors.text,
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
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionText: {
    color: theme.colors.text,
    fontSize: 9,
    fontWeight: '600',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 30,
    right: 30,
    backgroundColor: theme.colors.overlay,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: theme.colors.success + '50', // Adding transparency
  },
  instructionsText: {
    color: theme.colors.success,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: theme.colors.background,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 2,
  },
  instructionsSubtext: {
    color: theme.colors.text,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    textShadowColor: theme.colors.background,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontWeight: '500',
    opacity: 0.95,
  },
  pairInfoText: {
    color: theme.colors.success,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
    textShadowColor: theme.colors.background,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default BoundingBoxOverlay;