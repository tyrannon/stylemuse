import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions, Alert } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { logger } from '../../../utils/DebugLogger';
import { LogCategories } from '../../../constants/LogCategories';

interface WelcomeScreenProps {
  navigation: any;
  route: any;
}

const { width } = Dimensions.get('window');

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const { skipOnboarding } = route.params;

  useEffect(() => {
    logger.info(LogCategories.USER_ACTION, 'Welcome screen opened', {
      screen: 'onboarding_welcome',
      timestamp: new Date().toISOString()
    });

    const animations = [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ];

    Animated.parallel(animations).start();
  }, []);

  const benefits = [
    { 
      icon: '🎯', 
      title: 'Smart Outfits', 
      desc: 'AI-powered daily suggestions based on your style and wardrobe' 
    },
    { 
      icon: '👔', 
      title: 'Wardrobe Manager', 
      desc: 'Never forget what you own, track what you wear' 
    },
    { 
      icon: '📊', 
      title: 'Style Insights', 
      desc: 'Understand your fashion habits and optimize your wardrobe' 
    }
  ];

  const handleGetStarted = () => {
    logger.info(LogCategories.USER_ACTION, 'Get started button pressed', {
      screen: 'onboarding_welcome',
      action: 'get_started'
    });
    navigation.navigate('StyleGoals');
  };

  const handleSkip = () => {
    logger.info(LogCategories.USER_ACTION, 'Skip onboarding button pressed', {
      screen: 'onboarding_welcome',
      action: 'skip'
    });
    
    // Show confirmation dialog
    Alert.alert(
      '🎯 Skip Onboarding?',
      'Are you sure you want to skip the personalization setup? You can always access these settings later in your profile.',
      [
        {
          text: 'Go Back',
          style: 'cancel',
          onPress: () => {
            logger.info(LogCategories.USER_ACTION, 'Skip onboarding cancelled');
          }
        },
        {
          text: 'Skip Setup',
          style: 'default',
          onPress: () => {
            logger.info(LogCategories.USER_ACTION, 'Skip onboarding confirmed');
            skipOnboarding();
          }
        }
      ]
    );
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to StyleMuse</Text>
          <Text style={styles.subtitle}>Your AI-Powered Personal Stylist</Text>
        </View>

        <View style={styles.benefitsContainer}>
          {benefits.map((benefit, index) => (
            <Animated.View
              key={index}
              style={[
                styles.benefitCard,
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 50],
                      outputRange: [0, 20 + (index * 10)],
                    }),
                  }],
                }
              ]}
            >
              <View style={styles.benefitIconContainer}>
                <Text style={styles.benefitIcon}>{benefit.icon}</Text>
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDesc}>{benefit.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        <View style={styles.valueProposition}>
          <Text style={styles.valueTitle}>✨ Why StyleMuse?</Text>
          <Text style={styles.valueText}>
            Unlike other fashion apps, StyleMuse learns your actual wardrobe, 
            tracks what you wear, and suggests outfits from clothes you already own. 
            It's like having a personal stylist who knows your closet inside and out.
          </Text>
        </View>
      </Animated.View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSkip}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>I'm Already a Pro</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsContainer: {
    marginBottom: 30,
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitIcon: {
    fontSize: 24,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  valueProposition: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  valueText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingTop: 20,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});