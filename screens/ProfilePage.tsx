import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Switch, Alert, ScrollView } from 'react-native';
import { WardrobeItem, LovedOutfit } from '../hooks/useWardrobeData';
import { SafeImage } from '../utils/SafeImage';
import { PersistenceService } from '../services/PersistenceService';
import { useTheme } from '../contexts/ThemeContext';
import { BackupManagerModal } from '../components/BackupManagerModal';
import { DataResetService } from '../utils/DataResetService';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { SettingsRow, SettingsSection, ThemeModeOption } from '../components/SettingsComponents';

interface ProfilePageProps {
  profileImage: string | null;
  styleDNA: any | null;
  selectedGender: 'male' | 'female' | 'nonbinary' | null;
  savedItems: WardrobeItem[];
  lovedOutfits: LovedOutfit[];
  analyzingProfile: boolean;
  pickProfileImage: () => void;
  analyzeProfileImage: (imageUri: string) => void;
  setShowGenderSelector: (show: boolean) => void;
  onUpdateStyleDNA: (updatedStyleDNA: any) => void;
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy') => void;
  onRefreshData?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profileImage,
  styleDNA,
  selectedGender,
  savedItems,
  lovedOutfits,
  analyzingProfile,
  pickProfileImage,
  analyzeProfileImage,
  setShowGenderSelector,
  onUpdateStyleDNA,
  triggerHaptic,
  onRefreshData,
}) => {
  const { theme, themeMode, colorScheme, isDark, setThemeMode, setColorScheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
        Profile
      </Text>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'profile' && { borderBottomColor: theme.colors.primary }
          ]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('profile');
          }}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'profile' ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            🧬 Style DNA
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'settings' && { borderBottomColor: theme.colors.primary }
          ]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('settings');
          }}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'settings' ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            ⚙️ Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'profile' ? (
          <ProfileTabContent
            profileImage={profileImage}
            styleDNA={styleDNA}
            selectedGender={selectedGender}
            savedItems={savedItems}
            lovedOutfits={lovedOutfits}
            analyzingProfile={analyzingProfile}
            pickProfileImage={pickProfileImage}
            analyzeProfileImage={analyzeProfileImage}
            setShowGenderSelector={setShowGenderSelector}
            onUpdateStyleDNA={onUpdateStyleDNA}
            triggerHaptic={triggerHaptic}
            onRefreshData={onRefreshData}
            theme={theme}
            styles={styles}
          />
        ) : (
          <SettingsTabContent
            theme={theme}
            themeMode={themeMode}
            colorScheme={colorScheme}
            isDark={isDark}
            setThemeMode={setThemeMode}
            setColorScheme={setColorScheme}
            triggerHaptic={triggerHaptic}
            onRefreshData={onRefreshData}
            styles={styles}
          />
        )}
      </ScrollView>
    </View>
  );
};

// Profile Tab Content Component
interface ProfileTabContentProps {
  profileImage: string | null;
  styleDNA: any | null;
  selectedGender: 'male' | 'female' | 'nonbinary' | null;
  savedItems: WardrobeItem[];
  lovedOutfits: LovedOutfit[];
  analyzingProfile: boolean;
  pickProfileImage: () => void;
  analyzeProfileImage: (imageUri: string) => void;
  setShowGenderSelector: (show: boolean) => void;
  onUpdateStyleDNA: (updatedStyleDNA: any) => void;
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy') => void;
  onRefreshData?: () => void;
  theme: any;
  styles: any;
}

