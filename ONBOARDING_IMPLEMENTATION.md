# Onboarding Implementation Guide

## Overview

This guide provides the technical implementation for StyleMuse's new user onboarding flow, designed to collect valuable data ethically while providing immediate value to users.

## File Structure

```
/components/onboarding/
  ├── OnboardingNavigator.tsx
  ├── screens/
  │   ├── WelcomeScreen.tsx
  │   ├── StyleGoalsScreen.tsx
  │   ├── StyleQuizScreen.tsx
  │   ├── StyleDNAOptInScreen.tsx
  │   ├── PrivacyChoicesScreen.tsx
  │   └── TierSelectionScreen.tsx
  ├── components/
  │   ├── ProgressIndicator.tsx
  │   ├── SkipButton.tsx
  │   └── AnimatedTransitions.tsx
  └── styles/
      └── onboardingStyles.ts
```

## Core Components

### 1. OnboardingNavigator.tsx

```typescript
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();

export const OnboardingNavigator: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({
    styleGoals: [],
    stylePreferences: {},
    privacySettings: {
      analytics: true,
      shopping: false,
      trendReports: false
    },
    selectedTier: 'free'
  });

  const screens = [
    { name: 'Welcome', component: WelcomeScreen },
    { name: 'StyleGoals', component: StyleGoalsScreen },
    { name: 'StyleQuiz', component: StyleQuizScreen },
    { name: 'StyleDNA', component: StyleDNAOptInScreen },
    { name: 'Privacy', component: PrivacyChoicesScreen },
    { name: 'TierSelection', component: TierSelectionScreen }
  ];

  const saveOnboardingProgress = async (data: any) => {
    await AsyncStorage.setItem('onboardingData', JSON.stringify(data));
    await AsyncStorage.setItem('onboardingStep', currentStep.toString());
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress,
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [500, 0],
                  }),
                },
              ],
            },
          }),
        }}
      >
        {screens.map((screen, index) => (
          <Stack.Screen
            key={screen.name}
            name={screen.name}
            component={screen.component}
            initialParams={{
              onboardingData,
              setOnboardingData,
              currentStep: index,
              totalSteps: screens.length,
              saveProgress: saveOnboardingProgress
            }}
          />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

### 2. Welcome Screen

```typescript
// screens/WelcomeScreen.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import LottieView from 'lottie-react-native';

interface WelcomeScreenProps {
  navigation: any;
  route: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const fadeAnim = new Animated.Value(0);
  
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const benefits = [
    { icon: '🎯', title: 'Smart Outfits', desc: 'AI-powered daily suggestions' },
    { icon: '👔', title: 'Wardrobe Manager', desc: 'Never forget what you own' },
    { icon: '📊', title: 'Style Insights', desc: 'Understand your fashion habits' }
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Welcome to StyleMuse
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Your AI-Powered Personal Stylist
          </Text>
        </View>

        <View style={styles.benefitsContainer}>
          {benefits.map((benefit, index) => (
            <Animated.View
              key={index}
              style={[
                styles.benefitCard,
                { backgroundColor: theme.colors.card },
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  }],
                }
              ]}
            >
              <Text style={styles.benefitIcon}>{benefit.icon}</Text>
              <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>
                {benefit.title}
              </Text>
              <Text style={[styles.benefitDesc, { color: theme.colors.textSecondary }]}>
                {benefit.desc}
              </Text>
            </Animated.View>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('StyleGoals')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              AsyncStorage.setItem('onboardingCompleted', 'true');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
              I'm Already a Pro
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};
```

### 3. Style Goals Screen

```typescript
// screens/StyleGoalsScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { ProgressIndicator } from '../components/ProgressIndicator';

interface Goal {
  id: string;
  label: string;
  icon: string;
  value: string;
}

export const StyleGoalsScreen: React.FC = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { onboardingData, setOnboardingData, currentStep, totalSteps } = route.params;
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const goals: Goal[] = [
    { id: '1', label: 'Organize my wardrobe', icon: '🗄️', value: 'organize' },
    { id: '2', label: 'Get daily outfit ideas', icon: '💡', value: 'outfits' },
    { id: '3', label: 'Shop smarter', icon: '🛍️', value: 'shopping' },
    { id: '4', label: 'Reduce decision fatigue', icon: '🧠', value: 'efficiency' },
    { id: '5', label: 'Sustainable fashion choices', icon: '🌱', value: 'sustainable' },
    { id: '6', label: 'Track what I wear', icon: '📊', value: 'tracking' }
  ];

