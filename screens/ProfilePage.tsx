import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Switch, Alert } from 'react-native';
import { WardrobeItem, LovedOutfit } from '../hooks/useWardrobeData';
import { SafeImage } from '../utils/SafeImage';
import { EnhancedStyleDNA } from '../types/Avatar';
import { PersistenceService } from '../services/PersistenceService';
import { useTheme } from '../contexts/ThemeContext';
import { BackupManagerModal } from '../components/BackupManagerModal';
import { DataResetService } from '../utils/DataResetService';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface ProfilePageProps {
  profileImage: string | null;
  styleDNA: EnhancedStyleDNA | null;
  selectedGender: 'male' | 'female' | 'nonbinary' | null;
  savedItems: WardrobeItem[];
  lovedOutfits: LovedOutfit[];
  analyzingProfile: boolean;
  pickProfileImage: () => void;
  analyzeProfileImage: (imageUri: string) => void;
  setShowGenderSelector: (show: boolean) => void;
  onUpdateStyleDNA: (updatedStyleDNA: EnhancedStyleDNA) => void;
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy') => void;
  navigateToAvatarCustomization: () => void;
  onRefreshData?: () => void; // Add refresh callback
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
  navigateToAvatarCustomization,
  onRefreshData,
}) => {
  const { theme, themeMode, colorScheme, isDark, setThemeMode, setColorScheme, toggleTheme } = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, paddingHorizontal: 20, textAlign: 'center' }}>
        🧬 Style DNA Profile
      </Text>
      
      {/* Profile Images Section */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          {/* Real Profile Photo */}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Your Photo</Text>
            <TouchableOpacity
              onPress={pickProfileImage}
              style={{ position: 'relative' }}
            >
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: styleDNA ? '#4CAF50' : '#e0e0e0' }} 
                />
              ) : (
                <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#e0e0e0' }}>
                  <Text style={{ fontSize: 30 }}>🧬</Text>
                </View>
              )}
              <View style={{ position: 'absolute', top: 2, right: 2, width: 25, height: 25, borderRadius: 12.5, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontSize: 12 }}>✏️</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Generated Avatar */}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Your Avatar</Text>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('medium');
                navigateToAvatarCustomization();
              }}
              style={{ position: 'relative' }}
            >
              {styleDNA?.avatar_image_url ? (
                <View style={{ width: 100, height: 100, borderRadius: 50, overflow: 'hidden', borderWidth: 3, borderColor: '#007AFF' }}>
                  <SafeImage 
                    uri={styleDNA.avatar_image_url}
                    style={{ width: '100%', height: '100%' }}
                    fallbackStyle={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}
                  />
                </View>
              ) : (
                <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#e0e0e0' }}>
                  <Text style={{ fontSize: 20 }}>🎨</Text>
                  <Text style={{ fontSize: 8, color: '#666', textAlign: 'center' }}>Customize to generate</Text>
                </View>
              )}
              {/* Edit indicator */}
              <View style={{ position: 'absolute', top: 2, right: 2, width: 25, height: 25, borderRadius: 12.5, backgroundColor: '#8e24aa', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontSize: 12 }}>🎨</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {profileImage && (
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('medium');
              analyzeProfileImage(profileImage);
            }}
            style={{
              marginTop: 15,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 25,
              backgroundColor: '#007AFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
            disabled={analyzingProfile}
          >
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: 'white' }}>
              {analyzingProfile ? '🧬 Analyzing...' : '🧬 Analyze Style DNA'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Gender Selection Section */}
      <View style={{ marginBottom: 20, paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' }}>
          Gender Identity
        </Text>
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 10, textAlign: 'center' }}>
          Helps AI generate outfits that match your preferred style
        </Text>
        
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            setShowGenderSelector(true);
          }}
          style={[
            styles.genderCard,
            {
              borderColor: !selectedGender ? theme.colors.error : theme.colors.border,
            }
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, marginRight: 10 }}>
              {selectedGender === 'male' ? '👨' : 
               selectedGender === 'female' ? '👩' : 
               selectedGender === 'nonbinary' ? '🌈' : '⚧️'}
            </Text>
            <Text style={[styles.genderText, { color: theme.colors.text }]}>
              {selectedGender ? selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1) : 'Select Gender'}
            </Text>
          </View>
          <Text style={[styles.genderArrow, { color: theme.colors.textSecondary }]}>▶️</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar Customization Button */}
      <View style={{ marginBottom: 20, paddingHorizontal: 20 }}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('medium');
            navigateToAvatarCustomization();
          }}
          style={{
            backgroundColor: '#8e24aa',
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 24, marginRight: 10 }}>🎨</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white', marginBottom: 2 }}>
              Customize Your Avatar
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              Add details about your style, sizes, and preferences
            </Text>
          </View>
          <Text style={{ fontSize: 16, color: 'white' }}>▶️</Text>
        </TouchableOpacity>
      </View>

      {/* Style DNA Results Section */}
      {styleDNA && (
        <View style={{ marginBottom: 20, paddingHorizontal: 20 }}>
          <Text style={[{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }, { color: theme.colors.text }]}>
            🧬 Style DNA Analysis
          </Text>
          
          {/* Appearance */}
          {styleDNA.appearance && (
            <View style={[styles.styleDNACard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.styleDNACardTitle, { color: theme.colors.text }]}>👤 Physical Characteristics</Text>
              <Text style={[styles.styleDNAText, { color: theme.colors.text }]}>
                <Text style={[styles.styleDNALabel, { color: theme.colors.primary }]}>Hair Color:</Text> {styleDNA.appearance.hair_color || 'Not specified'}
              </Text>
              <Text style={[styles.styleDNAText, { color: theme.colors.text }]}>
                <Text style={[styles.styleDNALabel, { color: theme.colors.primary }]}>Hair Length:</Text> {styleDNA.appearance.hair_length || 'Not specified'}
              </Text>
              <Text style={[styles.styleDNAText, { color: theme.colors.text }]}>
                <Text style={[styles.styleDNALabel, { color: theme.colors.primary }]}>Hair Texture:</Text> {styleDNA.appearance.hair_texture || 'Not specified'}
              </Text>
              <Text style={[styles.styleDNAText, { color: theme.colors.text }]}>
                <Text style={[styles.styleDNALabel, { color: theme.colors.primary }]}>Build:</Text> {styleDNA.appearance.build || 'Not specified'}
              </Text>
              <Text style={[styles.styleDNAText, { color: theme.colors.text }]}>
                <Text style={[styles.styleDNALabel, { color: theme.colors.primary }]}>Complexion:</Text> {styleDNA.appearance.complexion || 'Not specified'}
              </Text>
              <Text style={[styles.styleDNAText, { color: theme.colors.text }]}>
                <Text style={[styles.styleDNALabel, { color: theme.colors.primary }]}>Age Range:</Text> {styleDNA.appearance.age_range || styleDNA.appearance.approximate_age_range || 'Not specified'}
              </Text>
            </View>
          )}

          {/* Style Preferences */}
          {styleDNA.style_preferences && (
            <View style={[styles.styleDNACard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.styleDNACardTitle, { color: theme.colors.text }]}>🎨 Style Preferences</Text>
              <Text style={[styles.styleDNAText, { color: theme.colors.text }]}>
                <Text style={[styles.styleDNALabel, { color: theme.colors.primary }]}>Aesthetic:</Text> {styleDNA.style_preferences.aesthetic_shown || 'Not specified'}
              </Text>
              <Text style={[styles.styleDNAText, { color: theme.colors.text }]}>
                <Text style={[styles.styleDNALabel, { color: theme.colors.primary }]}>Recommended Styles:</Text> {Array.isArray(styleDNA.style_preferences.recommended_styles) ? styleDNA.style_preferences.recommended_styles.join(', ') : 'Not specified'}
              </Text>
              <Text style={[styles.styleDNAText, { color: theme.colors.text }]}>
                <Text style={[styles.styleDNALabel, { color: theme.colors.primary }]}>Color Harmony:</Text> {Array.isArray(styleDNA.style_preferences.color_harmony) ? styleDNA.style_preferences.color_harmony.join(', ') : 'Not specified'}
              </Text>
              <Text style={[styles.styleDNAText, { color: theme.colors.text }]}>
                <Text style={[styles.styleDNALabel, { color: theme.colors.primary }]}>Fit Recommendations:</Text> {styleDNA.style_preferences.fit_recommendations || 'Not specified'}
              </Text>
              {styleDNA.style_preferences.styling_notes && (
                <Text style={[styles.styleDNAText, { color: theme.colors.text, fontStyle: 'italic', marginTop: 5 }]}>
                  <Text style={[styles.styleDNALabel, { color: theme.colors.primary }]}>Styling Notes:</Text> {styleDNA.style_preferences.styling_notes}
                </Text>
              )}
            </View>
          )}

          {/* Outfit Coordination */}
          {styleDNA.outfit_coordination && (
            <View style={[styles.styleDNACard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.styleDNACardTitle, { color: theme.colors.text }]}>✨ Outfit Coordination</Text>
              <Text style={[styles.styleDNAText, { color: theme.colors.text, lineHeight: 18 }]}>
                {styleDNA.outfit_coordination}
              </Text>
            </View>
          )}

          {/* Fashion Prompt */}
          {styleDNA.fashion_prompt && (
            <View style={[styles.styleDNACard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.styleDNACardTitle, { color: theme.colors.text }]}>🎯 Fashion Direction</Text>
              <Text style={[styles.styleDNAText, { color: theme.colors.text, lineHeight: 18 }]}>
                {styleDNA.fashion_prompt}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Stats Section */}
      <View style={{ marginBottom: 20, paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
          Your Stats
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{savedItems.length}</Text>
            <Text style={styles.statLabel}>Wardrobe Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{lovedOutfits.length}</Text>
            <Text style={styles.statLabel}>Loved Outfits</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {styleDNA ? '✅' : '❌'}
            </Text>
            <Text style={styles.statLabel}>Style DNA</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {selectedGender ? '✅' : '❌'}
            </Text>
            <Text style={styles.statLabel}>Gender Set</Text>
          </View>
        </View>
      </View>

      {/* App Settings Section */}
      <View style={[styles.settingsSection, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.settingsSectionTitle, { color: theme.colors.text }]}>
          ⚙️ App Settings
        </Text>
        <Text style={[styles.settingsSectionSubtitle, { color: theme.colors.textSecondary }]}>
          Customize your StyleMuse experience
        </Text>

        {/* Dark Mode Toggle */}
        <View style={[styles.settingCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.settingHeader}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                🌙 Dark Mode
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                {themeMode === 'system' 
                  ? `Auto (Currently ${isDark ? 'Dark' : 'Light'})`
                  : themeMode === 'dark' 
                    ? 'Always Dark' 
                    : 'Always Light'
                }
              </Text>
            </View>
          </View>
          
          {/* Theme Mode Options */}
          <View style={styles.themeOptions}>
            {(['light', 'dark', 'system'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: themeMode === mode ? theme.colors.primary : theme.colors.surface,
                    borderColor: themeMode === mode ? theme.colors.primary : theme.colors.border,
                  }
                ]}
                onPress={async () => {
                  await triggerHaptic('light');
                  setThemeMode(mode);
                }}
              >
                <Text style={styles.themeOptionIcon}>
                  {mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '🔄'}
                </Text>
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color: themeMode === mode ? '#FFFFFF' : theme.colors.text,
                    }
                  ]}
                >
                  {mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'Auto'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={[styles.settingNote, { color: theme.colors.textMuted }]}>
            💡 Auto mode follows your device's appearance settings. Perfect for sensitive eyes during late-night outfit planning!
          </Text>
        </View>

        {/* Color Scheme Toggle */}
        <View style={[styles.settingCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.settingHeader}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                🎨 Color Scheme
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                {colorScheme === 'tokyo' 
                  ? (theme.mode === 'dark' 
                    ? '🌃 Tokyo Cyber - Electric neon night vibes' 
                    : '🌸 Tokyo Kawaii - Soft peachy sakura aesthetic')
                  : '🎯 Default - Clean and classic colors'
                }
              </Text>
            </View>
          </View>
          
          {/* Color Scheme Options */}
          <View style={styles.themeOptions}>
            {(['default', 'tokyo'] as const).map((scheme) => (
              <TouchableOpacity
                key={scheme}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: colorScheme === scheme ? theme.colors.primary : theme.colors.surface,
                    borderColor: colorScheme === scheme ? theme.colors.primary : theme.colors.border,
                  }
                ]}
                onPress={async () => {
                  await triggerHaptic('light');
                  setColorScheme(scheme);
                }}
              >
                <Text style={styles.themeOptionIcon}>
                  {scheme === 'default' ? '🎯' : (theme.mode === 'dark' ? '🌃' : '🌸')}
                </Text>
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color: colorScheme === scheme ? '#FFFFFF' : theme.colors.text,
                    }
                  ]}
                >
                  {scheme === 'default' ? 'Default' : (theme.mode === 'dark' ? 'Cyber' : 'Kawaii')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={[styles.settingNote, { color: theme.colors.textMuted }]}>
            {colorScheme === 'tokyo' 
              ? (theme.mode === 'dark' 
                ? '⚡ Cyber mode: Electric neon colors for late-night style sessions! Perfect for channeling inner Tokyo street fashion energy 💫'
                : '🍑 Kawaii mode: Soft peachy colors inspired by sakura blossoms and mochi! Perfect for cute, dreamy outfit planning 💕')
              : '🌟 Experience Tokyo vibes with kawaii pastels (light) or cyber neon (dark) themes!'
            }
          </Text>
        </View>

        {/* Start Fresh Feature */}
        <StartFreshSection theme={theme} styles={styles} />

        {/* Future Settings Placeholder */}
        <View style={[styles.settingCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.settingHeader}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                🔮 More Settings Coming Soon
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                Notifications, export options, and more personalization features
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Backup & Data Management Section */}
      <BackupSection theme={theme} styles={styles} onRefreshData={onRefreshData} />

    </View>
  );
};

/**
 * 💾 BACKUP SECTION: Complete backup/restore system
 */
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
      const { FullBackupService } = await import('../services/FullBackupService');
      const backups = await FullBackupService.getAvailableBackups();
      
      const totalSize = backups.reduce((sum, backup) => sum + backup.totalSizeMB, 0);
      const lastBackup = backups.length > 0 ? new Date(backups[0].timestamp) : null;
      
      setBackupStats({
        availableBackups: backups.length,
        lastBackupDate: lastBackup,
        totalBackupSize: totalSize > 1 ? `${totalSize.toFixed(1)} MB` : `${Math.round(totalSize * 1024)} KB`,
      });
    } catch (error) {
      console.error('Failed to load backup stats:', error);
    }
  };

  const handleBackupCreated = (backupId: string) => {
    console.log('New backup created:', backupId);
    loadBackupStats(); // Refresh stats
  };

  const handleDataRestored = (backupId: string) => {
    console.log('Data restored from backup:', backupId);
    // You might want to trigger a full app refresh here
  };

  return (
    <View style={styles.backupSection}>
      <Text style={styles.backupTitle}>💾 Complete Backup System</Text>
      <Text style={styles.backupSubtitle}>
        Professional-grade backup, restore, and testing capabilities
      </Text>

      {/* Enhanced Backup Status */}
      <View style={styles.backupStatusCard}>
        <View style={styles.backupStatusHeader}>
          <Text style={styles.backupStatusTitle}>📊 System Status</Text>
          <Text style={[
            styles.backupStatusBadge, 
            backupStats.availableBackups > 0 ? styles.backupStatusGood : styles.backupStatusBad
          ]}>
            {backupStats.availableBackups > 0 ? '✅ Protected' : '⚠️ No Backups'}
          </Text>
        </View>
        
        <View style={styles.backupStatusDetails}>
          <Text style={styles.backupStatusText}>
            Backups: {backupStats.availableBackups} available
          </Text>
          <Text style={styles.backupStatusText}>
            Total Size: {backupStats.totalBackupSize}
          </Text>
          <Text style={styles.backupStatusText}>
            Last Backup: {backupStats.lastBackupDate 
              ? backupStats.lastBackupDate.toLocaleDateString() 
              : 'Never'}
          </Text>
        </View>
      </View>

      {/* Advanced Backup Manager Button */}
      <TouchableOpacity
        style={[styles.backupButton, styles.managerButton]}
        onPress={() => setShowBackupManager(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.backupButtonIcon}>🎛️</Text>
        <Text style={styles.backupButtonText}>Advanced Backup Manager</Text>
      </TouchableOpacity>

      <Text style={styles.backupNote}>
        🎯 Full backup/restore system with versioning, testing, and data reset capabilities. Create snapshots, restore from any point, and test your backup integrity.
      </Text>

      {/* Backup Manager Modal */}
      <BackupManagerModal
        visible={showBackupManager}
        onClose={() => setShowBackupManager(false)}
        onBackupCreated={handleBackupCreated}
        onDataRestored={handleDataRestored}
        onRefreshData={onRefreshData}
      />
    </View>
  );
};

