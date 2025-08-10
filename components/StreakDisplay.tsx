/**
 * Streak Display Component
 * Shows current streak with Duolingo-style visual feedback
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { streakService, StreakData } from '../services/StreakService';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

interface StreakDisplayProps {
  compact?: boolean;
  onPress?: () => void;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  compact = false,
  onPress,
}) => {
  const { theme } = useTheme();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flameAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadStreakData();
    startAnimations();
  }, []);

  const loadStreakData = async () => {
    try {
      setLoading(true);
      const data = await streakService.getStreakData();
      setStreakData(data);
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to load streak data', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const startAnimations = () => {
    // Pulse animation for streak number
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Flame flicker animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(flameAnim, {
          toValue: 0.8,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const getStreakColor = (streak: number): string => {
    if (streak === 0) return '#9CA3AF';
    if (streak < 7) return '#FFA500';
    if (streak < 30) return '#FF6B6B';
    if (streak < 100) return '#9333EA';
    return '#FFD700';
  };

  const getStreakEmoji = (streak: number): string => {
    if (streak === 0) return '💤';
    if (streak < 3) return '🔥';
    if (streak < 7) return '🔥🔥';
    if (streak < 30) return '🔥🔥🔥';
    if (streak < 100) return '🌟';
    return '💎';
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setShowModal(true);
    }
  };

  const purchaseFreeze = async () => {
    const result = await streakService.purchaseStreakFreeze();
    if (result.success) {
      logger.info(LogCategories.GAMIFICATION, 'Streak freeze purchased');
      await loadStreakData();
    }
  };

  if (loading || !streakData) {
    return null;
  }

  const streakColor = getStreakColor(streakData.currentStreak);
  const streakEmoji = getStreakEmoji(streakData.currentStreak);

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, { borderColor: streakColor }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Animated.View
          style={{
            transform: [{ scale: flameAnim }],
          }}
        >
          <Text style={styles.streakEmoji}>{streakEmoji}</Text>
        </Animated.View>
        <Animated.Text
          style={[
            styles.compactStreak,
            { color: streakColor, transform: [{ scale: pulseAnim }] },
          ]}
        >
          {streakData.currentStreak}
        </Animated.Text>
        {streakData.streakFreezes > 0 && (
          <View style={[styles.freezeBadge, { backgroundColor: '#60A5FA' }]}>
            <Text style={styles.freezeCount}>❄️ {streakData.streakFreezes}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.container, { backgroundColor: theme.surface }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Daily Streak</Text>
          <Text style={styles.streakEmoji}>{streakEmoji}</Text>
        </View>

        <Animated.View
          style={[
            styles.streakContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Text style={[styles.streakNumber, { color: streakColor }]}>
            {streakData.currentStreak}
          </Text>
          <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>
            day{streakData.currentStreak !== 1 ? 's' : ''}
          </Text>
        </Animated.View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {streakData.longestStreak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Longest
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {streakData.streakFreezes}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Freezes
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {streakData.perfectWeeks}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Perfect Weeks
            </Text>
          </View>
        </View>

        {/* Weekly Activity Indicator */}
        <View style={styles.weeklyActivity}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <View key={index} style={styles.dayContainer}>
              <Text style={[styles.dayLabel, { color: theme.textSecondary }]}>
                {day}
              </Text>
              <View
                style={[
                  styles.dayIndicator,
                  {
                    backgroundColor: streakData.weeklyActivity[index]
                      ? streakColor
                      : theme.border,
                  },
                ]}
              />
            </View>
          ))}
        </View>
      </TouchableOpacity>

      {/* Detailed Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                🔥 Streak Details
              </Text>

              <View style={styles.modalSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Current Progress
                </Text>
                <View style={styles.progressStats}>
                  <Text style={[styles.bigNumber, { color: streakColor }]}>
                    {streakData.currentStreak}
                  </Text>
                  <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                    day streak
                  </Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Streak Freezes
                </Text>
                <Text style={[styles.freezeInfo, { color: theme.textSecondary }]}>
                  You have {streakData.streakFreezes} freeze{streakData.streakFreezes !== 1 ? 's' : ''} available
                </Text>
                <TouchableOpacity
                  style={[styles.purchaseButton, { backgroundColor: '#60A5FA' }]}
                  onPress={purchaseFreeze}
                >
                  <Text style={styles.purchaseButtonText}>
                    Buy Freeze (200 💎)
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Milestones
                </Text>
                {streakData.milestones.map((milestone) => (
                  <View
                    key={milestone.days}
                    style={[
                      styles.milestoneItem,
                      milestone.achieved && styles.milestoneAchieved,
                    ]}
                  >
                    <Text
                      style={[
                        styles.milestoneDays,
                        { color: milestone.achieved ? '#10B981' : theme.textSecondary },
                      ]}
                    >
                      {milestone.days} days
                    </Text>
                    <Text style={[styles.milestoneReward, { color: theme.textSecondary }]}>
                      {milestone.reward.type === 'coins' && `🪙 ${milestone.reward.amount}`}
                      {milestone.reward.type === 'gems' && `💎 ${milestone.reward.amount}`}
                      {milestone.reward.type === 'freeze' && `❄️ ${milestone.reward.amount}`}
                      {milestone.reward.type === 'achievement' && `🏆 ${milestone.reward.name}`}
                    </Text>
                    {milestone.achieved && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.accent }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    gap: 6,
  },
  compactStreak: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  freezeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  freezeCount: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  container: {
    padding: 16,
    borderRadius: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  streakEmoji: {
    fontSize: 24,
  },
  streakContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  weeklyActivity: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dayIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  progressStats: {
    alignItems: 'center',
    padding: 20,
  },
  bigNumber: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 16,
    marginTop: 8,
  },
  freezeInfo: {
    fontSize: 14,
    marginBottom: 12,
  },
  purchaseButton: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  milestoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  milestoneAchieved: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  milestoneDays: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  milestoneReward: {
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
  },
  checkmark: {
    fontSize: 18,
    color: '#10B981',
  },
  closeButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});