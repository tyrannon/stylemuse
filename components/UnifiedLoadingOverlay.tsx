import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface LoadingStep {
  icon: string;
  text: string;
  completed?: boolean;
}

interface UnifiedLoadingOverlayProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  steps?: LoadingStep[];
  icon?: string;
  style?: 'outfit' | 'analysis' | 'save' | 'fetch' | 'generate';
}

const getStyleConfig = (style: string = 'generate') => {
  switch (style) {
    case 'outfit':
      return {
        primaryColor: '#667eea',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        cardBackground: '#FFFFFF',
      };
    case 'analysis':
      return {
        primaryColor: '#8b5cf6',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        cardBackground: '#FFFFFF',
      };
    case 'save':
      return {
        primaryColor: '#10b981',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        cardBackground: '#FFFFFF',
      };
    case 'fetch':
      return {
        primaryColor: '#06b6d4',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        cardBackground: '#FFFFFF',
      };
    default: // 'generate'
      return {
        primaryColor: '#667eea',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        cardBackground: '#FFFFFF',
      };
  }
};

const getDarkModeConfig = (style: string = 'generate') => {
  const baseConfig = getStyleConfig(style);
  return {
    ...baseConfig,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    cardBackground: '#1C1C1E',
  };
};

export const UnifiedLoadingOverlay: React.FC<UnifiedLoadingOverlayProps> = ({
  visible,
  title,
  subtitle,
  steps = [],
  icon,
  style = 'generate',
}) => {
  const { theme, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const styleConfig = isDark ? getDarkModeConfig(style) : getStyleConfig(style);

  useEffect(() => {
    if (visible) {
      // Fade in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade out animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible) {
    return null;
  }

  const dynamicStyles = StyleSheet.create({
    overlay: {
      ...styles.overlay,
      backgroundColor: theme.colors.loadingOverlay,
    },
    card: {
      ...styles.card,
      backgroundColor: theme.colors.loadingCard,
      borderColor: theme.colors.border,
      ...theme.shadows.large,
    },
    title: {
      ...styles.title,
      color: theme.colors.text,
    },
    subtitle: {
      ...styles.subtitle,
      color: theme.colors.textSecondary,
    },
    step: {
      ...styles.step,
      color: theme.colors.textMuted,
    },
  });

  return (
    <Animated.View
      style={[
        dynamicStyles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          dynamicStyles.card,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <ActivityIndicator size="large" color={styleConfig.primaryColor} />
        
        <Text style={dynamicStyles.title}>
          {icon && `${icon} `}{title}
        </Text>
        
        {subtitle && (
          <Text style={dynamicStyles.subtitle}>
            {subtitle}
          </Text>
        )}
        
        {steps.length > 0 && (
          <View style={styles.progress}>
            {steps.map((step, index) => (
              <Text key={index} style={dynamicStyles.step}>
                {step.icon} {step.text}
              </Text>
            ))}
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 12,
  },
  card: {
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    minWidth: 280,
    maxWidth: 320,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  progress: {
    marginTop: 20,
    alignItems: 'center',
    gap: 4,
  },
  step: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});