/**
 * 🔄 START FRESH SECTION: Complete data reset and onboarding restart
 */
interface StartFreshSectionProps {
  theme: any;
  styles: any;
}

const StartFreshSection: React.FC<StartFreshSectionProps> = ({ theme, styles }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{
    totalKeys: number;
    totalSizeMB: number;
    keys: string[];
  }>({ totalKeys: 0, totalSizeMB: 0, keys: [] });

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      const info = await DataResetService.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to load storage info', error);
    }
  };

  const showStartFreshConfirmation = () => {
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
          style: 'cancel',
          onPress: () => {
            logger.info(LogCategories.USER_ACTION, 'Start fresh cancelled');
          }
        },
        {
          text: 'Start Fresh',
          style: 'destructive',
          onPress: showFinalConfirmation
        }
      ]
    );
  };

  const showFinalConfirmation = () => {
    Alert.alert(
      '⚠️ Final Confirmation',
      'Are you absolutely sure? This action cannot be undone without restoring from backup.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes, Start Fresh',
          style: 'destructive',
          onPress: handleStartFresh
        }
      ]
    );
  };

  const handleStartFresh = async () => {
    setIsResetting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      logger.info(LogCategories.USER_ACTION, 'Starting fresh - full data reset initiated');

      // Create backup before reset
      const backupId = await DataResetService.createBackupBeforeReset();
      if (backupId) {
        logger.info(LogCategories.STORAGE, 'Backup created before reset', { backupId });
      }

      // Reset all data
      const resetStats = await DataResetService.resetAllData();
      
      logger.info(LogCategories.USER_ACTION, 'Data reset completed', {
        clearedItems: resetStats.clearedItems,
        totalSizeMB: resetStats.totalSizeMB,
        errors: resetStats.errors.length
      });

      // Validate reset
      const isValid = await DataResetService.validateReset();
      
      if (isValid) {
        Alert.alert(
          '✅ Reset Complete',
          `Successfully reset ${resetStats.clearedItems} items (${resetStats.totalSizeMB.toFixed(1)} MB).\n\n` +
          `${backupId ? 'Backup created: ' + String(backupId).substring(0, 8) + '...\n\n' : 'No backup created\n\n'}` +
          `The app will restart to onboarding.`,
          [
            {
              text: 'Restart Now',
              onPress: async () => {
                // Set a flag to force app restart
                try {
                  await AsyncStorage.setItem('forceAppRestart', 'true');
                  logger.info(LogCategories.USER_ACTION, 'Restart flag set, app will restart');
                  
                  // For React Native, we need to restart differently
                  if (typeof window !== 'undefined' && window.location) {
                    window.location.reload();
                  } else {
                    // For mobile, show message that app needs to be restarted manually
                    Alert.alert(
                      '📱 Restart Required',
                      'Please close and reopen the app to complete the reset.',
                      [{ text: 'OK' }]
                    );
                  }
                } catch (error) {
                  logger.error(LogCategories.STORAGE, 'Failed to set restart flag', error);
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(
          '⚠️ Reset Incomplete',
          `Some data may not have been cleared. Check the backup manager for details.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to start fresh', error);
      Alert.alert(
        '❌ Reset Failed',
        `Failed to reset data: ${error.message}\n\nYour data is safe. Please try again or contact support.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <View style={[styles.settingCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.settingHeader}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
            🔄 Start Fresh
          </Text>
          <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
            Reset all data and go through onboarding again
          </Text>
        </View>
      </View>
      
      <View style={styles.startFreshInfo}>
        <Text style={[styles.startFreshInfoText, { color: theme.colors.textSecondary }]}>
          Current data: {storageInfo.totalKeys} items ({storageInfo.totalSizeMB.toFixed(1)} MB)
        </Text>
        <Text style={[styles.startFreshInfoText, { color: theme.colors.textSecondary }]}>
          ✅ Backup created automatically
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.startFreshButton, { backgroundColor: theme.colors.error }]}
        onPress={showStartFreshConfirmation}
        disabled={isResetting}
        activeOpacity={0.8}
      >
        {isResetting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.startFreshButtonText}>🔄 Start Fresh</Text>
        )}
      </TouchableOpacity>

      <Text style={[styles.settingNote, { color: theme.colors.textMuted }]}>
        Perfect for testing onboarding or completely starting over. Creates a backup first, so you can restore if needed.
      </Text>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  genderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    marginHorizontal: 20,
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
  styleDNACard: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  styleDNACardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  styleDNAText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 3,
  },
  styleDNALabel: {
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  statCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  // App Settings Section Styles
  settingsSection: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
  },
  settingsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  settingsSectionSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  settingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    gap: 6,
  },
  themeOptionIcon: {
    fontSize: 16,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingNote: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  // Backup Section Styles
  backupSection: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  backupSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  backupStatusCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backupStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backupStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  backupStatusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  backupStatusGood: {
    backgroundColor: theme.colors.success + '20',
    color: theme.colors.success,
  },
  backupStatusBad: {
    backgroundColor: theme.colors.error + '20',
    color: theme.colors.error,
  },
  backupStatusDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backupStatusText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  backupActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  backupButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  exportButton: {
    backgroundColor: theme.colors.primary,
  },
  importButton: {
    backgroundColor: theme.colors.success,
  },
  managerButton: {
    backgroundColor: theme.colors.primary,
    marginTop: 12,
  },
  backupButtonIcon: {
    fontSize: 16,
  },
  backupButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  backupNote: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Start Fresh Section Styles
  startFreshInfo: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  startFreshInfoText: {
    fontSize: 12,
    marginBottom: 2,
  },
  startFreshButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 44,
  },
  startFreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});