import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WardrobeUploadScreen from './screens/WardrobeUploadScreen';
import { OnboardingNavigator } from './components/onboarding/OnboardingNavigator';
import { ThemeProvider } from './contexts/ThemeContext';
import { OutfitFilterProvider } from './contexts/OutfitFilterContext';
import { logger } from './utils/DebugLogger';
import { LogCategories } from './constants/LogCategories';
import { DataDebugger } from './utils/DataDebugger';

export default function App() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);


  const checkOnboardingStatus = async () => {
    try {
      logger.info(LogCategories.APP_LIFECYCLE, 'App started - checking onboarding status');
      
      // Debug: Log current storage state
      if (__DEV__) {
        await DataDebugger.checkUserDataStatus();
      }
      
      const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
      const hasExistingData = await checkForExistingUserData();
      
      // If user has existing data but no onboarding flag, assume they're an existing user
      if (hasExistingData && !onboardingCompleted) {
        logger.info(LogCategories.APP_LIFECYCLE, 'Existing user detected - skipping onboarding');
        await AsyncStorage.setItem('onboardingCompleted', 'true');
        setIsOnboardingComplete(true);
      } else {
        const completed = onboardingCompleted === 'true';
        logger.info(LogCategories.APP_LIFECYCLE, 'Onboarding status determined', {
          onboardingCompleted: completed,
          hasExistingData,
          isNewUser: !completed && !hasExistingData
        });
        setIsOnboardingComplete(completed);
      }
    } catch (error) {
      logger.error(LogCategories.APP_LIFECYCLE, 'Failed to check onboarding status', error);
      // On error, assume onboarding is complete to prevent blocking
      setIsOnboardingComplete(true);
    } finally {
      setIsLoading(false);
    }
  };

  const checkForExistingUserData = async () => {
    try {
      const [savedItems, lovedOutfits, profileImage, styleDNA] = await Promise.all([
        AsyncStorage.getItem('savedItems'),
        AsyncStorage.getItem('lovedOutfits'),
        AsyncStorage.getItem('profileImage'),
        AsyncStorage.getItem('styleDNA')
      ]);

      // Parse and check if arrays have items
      let hasItems = false;
      let hasOutfits = false;
      
      if (savedItems) {
        try {
          const items = JSON.parse(savedItems);
          hasItems = Array.isArray(items) && items.length > 0;
        } catch (e) {
          // Invalid JSON, assume no items
        }
      }
      
      if (lovedOutfits) {
        try {
          const outfits = JSON.parse(lovedOutfits);
          hasOutfits = Array.isArray(outfits) && outfits.length > 0;
        } catch (e) {
          // Invalid JSON, assume no outfits
        }
      }

      const hasData = hasItems || hasOutfits || !!profileImage || !!styleDNA;
      
      logger.info(LogCategories.APP_LIFECYCLE, 'Existing user data check', {
        hasItems,
        hasOutfits,
        hasProfileImage: !!profileImage,
        hasStyleDNA: !!styleDNA,
        isExistingUser: hasData
      });

      return hasData;
    } catch (error) {
      logger.error(LogCategories.APP_LIFECYCLE, 'Failed to check existing user data', error);
      return false;
    }
  };

  const handleOnboardingComplete = async (onboardingData) => {
    try {
      logger.info(LogCategories.APP_LIFECYCLE, 'Onboarding completed', {
        selectedTier: onboardingData.selectedTier,
        completedAt: onboardingData.completedAt
      });

      setIsOnboardingComplete(true);
      
      // Optional: You can use the onboarding data to initialize app state
      // For example, set user preferences, tier, etc.
      if (onboardingData.selectedTier) {
        await AsyncStorage.setItem('userTier', onboardingData.selectedTier);
      }
    } catch (error) {
      logger.error(LogCategories.APP_LIFECYCLE, 'Failed to complete onboarding', error);
    }
  };

  // Show loading screen while checking onboarding status
  if (isLoading) {
    return (
      <ThemeProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <OutfitFilterProvider>
        {isOnboardingComplete ? (
          <WardrobeUploadScreen />
        ) : (
          <OnboardingNavigator onComplete={handleOnboardingComplete} />
        )}
      </OutfitFilterProvider>
    </ThemeProvider>
  );
}
