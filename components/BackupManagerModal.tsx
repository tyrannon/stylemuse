import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { FullBackupService } from '../services/FullBackupService';
import { BackupRestoreService } from '../services/BackupRestoreService';
import { DataResetService } from '../services/DataResetService';

interface BackupMetadata {
  id: string;
  timestamp: number;
  version: string;
  itemCount: number;
  outfitCount: number;
  imageCount: number;
  totalSizeMB: number;
  userDescription?: string;
}

interface BackupManagerModalProps {
  visible: boolean;
  onClose: () => void;
  onBackupCreated?: (backupId: string) => void;
  onDataRestored?: (backupId: string) => void;
}

export const BackupManagerModal: React.FC<BackupManagerModalProps> = ({
  visible,
  onClose,
  onBackupCreated,
  onDataRestored,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'backups' | 'restore' | 'reset' | 'test'>('backups');
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [newBackupDescription, setNewBackupDescription] = useState('');
  const [progress, setProgress] = useState<{ message: string; percentage: number } | null>(null);
  const [resetConfirmation, setResetConfirmation] = useState('');

  const styles = createStyles(theme);

  useEffect(() => {
    if (visible) {
      loadAvailableBackups();
    }
  }, [visible]);

  const loadAvailableBackups = async () => {
    try {
      setLoading(true);
      const availableBackups = await FullBackupService.getAvailableBackups();
      setBackups(availableBackups);
    } catch (error) {
      console.error('Failed to load backups:', error);
      Alert.alert('Error', 'Failed to load available backups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setOperationInProgress(true);
      setProgress({ message: 'Creating backup...', percentage: 0 });

      const backupMetadata = await FullBackupService.createFullBackup(
        newBackupDescription || undefined
      );

      setProgress({ message: 'Backup created successfully!', percentage: 100 });
      setNewBackupDescription('');
      await loadAvailableBackups();
      onBackupCreated?.(backupMetadata.id);

      setTimeout(() => {
        setProgress(null);
        setOperationInProgress(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to create backup:', error);
      Alert.alert('Error', `Failed to create backup: ${error.message}`);
      setProgress(null);
      setOperationInProgress(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    try {
      const backup = backups.find(b => b.id === backupId);
      if (!backup) return;

      const result = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Restore Backup',
          `This will replace your current data with the backup from ${new Date(backup.timestamp).toLocaleString()}.\n\n` +
          `• ${backup.itemCount} wardrobe items\n` +
          `• ${backup.outfitCount} outfits\n` +
          `• ${backup.imageCount} images\n\n` +
          'Current data will be lost. Continue?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Restore', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      });

      if (!result) return;

      setOperationInProgress(true);
      setProgress({ message: 'Restoring backup...', percentage: 0 });

      const restoreResult = await BackupRestoreService.restoreFromBackup(
        backupId,
        {}, // Default options (restore everything)
        (progressInfo) => {
          setProgress({
            message: progressInfo.message,
            percentage: progressInfo.percentage,
          });
        }
      );

      if (restoreResult.success) {
        setProgress({ message: 'Restore completed successfully!', percentage: 100 });
        onDataRestored?.(backupId);
        
        setTimeout(() => {
          setProgress(null);
          setOperationInProgress(false);
          Alert.alert('Success', 'Backup restored successfully! Please restart the app to see changes.');
        }, 1500);
      } else {
        throw new Error(restoreResult.errors.join(', '));
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
      Alert.alert('Error', `Failed to restore backup: ${error.message}`);
      setProgress(null);
      setOperationInProgress(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      const backup = backups.find(b => b.id === backupId);
      if (!backup) return;

      const result = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Delete Backup',
          `Delete backup from ${new Date(backup.timestamp).toLocaleString()}?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      });

      if (!result) return;

      const success = await FullBackupService.deleteBackup(backupId);
      if (success) {
        await loadAvailableBackups();
        Alert.alert('Success', 'Backup deleted successfully');
      } else {
        Alert.alert('Error', 'Failed to delete backup');
      }
    } catch (error) {
      console.error('Failed to delete backup:', error);
      Alert.alert('Error', `Failed to delete backup: ${error.message}`);
    }
  };

  const handleCompleteReset = async () => {
    if (resetConfirmation !== 'RESET ALL DATA') {
      Alert.alert('Error', 'Please type "RESET ALL DATA" to confirm complete reset');
      return;
    }

    try {
      const result = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'DANGER: Complete Reset',
          'This will permanently delete ALL your data:\n\n' +
          '• All wardrobe items\n' +
          '• All outfits\n' +
          '• Style DNA\n' +
          '• Profile data\n' +
          '• All images\n\n' +
          'A backup will be created first. Continue?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'RESET ALL', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      });

      if (!result) return;

      setOperationInProgress(true);
      setProgress({ message: 'Creating backup before reset...', percentage: 25 });

      const resetResult = await DataResetService.performCompleteReset(
        {}, // Default options (reset everything)
        resetConfirmation
      );

      if (resetResult.success) {
        setProgress({ message: 'Reset completed successfully!', percentage: 100 });
        setResetConfirmation('');
        await loadAvailableBackups(); // Refresh to show the pre-reset backup
        
        setTimeout(() => {
          setProgress(null);
          setOperationInProgress(false);
          Alert.alert(
            'Reset Complete', 
            `All data has been reset. ${resetResult.backupId ? `Backup created: ${resetResult.backupId}` : 'No backup was created.'}`
          );
        }, 1500);
      } else {
        throw new Error(resetResult.errors.join(', '));
      }
    } catch (error) {
      console.error('Failed to reset data:', error);
      Alert.alert('Error', `Failed to reset data: ${error.message}`);
      setProgress(null);
      setOperationInProgress(false);
    }
  };

  const handleTestCycle = async () => {
    try {
      setOperationInProgress(true);
      setProgress({ message: 'Running backup/restore test...', percentage: 0 });

      const testResult = await DataResetService.testBackupRestoreCycle();

      if (testResult.success) {
        setProgress({ message: 'Test completed successfully!', percentage: 100 });
        
        setTimeout(() => {
          setProgress(null);
          setOperationInProgress(false);
          Alert.alert(
            'Test Successful',
            `Backup/restore cycle test completed successfully!\n\n${testResult.steps.join('\n')}`,
            [{ text: 'OK' }]
          );
        }, 1500);
      } else {
        throw new Error(testResult.errors.join(', '));
      }
    } catch (error) {
      console.error('Test cycle failed:', error);
      Alert.alert('Error', `Test cycle failed: ${error.message}`);
      setProgress(null);
      setOperationInProgress(false);
    }
  };

  const formatBackupDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatBackupSize = (sizeMB: number) => {
    if (sizeMB < 1) {
      return `${Math.round(sizeMB * 1024)} KB`;
    }
    return `${sizeMB.toFixed(1)} MB`;
  };

  const renderBackupsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.createBackupSection}>
        <Text style={styles.sectionTitle}>Create New Backup</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Optional description..."
          placeholderTextColor={theme.colors.textMuted}
          value={newBackupDescription}
          onChangeText={setNewBackupDescription}
          maxLength={100}
        />
        <TouchableOpacity
          style={[styles.primaryButton, operationInProgress && styles.disabledButton]}
          onPress={handleCreateBackup}
          disabled={operationInProgress}
        >
          <Ionicons name="archive" size={20} color={theme.colors.background} />
          <Text style={styles.primaryButtonText}>Create Backup</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.backupListSection}>
        <Text style={styles.sectionTitle}>Available Backups</Text>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : backups.length === 0 ? (
          <Text style={styles.emptyText}>No backups available</Text>
        ) : (
          <ScrollView style={styles.backupList}>
            {backups.map((backup) => (
              <View key={backup.id} style={styles.backupItem}>
                <View style={styles.backupInfo}>
                  <Text style={styles.backupDate}>{formatBackupDate(backup.timestamp)}</Text>
                  {backup.userDescription && (
                    <Text style={styles.backupDescription}>{backup.userDescription}</Text>
                  )}
                  <Text style={styles.backupStats}>
                    {backup.itemCount} items • {backup.outfitCount} outfits • {formatBackupSize(backup.totalSizeMB)}
                  </Text>
                </View>
                <View style={styles.backupActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleRestoreBackup(backup.id)}
                    disabled={operationInProgress}
                  >
                    <Ionicons name="refresh" size={18} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteBackup(backup.id)}
                    disabled={operationInProgress}
                  >
                    <Ionicons name="trash" size={18} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );

  const renderResetTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.dangerSection}>
        <Text style={styles.dangerTitle}>⚠️ Complete Data Reset</Text>
        <Text style={styles.dangerDescription}>
          This will permanently delete ALL your StyleMuse data. A backup will be created automatically before reset.
        </Text>
        
        <Text style={styles.confirmationLabel}>
          Type "RESET ALL DATA" to confirm:
        </Text>
        <TextInput
          style={[styles.textInput, styles.confirmationInput]}
          placeholder="RESET ALL DATA"
          placeholderTextColor={theme.colors.textMuted}
          value={resetConfirmation}
          onChangeText={setResetConfirmation}
          autoCapitalize="characters"
        />
        
        <TouchableOpacity
          style={[
            styles.dangerButton,
            (operationInProgress || resetConfirmation !== 'RESET ALL DATA') && styles.disabledButton
          ]}
          onPress={handleCompleteReset}
          disabled={operationInProgress || resetConfirmation !== 'RESET ALL DATA'}
        >
          <Ionicons name="nuclear" size={20} color={theme.colors.background} />
          <Text style={styles.dangerButtonText}>RESET ALL DATA</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTestTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>🧪 Test Backup System</Text>
        <Text style={styles.testDescription}>
          Run a complete backup/restore cycle test to verify system integrity.
        </Text>
        
        <TouchableOpacity
          style={[styles.primaryButton, operationInProgress && styles.disabledButton]}
          onPress={handleTestCycle}
          disabled={operationInProgress}
        >
          <Ionicons name="flask" size={20} color={theme.colors.background} />
          <Text style={styles.primaryButtonText}>Run Test Cycle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Backup Manager</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Progress Overlay */}
        {progress && (
          <View style={styles.progressOverlay}>
            <View style={styles.progressCard}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.progressMessage}>{progress.message}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress.percentage}%` }
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          {[
            { key: 'backups', label: 'Backups', icon: 'archive' },
            { key: 'reset', label: 'Reset', icon: 'refresh' },
            { key: 'test', label: 'Test', icon: 'flask' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && styles.activeTabButton
              ]}
              onPress={() => setActiveTab(tab.key as any)}
              disabled={operationInProgress}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.key ? theme.colors.primary : theme.colors.textMuted}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === tab.key && styles.activeTabButtonText
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'backups' && renderBackupsTab()}
        {activeTab === 'reset' && renderResetTab()}
        {activeTab === 'test' && renderTestTab()}
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 8,
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  progressCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  progressMessage: {
    color: theme.colors.text,
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  tabNavigation: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  activeTabButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  createBackupSection: {
    marginBottom: 32,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  backupListSection: {
    flex: 1,
  },
  backupList: {
    flex: 1,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  backupItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backupInfo: {
    flex: 1,
  },
  backupDate: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  backupDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  backupStats: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  backupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: theme.colors.surface,
  },
  dangerSection: {
    padding: 20,
    backgroundColor: theme.colors.error + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: 12,
  },
  dangerDescription: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 20,
    lineHeight: 20,
  },
  confirmationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  confirmationInput: {
    borderColor: theme.colors.error,
    marginBottom: 20,
  },
  dangerButton: {
    backgroundColor: theme.colors.error,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dangerButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  testSection: {
    padding: 20,
    backgroundColor: theme.colors.primary + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  testDescription: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 20,
    lineHeight: 20,
  },
});