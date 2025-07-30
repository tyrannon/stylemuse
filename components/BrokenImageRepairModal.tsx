import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { 
  BrokenImageRepairService, 
  RepairProgress, 
  RepairSummary 
} from '../services/BrokenImageRepairService';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

const { width: screenWidth } = Dimensions.get('window');

interface BrokenImageRepairModalProps {
  visible: boolean;
  onComplete: (summary: RepairSummary) => void;
  options?: {
    dryRun?: boolean;
    removeUnrecoverable?: boolean;
    backupBeforeRepair?: boolean;
    maxRecoveryAttempts?: number;
  };
}

export const BrokenImageRepairModal: React.FC<BrokenImageRepairModalProps> = ({
  visible,
  onComplete,
  options = {},
}) => {
  const { theme } = useTheme();
  const [progress, setProgress] = useState<RepairProgress>({
    phase: 'scanning',
    totalItems: 0,
    processedItems: 0,
    recoveredItems: 0,
    failedItems: 0,
    removedItems: 0,
    message: 'Initializing repair...',
    analytics: {
      brokenByType: {},
      recoveryMethods: {},
      failureReasons: {}
    }
  });
  const [progressAnim] = useState(new Animated.Value(0));
  const [showAnalytics, setShowAnalytics] = useState(false);

  const repairService = BrokenImageRepairService.getInstance();

  useEffect(() => {
    if (visible) {
      startRepair();
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

  const startRepair = async () => {
    try {
      logger.info(LogCategories.MIGRATION, 'Starting comprehensive image repair', options);
      
      const summary = await repairService.performComprehensiveRepair(
        setProgress,
        {
          dryRun: false,
          removeUnrecoverable: true,
          backupBeforeRepair: true,
          maxRecoveryAttempts: 5,
          ...options
        }
      );
      
      onComplete(summary);
    } catch (error) {
      logger.error(LogCategories.MIGRATION, 'Repair failed', error);
      onComplete({
        success: false,
        totalItems: 0,
        scannedItems: 0,
        brokenItems: 0,
        recoveredItems: 0,
        removedItems: 0,
        failedItems: 0,
        brokenReferences: [],
        recoveredReferences: [],
        removedReferences: [],
        details: [`Repair failed: ${error}`],
        analytics: {
          brokenByType: {},
          recoveryMethods: {},
          failureReasons: { system_error: 1 },
          timeTaken: 0,
          throughputPerSecond: 0
        }
      });
    }
  };

  const getPhaseIcon = () => {
    switch (progress.phase) {
      case 'scanning':
        return '🔍';
      case 'analyzing':
        return '🧐';
      case 'repairing':
        return '🔧';
      case 'cleanup':
        return '🧹';
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
      case 'scanning':
        return 'Scanning Wardrobe';
      case 'analyzing':
        return 'Analyzing Images';
      case 'repairing':
        return 'Repairing Images';
      case 'cleanup':
        return 'Cleaning Up';
      case 'completed':
        return 'Repair Complete';
      case 'failed':
        return 'Repair Failed';
      default:
        return 'Preparing...';
    }
  };

  const getPhaseDescription = () => {
    switch (progress.phase) {
      case 'scanning':
        return 'Loading and scanning wardrobe items for image issues';
      case 'analyzing':
        return 'Performing comprehensive validation of image references';
      case 'repairing':
        return 'Attempting to recover broken images using multiple strategies';
      case 'cleanup':
        return 'Cleaning up unrecoverable items and optimizing storage';
      case 'completed':
        return 'All repairs completed successfully';
      case 'failed':
        return 'Repair process encountered errors';
      default:
        return 'Initializing repair system...';
    }
  };

  const renderAnalyticsSection = () => {
    if (!showAnalytics || progress.phase === 'scanning') return null;

    const { brokenByType, recoveryMethods, failureReasons } = progress.analytics;

    return (
      <View style={styles.analyticsSection}>
        <TouchableOpacity 
          style={styles.analyticsHeader}
          onPress={() => setShowAnalytics(!showAnalytics)}
        >
          <Text style={styles.analyticsTitle}>📊 Detailed Analytics</Text>
          <Text style={styles.analyticsToggle}>{showAnalytics ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {showAnalytics && (
          <ScrollView style={styles.analyticsContent} showsVerticalScrollIndicator={false}>
            {Object.keys(brokenByType).length > 0 && (
              <View style={styles.analyticsGroup}>
                <Text style={styles.analyticsGroupTitle}>Issue Types</Text>
                {Object.entries(brokenByType).map(([type, count]) => (
                  <View key={type} style={styles.analyticsItem}>
                    <Text style={styles.analyticsLabel}>{type.replace(/_/g, ' ')}</Text>
                    <Text style={styles.analyticsValue}>{count}</Text>
                  </View>
                ))}
              </View>
            )}

            {Object.keys(recoveryMethods).length > 0 && (
              <View style={styles.analyticsGroup}>
                <Text style={styles.analyticsGroupTitle}>Recovery Methods</Text>
                {Object.entries(recoveryMethods).map(([method, count]) => (
                  <View key={method} style={styles.analyticsItem}>
                    <Text style={styles.analyticsLabel}>{method.replace(/_/g, ' ')}</Text>
                    <Text style={[styles.analyticsValue, { color: theme.colors.success }]}>{count}</Text>
                  </View>
                ))}
              </View>
            )}

            {Object.keys(failureReasons).length > 0 && (
              <View style={styles.analyticsGroup}>
                <Text style={styles.analyticsGroupTitle}>Failure Reasons</Text>
                {Object.entries(failureReasons).map(([reason, count]) => (
                  <View key={reason} style={styles.analyticsItem}>
                    <Text style={styles.analyticsLabel}>{reason.replace(/_/g, ' ')}</Text>
                    <Text style={[styles.analyticsValue, { color: theme.colors.error }]}>{count}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    );
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
      maxWidth: 450,
      maxHeight: '80%',
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
      fontSize: 22,
      fontWeight: 'bold' as const,
      color: theme.colors.text,
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center' as const,
      lineHeight: 20,
    },
    progressSection: {
      marginBottom: 20,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 4,
      overflow: 'hidden' as const,
      marginBottom: 16,
    },
    progressFill: {
      height: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 16,
      fontWeight: 'semibold' as const,
      color: theme.colors.text,
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    statusText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center' as const,
      fontStyle: 'italic' as const,
      marginBottom: 12,
    },
    statsContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      marginVertical: 16,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    statItem: {
      alignItems: 'center' as const,
      flex: 1,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold' as const,
      color: theme.colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase' as const,
      fontWeight: '600' as const,
      textAlign: 'center' as const,
    },
    currentItem: {
      backgroundColor: theme.colors.surface,
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    currentItemText: {
      fontSize: 12,
      color: theme.colors.text,
      fontWeight: '500' as const,
    },
    loadingContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: 16,
    },
    loadingText: {
      marginLeft: 12,
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontStyle: 'italic' as const,
    },
    analyticsSection: {
      marginTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 16,
    },
    analyticsHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: 8,
    },
    analyticsTitle: {
      fontSize: 14,
      fontWeight: 'bold' as const,
      color: theme.colors.text,
    },
    analyticsToggle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    analyticsContent: {
      maxHeight: 200,
      marginTop: 8,
    },
    analyticsGroup: {
      marginBottom: 16,
    },
    analyticsGroupTitle: {
      fontSize: 12,
      fontWeight: 'bold' as const,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase' as const,
      marginBottom: 8,
    },
    analyticsItem: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 4,
      marginBottom: 4,
    },
    analyticsLabel: {
      fontSize: 12,
      color: theme.colors.text,
      textTransform: 'capitalize' as const,
      flex: 1,
    },
    analyticsValue: {
      fontSize: 12,
      fontWeight: 'bold' as const,
      color: theme.colors.text,
      minWidth: 24,
      textAlign: 'right' as const,
    },
    phaseIndicator: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 16,
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
    },
    phaseText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: theme.colors.textSecondary,
      marginLeft: 8,
      textTransform: 'uppercase' as const,
    },
  });

  const styles = createStyles(theme);

  if (!visible) return null;

  const progressPercent = progress.totalItems > 0 
    ? Math.round((progress.processedItems / progress.totalItems) * 100)
    : 0;

  const isActive = progress.phase === 'scanning' || progress.phase === 'analyzing' || 
                  progress.phase === 'repairing' || progress.phase === 'cleanup';

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
            <Text style={styles.subtitle}>{getPhaseDescription()}</Text>
          </View>

          <View style={styles.phaseIndicator}>
            <Text style={styles.phaseText}>
              {options.dryRun ? 'DRY RUN - PREVIEW MODE' : progress.phase.toUpperCase()}
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
                : progress.phase === 'completed' ? 'Completed' : 'Preparing...'
              }
            </Text>
            
            <Text style={styles.statusText}>{progress.message}</Text>

            {progress.currentItem && isActive && (
              <View style={styles.currentItem}>
                <Text style={styles.currentItemText}>
                  Processing: {progress.currentItem}
                </Text>
              </View>
            )}
          </View>

          {(progress.phase === 'repairing' || progress.phase === 'cleanup' || progress.phase === 'completed') && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.success }]}>
                  {progress.recoveredItems}
                </Text>
                <Text style={styles.statLabel}>Recovered</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
                  {progress.removedItems}
                </Text>
                <Text style={styles.statLabel}>Cleaned</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.error }]}>
                  {progress.failedItems}
                </Text>
                <Text style={styles.statLabel}>Failed</Text>
              </View>
            </View>
          )}

          {renderAnalyticsSection()}

          {isActive && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>
                {progress.phase === 'scanning' ? 'Scanning items...' :
                 progress.phase === 'analyzing' ? 'Analyzing images...' :
                 progress.phase === 'repairing' ? 'Repairing images...' :
                 progress.phase === 'cleanup' ? 'Cleaning up...' : 'Processing...'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default BrokenImageRepairModal;