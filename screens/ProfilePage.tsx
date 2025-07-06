import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Switch } from 'react-native';
import { WardrobeItem, LovedOutfit } from '../hooks/useWardrobeData';
import { SafeImage } from '../utils/SafeImage';
import { EnhancedStyleDNA } from '../types/Avatar';
import { PersistenceService } from '../services/PersistenceService';
import { useTheme } from '../contexts/ThemeContext';
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
}) => {
  const { theme, themeMode, isDark, setThemeMode, toggleTheme } = useTheme();
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
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 15,
            borderWidth: 2,
            borderColor: !selectedGender ? '#ff6b6b' : '#e0e0e0',
            borderRadius: 12,
            backgroundColor: '#f8f9fa',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, marginRight: 10 }}>
              {selectedGender === 'male' ? '👨' : 
               selectedGender === 'female' ? '👩' : 
               selectedGender === 'nonbinary' ? '🌈' : '⚧️'}
            </Text>
            <Text style={{ fontSize: 16, color: '#333' }}>
              {selectedGender ? selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1) : 'Select Gender'}
            </Text>
          </View>
          <Text style={{ fontSize: 16, color: '#666' }}>▶️</Text>
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
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
            Style Analysis Results
          </Text>
          
          {/* Appearance */}
          {styleDNA.appearance && (
            <View style={styles.styleDNACard}>
              <Text style={styles.styleDNACardTitle}>👤 Appearance</Text>
              <Text style={styles.styleDNAText}>
                <Text style={styles.styleDNALabel}>Hair:</Text> {styleDNA.appearance.hair_color || 'Not specified'}
              </Text>
              <Text style={styles.styleDNAText}>
                <Text style={styles.styleDNALabel}>Build:</Text> {styleDNA.appearance.build || 'Not specified'}
              </Text>
              <Text style={styles.styleDNAText}>
                <Text style={styles.styleDNALabel}>Complexion:</Text> {styleDNA.appearance.complexion || 'Not specified'}
              </Text>
              <Text style={styles.styleDNAText}>
                <Text style={styles.styleDNALabel}>Age Range:</Text> {styleDNA.appearance.approximate_age_range || 'Not specified'}
              </Text>
            </View>
          )}

          {/* Style Preferences */}
          {styleDNA.style_preferences && (
            <View style={styles.styleDNACard}>
              <Text style={styles.styleDNACardTitle}>🎨 Style Preferences</Text>
              <Text style={styles.styleDNAText}>
                <Text style={styles.styleDNALabel}>Current Style:</Text> {styleDNA.style_preferences.current_style_visible || 'Not specified'}
              </Text>
              <Text style={styles.styleDNAText}>
                <Text style={styles.styleDNALabel}>Preferred Styles:</Text> {styleDNA.style_preferences.preferred_styles?.join(', ') || 'Not specified'}
              </Text>
              <Text style={styles.styleDNAText}>
                <Text style={styles.styleDNALabel}>Color Palette:</Text> {styleDNA.style_preferences.color_palette?.join(', ') || 'Not specified'}
              </Text>
              <Text style={styles.styleDNAText}>
                <Text style={styles.styleDNALabel}>Fit Preferences:</Text> {styleDNA.style_preferences.fit_preferences || 'Not specified'}
              </Text>
            </View>
          )}

          {/* Outfit Generation Notes */}
          {styleDNA.outfit_generation_notes && (
            <View style={styles.styleDNACard}>
              <Text style={styles.styleDNACardTitle}>✨ Outfit Generation</Text>
              <Text style={[styles.styleDNAText, { lineHeight: 16 }]}>
                {styleDNA.outfit_generation_notes}
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
      <BackupSection />

    </View>
  );
};

/**
 * 💾 BACKUP SECTION: Ultimate data persistence controls
 */
const BackupSection: React.FC = () => {
  const [backupInfo, setBackupInfo] = useState<{
    hasLocalBackup: boolean;
    lastBackupDate: Date | null;
    backupSize: string;
  }>({
    hasLocalBackup: false,
    lastBackupDate: null,
    backupSize: '0 KB'
  });
  const [loading, setLoading] = useState(false);

  // Load backup info on component mount
  useEffect(() => {
    loadBackupInfo();
  }, []);

  const loadBackupInfo = async () => {
    try {
      const info = await PersistenceService.getBackupInfo();
      setBackupInfo(info);
    } catch (error) {
      console.error('Error loading backup info:', error);
    }
  };

  const handleExportBackup = async () => {
    try {
      setLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await PersistenceService.exportBackup();
      await loadBackupInfo(); // Refresh backup info
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = async () => {
    try {
      setLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await PersistenceService.importBackup();
      await loadBackupInfo(); // Refresh backup info
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.backupSection}>
      <Text style={styles.backupTitle}>💾 Data Backup & Restore</Text>
      <Text style={styles.backupSubtitle}>
        Protect your StyleMuse data from app updates and device changes
      </Text>

      {/* Backup Status */}
      <View style={styles.backupStatusCard}>
        <View style={styles.backupStatusHeader}>
          <Text style={styles.backupStatusTitle}>📊 Backup Status</Text>
          <Text style={[styles.backupStatusBadge, backupInfo.hasLocalBackup ? styles.backupStatusGood : styles.backupStatusBad]}>
            {backupInfo.hasLocalBackup ? '✅ Protected' : '⚠️ No Backup'}
          </Text>
        </View>
        
        <View style={styles.backupStatusDetails}>
          <Text style={styles.backupStatusText}>
            Size: {backupInfo.backupSize}
          </Text>
          <Text style={styles.backupStatusText}>
            Last Backup: {backupInfo.lastBackupDate 
              ? backupInfo.lastBackupDate.toLocaleDateString() 
              : 'Never'}
          </Text>
        </View>
      </View>

      {/* Backup Actions */}
      <View style={styles.backupActions}>
        <TouchableOpacity
          style={[styles.backupButton, styles.exportButton]}
          onPress={handleExportBackup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.backupButtonIcon}>📤</Text>
              <Text style={styles.backupButtonText}>Export Backup</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.backupButton, styles.importButton]}
          onPress={handleImportBackup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.backupButtonIcon}>📥</Text>
              <Text style={styles.backupButtonText}>Restore Backup</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.backupNote}>
        💡 Your backups are saved to your device's secure storage and will sync with iCloud (iOS) automatically.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  styleDNACard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  styleDNACardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  styleDNAText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  styleDNALabel: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
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
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  backupSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  backupStatusCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
    color: '#333',
  },
  backupStatusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  backupStatusGood: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  backupStatusBad: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  backupStatusDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backupStatusText: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#007bff',
  },
  importButton: {
    backgroundColor: '#28a745',
  },
  backupButtonIcon: {
    fontSize: 16,
  },
  backupButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  backupNote: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});