const ProfileTabContent: React.FC<ProfileTabContentProps> = ({
  profileImage,
  styleDNA,
  selectedGender,
  savedItems,
  lovedOutfits,
  analyzingProfile,
  pickProfileImage,
  analyzeProfileImage,
  setShowGenderSelector,
  onUpdateStyleDNA,
  triggerHaptic,
  onRefreshData,
  theme,
  styles
}) => {
  return (
    <View>
      <Text style={styles.sectionTitle}>🧬 Style DNA Profile</Text>
      
      {/* Profile Photo Section */}
      <View style={styles.profilePhotoSection}>
        <TouchableOpacity
          onPress={pickProfileImage}
          style={styles.profilePhotoContainer}
        >
          {profileImage ? (
            <Image 
              source={{ uri: profileImage }} 
              style={[styles.profileImage, { borderColor: styleDNA ? '#4CAF50' : '#e0e0e0' }]} 
            />
          ) : (
            <View style={[styles.profileImagePlaceholder, { borderColor: '#e0e0e0', backgroundColor: theme.colors.surface }]}>
              <Text style={styles.profileImageEmoji}>🧬</Text>
            </View>
          )}
          <View style={[styles.cameraIcon, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.cameraIconText}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={[styles.uploadText, { color: theme.colors.textSecondary }]}>Tap to upload your photo</Text>
        
        {profileImage && (
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('medium');
              analyzeProfileImage(profileImage);
            }}
            style={[styles.analyzeButton, { backgroundColor: theme.colors.primary }]}
          >
            {analyzingProfile ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.analyzeButtonText}>🧬 Analyze Style DNA</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Gender Selection */}
      <TouchableOpacity 
        style={[styles.genderCard, { borderColor: selectedGender ? theme.colors.primary : theme.colors.border }]}
        onPress={() => {
          triggerHaptic('light');
          setShowGenderSelector(true);
        }}
      >
        <Text style={[styles.genderText, { color: theme.colors.text }]}>
          👤 Gender: {selectedGender ? selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1) : 'Select Gender'}
        </Text>
        <Text style={[styles.genderArrow, { color: theme.colors.textSecondary }]}>›</Text>
      </TouchableOpacity>

      {/* Style DNA Results */}
      {styleDNA && (
        <View style={styles.styleDNASection}>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.text }]}>Your Style Analysis</Text>
          
          {/* Style Summary */}
          {styleDNA.style_summary && (
            <View style={[styles.styleDNACard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.styleDNACardTitle, { color: theme.colors.text }]}>✨ Style Summary</Text>
              <Text style={[styles.styleDNAText, { color: theme.colors.text }]}>
                {styleDNA.style_summary}
              </Text>
            </View>
          )}

          {/* Fashion Prompt */}
          {styleDNA.fashion_prompt && (
            <View style={[styles.styleDNACard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.styleDNACardTitle, { color: theme.colors.text }]}>🎯 Fashion Direction</Text>
              <Text style={[styles.styleDNAText, { color: theme.colors.text }]}>
                {styleDNA.fashion_prompt}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.text }]}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>{savedItems.length}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Wardrobe Items</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>{lovedOutfits.length}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Loved Outfits</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>{styleDNA ? '✅' : '❌'}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Style DNA</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>{selectedGender ? '✅' : '❌'}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Gender Set</Text>
          </View>
        </View>
      </View>

      {/* Backup Section */}
      <BackupSection theme={theme} styles={styles} onRefreshData={onRefreshData} />
      
      {/* Add some bottom padding */}
      <View style={{ height: 32 }} />
    </View>
  );
};

// Settings Tab Content Component  
interface SettingsTabContentProps {
  theme: any;
  themeMode: string;
  colorScheme: string;
  isDark: boolean;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  setColorScheme: (scheme: string) => void;
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy') => void;
  onRefreshData?: () => void;
  styles: any;
}

