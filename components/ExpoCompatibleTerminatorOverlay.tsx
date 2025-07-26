/**
 * Expo Go Compatible Terminator Overlay
 * Fallback version using standard React Native components instead of Skia
 * DJI-inspired green bounding boxes with smooth animations
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useDetectedItems, useTerminatorColor, useTerminatorState } from '../contexts/TerminatorContext';
import { DetectedClothingItem } from '../types/ClothingTypes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ExpoCompatibleTerminatorOverlayProps {
  cameraWidth: number;
  cameraHeight: number;
  style?: any;
}

// Memoized bounding box calculation
const useBoundingBoxes = (
  detectedItems: DetectedClothingItem[],
  cameraWidth: number,
  cameraHeight: number
) => {
  return useMemo(() => {
    return detectedItems.map((item, index) => ({
      id: item.id || `item-${index}`,
      x: (item.boundingBox.x / 100) * cameraWidth,
      y: (item.boundingBox.y / 100) * cameraHeight,
      width: (item.boundingBox.width / 100) * cameraWidth,
      height: (item.boundingBox.height / 100) * cameraHeight,
      confidence: item.confidence || 0,
      label: item.label,
      category: item.category,
    }));
  }, [detectedItems, cameraWidth, cameraHeight]);
};

// Individual bounding box component - DJI style
const DJIStyleBoundingBox = React.memo<{
  box: any;
  index: number;
  stateColor: string;
  currentState: string;
}>(({ box, index, stateColor, currentState }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const pulseAnimation = useSharedValue(0);
  const cornerAnimation = useSharedValue(0);

  useEffect(() => {
    console.log(`🎯 DJI Box ${index} rendering:`, { currentState, label: box.label, confidence: box.confidence });
    
    if (currentState === 'tracking') {
      // DJI-style smooth entrance
      opacity.value = withSpring(1, { damping: 15, stiffness: 200 });
      scale.value = withSpring(1, { damping: 12, stiffness: 180 });
      
      // Confidence-based pulse (like DJI's tracking confirmation)
      const pulseFrequency = Math.max(1000, 3000 - (box.confidence * 2000));
      pulseAnimation.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 200 }),
          withTiming(0, { duration: 800 })
        ),
        -1,
        false
      );
      
      // Corner animation (DJI's corner indicators)
      cornerAnimation.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        true
      );
    } else if (currentState === 'detecting') {
      // Scanning animation
      opacity.value = withTiming(0.6, { duration: 300 });
      scale.value = withTiming(0.9, { duration: 300 });
    } else {
      // Fade out
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0.8, { duration: 300 });
    }
  }, [currentState, box.confidence]);

  const boxStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value * (1 + pulseAnimation.value * 0.1) }
    ],
  }));

  const cornerOffset = useAnimatedStyle(() => ({
    width: interpolate(cornerAnimation.value, [0, 1], [15, 25]),
    height: interpolate(cornerAnimation.value, [0, 1], [15, 25]),
  }));

  return (
    <Animated.View
      style={[
        styles.boundingBox,
        {
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
          borderColor: stateColor,
        },
        boxStyle,
      ]}
    >
      {/* DJI-style corner indicators */}
      <Animated.View style={[styles.cornerTopLeft, { borderColor: stateColor }, cornerOffset]} />
      <Animated.View style={[styles.cornerTopRight, { borderColor: stateColor }, cornerOffset]} />
      <Animated.View style={[styles.cornerBottomLeft, { borderColor: stateColor }, cornerOffset]} />
      <Animated.View style={[styles.cornerBottomRight, { borderColor: stateColor }, cornerOffset]} />
      
      {/* Confidence bar (DJI style) */}
      <View style={[styles.confidenceContainer, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
        <View
          style={[
            styles.confidenceBar,
            {
              width: `${box.confidence * 100}%`,
              backgroundColor: stateColor,
            },
          ]}
        />
      </View>
      
      {/* Label (DJI style) */}
      <View style={[styles.labelContainer, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
        <Text style={[styles.labelText, { color: stateColor }]}>
          {box.label} ({Math.round(box.confidence * 100)}%)
        </Text>
      </View>
    </Animated.View>
  );
});

// Scanning line effect (DJI-inspired)
const ScanningLine = React.memo<{
  cameraWidth: number;
  cameraHeight: number;
  isScanning: boolean;
  stateColor: string;
}>(({ cameraWidth, cameraHeight, isScanning, stateColor }) => {
  const scanPosition = useSharedValue(0);
  const scanOpacity = useSharedValue(0);

  useEffect(() => {
    console.log(`🎯 Scanning line:`, { isScanning, stateColor });
    
    if (isScanning) {
      scanOpacity.value = withTiming(0.8, { duration: 300 });
      scanPosition.value = withRepeat(
        withTiming(cameraHeight, { duration: 2000 }),
        -1,
        false
      );
    } else {
      scanOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isScanning, cameraHeight]);

  const lineStyle = useAnimatedStyle(() => ({
    top: scanPosition.value,
    opacity: scanOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.scanLine,
        {
          backgroundColor: stateColor,
          width: cameraWidth,
        },
        lineStyle,
      ]}
    />
  );
});

// Visual debug display (like DJI's status info)
const TerminatorDebugDisplay = React.memo(() => {
  const detectedItems = useDetectedItems();
  const currentState = useTerminatorState();
  const stateColor = useTerminatorColor();

  return (
    <View style={[styles.debugDisplay, { backgroundColor: stateColor + '20', borderColor: stateColor }]}>
      <Text style={[styles.debugText, { color: stateColor }]}>
        🎯 TERMINATOR STATUS: {currentState.toUpperCase()} | TARGETS: {detectedItems.length}
      </Text>
    </View>
  );
});

// Main component
export const ExpoCompatibleTerminatorOverlay: React.FC<ExpoCompatibleTerminatorOverlayProps> = React.memo(({
  cameraWidth,
  cameraHeight,
  style,
}) => {
  const detectedItems = useDetectedItems();
  const stateColor = useTerminatorColor();
  const currentState = useTerminatorState();

  // Debug logging
  useEffect(() => {
    console.log(`🎯 ExpoCompatibleTerminatorOverlay render:`, {
      currentState,
      itemCount: detectedItems.length,
      stateColor,
      cameraSize: { width: cameraWidth, height: cameraHeight }
    });
  });

  const boundingBoxes = useBoundingBoxes(detectedItems, cameraWidth, cameraHeight);

  const overlayStyle = useMemo(() => [
    StyleSheet.absoluteFillObject,
    {
      width: cameraWidth,
      height: cameraHeight,
      pointerEvents: 'none', // Allow touch to pass through to camera
    },
    style,
  ], [cameraWidth, cameraHeight, style]);

  return (
    <View style={overlayStyle}>
      {/* Debug status display */}
      <TerminatorDebugDisplay />
      
      {/* Scanning line effect */}
      <ScanningLine
        cameraWidth={cameraWidth}
        cameraHeight={cameraHeight}
        isScanning={currentState === 'scanning'}
        stateColor={stateColor}
      />

      {/* DJI-style bounding boxes */}
      {boundingBoxes.map((box, index) => (
        <DJIStyleBoundingBox
          key={box.id}
          box={box}
          index={index}
          stateColor={stateColor}
          currentState={currentState}
        />
      ))}

      {/* Grid overlay (DJI-style when active) */}
      {currentState !== 'idle' && (
        <View style={styles.gridOverlay}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={`grid-${i}`}>
              <View
                style={[
                  styles.gridLineVertical,
                  {
                    left: (i * cameraWidth) / 4,
                    height: cameraHeight,
                    backgroundColor: stateColor + '20',
                  },
                ]}
              />
              <View
                style={[
                  styles.gridLineHorizontal,
                  {
                    top: (i * cameraHeight) / 4,
                    width: cameraWidth,
                    backgroundColor: stateColor + '20',
                  },
                ]}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

ExpoCompatibleTerminatorOverlay.displayName = 'ExpoCompatibleTerminatorOverlay';

const styles = StyleSheet.create({
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
    borderStyle: 'solid',
  },
  
  // DJI-style corner indicators
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  
  // Confidence indicator (DJI style)
  confidenceContainer: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
  },
  
  confidenceBar: {
    height: '100%',
    borderRadius: 2,
  },
  
  // Label (DJI style)
  labelContainer: {
    position: 'absolute',
    top: -40,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  
  labelText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Courier New',
  },
  
  // Scanning line
  scanLine: {
    position: 'absolute',
    height: 2,
    shadowColor: '#00DDFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },
  
  // Debug display
  debugDisplay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 1000,
  },
  
  debugText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Courier New',
    textAlign: 'center',
  },
  
  // Grid overlay
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  
  gridLineVertical: {
    position: 'absolute',
    width: 1,
  },
  
  gridLineHorizontal: {
    position: 'absolute',
    height: 1,
  },
});