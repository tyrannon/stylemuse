import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Easing
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { RandomOutfitOptions } from '../utils/RandomOutfitGenerator';
import { StyleCompatibility } from '../utils/StyleCompatibility';

interface RandomOutfitButtonProps {
  onGenerate: (options?: RandomOutfitOptions) => void;
  isGenerating: boolean;
  disabled?: boolean;
  style?: any;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'minimal';
}

interface StyleSelectorProps {
  visible: boolean;
  onSelect: (style: string | undefined) => void;
  onCancel: () => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ visible, onSelect, onCancel }) => {
  const { theme } = useTheme();
  
  if (!visible) return null;

  const styles = StyleCompatibility.getAvailableStyles();
  const styleDisplayNames: Record<string, string> = {
    casual: '👕 Casual',
    business: '💼 Business',
    sporty: '🏃‍♀️ Sporty',
    date_night: '💃 Date Night',
    weekend: '🏠 Weekend',
    party: '🎉 Party'
  };

  return (
    <View style={[styleSelectionStyles.overlay, { backgroundColor: theme.colors.overlay }]}>
      <View style={[styleSelectionStyles.modal, { backgroundColor: theme.colors.card }]}>
        <Text style={[styleSelectionStyles.title, { color: theme.colors.text }]}>
          Choose Style
        </Text>
        
        <TouchableOpacity
          style={[styleSelectionStyles.option, { borderColor: theme.colors.border }]}
          onPress={() => onSelect(undefined)}
        >
          <Text style={[styleSelectionStyles.optionText, { color: theme.colors.text }]}>
            🎲 Surprise Me (Random Style)
          </Text>
        </TouchableOpacity>

        {styles.map((style) => (
          <TouchableOpacity
            key={style}
            style={[styleSelectionStyles.option, { borderColor: theme.colors.border }]}
            onPress={() => onSelect(style)}
          >
            <Text style={[styleSelectionStyles.optionText, { color: theme.colors.text }]}>
              {styleDisplayNames[style] || style}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styleSelectionStyles.cancelButton, { backgroundColor: theme.colors.border }]}
          onPress={onCancel}
        >
          <Text style={[styleSelectionStyles.cancelText, { color: theme.colors.text }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const RandomOutfitButton: React.FC<RandomOutfitButtonProps> = ({
  onGenerate,
  isGenerating,
  disabled = false,
  style,
  size = 'medium',
  variant = 'primary'
}) => {
  const { theme } = useTheme();
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [rotateAnimation] = useState(new Animated.Value(0));

  // Animation for the dice icon when generating
  React.useEffect(() => {
    if (isGenerating) {
      const rotation = Animated.loop(
        Animated.timing(rotateAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotation.start();
      return () => rotation.stop();
    } else {
      rotateAnimation.setValue(0);
    }
  }, [isGenerating, rotateAnimation]);

  const handlePress = () => {
    if (disabled || isGenerating) return;
    setShowStyleSelector(true);
  };

  const handleStyleSelect = (selectedStyle?: string) => {
    setShowStyleSelector(false);
    
    const options: RandomOutfitOptions = {
      style: selectedStyle,
      includeAccessories: Math.random() > 0.6, // 40% chance
      includeJacket: Math.random() > 0.5, // 50% chance
      avoidRecentlyWorn: true
    };

    onGenerate(options);
  };

  const handleCancel = () => {
    setShowStyleSelector(false);
  };

  const getButtonStyles = () => {
    const baseStyle = [styles.button];
    
    // Size variations
    if (size === 'small') baseStyle.push(styles.buttonSmall);
    if (size === 'large') baseStyle.push(styles.buttonLarge);

    // Variant styles
    if (variant === 'primary') {
      baseStyle.push([styles.buttonPrimary, { backgroundColor: theme.colors.primary }]);
    } else if (variant === 'secondary') {
      baseStyle.push([styles.buttonSecondary, { 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.primary,
        borderWidth: 2
      }]);
    } else {
      baseStyle.push([styles.buttonMinimal, { backgroundColor: theme.colors.surface }]);
    }

    // Disabled state
    if (disabled || isGenerating) {
      baseStyle.push([styles.buttonDisabled, { backgroundColor: theme.colors.border }]);
    }

    return baseStyle;
  };

  const getTextStyles = () => {
    const baseStyle = [styles.buttonText];
    
    if (size === 'small') baseStyle.push(styles.textSmall);
    if (size === 'large') baseStyle.push(styles.textLarge);

    if (variant === 'primary') {
      baseStyle.push({ color: '#FFFFFF' });
    } else {
      baseStyle.push({ color: theme.colors.primary });
    }

    if (disabled || isGenerating) {
      baseStyle.push({ color: theme.colors.textMuted });
    }

    return baseStyle;
  };

  const rotateInterpolate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <>
      <TouchableOpacity
        style={[getButtonStyles(), style]}
        onPress={handlePress}
        disabled={disabled || isGenerating}
        activeOpacity={0.7}
      >
        <Animated.Text
          style={[
            styles.diceIcon,
            isGenerating && { transform: [{ rotate: rotateInterpolate }] }
          ]}
        >
          🎲
        </Animated.Text>
        
        <Text style={getTextStyles()}>
          {isGenerating ? 'Generating...' : 'Random Outfit'}
        </Text>
      </TouchableOpacity>

      <StyleSelector
        visible={showStyleSelector}
        onSelect={handleStyleSelect}
        onCancel={handleCancel}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonSmall: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonLarge: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
  },
  buttonPrimary: {
    // Background set dynamically
  },
  buttonSecondary: {
    // Background and border set dynamically
  },
  buttonMinimal: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  textSmall: {
    fontSize: 14,
    marginLeft: 6,
  },
  textLarge: {
    fontSize: 18,
    marginLeft: 10,
  },
  diceIcon: {
    fontSize: 20,
  },
});

const styleSelectionStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});