const SettingsTabContent: React.FC<SettingsTabContentProps> = ({
  theme,
  themeMode,
  colorScheme,
  isDark,
  setThemeMode,
  setColorScheme,
  triggerHaptic,
  onRefreshData,
  styles
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

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
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start Fresh', style: 'destructive', onPress: () => performStartFresh(storageInfo) }
        ]
      );
    } catch (error) {
      logger.error(LogCategories.USER_ACTION, 'Failed to get storage info for Start Fresh', error);
      Alert.alert('Error', 'Failed to get storage information. Please try again.');
    }
  };

  const performStartFresh = async (storageInfo: any) => {
    Alert.alert(
      '⚠️ Final Confirmation',
      `Are you absolutely sure? This cannot be undone.\n\n` +
      `This will:\n` +
      `• Delete all ${storageInfo.totalKeys} stored items\n` +
      `• Reset all settings and preferences\n` +
      `• Return you to the onboarding screen\n\n` +
      `A backup will be created first for safety.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Start Fresh', 
          style: 'destructive', 
          onPress: async () => {
            try {
              triggerHaptic('heavy');
              logger.info(LogCategories.USER_ACTION, 'User initiated Start Fresh');
              
              const success = await DataResetService.resetAllData();
              
              if (success) {
                logger.info(LogCategories.USER_ACTION, 'Start Fresh completed successfully');
                await AsyncStorage.setItem('forceAppRestart', 'true');
                Alert.alert('✅ Reset Complete', 'StyleMuse has been reset successfully. The app will restart to complete the process.');
              } else {
                throw new Error('Reset operation failed');
              }
            } catch (error) {
              logger.error(LogCategories.USER_ACTION, 'Start Fresh failed', error);
              Alert.alert('Reset Failed', 'Failed to reset app data. Please try again or contact support if the problem persists.');
            }
          }
        }
      ]
    );
  };

  return (
    <View>
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
    </View>
  );
};

// Backup Section Component (keeping the existing one)
interface BackupSectionProps {
  theme: any;
  styles: any;
  onRefreshData?: () => void;
}

const BackupSection: React.FC<BackupSectionProps> = ({ theme, styles, onRefreshData }) => {
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [backupStats, setBackupStats] = useState<{
    availableBackups: number;
    lastBackupDate: Date | null;
    totalBackupSize: string;
  }>({
    availableBackups: 0,
    lastBackupDate: null,
    totalBackupSize: '0 KB'
  });

  useEffect(() => {
    loadBackupStats();
  }, []);

  const loadBackupStats = async () => {
    try {
      const stats = await PersistenceService.getBackupStats();
      setBackupStats(stats);
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to load backup stats', error);
    }
  };

  const triggerBackup = async () => {
    try {
      logger.info(LogCategories.USER_ACTION, 'User triggered manual backup');
      
      const success = await PersistenceService.createBackup();
      
      if (success) {
        Alert.alert('✅ Backup Created', 'Your data has been backed up successfully.');
        await loadBackupStats();
        if (onRefreshData) {
          onRefreshData();
        }
      } else {
        Alert.alert('❌ Backup Failed', 'Failed to create backup. Please try again.');
      }
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Manual backup failed', error);
      Alert.alert('❌ Backup Failed', 'An error occurred during backup. Please try again.');
    }
  };

  return (
    <View style={styles.backupSection}>
      <Text style={[styles.sectionSubtitle, { color: theme.colors.text }]}>💾 Backup & Data</Text>
      
      <View style={[styles.backupCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.backupHeader}>
          <View style={styles.backupInfo}>
            <Text style={[styles.backupTitle, { color: theme.colors.text }]}>
              📱 Data Backup
            </Text>
            <Text style={[styles.backupDescription, { color: theme.colors.textSecondary }]}>
              {backupStats.availableBackups} backups available • {backupStats.totalBackupSize}
            </Text>
            {backupStats.lastBackupDate && (
              <Text style={[styles.backupLastDate, { color: theme.colors.textMuted }]}>
                Last backup: {backupStats.lastBackupDate.toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.backupButtons}>
          <TouchableOpacity
            style={[styles.backupButton, { backgroundColor: theme.colors.primary }]}
            onPress={triggerBackup}
          >
            <Text style={styles.backupButtonText}>💾 Create Backup</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.backupButton, { backgroundColor: theme.colors.secondary }]}
            onPress={() => setShowBackupManager(true)}
          >
            <Text style={styles.backupButtonText}>📋 Manage Backups</Text>
          </TouchableOpacity>
        </View>
      </View>

      <BackupManagerModal
        visible={showBackupManager}
        onClose={() => setShowBackupManager(false)}
        onRefreshData={onRefreshData}
      />
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginTop: 20,
    flex: 1,
  },
  
  // Header Styles
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Section Styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 20,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  
  // Profile Photo Styles
  profilePhotoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePhotoContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  profileImageEmoji: {
    fontSize: 40,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconText: {
    color: 'white',
    fontSize: 18,
  },
  uploadText: {
    fontSize: 14,
    marginTop: 10,
  },
  analyzeButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Gender Card Styles
  genderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    ...theme.shadows.medium,
  },
  genderText: {
    fontSize: 16,
  },
  genderArrow: {
    fontSize: 16,
  },
  
  // Style DNA Styles
  styleDNASection: {
    marginBottom: 20,
  },
  styleDNACard: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  styleDNACardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  styleDNAText: {
    fontSize: 14,
    lineHeight: 18,
  },
  
  // Stats Styles
  statsSection: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    margin: 4,
    borderRadius: 8,
    ...theme.shadows.small,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  
  // Theme Options
  themeContainer: {
    paddingVertical: 8,
  },
  themeOptions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  
  // Backup Section Styles
  backupSection: {
    marginBottom: 20,
  },
  backupCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  backupHeader: {
    marginBottom: 16,
  },
  backupInfo: {
    flex: 1,
  },
  backupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  backupDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  backupLastDate: {
    fontSize: 12,
  },
  backupButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  backupButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backupButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});