import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { DataMigrationService, MigrationProgress, MigrationSummary } from '../services/DataMigrationService';

const { width: screenWidth } = Dimensions.get('window');

interface DataMigrationModalProps {
  visible: boolean;
  onComplete: (summary: MigrationSummary) => void;
}

export const DataMigrationModal: React.FC<DataMigrationModalProps> = ({
  visible,
  onComplete,
}) => {
  const { theme } = useTheme();
  const [progress, setProgress] = useState<MigrationProgress>({
    phase: 'detecting',
    totalItems: 0,
    processedItems: 0,
    recoveredItems: 0,
    failedItems: 0,
    message: 'Initializing migration...'
  });
  const [progressAnim] = useState(new Animated.Value(0));

  const migrationService = DataMigrationService.getInstance();

  useEffect(() => {
    if (visible) {
      startMigration();
    }
  }, [visible]);

  useEffect(() => {
    // Animate progress bar
    const progressPercent = progress.totalItems > 0 
      ? progress.processedItems / progress.totalItems 
      : 0;
    
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress.processedItems, progress.totalItems]);

  const startMigration = async () => {
    try {
      const summary = await migrationService.performDataMigration(setProgress);
      onComplete(summary);
    } catch (error) {
      console.error('Migration failed:', error);
      onComplete({
        success: false,
        totalItems: 0,
        recoveredItems: 0,
        failedItems: 0,
        brokenReferences: [],
        details: [`Migration failed: ${error}`]
      });
    }
  };

  const getPhaseIcon = () => {
    switch (progress.phase) {
      case 'detecting':
        return '🔍';
      case 'migrating':
        return '🔄';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getPhaseTitle = () => {
    switch (progress.phase) {
      case 'detecting':
        return 'Scanning Wardrobe';
      case 'migrating':
        return 'Migrating Images';
      case 'completed':
        return 'Migration Complete';
      case 'failed':
        return 'Migration Failed';
      default:
        return 'Preparing...';
    }
  };

  const createStyles = (theme: any) => ({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    modalContent: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 24,
      margin: 20,
      width: screenWidth - 40,
      maxWidth: 400,
      ...theme.shadows.large,
    },
    header: {
      alignItems: 'center' as const,
      marginBottom: 24,
    },
    icon: {
      fontSize: 48,
      marginBottom: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold' as const,
      color: theme.colors.text,
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center' as const,
    },
    progressSection: {
      marginBottom: 24,
    },
    progressBar: {
      height: 6,
      backgroundColor: theme.colors.surface,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 12,
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 3,
    },
    progressText: {
      fontSize: 14,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    statusText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    currentItem: {
      backgroundColor: theme.colors.surface,
      padding: 8,
      borderRadius: 8,
      marginTop: 12,
    },
    currentItemText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
    },
    loadingText: {
      marginLeft: 12,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
  });

  const styles = createStyles(theme);

  if (!visible) return null;

  const progressPercent = progress.totalItems > 0 
    ? Math.round((progress.processedItems / progress.totalItems) * 100)
    : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.icon}>{getPhaseIcon()}</Text>
            <Text style={styles.title}>{getPhaseTitle()}</Text>
            <Text style={styles.subtitle}>
              Protecting your wardrobe from data loss
            </Text>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            
            <Text style={styles.progressText}>
              {progress.totalItems > 0 
                ? `${progress.processedItems} of ${progress.totalItems} items (${progressPercent}%)`
                : 'Preparing...'
              }
            </Text>
            
            <Text style={styles.statusText}>{progress.message}</Text>

            {progress.currentItem && (
              <View style={styles.currentItem}>
                <Text style={styles.currentItemText}>
                  Current: {progress.currentItem}
                </Text>
              </View>
            )}
          </View>

          {progress.phase === 'migrating' && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.success }]}>
                  {progress.recoveredItems}
                </Text>
                <Text style={styles.statLabel}>Recovered</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.error }]}>
                  {progress.failedItems}
                </Text>
                <Text style={styles.statLabel}>Failed</Text>
              </View>
            </View>
          )}

          {(progress.phase === 'detecting' || progress.phase === 'migrating') && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>
                {progress.phase === 'detecting' ? 'Scanning...' : 'Migrating...'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default DataMigrationModal;