import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { RandomOutfitOptions } from '../utils/RandomOutfitGenerator';
import { StyleCompatibility } from '../utils/StyleCompatibility';

interface RandomOutfitButtonsProps {
  onGenerate: (options?: RandomOutfitOptions) => void;
  isGenerating: boolean;
  disabled?: boolean;
  style?: any;
}

interface StyleButtonData {
  style: string | undefined;
  emoji: string;
  name: string;
  colors: string[];
}

const STYLE_BUTTONS: StyleButtonData[] = [
  {
    style: undefined,
    emoji: '🎲',
    name: 'Surprise',
    colors: ['#FF6B6B', '#4ECDC4'] // Gradient colors
  },
  {
    style: 'casual',
    emoji: '👕',
    name: 'Casual',
    colors: ['#74B9FF', '#0984E3']
  },
  {
    style: 'business',
    emoji: '💼',
    name: 'Business',
    colors: ['#636E72', '#2D3436']
  },
  {
    style: 'sporty',
    emoji: '🏃‍♀️',
    name: 'Sporty',
    colors: ['#00B894', '#00A085']
  },
  {
    style: 'date_night',
    emoji: '💃',
    name: 'Date Night',
    colors: ['#E84393', '#D63031']
  },
  {
    style: 'weekend',
    emoji: '🏠',
    name: 'Weekend',
    colors: ['#FDCB6E', '#E17055']
  },
  {
    style: 'party',
    emoji: '🎉',
    name: 'Party',
    colors: ['#A29BFE', '#6C5CE7']
  }
];

export const RandomOutfitButtons: React.FC<RandomOutfitButtonsProps> = ({
  onGenerate,
  isGenerating,
  disabled = false,
  style
}) => {
  const { theme } = useTheme();
  const [rotateAnimations] = useState(() => 
    STYLE_BUTTONS.map(() => new Animated.Value(0))
  );

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
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Quick Outfit Styles
      </Text>
      
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
                styles.styleButton,
                {
                  backgroundColor: buttonData.colors[0],
                  borderColor: buttonData.colors[1],
                  opacity: isButtonDisabled ? 0.5 : 1
                }
              ]}
              onPress={() => handleStylePress(buttonData, index)}
              disabled={isButtonDisabled}
              activeOpacity={0.8}
            >
              <Animated.Text
                style={[
                  styles.emojiIcon,
                  { transform: [{ rotate: rotateInterpolate }] }
                ]}
              >
                {buttonData.emoji}
              </Animated.Text>
              
              <Text style={[styles.styleName, { color: '#FFFFFF' }]}>
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
};

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