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
import { costTracker, UsageStats, GenerationRecord } from '../utils/CostTracker';
import { temperatureUtils, TemperatureUnit } from '../utils/TemperatureUtils';
import { DailyWeatherSceneService, DailyWeatherScene } from '../services/DailyWeatherSceneService';
import * as Haptics from 'expo-haptics';
import { SettingsRow, SettingsSection, ThemeModeOption } from '../components/SettingsComponents';
import { soundService } from '../services/SoundService';

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
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'about'>('profile');
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
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'about' && { borderBottomColor: theme.colors.primary }
          ]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('about');
          }}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'about' ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            ℹ️ About
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
        ) : activeTab === 'settings' ? (
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
        ) : (
          <AboutTabContent
            theme={theme}
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
  const [selectedAIModel, setSelectedAIModel] = useState<'gpt-5-nano' | 'gpt-5-mini' | 'gpt-5'>('gpt-5-mini');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>('celsius');
  const [featuredImages, setFeaturedImages] = useState<GenerationRecord[]>([]);
  const [weatherScenes, setWeatherScenes] = useState<DailyWeatherScene[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  
  // Sound settings state
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [ambienceEnabled, setAmbienceEnabled] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<'ocean' | 'forest' | 'rain' | 'fireplace'>('ocean');

  // Load sound settings
  useEffect(() => {
    const loadSoundSettings = async () => {
      try {
        setSoundEffectsEnabled(soundService.getSoundEnabled());
        setMusicEnabled(soundService.getMusicEnabled());
        setAmbienceEnabled(soundService.getAmbienceEnabled());
        setCurrentTheme(soundService.getCurrentTheme() as 'ocean' | 'forest' | 'rain' | 'fireplace');
      } catch (error) {
        logger.error(LogCategories.STORAGE, 'Failed to load sound settings', error);
      }
    };
    loadSoundSettings();
  }, []);

  // Load saved AI model preference and usage stats
  useEffect(() => {
    const loadAIModelPreference = async () => {
      try {
        const saved = await AsyncStorage.getItem('preferred_ai_model');
        if (saved) {
          setSelectedAIModel(saved as 'gpt-5-nano' | 'gpt-5-mini' | 'gpt-5');
        }
      } catch (error) {
        logger.error(LogCategories.STORAGE, 'Failed to load AI model preference', error);
      }
    };
    
    const loadUsageStats = async () => {
      try {
        setLoadingStats(true);
        const stats = await costTracker.getUsageStats();
        setUsageStats(stats);
      } catch (error) {
        logger.error(LogCategories.ANALYTICS, 'Failed to load usage stats', error);
      } finally {
        setLoadingStats(false);
      }
    };

    const loadTemperatureUnit = async () => {
      try {
        const currentUnit = await temperatureUtils.initialize();
        setTemperatureUnit(currentUnit);
      } catch (error) {
        logger.error(LogCategories.STORAGE, 'Failed to load temperature unit', error);
      }
    };

    const loadFeaturedImages = async () => {
      try {
        setLoadingImages(true);
        // Load image generations
        const images = await costTracker.getImageGenerations(20); // Get last 20 images
        setFeaturedImages(images);
        
        // Load weather scenes
        const scenes = await DailyWeatherSceneService.getPreviousScenes(10); // Get last 10 scenes
        setWeatherScenes(scenes);
        
        logger.info(LogCategories.ANALYTICS, 'Featured images loaded', {
          imageGenerations: images.length,
          weatherScenes: scenes.length
        });
      } catch (error) {
        logger.error(LogCategories.ANALYTICS, 'Failed to load featured images', error);
      } finally {
        setLoadingImages(false);
      }
    };
    
    loadAIModelPreference();
    loadUsageStats();
    loadTemperatureUnit();
    loadFeaturedImages();
  }, []);

  // Save AI model preference
  const handleModelChange = async (model: 'gpt-5-nano' | 'gpt-5-mini' | 'gpt-5') => {
    try {
      await AsyncStorage.setItem('preferred_ai_model', model);
      setSelectedAIModel(model);
      triggerHaptic('light');
      logger.info(LogCategories.USER_ACTION, 'AI model preference changed', { model });
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to save AI model preference', error);
    }
  };

  // Handle temperature unit change
  const handleTemperatureUnitChange = async (unit: TemperatureUnit) => {
    try {
      await temperatureUtils.setUnit(unit);
      setTemperatureUnit(unit);
      triggerHaptic('light');
      logger.info(LogCategories.USER_ACTION, 'Temperature unit changed', { unit });
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to save temperature unit', error);
    }
  };

  const handleThemeChange = async (theme: 'ocean' | 'forest' | 'rain' | 'fireplace') => {
    try {
      await soundService.setTheme(theme);
      setCurrentTheme(theme);
      triggerHaptic('light');
      logger.info(LogCategories.USER_ACTION, 'Ambience theme changed', { theme });
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to change ambience theme', error);
      Alert.alert('Error', 'Failed to change ambience theme.');
    }
  };

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
        
        {/* Temperature Unit */}
        <View style={styles.themeContainer}>
          <SettingsRow
            icon="🌡️"
            title="Temperature Unit"
            theme={theme}
            hasChevron={false}
            rightComponent={
              <View style={styles.themeOptions}>
                {(['celsius', 'fahrenheit'] as const).map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.tempUnitOption,
                      temperatureUnit === unit && styles.tempUnitOptionActive,
                      { borderColor: theme.colors.border }
                    ]}
                    onPress={() => handleTemperatureUnitChange(unit)}
                  >
                    <Text style={[
                      styles.tempUnitOptionText,
                      { color: temperatureUnit === unit ? theme.colors.primary : theme.colors.textSecondary }
                    ]}>
                      {unit === 'celsius' ? '°C' : '°F'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            }
          />
        </View>

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

      {/* AI Generation Section */}
      <SettingsSection title="AI Generation" theme={theme}>
        <SettingsRow
          icon="🤖"
          title="Default AI Model"
          value={selectedAIModel === 'gpt-5' ? 'GPT-5 Pro' : 
                selectedAIModel === 'gpt-5-mini' ? 'GPT-5 Mini' : 
                'GPT-5 Nano'}
          onPress={() => setShowModelSelector(true)}
          theme={theme}
        />
        
        <View style={styles.costTableContainer}>
          <Text style={[styles.costTableTitle, { color: theme.colors.textSecondary }]}>
            💰 Generation Costs per Image
          </Text>
          <View style={styles.costTable}>
            <View style={[styles.costRow, selectedAIModel === 'gpt-5-nano' && styles.selectedCostRow]}>
              <Text style={[styles.costModelName, { color: theme.colors.text }]}>GPT-5 Nano</Text>
              <Text style={[styles.costValue, { color: '#4ECDC4' }]}>$0.02</Text>
              <Text style={[styles.costDescription, { color: theme.colors.textSecondary }]}>Fast & Cheap</Text>
            </View>
            <View style={[styles.costRow, selectedAIModel === 'gpt-5-mini' && styles.selectedCostRow]}>
              <Text style={[styles.costModelName, { color: theme.colors.text }]}>GPT-5 Mini</Text>
              <Text style={[styles.costValue, { color: '#45B7D1' }]}>$0.05</Text>
              <Text style={[styles.costDescription, { color: theme.colors.textSecondary }]}>Balanced (Recommended)</Text>
            </View>
            <View style={[styles.costRow, selectedAIModel === 'gpt-5' && styles.selectedCostRow]}>
              <Text style={[styles.costModelName, { color: theme.colors.text }]}>GPT-5 Pro</Text>
              <Text style={[styles.costValue, { color: '#FF6B6B' }]}>$0.15</Text>
              <Text style={[styles.costDescription, { color: theme.colors.textSecondary }]}>Premium Quality</Text>
            </View>
          </View>
        </View>

        {/* Usage Statistics */}
        <View style={styles.costTableContainer}>
          <Text style={[styles.costTableTitle, { color: theme.colors.textSecondary }]}>
            📊 Usage Statistics
          </Text>
          {loadingStats ? (
            <Text style={[styles.statsLoading, { color: theme.colors.textSecondary }]}>Loading stats...</Text>
          ) : usageStats ? (
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <Text style={[styles.statsLabel, { color: theme.colors.text }]}>Total Generated:</Text>
                <Text style={[styles.statsValue, { color: theme.colors.primary }]}>{usageStats.totalGenerations}</Text>
              </View>
              <View style={styles.statsRow}>
                <Text style={[styles.statsLabel, { color: theme.colors.text }]}>Total Cost:</Text>
                <Text style={[styles.statsValue, { color: '#FF6B6B' }]}>${usageStats.totalCost.toFixed(2)}</Text>
              </View>
              <View style={styles.statsRow}>
                <Text style={[styles.statsLabel, { color: theme.colors.text }]}>This Month:</Text>
                <Text style={[styles.statsValue, { color: '#45B7D1' }]}>${usageStats.monthlyCost.toFixed(2)}</Text>
              </View>
              <View style={styles.statsRow}>
                <Text style={[styles.statsLabel, { color: theme.colors.text }]}>Today:</Text>
                <Text style={[styles.statsValue, { color: '#4ECDC4' }]}>${usageStats.dailyCost.toFixed(2)}</Text>
              </View>
              {usageStats.lastGeneration && (
                <View style={styles.statsRow}>
                  <Text style={[styles.statsLabel, { color: theme.colors.text }]}>Last Generated:</Text>
                  <Text style={[styles.statsValue, { color: theme.colors.textSecondary }]}>
                    {usageStats.lastGeneration.toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={[styles.statsLoading, { color: theme.colors.textSecondary }]}>No usage data yet</Text>
          )}
        </View>

        {/* Featured Images Gallery */}
        <View style={styles.costTableContainer}>
          <Text style={[styles.costTableTitle, { color: theme.colors.textSecondary }]}>
            🖼️ Featured Images Gallery
          </Text>
          {loadingImages ? (
            <Text style={[styles.statsLoading, { color: theme.colors.textSecondary }]}>Loading images...</Text>
          ) : (
            <View style={styles.featuredImagesContainer}>
              {/* Recent Outfit Generations */}
              {featuredImages.length > 0 && (
                <View style={styles.imageSection}>
                  <Text style={[styles.imageSectionTitle, { color: theme.colors.text }]}>
                    🎨 Recent Outfit Generations ({featuredImages.length})
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
                    {featuredImages.map((image) => (
                      <TouchableOpacity 
                        key={image.id}
                        style={styles.imageCard}
                        onPress={() => {
                          Alert.alert(
                            'Image Details',
                            `Generated: ${new Date(image.timestamp).toLocaleDateString()}\nModel: ${image.model}\nCost: $${image.cost.toFixed(2)}`,
                            [
                              { text: 'Close', style: 'cancel' }
                            ]
                          );
                        }}
                      >
                        {image.imageUrl && (
                          <SafeImage
                            uri={image.imageUrl}
                            style={styles.imagePreview}
                            resizeMode="cover"
                          />
                        )}
                        <View style={styles.imageOverlay}>
                          <Text style={styles.imageDate}>
                            {new Date(image.timestamp).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </Text>
                          <Text style={styles.imageCost}>${image.cost.toFixed(2)}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Daily Weather Scenes */}
              {weatherScenes.length > 0 && (
                <View style={styles.imageSection}>
                  <Text style={[styles.imageSectionTitle, { color: theme.colors.text }]}>
                    🌤️ Daily Weather Scenes ({weatherScenes.length})
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
                    {weatherScenes.map((scene) => (
                      <TouchableOpacity 
                        key={scene.date}
                        style={styles.imageCard}
                        onPress={() => {
                          Alert.alert(
                            'Scene Details',
                            `Date: ${scene.date}\nLocation: ${scene.weatherData?.location || 'Unknown'}\nWeather: ${scene.weatherData?.condition || 'Unknown'}\n\n"${scene.prompt.substring(0, 150)}${scene.prompt.length > 150 ? '...' : ''}"`,
                            [
                              { text: 'Close', style: 'cancel' }
                            ]
                          );
                        }}
                      >
                        <SafeImage
                          uri={scene.imageUrl}
                          style={styles.imagePreview}
                          resizeMode="cover"
                        />
                        <View style={styles.imageOverlay}>
                          <Text style={styles.imageDate}>
                            {new Date(scene.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </Text>
                          <Text style={styles.imageCost}>Scene</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* No images message */}
              {featuredImages.length === 0 && weatherScenes.length === 0 && (
                <Text style={[styles.statsLoading, { color: theme.colors.textSecondary }]}>
                  No generated images yet. Start creating outfits to see them here!
                </Text>
              )}
            </View>
          )}
        </View>
      </SettingsSection>

      {/* Model Selector Modal */}
      {showModelSelector && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select AI Model</Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              Choose your preferred model for outfit generation
            </Text>
            
            {[
              { id: 'gpt-5-nano' as const, name: 'GPT-5 Nano', cost: '$0.02', desc: 'Fastest and cheapest option', color: '#4ECDC4' },
              { id: 'gpt-5-mini' as const, name: 'GPT-5 Mini', cost: '$0.05', desc: 'Best balance of quality and cost (Recommended)', color: '#45B7D1' },
              { id: 'gpt-5' as const, name: 'GPT-5 Pro', cost: '$0.15', desc: 'Highest quality and reliability', color: '#FF6B6B' },
            ].map((model) => (
              <TouchableOpacity
                key={model.id}
                style={[
                  styles.modelOption,
                  selectedAIModel === model.id && { borderColor: theme.colors.primary, borderWidth: 2 }
                ]}
                onPress={() => {
                  handleModelChange(model.id);
                  setShowModelSelector(false);
                }}
              >
                <View style={styles.modelOptionContent}>
                  <View style={styles.modelOptionHeader}>
                    <Text style={[styles.modelOptionName, { color: theme.colors.text }]}>{model.name}</Text>
                    <Text style={[styles.modelOptionCost, { color: model.color }]}>{model.cost}</Text>
                  </View>
                  <Text style={[styles.modelOptionDesc, { color: theme.colors.textSecondary }]}>{model.desc}</Text>
                </View>
                {selectedAIModel === model.id && (
                  <Text style={[styles.checkmark, { color: theme.colors.primary }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowModelSelector(false)}
            >
              <Text style={styles.modalCloseButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Sound & Music Section */}
      <SettingsSection title="Sound & Music" theme={theme}>
        <SettingsRow
          icon="🔊"
          title="Sound Effects"
          subtitle="Button taps and UI sounds"
          theme={theme}
          hasChevron={false}
          rightComponent={
            <Switch
              value={soundEffectsEnabled}
              onValueChange={async (value) => {
                triggerHaptic('light');
                await soundService.setSoundEnabled(value);
                setSoundEffectsEnabled(value);
                logger.info(LogCategories.USER_ACTION, 'Sound effects toggled', { enabled: value });
              }}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.card}
            />
          }
        />
        
        <SettingsRow
          icon="🎵"
          title="Background Music"
          subtitle={`Now playing: ${soundService.getCurrentTimeOfDay()} track`}
          theme={theme}
          hasChevron={false}
          rightComponent={
            <Switch
              value={musicEnabled}
              onValueChange={async (value) => {
                triggerHaptic('light');
                await soundService.setMusicEnabled(value);
                setMusicEnabled(value);
                logger.info(LogCategories.USER_ACTION, 'Background music toggled', { enabled: value });
              }}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.card}
            />
          }
        />
        
        <SettingsRow
          icon="🌊"
          title="Peaceful Ambience"
          subtitle={`${currentTheme === 'ocean' ? '🌊 Ocean Waves' : 
                     currentTheme === 'forest' ? '🌲 Forest Sounds' :
                     currentTheme === 'rain' ? '🌧️ Gentle Rain' : '🔥 Cozy Fireplace'}`}
          theme={theme}
          hasChevron={false}
          rightComponent={
            <Switch
              value={ambienceEnabled}
              onValueChange={async (value) => {
                triggerHaptic('light');
                await soundService.setAmbienceEnabled(value);
                setAmbienceEnabled(value);
                logger.info(LogCategories.USER_ACTION, 'Ambience toggled', { enabled: value, theme: currentTheme });
              }}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.card}
            />
          }
        />
        
        <SettingsRow
          icon="🎨"
          title="Ambience Theme"
          value={currentTheme === 'ocean' ? '🌊 Ocean' : 
                 currentTheme === 'forest' ? '🌲 Forest' :
                 currentTheme === 'rain' ? '🌧️ Rain' : '🔥 Fireplace'}
          onPress={() => {
            triggerHaptic('light');
            Alert.alert(
              'Choose Peaceful Theme',
              'Select your preferred ambient soundscape',
              [
                { text: '🌊 Ocean Waves', onPress: () => handleThemeChange('ocean') },
                { text: '🌲 Forest Sounds', onPress: () => handleThemeChange('forest') },
                { text: '🌧️ Gentle Rain', onPress: () => handleThemeChange('rain') },
                { text: '🔥 Cozy Fireplace', onPress: () => handleThemeChange('fireplace') },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
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

// About Tab Content Component
const AboutTabContent: React.FC<{ theme: any; styles: any }> = ({ theme, styles }) => {
  return (
    <View style={styles.tabContentContainer}>
      {/* App Info Section */}
      <View style={[styles.aboutSection, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.aboutTitle, { color: theme.colors.primary }]}>
          StyleMuse
        </Text>
        <Text style={[styles.aboutVersion, { color: theme.colors.textSecondary }]}>
          Version 1.0.0
        </Text>
        <Text style={[styles.aboutDescription, { color: theme.colors.text }]}>
          Your AI-powered fashion companion with peaceful vibes 🌊
        </Text>
      </View>

      {/* Credits Section */}
      <View style={[styles.creditsSection, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          🙏 Credits & Thanks
        </Text>
        
        <View style={styles.creditItem}>
          <Text style={[styles.creditTitle, { color: theme.colors.text }]}>
            🎵 Background Music
          </Text>
          <Text style={[styles.creditDescription, { color: theme.colors.textSecondary }]}>
            Towball's Crossing by Towball
          </Text>
          <TouchableOpacity 
            onPress={() => {
              // Open link to Towball's itch.io page
              Alert.alert(
                'Visit Towball', 
                'Opens in browser: https://towball.itch.io/towballs-crossing',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Open', onPress: () => {
                    logger.info(LogCategories.USER_ACTION, 'Opening Towball credit link');
                  }}
                ]
              );
            }}
            style={[styles.creditLink, { backgroundColor: theme.colors.primary + '20' }]}
          >
            <Text style={[styles.creditLinkText, { color: theme.colors.primary }]}>
              🔗 towball.itch.io/towballs-crossing
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.creditItem}>
          <Text style={[styles.creditTitle, { color: theme.colors.text }]}>
            🌊 Ambient Sounds
          </Text>
          <Text style={[styles.creditDescription, { color: theme.colors.textSecondary }]}>
            Ocean waves, rain, forest, and fireplace sounds for peaceful vibes
          </Text>
        </View>

        <View style={styles.creditItem}>
          <Text style={[styles.creditTitle, { color: theme.colors.text }]}>
            🤖 AI Technology
          </Text>
          <Text style={[styles.creditDescription, { color: theme.colors.textSecondary }]}>
            Powered by OpenAI GPT-5 and Claude
          </Text>
        </View>

        <View style={styles.creditItem}>
          <Text style={[styles.creditTitle, { color: theme.colors.text }]}>
            💎 Gamification Design
          </Text>
          <Text style={[styles.creditDescription, { color: theme.colors.textSecondary }]}>
            Inspired by Pokemon TCG and fashion gaming
          </Text>
        </View>
      </View>

      {/* Developer Section */}
      <View style={[styles.developerSection, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          👨‍💻 Development
        </Text>
        <Text style={[styles.creditDescription, { color: theme.colors.textSecondary }]}>
          Built with React Native, Expo, and lots of ☕
        </Text>
        <Text style={[styles.creditDescription, { color: theme.colors.textSecondary, marginTop: 10 }]}>
          Special thanks to the StyleMuse community for feedback and support!
        </Text>
      </View>

      {/* Contact Section */}
      <View style={[styles.contactSection, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          📧 Get in Touch
        </Text>
        <Text style={[styles.creditDescription, { color: theme.colors.textSecondary }]}>
          Questions, feedback, or suggestions?
        </Text>
        <TouchableOpacity 
          style={[styles.contactButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            Alert.alert('Contact', 'Contact feature coming soon!');
          }}
        >
          <Text style={styles.contactButtonText}>Send Feedback</Text>
        </TouchableOpacity>
      </View>
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

  // AI Model Selection Styles
  costTableContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  costTableTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  costTable: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 12,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    marginVertical: 2,
  },
  selectedCostRow: {
    backgroundColor: 'rgba(70, 183, 209, 0.1)',
  },
  costModelName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  costValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  costDescription: {
    fontSize: 12,
    flex: 1.2,
    textAlign: 'right',
  },
  
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modelOptionContent: {
    flex: 1,
  },
  modelOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modelOptionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  modelOptionCost: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modelOptionDesc: {
    fontSize: 13,
  },
  checkmark: {
    fontSize: 18,
    marginLeft: 8,
  },
  modalCloseButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Usage Statistics Styles
  statsContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  statsLabel: {
    fontSize: 14,
    flex: 1,
  },
  statsValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  statsLoading: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },

  // Featured Images Gallery Styles
  featuredImagesContainer: {
    marginTop: 8,
  },
  imageSection: {
    marginBottom: 16,
  },
  imageSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    paddingLeft: 4,
  },
  imageGallery: {
    paddingLeft: 4,
  },
  imageCard: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 2,
    paddingHorizontal: 4,
    flexDirection: 'column',
    alignItems: 'center',
  },
  imageDate: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  imageCost: {
    fontSize: 7,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
  },

  // Temperature Unit Styles
  tempUnitOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 2,
    minWidth: 36,
    alignItems: 'center',
  },
  tempUnitOptionActive: {
    borderWidth: 2,
  },
  tempUnitOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // About Tab Styles
  aboutSection: {
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  aboutVersion: {
    fontSize: 14,
    marginBottom: 10,
  },
  aboutDescription: {
    fontSize: 16,
    textAlign: 'center',
  },
  creditsSection: {
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
  },
  creditItem: {
    marginBottom: 20,
  },
  creditTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  creditDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  creditLink: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  creditLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  developerSection: {
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
  },
  contactSection: {
    padding: 20,
    marginBottom: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  contactButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});