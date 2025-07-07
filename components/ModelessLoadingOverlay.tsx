import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBackgroundTasks } from '../contexts/BackgroundTaskContext';
import { useTheme } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';

interface ModelessLoadingOverlayProps {
  // Optional props for customization
  position?: 'top' | 'bottom' | 'floating';
  allowDismiss?: boolean;
}

export const ModelessLoadingOverlay: React.FC<ModelessLoadingOverlayProps> = ({
  position = 'bottom',
  allowDismiss = true,
}) => {
  const { theme } = useTheme();
  const {
    activeTasks,
    completedTasks,
    hasActiveTasks,
    showMinimized,
    setShowMinimized,
    showTaskDetails,
    setShowTaskDetails,
    selectedTaskId,
    setSelectedTaskId,
    cancelTask,
    removeTask,
    clearCompletedTasks,
  } = useBackgroundTasks();
  
  const [slideAnim] = useState(new Animated.Value(0));
  const [isExpanded, setIsExpanded] = useState(false);
  
  const styles = createStyles(theme);
  
  // Animation for showing/hiding the overlay
  useEffect(() => {
    if (hasActiveTasks && showMinimized) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [hasActiveTasks, showMinimized, slideAnim]);
  
  // Get the primary active task to display
  const primaryTask = activeTasks[0];
  const taskCount = activeTasks.length;
  
  const handleExpand = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(true);
    setShowTaskDetails(true);
  };
  
  const handleMinimize = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(false);
    setShowTaskDetails(false);
  };
  
  const handleDismiss = async () => {
    if (!allowDismiss) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowMinimized(false);
  };
  
  const handleCancelTask = async (taskId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await cancelTask(taskId);
  };
  
  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'outfit_generation':
        return 'shirt-outline';
      case 'smart_suggestions':
        return 'bulb-outline';
      case 'image_analysis':
        return 'camera-outline';
      case 'ai_search':
        return 'search-outline';
      default:
        return 'cog-outline';
    }
  };
  
  const getTaskColor = (taskType: string) => {
    switch (taskType) {
      case 'outfit_generation':
        return theme.colors.primary;
      case 'smart_suggestions':
        return theme.colors.success;
      case 'image_analysis':
        return theme.colors.accent;
      case 'ai_search':
        return theme.colors.secondary;
      default:
        return theme.colors.text;
    }
  };
  
  if (!hasActiveTasks && !showMinimized) {
    return null;
  }
  
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: position === 'top' ? [-100, 0] : [100, 0],
  });
  
  return (
    <>
      {/* Minimized floating overlay */}
      <Animated.View
        style={[
          styles.minimizedOverlay,
          position === 'top' ? styles.topPosition : styles.bottomPosition,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.minimizedContent}
          onPress={handleExpand}
          activeOpacity={0.8}
        >
          <View style={styles.taskInfo}>
            <View style={styles.taskIconContainer}>
              <Ionicons
                name={getTaskIcon(primaryTask?.type || 'outfit_generation')}
                size={16}
                color={getTaskColor(primaryTask?.type || 'outfit_generation')}
              />
            </View>
            
            <View style={styles.taskText}>
              <Text style={styles.taskTitle} numberOfLines={1}>
                {primaryTask?.title || 'Processing...'}
              </Text>
              {primaryTask?.subtitle && (
                <Text style={styles.taskSubtitle} numberOfLines={1}>
                  {primaryTask.subtitle}
                </Text>
              )}
            </View>
            
            <View style={styles.taskProgress}>
              <ActivityIndicator
                size="small"
                color={getTaskColor(primaryTask?.type || 'outfit_generation')}
              />
              {taskCount > 1 && (
                <Text style={styles.taskCount}>+{taskCount - 1}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.hideButton}
              onPress={handleDismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="eye-off" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            
            {allowDismiss && (
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={handleDismiss}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Expanded details modal */}
      <Modal
        visible={showTaskDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleMinimize}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Background Tasks</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={handleMinimize}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Active Tasks */}
            {activeTasks.length > 0 && (
              <View style={styles.taskSection}>
                <Text style={styles.sectionTitle}>Active Tasks</Text>
                {activeTasks.map((task) => (
                  <View key={task.id} style={styles.taskCard}>
                    <View style={styles.taskCardHeader}>
                      <View style={styles.taskCardInfo}>
                        <Ionicons
                          name={getTaskIcon(task.type)}
                          size={20}
                          color={getTaskColor(task.type)}
                        />
                        <Text style={styles.taskCardTitle}>{task.title}</Text>
                      </View>
                      
                      {task.cancellable && (
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => handleCancelTask(task.id)}
                        >
                          <Ionicons name="stop" size={16} color={theme.colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {task.subtitle && (
                      <Text style={styles.taskCardSubtitle}>{task.subtitle}</Text>
                    )}
                    
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${task.progress}%`,
                              backgroundColor: getTaskColor(task.type),
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>{task.progress}%</Text>
                    </View>
                    
                    {task.steps && task.steps.length > 0 && (
                      <View style={styles.stepsContainer}>
                        {task.steps.map((step, index) => (
                          <View key={index} style={styles.stepItem}>
                            <Ionicons
                              name={
                                step.status === 'completed'
                                  ? 'checkmark-circle'
                                  : step.status === 'running'
                                  ? 'time'
                                  : 'ellipse-outline'
                              }
                              size={14}
                              color={
                                step.status === 'completed'
                                  ? theme.colors.success
                                  : step.status === 'running'
                                  ? theme.colors.primary
                                  : theme.colors.textMuted
                              }
                            />
                            <Text style={styles.stepText}>{step.title}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
            
            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <View style={styles.taskSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Completed Tasks</Text>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearCompletedTasks}
                  >
                    <Text style={styles.clearButtonText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                
                {completedTasks.slice(0, 5).map((task) => (
                  <View key={task.id} style={styles.completedTaskCard}>
                    <View style={styles.taskCardInfo}>
                      <Ionicons
                        name={
                          task.status === 'completed'
                            ? 'checkmark-circle'
                            : task.status === 'failed'
                            ? 'alert-circle'
                            : 'stop-circle'
                        }
                        size={16}
                        color={
                          task.status === 'completed'
                            ? theme.colors.success
                            : task.status === 'failed'
                            ? theme.colors.error
                            : theme.colors.textSecondary
                        }
                      />
                      <Text style={styles.completedTaskTitle}>{task.title}</Text>
                    </View>
                    
                    {task.error && (
                      <Text style={styles.errorText}>{task.error}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  minimizedOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 10,
  },
  topPosition: {
    top: 20, // In header area, well above content
  },
  bottomPosition: {
    bottom: 140, // Well above bottom navigation
  },
  minimizedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 12,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  taskInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskText: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  taskSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  taskProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  taskCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 8,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  hideButton: {
    padding: 4,
    marginRight: 8,
  },
  dismissButton: {
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  taskSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.surface,
  },
  clearButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  taskCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 12,
  },
  taskCardSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: theme.colors.surface,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  stepsContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  completedTaskCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  completedTaskTitle: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
    marginLeft: 24,
  },
});