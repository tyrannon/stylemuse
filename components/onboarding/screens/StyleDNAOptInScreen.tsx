import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { logger } from '../../../utils/DebugLogger';
import { LogCategories } from '../../../constants/LogCategories';

interface StyleDNAOptInScreenProps {
  navigation: any;
  route: any;
}

export const StyleDNAOptInScreen: React.FC<StyleDNAOptInScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [styleDNAEnabled, setStyleDNAEnabled] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const pulseAnim = new Animated.Value(1);

  const { onboardingData, setOnboardingData, currentStep, totalSteps, saveProgress } = route.params;

  useEffect(() => {
    logger.info(LogCategories.USER_ACTION, 'StyleDNA opt-in screen opened', {
      screen: 'onboarding_style_dna',
      step: currentStep,
      totalSteps
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Pulse animation for the DNA icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const handleToggleStyleDNA = () => {
    setStyleDNAEnabled(!styleDNAEnabled);
    logger.debug(LogCategories.USER_ACTION, 'StyleDNA toggled', {
      enabled: !styleDNAEnabled,
      screen: 'onboarding_style_dna'
    });
  };

  const handleContinue = async () => {
    logger.info(LogCategories.USER_ACTION, 'StyleDNA opt-in completed', {
      styleDNAEnabled,
      screen: 'onboarding_style_dna'
    });

    const updatedData = {
      ...onboardingData,
      privacySettings: {
        ...onboardingData.privacySettings,
        styleDNA: styleDNAEnabled
      }
    };

    setOnboardingData(updatedData);
    await saveProgress(updatedData, currentStep + 1);
    navigation.navigate('Privacy');
  };

  const features = [
    {
      icon: '🎯',
      title: 'Hyper-Personalized Outfits',
      description: 'AI learns your unique style preferences and body type for perfect suggestions'
    },
    {
      icon: '🧠',
      title: 'Advanced Pattern Recognition',
      description: 'Understands subtle style cues like fabric preferences, fit, and color combinations'
    },
    {
      icon: '📊',
      title: 'Style Evolution Tracking',
      description: 'Monitors how your style changes over time and adapts recommendations accordingly'
    },
    {
      icon: '💡',
      title: 'Predictive Styling',
      description: 'Suggests outfits before you even know you want them, based on your habits'
    }
  ];

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((currentStep + 1) / totalSteps) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {currentStep + 1} of {totalSteps}
            </Text>
          </View>

          <Animated.View 
            style={[
              styles.dnaIconContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Text style={styles.dnaIcon}>🧬</Text>
          </Animated.View>

          <Text style={styles.title}>Unlock Your Style DNA</Text>
          <Text style={styles.subtitle}>
            Enable advanced AI personalization for the ultimate styling experience
          </Text>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.featureCard,
                  {
                    opacity: fadeAnim,
                    transform: [{
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    }],
                  }
                ]}
              >
                <View style={styles.featureIconContainer}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          <View style={styles.privacySection}>
            <Text style={styles.privacyTitle}>🔒 Your Privacy Matters</Text>
            <View style={styles.privacyPoints}>
              <Text style={styles.privacyPoint}>• All data is processed locally when possible</Text>
              <Text style={styles.privacyPoint}>• No personal photos are stored permanently</Text>
              <Text style={styles.privacyPoint}>• Style patterns are anonymized and encrypted</Text>
              <Text style={styles.privacyPoint}>• You can disable this anytime in settings</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.toggleContainer,
              styleDNAEnabled && styles.toggleContainerActive
            ]}
            onPress={handleToggleStyleDNA}
            activeOpacity={0.8}
          >
            <View style={styles.toggleContent}>
              <Text style={[
                styles.toggleTitle,
                styleDNAEnabled && styles.toggleTitleActive
              ]}>
                {styleDNAEnabled ? '✨ Style DNA Enabled' : 'Enable Style DNA'}
              </Text>
              <Text style={[
                styles.toggleDescription,
                styleDNAEnabled && styles.toggleDescriptionActive
              ]}>
                {styleDNAEnabled 
                  ? 'Get ready for incredible personalization!' 
                  : 'Tap to unlock advanced AI styling'
                }
              </Text>
            </View>
            <View style={[
              styles.toggleSwitch,
              styleDNAEnabled && styles.toggleSwitchActive
            ]}>
              <View style={[
                styles.toggleIndicator,
                styleDNAEnabled && styles.toggleIndicatorActive
              ]} />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {styleDNAEnabled ? 'Continue with Style DNA' : 'Continue without Style DNA'}
          </Text>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  dnaIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dnaIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
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
  scrollContainer: {
    flex: 1,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  privacySection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  privacyPoints: {
    paddingLeft: 8,
  },
  privacyPoint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  toggleContainerActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  toggleTitleActive: {
    color: theme.colors.primary,
  },
  toggleDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  toggleDescriptionActive: {
    color: theme.colors.primary,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleIndicatorActive: {
    alignSelf: 'flex-end',
  },
  buttonContainer: {
    paddingTop: 20,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});