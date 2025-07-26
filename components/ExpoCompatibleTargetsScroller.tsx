/**
 * Expo Go Compatible Targets Scroller
 * DJI-inspired targets display using standard React Native components
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  interpolate,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { 
  useDetectedItems, 
  useTerminatorState, 
  useTerminatorColor,
  useTerminatorDisplay 
} from '../contexts/TerminatorContext';
import { DetectedClothingItem } from '../types/ClothingTypes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Enhanced emoji mapping (DJI-style category indicators)
const CATEGORY_EMOJIS = {
  top: ['👕', '👔', '🎽', '👘'],
  bottom: ['👖', '🩳', '👗', '🩱'],
  shoes: ['👟', '👠', '🥾', '🩴'],
  accessories: ['👜', '🎒', '👒', '🧣'],
  jacket: ['🧥', '🧤', '🦺'],
  hat: ['👒', '🧢', '👑'],
  default: ['👕', '👖', '👟'],
};

const getItemEmoji = (category: string, confidence: number): string => {
  const emojis = CATEGORY_EMOJIS[category as keyof typeof CATEGORY_EMOJIS] || CATEGORY_EMOJIS.default;
  const index = Math.floor(confidence * emojis.length);
  return emojis[Math.min(index, emojis.length - 1)];
};

// Individual target item (DJI-style tracking indicator)
const DJITargetItem = React.memo<{
  item: DetectedClothingItem;
  index: number;
  stateColor: string;
  currentState: string;
  isVisible: boolean;
}>(({ item, index, stateColor, currentState, isVisible }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const confidencePulse = useSharedValue(0);

  useEffect(() => {
    console.log(`🎯 DJI Target ${index} render:`, { 
      label: item.label, 
      confidence: item.confidence, 
      isVisible, 
      currentState 
    });

    if (isVisible && currentState === 'tracking') {
      // DJI-style staggered entrance
      const delay = index * 100;
      
      setTimeout(() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
        opacity.value = withSpring(1, { damping: 15 });
        glowIntensity.value = withSpring(item.confidence || 0.5);
        
        // DJI-style confidence pulse
        confidencePulse.value = withRepeat(
          withSequence(
            withTiming(0.2, { duration: 1000 }),
            withTiming(0, { duration: 1000 })
          ),
          -1,
          false
        );
      }, delay);
    } else {
      scale.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
      cancelAnimation(confidencePulse);
    }
  }, [isVisible, currentState, index, item.confidence]);

  const animatedStyle = useAnimatedStyle(() => {
    const animatedScale = scale.value * (1 + confidencePulse.value * 0.1);
    const animatedOpacity = opacity.value * (0.8 + confidencePulse.value * 0.2);
    
    return {
      transform: [{ scale: animatedScale }],
      opacity: animatedOpacity,
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(
      glowIntensity.value + confidencePulse.value,
      [0, 1],
      [0, 8]
    );
    
    return {
      shadowRadius,
      elevation: shadowRadius,
    };
  });

  const emoji = useMemo(() => 
    getItemEmoji(item.category || 'default', item.confidence || 0.5), 
    [item.category, item.confidence]
  );

  const confidencePercentage = Math.round((item.confidence || 0) * 100);

  return (
    <Animated.View style={[styles.targetItem, animatedStyle]}>
      <Animated.View 
        style={[
          styles.targetBackground, 
          { 
            backgroundColor: stateColor + '20',
            borderColor: stateColor + '60',
            shadowColor: stateColor,
          },
          shadowStyle
        ]}
      >
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
      </Animated.View>
    </Animated.View>
  );
});

// Main scroller component (DJI-inspired)
export const ExpoCompatibleTargetsScroller: React.FC = React.memo(() => {
  const detectedItems = useDetectedItems();
  const currentState = useTerminatorState();
  const stateColor = useTerminatorColor();
  const stateDisplay = useTerminatorDisplay();

  const containerOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.8);
  const blinkOpacity = useSharedValue(1);

  // Debug logging
  useEffect(() => {
    console.log(`🎯 ExpoCompatibleTargetsScroller render:`, {
      currentState,
      itemCount: detectedItems.length,
      shouldRender: currentState === 'tracking' && detectedItems.length > 0
    });
  });

  useEffect(() => {
    if (currentState === 'tracking' && detectedItems.length > 0) {
      console.log(`🎯 Targets Scroller: ACTIVATING with ${detectedItems.length} items`);
      
      containerOpacity.value = withSpring(1, { damping: 15 });
      headerScale.value = withSpring(1, { damping: 12 });
      
      // DJI-style blinking effect
      blinkOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 300 }),
          withTiming(1, { duration: 700 })
        ),
        -1,
        false
      );
    } else {
      console.log(`🎯 Targets Scroller: DEACTIVATING`);
      
      containerOpacity.value = withTiming(0, { duration: 500 });
      headerScale.value = withTiming(0.8, { duration: 500 });
      cancelAnimation(blinkOpacity);
    }
  }, [currentState, detectedItems.length]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: blinkOpacity.value,
  }));

  // Don't render if conditions not met
  if (detectedItems.length === 0 || currentState !== 'tracking') {
    return null;
  }

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={[styles.containerBackground, { backgroundColor: 'rgba(0, 0, 0, 0.7)', borderColor: stateColor + '60' }]}>
        {/* DJI-style header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <Text style={[styles.headerText, { color: stateColor }]}>
            🎯 TARGETS ACQUIRED: [{detectedItems.length} LOCKED]
          </Text>
        </Animated.View>

        {/* Horizontal scrolling targets (DJI-style) */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollContainer}
        >
          {detectedItems.map((item, index) => (
            <DJITargetItem
              key={`${item.id || 'item'}-${index}`}
              item={item}
              index={index}
              stateColor={stateColor}
              currentState={currentState}
              isVisible={true}
            />
          ))}
        </ScrollView>

        {/* Status indicator (DJI-style) */}
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: stateColor }]}>
            {stateDisplay}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
});

ExpoCompatibleTargetsScroller.displayName = 'ExpoCompatibleTargetsScroller';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80, // Below debug display
    left: 0,
    right: 0,
    height: 120,
    zIndex: 999,
  },
  
  containerBackground: {
    flex: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  
  header: {
    paddingHorizontal: 12,
    paddingTop: 8,
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
    marginTop: 4,
  },
  
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  
  targetItem: {
    marginHorizontal: 6,
    alignItems: 'center',
  },
  
  targetBackground: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
  },
  
  targetContent: {
    alignItems: 'center',
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
    paddingBottom: 6,
  },
  
  statusText: {
    fontFamily: 'Courier New',
    fontSize: 10,
    opacity: 0.7,
    textTransform: 'uppercase',
  },
});