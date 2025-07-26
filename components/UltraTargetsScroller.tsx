/**
 * Ultra-Enhanced Targets Scroller with Advanced Animations
 * Morphing state transitions and premium visual effects
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
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
  cancelAnimation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { 
  useDetectedItems, 
  useTerminatorState, 
  useTerminatorColor,
  useTerminatorDisplay 
} from '../contexts/TerminatorContext';
import { DetectedClothingItem } from '../types/ClothingTypes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Enhanced emoji mapping with confidence-based selection
const CATEGORY_EMOJIS = {
  top: ['👕', '👔', '🎽', '👘'],
  bottom: ['👖', '🩳', '👗', '🩱'],
  shoes: ['👟', '👠', '🥾', '🩴'],
  accessories: ['👜', '🎒', '👒', '🧣'],
  jacket: ['🧥', '🧤', '🦺'],
  hat: ['👒', '🧢', '👑'],
  default: ['👕', '👖', '👟'],
};

// Get emoji based on category and confidence
const getItemEmoji = (category: string, confidence: number): string => {
  const emojis = CATEGORY_EMOJIS[category as keyof typeof CATEGORY_EMOJIS] || CATEGORY_EMOJIS.default;
  const index = Math.floor(confidence * emojis.length);
  return emojis[Math.min(index, emojis.length - 1)];
};

// Individual target item component with morphing animations
const UltraTargetItem = React.memo<{
  item: DetectedClothingItem;
  index: number;
  stateColor: string;
  currentState: string;
  isVisible: boolean;
}>(({ item, index, stateColor, currentState, isVisible }) => {
  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const morphProgress = useSharedValue(0);

  // Confidence-based pulsing
  const confidencePulse = useSharedValue(0);

  useEffect(() => {
    if (isVisible && currentState === 'tracking') {
      // Staggered entrance animation
      const delay = index * 150;
      
      setTimeout(() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
        opacity.value = withSpring(1, { damping: 15 });
        
        // Confidence-based glow
        glowIntensity.value = withSpring(item.confidence || 0.5);
        
        // Continuous confidence pulse
        confidencePulse.value = withRepeat(
          withSequence(
            withTiming(0.2, { duration: 1000 }),
            withTiming(0, { duration: 1000 })
          ),
          -1,
          false
        );
        
        // Subtle rotation for dynamic feel
        rotation.value = withRepeat(
          withTiming(360, { duration: 20000 }),
          -1,
          false
        );
      }, delay);
    } else {
      // Exit animation
      scale.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
      cancelAnimation(confidencePulse);
      cancelAnimation(rotation);
    }
  }, [isVisible, currentState, index, item.confidence]);

  // Morph animation for state changes
  useEffect(() => {
    morphProgress.value = withSpring(currentState === 'tracking' ? 1 : 0, {
      damping: 10,
      stiffness: 100,
    });
  }, [currentState]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    const animatedScale = scale.value * (1 + confidencePulse.value * 0.1);
    const animatedOpacity = opacity.value * (0.8 + confidencePulse.value * 0.2);
    
    return {
      transform: [
        { scale: animatedScale },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: animatedOpacity,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const glowRadius = interpolate(
      glowIntensity.value + confidencePulse.value,
      [0, 1],
      [0, 15]
    );
    
    return {
      shadowColor: stateColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: glowRadius,
      elevation: glowRadius,
    };
  });

  const backgroundStyle = useAnimatedStyle(() => {
    const morphedRadius = interpolate(morphProgress.value, [0, 1], [8, 20]);
    const morphedPadding = interpolate(morphProgress.value, [0, 1], [8, 12]);
    
    return {
      borderRadius: morphedRadius,
      paddingHorizontal: morphedPadding,
      paddingVertical: morphedPadding * 0.7,
    };
  });

  const emoji = useMemo(() => 
    getItemEmoji(item.category || 'default', item.confidence || 0.5), 
    [item.category, item.confidence]
  );

  const confidencePercentage = Math.round((item.confidence || 0) * 100);

  return (
    <Animated.View style={[styles.targetItem, animatedStyle]}>
      <Animated.View style={[styles.targetBackground, backgroundStyle, glowStyle]}>
        <BlurView intensity={20} style={styles.blurBackground}>
          <View style={styles.targetContent}>
            <Text style={[styles.targetEmoji, { color: stateColor }]}>
              {emoji}
            </Text>
            <Text style={[styles.targetLabel, { color: stateColor }]}>
              {item.label || 'TARGET'}
            </Text>
            <Text style={[styles.targetConfidence, { color: stateColor }]}>
              {confidencePercentage}%
            </Text>
          </View>
        </BlurView>
      </Animated.View>
    </Animated.View>
  );
});

// Main scroller component
export const UltraTargetsScroller: React.FC = React.memo(() => {
  // Context state
  const detectedItems = useDetectedItems();
  const currentState = useTerminatorState();
  const stateColor = useTerminatorColor();
  const stateDisplay = useTerminatorDisplay();

  // Animation values
  const scrollOffset = useSharedValue(0);
  const containerOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.8);
  const blinkOpacity = useSharedValue(1);

  // Auto-scroll animation
  useEffect(() => {
    if (currentState === 'tracking' && detectedItems.length > 0) {
      // Show container
      containerOpacity.value = withSpring(1, { damping: 15 });
      headerScale.value = withSpring(1, { damping: 12 });
      
      // Start continuous scroll
      const scrollDistance = detectedItems.length * 120 + 200;
      scrollOffset.value = withRepeat(
        withTiming(-scrollDistance, { duration: 8000 }),
        -1,
        false
      );
      
      // Blinking effect for "TARGETS ACQUIRED"
      blinkOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 300 }),
          withTiming(1, { duration: 700 })
        ),
        -1,
        false
      );
    } else {
      // Hide container
      containerOpacity.value = withTiming(0, { duration: 500 });
      headerScale.value = withTiming(0.8, { duration: 500 });
      cancelAnimation(scrollOffset);
      cancelAnimation(blinkOpacity);
    }
  }, [currentState, detectedItems.length]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));

  const scrollStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollOffset.value }],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: blinkOpacity.value,
  }));

  // Performance monitoring
  const renderCount = useSharedValue(0);
  
  useEffect(() => {
    renderCount.value += 1;
    if (renderCount.value % 30 === 0) {
      runOnJS(() => {
        console.log(`🎯 Targets Scroller: ${renderCount.value} renders, ${detectedItems.length} items`);
      })();
    }
  });

  // Don't render if no items or not in tracking state
  if (detectedItems.length === 0 || currentState !== 'tracking') {
    return null;
  }

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <BlurView intensity={30} style={styles.containerBlur}>
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <Text style={[styles.headerText, { color: stateColor }]}>
            🎯 TARGETS ACQUIRED: [{detectedItems.length} LOCKED]
          </Text>
        </Animated.View>

        {/* Scrolling targets */}
        <View style={styles.scrollContainer}>
          <Animated.View style={[styles.scrollContent, scrollStyle]}>
            {/* Duplicate items for seamless loop */}
            {[...detectedItems, ...detectedItems, ...detectedItems].map((item, index) => (
              <UltraTargetItem
                key={`${item.id || 'item'}-${index}`}
                item={item}
                index={index % detectedItems.length}
                stateColor={stateColor}
                currentState={currentState}
                isVisible={true}
              />
            ))}
          </Animated.View>
        </View>

        {/* Status indicator */}
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: stateColor }]}>
            {stateDisplay}
          </Text>
        </View>
      </BlurView>
    </Animated.View>
  );
});

UltraTargetsScroller.displayName = 'UltraTargetsScroller';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1000,
  },
  
  containerBlur: {
    flex: 1,
    borderRadius: 15,
    marginHorizontal: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  
  header: {
    paddingHorizontal: 15,
    paddingTop: 10,
    alignItems: 'center',
  },
  
  headerText: {
    fontFamily: 'Courier New',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 255, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  
  scrollContainer: {
    height: 60,
    overflow: 'hidden',
    marginTop: 5,
  },
  
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  
  targetItem: {
    marginHorizontal: 8,
    alignItems: 'center',
  },
  
  targetBackground: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  
  blurBackground: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  
  targetContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  
  targetEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  
  targetLabel: {
    fontFamily: 'Courier New',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  
  targetConfidence: {
    fontFamily: 'Courier New',
    fontSize: 8,
    opacity: 0.8,
    marginTop: 1,
  },
  
  statusContainer: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  
  statusText: {
    fontFamily: 'Courier New',
    fontSize: 10,
    opacity: 0.7,
    textTransform: 'uppercase',
  },
});