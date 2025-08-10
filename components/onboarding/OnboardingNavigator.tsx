import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../../utils/DebugLogger';
import { LogCategories } from '../../constants/LogCategories';

import { WelcomeScreen } from './screens/WelcomeScreen';
import { StyleGoalsScreen } from './screens/StyleGoalsScreen';
import { StyleQuizScreen } from './screens/StyleQuizScreen';
import { StyleDNAOptInScreen } from './screens/StyleDNAOptInScreen';
import { PrivacyChoicesScreen } from './screens/PrivacyChoicesScreen';
import { TierSelectionScreen } from './screens/TierSelectionScreen';

const Stack = createStackNavigator();

export interface OnboardingData {
  styleGoals: string[];
  stylePreferences: {
    colors: string[];
    styles: string[];
    occasions: string[];
    bodyType?: string;
    budget?: string;
  };
  privacySettings: {
    analytics: boolean;
    shopping: boolean;
    trendReports: boolean;
    styleDNA: boolean;
  };
  selectedTier: 'free' | 'pro' | 'elite';
  completedAt?: string;
}

interface OnboardingNavigatorProps {
  onComplete: (data: OnboardingData) => void;
}

export const OnboardingNavigator: React.FC<OnboardingNavigatorProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    styleGoals: [],
    stylePreferences: {
      colors: [],
      styles: [],
      occasions: [],
    },
    privacySettings: {
      analytics: true,
      shopping: false,
      trendReports: false,
      styleDNA: false,
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

  useEffect(() => {
    loadOnboardingProgress();
  }, []);

  const loadOnboardingProgress = async () => {
    try {
      const savedData = await AsyncStorage.getItem('onboardingData');
      const savedStep = await AsyncStorage.getItem('onboardingStep');
      
      if (savedData) {
        setOnboardingData(JSON.parse(savedData));
        logger.info(LogCategories.USER_ACTION, 'Onboarding progress loaded', {
          step: savedStep ? parseInt(savedStep) : 0,
          hasData: !!savedData
        });
      }
      
      if (savedStep) {
        setCurrentStep(parseInt(savedStep));
      }
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to load onboarding progress', error as Error);
    }
  };

  const saveOnboardingProgress = async (data: OnboardingData, step?: number) => {
    try {
      await AsyncStorage.setItem('onboardingData', JSON.stringify(data));
      if (step !== undefined) {
        await AsyncStorage.setItem('onboardingStep', step.toString());
        setCurrentStep(step);
      }
      
      logger.debug(LogCategories.USER_ACTION, 'Onboarding progress saved', {
        step: step || currentStep,
        dataKeys: Object.keys(data)
      });
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to save onboarding progress', error as Error);
    }
  };

  const completeOnboarding = async (finalData: OnboardingData) => {
    try {
      const completedData = {
        ...finalData,
        completedAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('onboardingData', JSON.stringify(completedData));
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      await AsyncStorage.setItem('userTier', finalData.selectedTier);
      await AsyncStorage.removeItem('onboardingStep');
      
      logger.info(LogCategories.USER_ACTION, 'Onboarding completed', {
        selectedTier: finalData.selectedTier,
        styleGoalsCount: finalData.styleGoals.length,
        privacyOptIns: Object.values(finalData.privacySettings).filter(Boolean).length
      });
      
      onComplete(completedData);
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to complete onboarding', error as Error);
    }
  };

  const skipOnboarding = async () => {
    const defaultData: OnboardingData = {
      styleGoals: [],
      stylePreferences: {
        colors: [],
        styles: [],
        occasions: [],
      },
      privacySettings: {
        analytics: false,
        shopping: false,
        trendReports: false,
        styleDNA: false,
      },
      selectedTier: 'free',
      completedAt: new Date().toISOString()
    };
    
    logger.info(LogCategories.USER_ACTION, 'Onboarding skipped');
    await completeOnboarding(defaultData);
  };

  return (
    <Stack.Navigator
      initialRouteName={screens[currentStep]?.name || 'Welcome'}
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            opacity: progress,
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
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
            saveProgress: saveOnboardingProgress,
            completeOnboarding,
            skipOnboarding,
          }}
        />
      ))}
    </Stack.Navigator>
  );
};