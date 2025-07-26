/**
 * Ultra-Optimized Terminator Overlay with Skia and Reanimated 3
 * 60fps performance with advanced visual effects and state-aware animations
 */

import React, { useMemo, useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  interpolate,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import { Canvas, Rect, RoundedRect, Group, Paint, Blur, LinearGradient, vec } from '@shopify/react-native-skia';
import { useTerminator, useDetectedItems, useTerminatorColor, useTerminatorState } from '../contexts/TerminatorContext';
import { DetectedClothingItem } from '../types/ClothingTypes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface UltraTerminatorOverlayProps {
  cameraWidth: number;
  cameraHeight: number;
  style?: any;
}

// Memoized bounding box calculation for performance
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

// Individual bounding box component with advanced animations
const AnimatedBoundingBox = React.memo<{
  box: any;
  index: number;
  stateColor: string;
  currentState: string;
}>(({ box, index, stateColor, currentState }) => {
  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const glowIntensity = useSharedValue(0);
  const cornerAnimation = useSharedValue(0);
  const pulseAnimation = useSharedValue(0);

  // State-aware animations
  useEffect(() => {
    if (currentState === 'tracking') {
      // Smooth entrance with spring physics
      opacity.value = withSpring(1, { damping: 15, stiffness: 200 });
      scale.value = withSpring(1, { damping: 12, stiffness: 180 });
      glowIntensity.value = withSpring(0.8, { damping: 10 });
      
      // Continuous corner animation for tracking state
      cornerAnimation.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        true
      );
      
      // Confidence-based pulse
      const pulseFrequency = Math.max(1000, 3000 - (box.confidence * 2000));
      pulseAnimation.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 200 }),
          withTiming(0, { duration: 800 })
        ),
        -1,
        false
      );
    } else if (currentState === 'detecting') {
      // Scanning animation
      opacity.value = withTiming(0.6, { duration: 300 });
      scale.value = withTiming(0.9, { duration: 300 });
      glowIntensity.value = withRepeat(
        withTiming(1, { duration: 500 }),
        -1,
        true
      );
    } else if (currentState === 'lost') {
      // Fade out with shake effect
      opacity.value = withSequence(
        withTiming(0.3, { duration: 200 }),
        withTiming(0, { duration: 1000 })
      );
      scale.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withTiming(0.9, { duration: 100 }),
        withTiming(0, { duration: 800 })
      );
    }
  }, [currentState]);

  // Derived values for complex animations
  const animatedGlow = useDerivedValue(() => {
    return interpolate(
      glowIntensity.value + pulseAnimation.value,
      [0, 1],
      [0, 20]
    );
  });

  const cornerOffset = useDerivedValue(() => {
    return interpolate(
      cornerAnimation.value,
      [0, 1],
      [5, 15]
    );
  });

  return (
    <Group key={box.id}>
      {/* Main bounding box with glow effect */}
      <RoundedRect
        x={box.x - 2}
        y={box.y - 2}
        width={box.width + 4}
        height={box.height + 4}
        r={8}
        style="stroke"
        strokeWidth={3}
        color={stateColor}
        opacity={opacity}
      >
        <Paint>
          <Blur blur={animatedGlow} />
        </Paint>
      </RoundedRect>

      {/* Corner indicators for sci-fi aesthetic */}
      <Group opacity={opacity}>
        {/* Top-left corner */}
        <Rect
          x={box.x}
          y={box.y}
          width={cornerOffset}
          height={3}
          color={stateColor}
        />
        <Rect
          x={box.x}
          y={box.y}
          width={3}
          height={cornerOffset}
          color={stateColor}
        />

        {/* Top-right corner */}
        <Rect
          x={box.x + box.width - cornerOffset.value}
          y={box.y}
          width={cornerOffset}
          height={3}
          color={stateColor}
        />
        <Rect
          x={box.x + box.width - 3}
          y={box.y}
          width={3}
          height={cornerOffset}
          color={stateColor}
        />

        {/* Bottom-left corner */}
        <Rect
          x={box.x}
          y={box.y + box.height - 3}
          width={cornerOffset}
          height={3}
          color={stateColor}
        />
        <Rect
          x={box.x}
          y={box.y + box.height - cornerOffset.value}
          width={3}
          height={cornerOffset}
          color={stateColor}
        />

        {/* Bottom-right corner */}
        <Rect
          x={box.x + box.width - cornerOffset.value}
          y={box.y + box.height - 3}
          width={cornerOffset}
          height={3}
          color={stateColor}
        />
        <Rect
          x={box.x + box.width - 3}
          y={box.y + box.height - cornerOffset.value}
          width={3}
          height={cornerOffset}
          color={stateColor}
        />
      </Group>

      {/* Confidence indicator bar */}
      <Group opacity={opacity}>
        <Rect
          x={box.x}
          y={box.y - 12}
          width={box.width}
          height={4}
          color="#000000"
          opacity={0.6}
        />
        <Rect
          x={box.x + 1}
          y={box.y - 11}
          width={(box.width - 2) * box.confidence}
          height={2}
          color={stateColor}
        />
      </Group>

      {/* Label background and text would go here if using text rendering */}
      {/* For now, we'll use the confidence bar as the main indicator */}
    </Group>
  );
});

