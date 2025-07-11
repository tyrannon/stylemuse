import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Switch } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { logger } from '../../../utils/DebugLogger';
import { LogCategories } from '../../../constants/LogCategories';

interface PrivacyOption {
  key: keyof PrivacySettings;
  title: string;
  description: string;
  benefit: string;
  icon: string;
  importance: 'essential' | 'recommended' | 'optional';
}

interface PrivacySettings {
  analytics: boolean;
  shopping: boolean;
  trendReports: boolean;
  notifications: boolean;
  dataSharing: boolean;
}

interface PrivacyChoicesScreenProps {
  navigation: any;
  route: any;
}

export const PrivacyChoicesScreen: React.FC<PrivacyChoicesScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    analytics: true,
    shopping: false,
    trendReports: false,
    notifications: true,
    dataSharing: false,
  });
  const fadeAnim = new Animated.Value(0);

  const { onboardingData, setOnboardingData, currentStep, totalSteps, saveProgress } = route.params;

  useEffect(() => {
    logger.info(LogCategories.USER_ACTION, 'Privacy choices screen opened', {
      screen: 'onboarding_privacy',
      step: currentStep,
      totalSteps
    });

    // Initialize with existing settings if available
    if (onboardingData.privacySettings) {
      setPrivacySettings(prev => ({
        ...prev,
        ...onboardingData.privacySettings
      }));
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const privacyOptions: PrivacyOption[] = [
    {
      key: 'analytics',
      title: 'Help improve StyleMuse',
      description: 'Share anonymous app usage data to help us improve features and fix bugs',
      benefit: 'Better app experience for everyone',
      icon: '📊',
      importance: 'recommended'
    },
    {
      key: 'shopping',
      title: 'Personalized shopping recommendations',
      description: 'Get product suggestions based on your style and wardrobe gaps',
      benefit: 'Save time finding perfect items',
      icon: '🛍️',
      importance: 'optional'
    },
    {
      key: 'trendReports',
      title: 'Contribute to fashion insights',
      description: 'Help create anonymous trend reports while getting free quarterly insights',
      benefit: 'Free trend reports & style forecasts',
      icon: '📈',
      importance: 'optional'
    },
    {
      key: 'notifications',
      title: 'Style notifications',
      description: 'Get reminders for outfit planning and style tips',
      benefit: 'Never miss styling opportunities',
      icon: '🔔',
      importance: 'recommended'
    },
    {
      key: 'dataSharing',
      title: 'Anonymous data contribution',
      description: 'Contribute to fashion AI research with fully anonymized data',
      benefit: 'Advance fashion technology for everyone',
      icon: '🤝',
      importance: 'optional'
    }
  ];

  const handleToggle = (key: keyof PrivacySettings) => {
    setPrivacySettings(prev => {
      const newSettings = {
        ...prev,
        [key]: !prev[key]
      };

      logger.debug(LogCategories.USER_ACTION, 'Privacy setting toggled', {
        setting: key,
        enabled: newSettings[key],
        screen: 'onboarding_privacy'
      });

      return newSettings;
    });
  };

  const handleContinue = async () => {
    logger.info(LogCategories.USER_ACTION, 'Privacy choices completed', {
      privacySettings,
      optInsCount: Object.values(privacySettings).filter(Boolean).length,
      screen: 'onboarding_privacy'
    });

    const updatedData = {
      ...onboardingData,
      privacySettings: {
        ...onboardingData.privacySettings,
        ...privacySettings
      }
    };

    setOnboardingData(updatedData);
    await saveProgress(updatedData, currentStep + 1);
    navigation.navigate('TierSelection');
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'essential':
        return theme.colors.error;
      case 'recommended':
        return theme.colors.warning;
      case 'optional':
        return theme.colors.textSecondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getImportanceLabel = (importance: string) => {
    switch (importance) {
      case 'essential':
        return 'Essential';
      case 'recommended':
        return 'Recommended';
      case 'optional':
        return 'Optional';
      default:
        return '';
    }
  };

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

          <Text style={styles.title}>Your Privacy, Your Choice</Text>
          <Text style={styles.subtitle}>
            Choose how you'd like to use StyleMuse. You can change these anytime in settings.
          </Text>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.privacyContainer}>
            {privacyOptions.map((option, index) => (
              <Animated.View
                key={option.key}
                style={[
                  styles.privacyCardContainer,
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
                <View style={styles.privacyCard}>
                  <View style={styles.privacyHeader}>
                    <View style={styles.privacyTitleContainer}>
                      <Text style={styles.privacyIcon}>{option.icon}</Text>
                      <View style={styles.privacyTitleContent}>
                        <Text style={styles.privacyTitle}>{option.title}</Text>
                        <Text style={[
                          styles.importanceLabel,
                          { color: getImportanceColor(option.importance) }
                        ]}>
                          {getImportanceLabel(option.importance)}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={privacySettings[option.key]}
                      onValueChange={() => handleToggle(option.key)}
                      trackColor={{ 
                        false: theme.colors.border, 
                        true: theme.colors.primary 
                      }}
                      thumbColor={privacySettings[option.key] ? '#FFFFFF' : '#FFFFFF'}
                      style={styles.switch}
                    />
                  </View>
                  
                  <Text style={styles.privacyDesc}>{option.description}</Text>
                  
                  <View style={styles.benefitBadge}>
                    <Text style={styles.benefitText}>✨ {option.benefit}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>

          <View style={styles.transparencyNote}>
            <Text style={styles.noteTitle}>🔒 Our Privacy Promise</Text>
            <View style={styles.noteContent}>
              <Text style={styles.noteText}>• Your personal data is never sold</Text>
              <Text style={styles.noteText}>• All data is encrypted and secure</Text>
              <Text style={styles.noteText}>• Delete your data anytime</Text>
              <Text style={styles.noteText}>• Full transparency in settings</Text>
              <Text style={styles.noteText}>• GDPR & CCPA compliant</Text>
            </View>
          </View>

          <View style={styles.customizationNote}>
            <Text style={styles.customizationTitle}>🎛️ Full Control</Text>
            <Text style={styles.customizationText}>
              You can adjust all these settings later in your profile. 
              We believe in giving you complete control over your data and privacy.
            </Text>
          </View>
        </ScrollView>
      </Animated.View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
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
    marginBottom: 30,
  },
  progressContainer: {
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
  privacyContainer: {
    marginBottom: 30,
  },
  privacyCardContainer: {
    marginBottom: 16,
  },
  privacyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  privacyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  privacyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  privacyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  privacyTitleContent: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  importanceLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  privacyDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  benefitBadge: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  benefitText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  transparencyNote: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  noteContent: {
    paddingLeft: 8,
  },
  noteText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  customizationNote: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  customizationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  customizationText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
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