  const toggleGoal = (value: string) => {
    setSelectedGoals(prev => 
      prev.includes(value) 
        ? prev.filter(g => g !== value)
        : [...prev, value]
    );
  };

  const handleContinue = () => {
    setOnboardingData({
      ...onboardingData,
      styleGoals: selectedGoals
    });
    navigation.navigate('StyleQuiz');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ProgressIndicator current={currentStep} total={totalSteps} />
      
      <ScrollView style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          What brings you to StyleMuse?
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Select all that apply - this helps us personalize your experience
        </Text>

        <View style={styles.goalsGrid}>
          {goals.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalCard,
                { 
                  backgroundColor: theme.colors.card,
                  borderColor: selectedGoals.includes(goal.value) 
                    ? theme.colors.primary 
                    : theme.colors.border
                },
                selectedGoals.includes(goal.value) && styles.selectedGoal
              ]}
              onPress={() => toggleGoal(goal.value)}
            >
              <Text style={styles.goalIcon}>{goal.icon}</Text>
              <Text style={[styles.goalLabel, { color: theme.colors.text }]}>
                {goal.label}
              </Text>
              {selectedGoals.includes(goal.value) && (
                <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: theme.colors.primary },
            selectedGoals.length === 0 && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={selectedGoals.length === 0}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

### 4. Privacy Choices Screen

```typescript
// screens/PrivacyChoicesScreen.tsx
import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';

export const PrivacyChoicesScreen: React.FC = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { onboardingData, setOnboardingData } = route.params;
  const [privacySettings, setPrivacySettings] = useState({
    analytics: true,
    shopping: false,
    trendReports: false
  });

  const privacyOptions = [
    {
      key: 'analytics',
      title: 'Help improve StyleMuse',
      description: 'Share anonymous app usage to help us improve features',
      benefit: 'Better app experience for everyone',
      icon: '📊'
    },
    {
      key: 'shopping',
      title: 'Personalized shopping recommendations',
      description: 'Get product suggestions based on your style and wardrobe gaps',
      benefit: 'Save time finding perfect items',
      icon: '🛍️'
    },
    {
      key: 'trendReports',
      title: 'Contribute to fashion insights',
      description: 'Help create anonymous trend reports while getting free insights',
      benefit: 'Free quarterly trend reports',
      icon: '📈'
    }
  ];

  const handleToggle = (key: string) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleContinue = () => {
    setOnboardingData({
      ...onboardingData,
      privacySettings
    });
    navigation.navigate('TierSelection');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Your Privacy, Your Choice
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Choose how you'd like to use StyleMuse. You can change these anytime.
        </Text>

        <View style={styles.privacyContainer}>
          {privacyOptions.map((option) => (
            <View 
              key={option.key} 
              style={[styles.privacyCard, { backgroundColor: theme.colors.card }]}
            >
              <View style={styles.privacyHeader}>
                <Text style={styles.privacyIcon}>{option.icon}</Text>
                <Text style={[styles.privacyTitle, { color: theme.colors.text }]}>
                  {option.title}
                </Text>
                <Switch
                  value={privacySettings[option.key]}
                  onValueChange={() => handleToggle(option.key)}
                  trackColor={{ 
                    false: theme.colors.border, 
                    true: theme.colors.primary 
                  }}
                />
              </View>
              <Text style={[styles.privacyDesc, { color: theme.colors.textSecondary }]}>
                {option.description}
              </Text>
              <View style={[styles.benefitBadge, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.benefitText, { color: theme.colors.primary }]}>
                  ✨ {option.benefit}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.transparencyNote, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.noteTitle, { color: theme.colors.text }]}>
            🔒 Our Promise
          </Text>
          <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
            • Your personal data is never sold{'\n'}
            • All data is encrypted and secure{'\n'}
            • Delete your data anytime{'\n'}
            • Full transparency in settings
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.continueButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleContinue}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 5. Tier Selection Screen

```typescript
// screens/TierSelectionScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

export const TierSelectionScreen: React.FC = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { onboardingData, setOnboardingData } = route.params;
  const [selectedTier, setSelectedTier] = useState('pro');
  const scaleAnim = new Animated.Value(1);

  const tiers = [
    {
      id: 'free',
      name: 'Explorer',
      price: 'Free',
      features: [
        '5 AI outfits/month',
        'Basic wardrobe (50 items)',
        '3 saved outfits',
        'Basic analytics'
      ],
      color: theme.colors.secondary
    },
    {
      id: 'pro',
      name: 'Style Pro',
      price: '$9.99/mo',
      popular: true,
      features: [
        'Unlimited AI outfits',
        'Unlimited wardrobe',
        'Full outfit history',
        'Advanced analytics',
        'Seasonal style updates',
        'Weather recommendations'
      ],
      color: theme.colors.primary
    },
    {
      id: 'elite',
      name: 'Fashion Forward',
      price: '$19.99/mo',
      features: [
        'Everything in Pro',
        'Personal AI stylist',
        'Trend forecasts',
        'API access',
        'Virtual fashion shows',
        'Priority support'
      ],
      color: theme.colors.accent
    }
  ];

  const handleSelectTier = (tierId: string) => {
    setSelectedTier(tierId);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  };

  const handleComplete = async () => {
    const finalData = {
      ...onboardingData,
      selectedTier
    };
    
    // Save all onboarding data
    await AsyncStorage.setItem('onboardingData', JSON.stringify(finalData));
    await AsyncStorage.setItem('onboardingCompleted', 'true');
    await AsyncStorage.setItem('userTier', selectedTier);
    
    // Navigate to main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Choose Your StyleMuse Journey
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Start with a 7-day free trial of any paid plan
        </Text>

        <View style={styles.tiersContainer}>
          {tiers.map((tier) => (
            <TouchableOpacity
              key={tier.id}
              onPress={() => handleSelectTier(tier.id)}
              activeOpacity={0.9}
            >
              <Animated.View
                style={[
                  styles.tierCard,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: selectedTier === tier.id ? tier.color : theme.colors.border,
                    borderWidth: selectedTier === tier.id ? 2 : 1,
                    transform: selectedTier === tier.id ? [{ scale: scaleAnim }] : []
                  }
                ]}
              >
                {tier.popular && (
                  <View style={[styles.popularBadge, { backgroundColor: tier.color }]}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}
                
                <Text style={[styles.tierName, { color: theme.colors.text }]}>
                  {tier.name}
                </Text>
                <Text style={[styles.tierPrice, { color: tier.color }]}>
                  {tier.price}
                </Text>
                
                <View style={styles.featuresContainer}>
                  {tier.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Text style={{ color: tier.color }}>✓</Text>
                      <Text style={[styles.featureText, { color: theme.colors.text }]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
                
                {selectedTier === tier.id && (
                  <View style={[styles.selectedIndicator, { backgroundColor: tier.color }]}>
                    <Text style={styles.selectedText}>Selected</Text>
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleComplete}
        >
          <Text style={styles.startButtonText}>
            {selectedTier === 'free' ? 'Start Free' : 'Start Free Trial'}
          </Text>
        </TouchableOpacity>
        
        <Text style={[styles.disclaimer, { color: theme.colors.textMuted }]}>
          {selectedTier !== 'free' && 'Cancel anytime. No credit card required for trial.'}
        </Text>
      </View>
    </View>
  );
};
```

## Key Implementation Details

### 1. User Data Storage

```typescript
// utils/userDataManager.ts
export class UserDataManager {
  static async saveUserPreferences(data: any) {
    const encrypted = await encryptData(data);
    await AsyncStorage.setItem('userPreferences', encrypted);
  }

  static async getUserTier(): Promise<string> {
    return await AsyncStorage.getItem('userTier') || 'free';
  }

  static async canUseFeature(feature: string): Promise<boolean> {
    const tier = await this.getUserTier();
    return FEATURE_FLAGS[feature].includes(tier);
  }
}
```

### 2. Feature Flags

```typescript
// config/featureFlags.ts
export const FEATURE_FLAGS = {
  unlimited_ai_outfits: ['pro', 'elite'],
  outfit_history: ['pro', 'elite'],
  trend_reports: ['elite'],
  api_access: ['elite'],
  advanced_analytics: ['pro', 'elite'],
  basic_wardrobe: ['free', 'pro', 'elite'],
  export_data: ['pro', 'elite']
};
```

### 3. Analytics Integration

```typescript
// utils/analytics.ts
export const trackOnboardingStep = (step: string, data: any) => {
  if (userOptedInToAnalytics()) {
    // Send to analytics service
    analytics.track('onboarding_step_completed', {
      step,
      ...data,
      timestamp: new Date().toISOString()
    });
  }
};
```

## Testing the Onboarding

1. **New User Flow**: Clear AsyncStorage and restart app
2. **Returning User**: Check for 'onboardingCompleted' flag
3. **Partial Completion**: Save progress at each step
4. **Skip Options**: Allow users to skip non-essential steps
5. **A/B Testing**: Track conversion rates for different flows

## Next Steps

1. Implement payment processing for paid tiers
2. Add animation polish between screens
3. Create A/B test variants
4. Build analytics dashboard
5. Implement progressive disclosure for complex features