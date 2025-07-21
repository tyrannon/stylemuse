import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Alert,
  Switch,
  SafeAreaView 
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SettingsRow, SettingsSection, ThemeModeOption } from '../components/SettingsComponents';
import { DataResetService } from '../utils/DataResetService';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface SettingsScreenProps {
  onNavigateBack?: () => void;
  triggerHaptic?: (type?: 'light' | 'medium' | 'heavy') => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateBack,
  triggerHaptic = () => {}
}) => {
  const { theme, themeMode, colorScheme, isDark, setThemeMode, setColorScheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

  const styles = createStyles(theme);

  const handleStartFresh = async () => {
    try {
      triggerHaptic('medium');
      
      // Get storage info for confirmation dialog
      const storageInfo = await DataResetService.getStorageInfo();
      
      Alert.alert(
        '🔄 Start Fresh',
        `This will completely reset StyleMuse and take you through onboarding again.\n\n` +
        `Current data:\n` +
        `• ${storageInfo.totalKeys} stored items\n` +
        `• ${storageInfo.totalSizeMB.toFixed(1)} MB of data\n\n` +
        `A backup will be created automatically before reset.`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Start Fresh',
            style: 'destructive',
            onPress: () => showFinalConfirmation(storageInfo)
          }
        ]
      );
    } catch (error) {
      logger.error(LogCategories.USER_ACTION, 'Failed to get storage info for Start Fresh', error);
      Alert.alert('Error', 'Failed to get storage information. Please try again.');
    }
  };

  const showFinalConfirmation = (storageInfo: any) => {
    Alert.alert(
      '⚠️ Final Confirmation',
      `Are you absolutely sure? This cannot be undone.\n\n` +
      `This will:\n` +
      `• Delete all ${storageInfo.totalKeys} stored items\n` +
      `• Reset all settings and preferences\n` +
      `• Return you to the onboarding screen\n\n` +
      `A backup will be created first for safety.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes, Start Fresh',
          style: 'destructive',
          onPress: performStartFresh
        }
      ]
    );
  };

  const performStartFresh = async () => {
    try {
      triggerHaptic('heavy');
      
      logger.info(LogCategories.USER_ACTION, 'User initiated Start Fresh');
      
      // Create backup and reset data
      const success = await DataResetService.resetAllData();
      
      if (success) {
        logger.info(LogCategories.USER_ACTION, 'Start Fresh completed successfully');
        
        // Force app to restart by setting a flag
        await AsyncStorage.setItem('forceAppRestart', 'true');
        
        Alert.alert(
          '✅ Reset Complete',
          'StyleMuse has been reset successfully. The app will restart to complete the process.',
          [
            {
              text: 'OK',
              onPress: () => {
                // In a real app, you might use a restart library or navigation reset
                if (onNavigateBack) {
                  onNavigateBack();
                }
              }
            }
          ]
        );
      } else {
        throw new Error('Reset operation failed');
      }
    } catch (error) {
      logger.error(LogCategories.USER_ACTION, 'Start Fresh failed', error);
      Alert.alert(
        'Reset Failed',
        'Failed to reset app data. Please try again or contact support if the problem persists.'
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance Section */}
        <SettingsSection title="Appearance" theme={theme}>
          {/* Dark Mode */}
          <View style={styles.themeContainer}>
            <SettingsRow
              icon="🌙"
              title="Dark Mode"
              theme={theme}
              hasChevron={false}
              rightComponent={
                <View style={styles.themeOptions}>
                  {(['light', 'dark', 'system'] as const).map((mode) => (
                    <ThemeModeOption
                      key={mode}
                      mode={mode}
                      currentMode={themeMode}
                      onSelect={(selectedMode) => {
                        triggerHaptic('light');
                        setThemeMode(selectedMode);
                      }}
                      theme={theme}
                    />
                  ))}
                </View>
              }
            />
          </View>
          
          {/* Color Scheme */}
          <SettingsRow
            icon="🎨"
            title="Color Scheme"
            value={colorScheme === 'default' ? 'Default' : 'Tokyo'}
            onPress={() => {
              triggerHaptic('light');
              setColorScheme(colorScheme === 'default' ? 'tokyo' : 'default');
            }}
            theme={theme}
          />
          
          {/* Display Options */}
          <SettingsRow
            icon="📱"
            title="Display Options"
            value="Font Size, Animations"
            onPress={() => {
              // Navigate to display options
              Alert.alert('Coming Soon', 'Display options will be available in a future update.');
            }}
            theme={theme}
          />
        </SettingsSection>

        {/* Privacy & Security Section */}
        <SettingsSection title="Privacy & Security" theme={theme}>
          <SettingsRow
            icon="🔒"
            title="Privacy Choices"
            value="Manage Data Collection"
            onPress={() => {
              Alert.alert('Coming Soon', 'Privacy settings will be available in a future update.');
            }}
            theme={theme}
          />
          
          <SettingsRow
            icon="📊"
            title="Analytics"
            theme={theme}
            hasChevron={false}
            rightComponent={
              <Switch
                value={analyticsEnabled}
                onValueChange={(value) => {
                  triggerHaptic('light');
                  setAnalyticsEnabled(value);
                }}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.card}
              />
            }
          />
          
          <SettingsRow
            icon="🛡️"
            title="Security"
            value="Biometric Auth"
            onPress={() => {
              Alert.alert('Coming Soon', 'Security settings will be available in a future update.');
            }}
            theme={theme}
          />
        </SettingsSection>

        {/* Account & Subscription Section */}
        <SettingsSection title="Account & Subscription" theme={theme}>
          <SettingsRow
            icon="👤"
            title="Profile"
            value="Edit Name, Email"
            onPress={() => {
              Alert.alert('Coming Soon', 'Profile editing will be available in a future update.');
            }}
            theme={theme}
          />
          
          <SettingsRow
            icon="💎"
            title="Subscription"
            value="StyleMuse Free"
            onPress={() => {
              Alert.alert('Coming Soon', 'Subscription management will be available in a future update.');
            }}
            theme={theme}
          />
          
          <SettingsRow
            icon="⏰"
            title="Trial Status"
            value="7 days remaining"
            onPress={() => {
              Alert.alert('Coming Soon', 'Trial management will be available in a future update.');
            }}
            theme={theme}
          />
        </SettingsSection>

        {/* Data Management Section */}
        <SettingsSection title="Data Management" theme={theme}>
          <SettingsRow
            icon="💾"
            title="Storage & Backup"
            theme={theme}
            hasChevron={false}
            rightComponent={
              <Switch
                value={autoBackupEnabled}
                onValueChange={(value) => {
                  triggerHaptic('light');
                  setAutoBackupEnabled(value);
                }}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.card}
              />
            }
          />
          
          <SettingsRow
            icon="📤"
            title="Export Data"
            value="Download Your Data"
            onPress={() => {
              Alert.alert('Coming Soon', 'Data export will be available in a future update.');
            }}
            theme={theme}
          />
          
          <SettingsRow
            icon="📥"
            title="Import Data"
            value="Restore from Backup"
            onPress={() => {
              Alert.alert('Coming Soon', 'Data import will be available in a future update.');
            }}
            theme={theme}
          />
          
          <SettingsRow
            icon="🔄"
            title="Start Fresh"
            value="Reset All Data"
            onPress={handleStartFresh}
            theme={theme}
          />
        </SettingsSection>

        {/* About & Support Section */}
        <SettingsSection title="About & Support" theme={theme}>
          <SettingsRow
            icon="ℹ️"
            title="About StyleMuse"
            value="v1.0.0"
            onPress={() => {
              Alert.alert(
                'About StyleMuse',
                'StyleMuse v1.0.0\n\nYour AI-powered personal stylist and wardrobe organizer.\n\nBuilt with React Native and powered by OpenAI.',
                [{ text: 'OK' }]
              );
            }}
            theme={theme}
          />
          
          <SettingsRow
            icon="❓"
            title="Help Center"
            value="FAQs & Guides"
            onPress={() => {
              Alert.alert('Coming Soon', 'Help center will be available in a future update.');
            }}
            theme={theme}
          />
          
          <SettingsRow
            icon="💬"
            title="Contact Support"
            value="Get Help"
            onPress={() => {
              Alert.alert('Coming Soon', 'Support contact will be available in a future update.');
            }}
            theme={theme}
          />
          
          <SettingsRow
            icon="⭐"
            title="Rate App"
            value="App Store"
            onPress={() => {
              Alert.alert('Coming Soon', 'App Store rating will be available in a future update.');
            }}
            theme={theme}
          />
        </SettingsSection>

        {/* Add some bottom padding */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  themeContainer: {
    paddingVertical: 8,
  },
  themeOptions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
});