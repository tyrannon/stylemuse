import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './navigation/RootNavigator';
import { ThemeProvider } from './contexts/ThemeContext';
import { OutfitFilterProvider } from './contexts/OutfitFilterContext';
import { logger } from './utils/DebugLogger';
import { LogCategories } from './constants/LogCategories';
import { DataDebugger } from './utils/DataDebugger';
import { ImageRepairIntegration } from './services/ImageRepairIntegration';
import { BrokenImageRepairModal } from './components/BrokenImageRepairModal';
import { DataMigrationModal } from './components/DataMigrationModal';
import { soundService } from './services/SoundService';
import { DailyRewardNotification } from './components/DailyRewardNotification';
import { imageRecoveryService } from './services/ImageRecoveryService';
import { streakService } from './services/StreakService';

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageRepairNeeded, setImageRepairNeeded] = useState(false);
  const [repairInfo, setRepairInfo] = useState(null);
  const [userId] = useState('user123'); // For now, use a static user ID

  useEffect(() => {
    checkOnboardingStatus();
    initializeSoundService();
    initializeImageRecovery();
    checkDailyStreak();
  }, []);

  const initializeSoundService = async () => {
    try {
      // Initialize sound service on app startup
      await soundService.initialize();
      
      // Start playing background music and ambience
      await soundService.playBackgroundMusic();
      await soundService.playAmbience();
      
      logger.info(LogCategories.SOUND, 'Sound service initialized successfully');
    } catch (error) {
      logger.error(LogCategories.SOUND, 'Failed to initialize sound service', error);
    }
  };

  const initializeImageRecovery = async () => {
    try {
      // Run image recovery check on app launch
      const recoveryReport = await imageRecoveryService.checkAndRecoverOnLaunch();
      if (recoveryReport && recoveryReport.issuesFound > 0) {
        logger.info(LogCategories.APP_LIFECYCLE, 'Image recovery performed', {
          found: recoveryReport.issuesFound,
          fixed: recoveryReport.issuesFixed
        });
      }
    } catch (error) {
      logger.error(LogCategories.APP_LIFECYCLE, 'Failed to initialize image recovery', error);
    }
  };

  const checkDailyStreak = async () => {
    try {
      // Check and update daily streak
      const streakResult = await streakService.checkDailyStreak();
      if (streakResult.isNewDay) {
        logger.info(LogCategories.GAMIFICATION, 'Daily streak updated', {
          currentStreak: streakResult.streakData.currentStreak,
          maintained: streakResult.streakMaintained,
          freezeUsed: streakResult.freezeUsed
        });
        
        // Handle milestone rewards
        if (streakResult.milestonesReached.length > 0) {
          logger.info(LogCategories.GAMIFICATION, 'Streak milestones reached!', {
            milestones: streakResult.milestonesReached.map(m => m.days)
          });
        }
      }
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to check daily streak', error);
    }
  };

  const handleWardrobeItemsEarned = (items) => {
    logger.info(LogCategories.GAMIFICATION, 'User earned wardrobe items from daily rewards', { 
      itemCount: items?.length || 0,
      items: items?.map(item => ({ name: item.name, rarity: item.rarity })) || []
    });
    // Items will be automatically added to wardrobe by the reward system
  };


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
        setInitialRoute('MainApp');
      } else {
        const completed = onboardingCompleted === 'true';
        logger.info(LogCategories.APP_LIFECYCLE, 'Onboarding status determined', {
          onboardingCompleted: completed,
          hasExistingData,
          isNewUser: !completed && !hasExistingData
        });
        setInitialRoute(completed ? 'MainApp' : 'Onboarding');
      }

      // Perform image repair check for existing users
      if (hasExistingData) {
        await checkImageRepairNeeds();
      }
    } catch (error) {
      logger.error(LogCategories.APP_LIFECYCLE, 'Failed to check onboarding status', error);
      // On error, assume onboarding is complete to prevent blocking
      setInitialRoute('MainApp');
    } finally {
      setIsLoading(false);
    }
  };

  const checkImageRepairNeeds = async () => {
    try {
      logger.info(LogCategories.APP_LIFECYCLE, 'Checking image repair needs');
      const repairIntegration = ImageRepairIntegration.getInstance();
      const checkResult = await repairIntegration.performStartupImageCheck();
      
      if (checkResult.needsRepair || checkResult.needsLegacyMigration) {
        setImageRepairNeeded(true);
        setRepairInfo(checkResult);
        logger.info(LogCategories.APP_LIFECYCLE, 'Image repair needed', {
          needsRepair: checkResult.needsRepair,
          needsLegacyMigration: checkResult.needsLegacyMigration,
          brokenCount: checkResult.repairInfo?.brokenCount
        });
      }
    } catch (error) {
      logger.error(LogCategories.APP_LIFECYCLE, 'Failed to check image repair needs', error);
      // Don't block app startup on repair check failure
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

      await AsyncStorage.setItem('onboardingCompleted', 'true');
      setInitialRoute('MainApp');
      
      // Optional: You can use the onboarding data to initialize app state
      // For example, set user preferences, tier, etc.
      if (onboardingData.selectedTier) {
        await AsyncStorage.setItem('userTier', onboardingData.selectedTier);
      }
    } catch (error) {
      logger.error(LogCategories.APP_LIFECYCLE, 'Failed to complete onboarding', error);
    }
  };

  const handleImageRepairComplete = async (summary) => {
    try {
      logger.info(LogCategories.APP_LIFECYCLE, 'Image repair completed', {
        success: summary.success,
        recoveredItems: summary.recoveredItems,
        failedItems: summary.failedItems
      });

      setImageRepairNeeded(false);
      setRepairInfo(null);
      
      // Show results to user
      const repairIntegration = ImageRepairIntegration.getInstance();
      if (summary.success) {
        await repairIntegration.repairService.showRepairResults(summary);
      }
    } catch (error) {
      logger.error(LogCategories.APP_LIFECYCLE, 'Failed to handle repair completion', error);
    }
  };

  // Show loading screen while checking onboarding status
  if (isLoading || !initialRoute) {
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
        <NavigationContainer>
          <RootNavigator 
            initialRouteName={initialRoute}
            onOnboardingComplete={handleOnboardingComplete}
          />
        </NavigationContainer>
        
        {/* Image Repair Modals */}
        {imageRepairNeeded && repairInfo && (
          <>
            {repairInfo.needsLegacyMigration ? (
              <DataMigrationModal
                visible={true}
                onComplete={handleImageRepairComplete}
              />
            ) : (
              <BrokenImageRepairModal
                visible={true}
                onComplete={handleImageRepairComplete}
                options={{
                  dryRun: false,
                  removeUnrecoverable: true,
                  backupBeforeRepair: true,
                  maxRecoveryAttempts: 5
                }}
              />
            )}
          </>
        )}
        
        {/* Daily Reward Notification Overlay */}
        <DailyRewardNotification 
          userId={userId}
          onWardrobeItemsEarned={handleWardrobeItemsEarned}
        />
      </OutfitFilterProvider>
    </ThemeProvider>
  );
}
