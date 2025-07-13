import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { RandomOutfitOptions } from '../utils/RandomOutfitGenerator';
import { StyleCompatibility } from '../utils/StyleCompatibility';
import SpeedDialIcon from './SpeedDialIcon';

interface RandomOutfitButtonsProps {
  onGenerate: (options?: RandomOutfitOptions) => void;
  onAIGenerate?: () => void;  // New prop for AI generation
  isGenerating: boolean;
  disabled?: boolean;
  style?: any;
}

interface StyleButtonData {
  style: string | undefined;
  emoji: string;
  name: string;
  colors: string[];
  icon: any; // PNG image require
}

const STYLE_BUTTONS: StyleButtonData[] = [
  {
    style: undefined,
    emoji: '🎲',
    name: 'Surprise',
    colors: ['#FF6B6B', '#4ECDC4'], // Gradient colors
    icon: require('../assets/surprise.png')
  },
  {
    style: 'casual',
    emoji: '👕',
    name: 'Casual',
    colors: ['#74B9FF', '#0984E3'],
    icon: require('../assets/casual.png')
  },
  {
    style: 'business',
    emoji: '💼',
    name: 'Business',
    colors: ['#636E72', '#2D3436'],
    icon: require('../assets/business.png')
  },
  {
    style: 'sporty',
    emoji: '🏃‍♀️',
    name: 'Sporty',
    colors: ['#00B894', '#00A085'],
    icon: require('../assets/sporty.png')
  },
  {
    style: 'date_night',
    emoji: '💃',
    name: 'Date Night',
    colors: ['#E84393', '#D63031'],
    icon: require('../assets/datenight.png')
  },
  {
    style: 'weekend',
    emoji: '🏠',
    name: 'Weekend',
    colors: ['#FDCB6E', '#E17055'],
    icon: require('../assets/weekend.png')
  },
  {
    style: 'party',
    emoji: '🎉',
    name: 'Party',
    colors: ['#A29BFE', '#6C5CE7'],
    icon: require('../assets/party.png')
  },
  {
    style: 'ai', // Special AI style
    emoji: '🤖',
    name: 'AI',
    colors: ['#00D2FF', '#3A7BFF'], // Futuristic blue gradient
    icon: require('../assets/ai.png')
  }
];

export const RandomOutfitButtons: React.FC<RandomOutfitButtonsProps> = React.memo(({
  onGenerate,
  onAIGenerate,
  isGenerating,
  disabled = false,
  style
}) => {
  const { theme } = useTheme();
  const [rotateAnimations] = useState(() => 
    STYLE_BUTTONS.map(() => new Animated.Value(0))
  );
  
  // Log mount/unmount for performance debugging
  useEffect(() => {
    console.log('[PERFORMANCE] RandomOutfitButtons mounted');
    return () => {
      console.log('[PERFORMANCE] RandomOutfitButtons unmounted');
    };
  }, []);

  const handleStylePress = (buttonData: StyleButtonData, index: number) => {
    if (disabled || isGenerating) return;

    // Create rotation animation for the pressed button
    const rotation = Animated.timing(rotateAnimations[index], {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    rotation.start(() => {
      rotateAnimations[index].setValue(0);
    });

    // Handle AI button differently
    if (buttonData.style === 'ai') {
      if (onAIGenerate) {
        onAIGenerate();
      }
      return;
    }

    const options: RandomOutfitOptions = {
      style: buttonData.style,
      includeAccessories: Math.random() > 0.6, // 40% chance
      includeJacket: Math.random() > 0.5, // 50% chance
      avoidRecentlyWorn: true
    };

    onGenerate(options);
  };

  return (
    <View style={[styles.container, style]}>
      
      <View style={styles.buttonsGrid}>
        {STYLE_BUTTONS.map((buttonData, index) => {
          const rotateInterpolate = rotateAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          });

          const isButtonDisabled = disabled || isGenerating;

          return (
            <TouchableOpacity
              key={buttonData.style || 'random'}
              style={[
                styles.iconOnlyButton,
                {
                  opacity: isButtonDisabled ? 0.5 : 1
                }
              ]}
              onPress={() => handleStylePress(buttonData, index)}
              disabled={isButtonDisabled}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[{ transform: [{ rotate: rotateInterpolate }] }]}
              >
                <SpeedDialIcon
                  source={buttonData.icon}
                  fallbackEmoji={buttonData.emoji}
                  size={50}
                  style={styles.iconOnlyImage}
                />
              </Animated.View>
              
              <Text style={styles.iconOnlyLabel}>
                {buttonData.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isGenerating && (
        <View style={[styles.generatingIndicator, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.generatingText, { color: theme.colors.primary }]}>
            ✨ Creating your outfit...
          </Text>
        </View>
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if these props actually change
  return (
    prevProps.isGenerating === nextProps.isGenerating &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.onGenerate === nextProps.onGenerate &&
    prevProps.onAIGenerate === nextProps.onAIGenerate &&
    prevProps.style === nextProps.style
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: 350,
  },
  styleButton: {
    width: 75,
    height: 75,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
  },
  emojiIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  iconImage: {
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  iconOnlyButton: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
  },
  iconOnlyImage: {
    width: 50,
    height: 50,
    marginBottom: 6,
  },
  iconOnlyLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333333',
  },
  styleName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  generatingIndicator: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  generatingText: {
    fontSize: 16,
    fontWeight: '600',
  },
});