// Main scanning line effect for scanning state
const ScanLine = React.memo<{
  cameraWidth: number;
  cameraHeight: number;
  isScanning: boolean;
}>(({ cameraWidth, cameraHeight, isScanning }) => {
  const scanPosition = useSharedValue(0);
  const scanOpacity = useSharedValue(0);

  useEffect(() => {
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

  const animatedY = useDerivedValue(() => scanPosition.value);

  return (
    <Group opacity={scanOpacity}>
      <Rect
        x={0}
        y={animatedY}
        width={cameraWidth}
        height={2}
        color="#00DDFF"
      >
        <Paint>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(cameraWidth, 0)}
            colors={['transparent', '#00DDFF', '#00DDFF', 'transparent']}
            positions={[0, 0.3, 0.7, 1]}
          />
          <Blur blur={3} />
        </Paint>
      </Rect>
    </Group>
  );
});

// Main component
export const UltraTerminatorOverlay: React.FC<UltraTerminatorOverlayProps> = React.memo(({
  cameraWidth,
  cameraHeight,
  style,
}) => {
  // Context state
  const detectedItems = useDetectedItems();
  const stateColor = useTerminatorColor();
  const currentState = useTerminatorState();

  // Memoized bounding boxes
  const boundingBoxes = useBoundingBoxes(detectedItems, cameraWidth, cameraHeight);

  // Performance monitoring
  const frameCount = useSharedValue(0);
  
  useEffect(() => {
    frameCount.value += 1;
    
    // Log performance every 60 frames
    if (frameCount.value % 60 === 0) {
      runOnJS(() => {
        console.log(`🎯 Terminator Overlay: ${frameCount.value} frames rendered`);
      })();
    }
  });

  // Main canvas style with full overlay
  const canvasStyle = useMemo(() => [
    StyleSheet.absoluteFillObject,
    {
      width: cameraWidth,
      height: cameraHeight,
    },
    style,
  ], [cameraWidth, cameraHeight, style]);

  // Add debug logging
  console.log(`🎯 UltraTerminatorOverlay render:`, {
    currentState,
    detectedItemsCount: detectedItems.length,
    boundingBoxesCount: boundingBoxes.length,
    canvasSize: { width: cameraWidth, height: cameraHeight }
  });

  return (
    <Canvas style={canvasStyle}>
      {/* Scanning line effect */}
      <ScanLine
        cameraWidth={cameraWidth}
        cameraHeight={cameraHeight}
        isScanning={currentState === 'scanning'}
      />

      {/* Bounding boxes for detected items */}
      {boundingBoxes.map((box, index) => (
        <AnimatedBoundingBox
          key={box.id}
          box={box}
          index={index}
          stateColor={stateColor}
          currentState={currentState}
        />
      ))}

      {/* Corner grid overlay for sci-fi aesthetic (only when active) */}
      {currentState !== 'idle' && (
        <Group opacity={0.1}>
          {/* Grid lines */}
          {Array.from({ length: 10 }).map((_, i) => (
            <Group key={`grid-${i}`}>
              <Rect
                x={(i * cameraWidth) / 9}
                y={0}
                width={1}
                height={cameraHeight}
                color={stateColor}
              />
              <Rect
                x={0}
                y={(i * cameraHeight) / 9}
                width={cameraWidth}
                height={1}
                color={stateColor}
              />
            </Group>
          ))}
        </Group>
      )}
    </Canvas>
  );
});

UltraTerminatorOverlay.displayName = 'UltraTerminatorOverlay';