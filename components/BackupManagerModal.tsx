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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  onRefreshData?: (operation?: 'reset' | 'restore') => void; // Enhanced refresh callback
}

export const BackupManagerModal: React.FC<BackupManagerModalProps> = ({
  visible,
  onClose,
  onBackupCreated,
  onDataRestored,
  onRefreshData,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'backups' | 'restore' | 'reset' | 'test'>('backups');
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [newBackupDescription, setNewBackupDescription] = useState('');
  const [progress, setProgress] = useState<{ message: string; percentage: number } | null>(null);
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [exportingBackupId, setExportingBackupId] = useState<string | null>(null);
  const [importingFile, setImportingFile] = useState(false);

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
          
          // Trigger data refresh to update UI immediately
          onRefreshData?.('restore');
          
          Alert.alert(
            'Restore Complete!', 
            `Successfully restored:\n• ${restoreResult.restoredCounts.wardrobeItems} wardrobe items\n• ${restoreResult.restoredCounts.lovedOutfits} outfits\n• ${restoreResult.restoredCounts.images} images\n• Style DNA: ${restoreResult.restoredCounts.styleDNA ? '✅' : '❌'}\n• Profile Image: ${restoreResult.restoredCounts.profileImage ? '✅' : '❌'}\n\nData has been refreshed and should appear immediately!`,
            [
              { text: 'OK', onPress: () => onClose() } // Close the modal
            ]
          );
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

  const handleExportBackup = async (backupId: string) => {
    try {
      const backup = backups.find(b => b.id === backupId);
      if (!backup) return;

      setExportingBackupId(backupId);

      // Load the full backup data
      const backupData = await FullBackupService.loadBackup(backupId);
      if (!backupData) {
        Alert.alert('Error', 'Failed to load backup data');
        return;
      }

      // Create a meaningful filename
      const date = new Date(backup.timestamp);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format
      const description = backup.userDescription ? `_${backup.userDescription.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      const fileName = `StyleMuse_Backup_${dateStr}_${timeStr}${description}.json`;

      // Create a temporary file for export
      const tempFileUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      // Write the backup data to the temporary file
      await FileSystem.writeAsStringAsync(tempFileUri, JSON.stringify(backupData, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if sharing is available
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (!sharingAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // Share the file
      await Sharing.shareAsync(tempFileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export StyleMuse Backup',
        UTI: 'public.json',
      });

      // Clean up temporary file after a delay to allow sharing to complete
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(tempFileUri, { idempotent: true });
        } catch (cleanupError) {
          console.warn('Failed to cleanup temporary export file:', cleanupError);
        }
      }, 5000);

      Alert.alert(
        'Export Complete',
        `Backup exported successfully!\n\nFile: ${fileName}\nSize: ${formatBackupSize(backup.totalSizeMB)}\nItems: ${backup.itemCount} wardrobe items, ${backup.outfitCount} outfits`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to export backup:', error);
      Alert.alert('Error', `Failed to export backup: ${error.message}`);
    } finally {
      setExportingBackupId(null);
    }
  };

  const handleImportBackup = async () => {
    try {
      setImportingFile(true);
      
      // Use DocumentPicker to select a JSON file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        console.log('Import cancelled by user');
        return;
      }

      const file = result.assets?.[0];
      if (!file) {
        Alert.alert('Error', 'No file selected');
        return;
      }

      // Check file size (warn if > 50MB)
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      if (fileInfo.exists && 'size' in fileInfo && fileInfo.size > 50 * 1024 * 1024) {
        const confirmed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Large File Warning',
            `The selected file is ${Math.round(fileInfo.size / (1024 * 1024))}MB. Large imports may take several minutes. Continue?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Continue', onPress: () => resolve(true) },
            ]
          );
        });
        
        if (!confirmed) return;
      }

      setOperationInProgress(true);
      setProgress({ message: 'Reading backup file...', percentage: 10 });
      
      // Read the file content
      const fileContent = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      setProgress({ message: 'Validating backup file...', percentage: 20 });
      
      // Parse and validate the backup file
      let backupData;
      try {
        backupData = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error('Invalid JSON file. Please select a valid StyleMuse backup file.');
      }

      // Validate backup structure
      const validation = validateImportedBackup(backupData);
      if (!validation.isValid) {
        throw new Error(`Invalid backup file: ${validation.errors.join(', ')}`);
      }

      // Show import confirmation
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Import Backup',
          `Import backup from ${validation.metadata.fileName || 'Unknown'}?\n\n` +
          `Date: ${new Date(validation.metadata.timestamp).toLocaleString()}\n` +
          `• ${validation.metadata.itemCount} wardrobe items\n` +
          `• ${validation.metadata.outfitCount} outfits\n` +
          `• ${validation.metadata.imageCount} images\n` +
          `• Size: ${formatBackupSize(validation.metadata.totalSizeMB)}\n\n` +
          'This will replace your current data. Continue?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Import', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      });

      if (!confirmed) {
        setProgress(null);
        setOperationInProgress(false);
        return;
      }

      setProgress({ message: 'Importing backup...', percentage: 30 });
      
      // Import the backup using the existing infrastructure
      const importedBackup = await importBackupFromData(backupData);
      
      setProgress({ message: 'Restoring data...', percentage: 60 });
      
      // Restore the imported backup
      const restoreResult = await BackupRestoreService.restoreFromBackup(
        importedBackup.id,
        {}, // Default options (restore everything)
        (progressInfo) => {
          setProgress({
            message: progressInfo.message,
            percentage: 60 + (progressInfo.percentage * 0.4), // Scale to 60-100%
          });
        }
      );

      if (restoreResult.success) {
        setProgress({ message: 'Import completed successfully!', percentage: 100 });
        await loadAvailableBackups(); // Refresh backup list
        onDataRestored?.(importedBackup.id);
        
        setTimeout(() => {
          setProgress(null);
          setOperationInProgress(false);
          
          // Trigger data refresh
          onRefreshData?.('restore');
          
          Alert.alert(
            'Import Complete!',
            `Successfully imported backup:\n• ${restoreResult.restoredCounts.wardrobeItems} wardrobe items\n• ${restoreResult.restoredCounts.lovedOutfits} outfits\n• ${restoreResult.restoredCounts.images} images\n• Style DNA: ${restoreResult.restoredCounts.styleDNA ? '✅' : '❌'}\n• Profile Image: ${restoreResult.restoredCounts.profileImage ? '✅' : '❌'}\n\nData has been refreshed and should appear immediately!`,
            [{ text: 'OK' }]
          );
        }, 1500);
      } else {
        throw new Error(restoreResult.errors.join(', '));
      }
    } catch (error) {
      console.error('Failed to import backup:', error);
      Alert.alert('Error', `Failed to import backup: ${error.message}`);
      setProgress(null);
      setOperationInProgress(false);
    } finally {
      setImportingFile(false);
    }
  };

  const validateImportedBackup = (data: any): {
    isValid: boolean;
    errors: string[];
    metadata: {
      fileName?: string;
      timestamp: number;
      itemCount: number;
      outfitCount: number;
      imageCount: number;
      totalSizeMB: number;
    };
  } => {
    const errors: string[] = [];
    
    // Check if it's a StyleMuse backup
    if (!data.metadata || !data.data || !data.images) {
      errors.push('Not a valid StyleMuse backup file');
      return {
        isValid: false,
        errors,
        metadata: {
          timestamp: Date.now(),
          itemCount: 0,
          outfitCount: 0,
          imageCount: 0,
          totalSizeMB: 0,
        },
      };
    }

    // Validate metadata structure
    if (!data.metadata.id || !data.metadata.timestamp) {
      errors.push('Invalid backup metadata');
    }

    // Validate data structure
    if (!Array.isArray(data.data.wardrobeItems)) {
      errors.push('Invalid wardrobe items data');
    }
    if (!Array.isArray(data.data.lovedOutfits)) {
      errors.push('Invalid loved outfits data');
    }

    // Validate images structure
    if (typeof data.images !== 'object') {
      errors.push('Invalid images data');
    }

    return {
      isValid: errors.length === 0,
      errors,
      metadata: {
        fileName: data.metadata.userDescription,
        timestamp: data.metadata.timestamp || Date.now(),
        itemCount: data.data.wardrobeItems?.length || 0,
        outfitCount: data.data.lovedOutfits?.length || 0,
        imageCount: Object.keys(data.images || {}).length,
        totalSizeMB: data.metadata.totalSizeMB || 0,
      },
    };
  };

  const importBackupFromData = async (backupData: any): Promise<{ id: string }> => {
    // Generate a new backup ID for the imported backup
    const importedId = `imported_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Update the backup metadata with new ID and import timestamp
    const updatedBackup = {
      ...backupData,
      metadata: {
        ...backupData.metadata,
        id: importedId,
        timestamp: Date.now(),
        userDescription: `Imported: ${backupData.metadata.userDescription || 'Unknown'}`
      },
    };

    // Save the backup file
    const backupFilePath = `${FileSystem.documentDirectory}backups/${importedId}.json`;
    
    // Ensure backup directory exists
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}backups/`, { intermediates: true });
    
    await FileSystem.writeAsStringAsync(backupFilePath, JSON.stringify(updatedBackup), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Update backup index
    const indexStr = await AsyncStorage.getItem('backup_index');
    const index = indexStr ? JSON.parse(indexStr) : [];
    index.push(updatedBackup.metadata);
    index.sort((a: any, b: any) => b.timestamp - a.timestamp);
    await AsyncStorage.setItem('backup_index', JSON.stringify(index));

    console.log(`📥 [Import] Successfully imported backup: ${importedId}`);
    
    return { id: importedId };
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
          
          // Trigger data refresh to update UI immediately
          onRefreshData?.('reset');
          
          Alert.alert(
            'Reset Complete', 
            `All data has been reset. ${resetResult.backupId ? `Backup created: ${resetResult.backupId}` : 'No backup was created.'}\n\nUI has been refreshed to show empty state!`
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
        <Text style={styles.sectionTitle}>Backup Management</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Optional description..."
          placeholderTextColor={theme.colors.textMuted}
          value={newBackupDescription}
          onChangeText={setNewBackupDescription}
          maxLength={100}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.primaryButton, styles.halfButton, (operationInProgress || exportingBackupId !== null || importingFile) && styles.disabledButton]}
            onPress={handleCreateBackup}
            disabled={operationInProgress || exportingBackupId !== null || importingFile}
          >
            <Ionicons name="archive" size={20} color={theme.colors.background} />
            <Text style={styles.primaryButtonText}>Create Backup</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, styles.halfButton, (operationInProgress || exportingBackupId !== null || importingFile) && styles.disabledButton]}
            onPress={handleImportBackup}
            disabled={operationInProgress || exportingBackupId !== null || importingFile}
          >
            {importingFile ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons name="cloud-download" size={20} color={theme.colors.primary} />
            )}
            <Text style={styles.secondaryButtonText}>Import Backup</Text>
          </TouchableOpacity>
        </View>
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
                    onPress={() => handleExportBackup(backup.id)}
                    disabled={operationInProgress || exportingBackupId === backup.id || importingFile}
                  >
                    {exportingBackupId === backup.id ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <Ionicons name="share-outline" size={18} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleRestoreBackup(backup.id)}
                    disabled={operationInProgress || exportingBackupId !== null || importingFile}
                  >
                    <Ionicons name="refresh" size={18} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteBackup(backup.id)}
                    disabled={operationInProgress || exportingBackupId !== null || importingFile}
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
            (operationInProgress || exportingBackupId !== null || importingFile || resetConfirmation !== 'RESET ALL DATA') && styles.disabledButton
          ]}
          onPress={handleCompleteReset}
          disabled={operationInProgress || exportingBackupId !== null || importingFile || resetConfirmation !== 'RESET ALL DATA'}
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
          style={[styles.primaryButton, (operationInProgress || exportingBackupId !== null || importingFile) && styles.disabledButton]}
          onPress={handleTestCycle}
          disabled={operationInProgress || exportingBackupId !== null || importingFile}
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
              disabled={operationInProgress || exportingBackupId !== null || importingFile}
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfButton: {
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
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