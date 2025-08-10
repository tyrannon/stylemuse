import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { dailyRewardsService } from '../services/DailyRewardsService';
import { currencyService } from '../services/CurrencyService';
import { soundService } from '../services/SoundService';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

interface DailyReward {
  day: number;
  type: 'coins' | 'gems' | 'pack' | 'card';
  amount?: number;
  packType?: string;
  claimed: boolean;
  claimedDate?: string;
}

interface DailyLoginStreak {
  currentStreak: number;
  lastLoginDate: string;
  longestStreak: number;
  totalLogins: number;
}

interface DailyRewardsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  visible,
  onClose,
  userId,
}) => {
  const { theme } = useTheme();
  const [streak, setStreak] = useState<DailyLoginStreak | null>(null);
  const [todaysReward, setTodaysReward] = useState<DailyReward | null>(null);
  const [canClaimRewards, setCanClaimRewards] = useState(false);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [celebrationAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      checkDailyRewards();
    }
  }, [visible, userId]);

  const checkDailyRewards = async () => {
    try {
      const result = await dailyRewardsService.checkDailyLogin();
      setStreak(result.streak);
      setTodaysReward(result.todaysReward || null);
      setCanClaimRewards(result.canClaimRewards);

      if (result.canClaimRewards) {
        // Animate modal entrance
        Animated.spring(celebrationAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to check daily rewards', error as Error);
    }
  };

  const handleClaimReward = async () => {
    if (!todaysReward || !canClaimRewards) return;

    setIsClaimingReward(true);

    try {
      // Play pack opening sound
      await soundService.playPackOpen();

      // Claim the daily reward
      const result = await dailyRewardsService.claimDailyReward(todaysReward);

      if (result.success && result.claimedReward) {
        // Apply currency rewards
        if (result.claimedReward.type === 'coins' && result.claimedReward.amount) {
          await currencyService.earnCoins(userId, {
            source: 'daily_login',
            amount: result.claimedReward.amount,
            description: `Day ${result.claimedReward.day} login bonus`,
          });
        } else if (result.claimedReward.type === 'gems' && result.claimedReward.amount) {
          await currencyService.earnGems(userId, {
            source: 'daily_login',
            amount: result.claimedReward.amount,
            description: `Day ${result.claimedReward.day} login bonus`,
          });
        }

        // Update state
        setTodaysReward(result.claimedReward);
        setCanClaimRewards(false);

        // Play success sound and show celebration
        await soundService.playAchievement();
        
        logger.info(LogCategories.GAMIFICATION, 'Daily reward claimed successfully', {
          day: result.claimedReward.day,
          type: result.claimedReward.type,
          amount: result.claimedReward.amount,
        });

        // Auto-close modal after celebration
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to claim daily reward', error as Error);
    } finally {
      setIsClaimingReward(false);
    }
  };

  const getRewardIcon = (rewardType: string) => {
    switch (rewardType) {
      case 'coins':
        return '🪙';
      case 'gems':
        return '💎';
      case 'pack':
        return '📦';
      case 'card':
        return '🎴';
      default:
        return '🎁';
    }
  };

  const getRewardColor = (rewardType: string) => {
    switch (rewardType) {
      case 'coins':
        return '#FFD700';
      case 'gems':
        return '#FF69B4';
      case 'pack':
        return '#8B4513';
      case 'card':
        return '#9932CC';
      default:
        return theme.colors.primary;
    }
  };

  const getStreakRewardPreview = (day: number) => {
    const dayInCycle = ((day - 1) % 7) + 1;
    const rewards = {
      1: { type: 'coins', amount: 100 },
      2: { type: 'coins', amount: 150 },
      3: { type: 'gems', amount: 25 },
      4: { type: 'coins', amount: 200 },
      5: { type: 'pack', packType: 'standard' },
      6: { type: 'gems', amount: 50 },
      7: { type: 'pack', packType: 'premium' },
    };
    return rewards[dayInCycle as keyof typeof rewards];
  };

  if (!visible || !streak) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.card },
            {
              transform: [
                {
                  scale: celebrationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
              opacity: celebrationAnim,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Daily Rewards
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Day {streak.currentStreak} • 🔥 {streak.longestStreak} best streak
            </Text>
          </View>

          {/* Today's Reward */}
          {todaysReward && (
            <View style={styles.todayRewardContainer}>
              <Text style={[styles.todayLabel, { color: theme.colors.textSecondary }]}>
                Today's Reward
              </Text>
              <View
                style={[
                  styles.rewardCard,
                  { 
                    backgroundColor: getRewardColor(todaysReward.type),
                    borderColor: canClaimRewards ? getRewardColor(todaysReward.type) : theme.colors.border,
                  },
                ]}
              >
                <Text style={styles.rewardIcon}>
                  {getRewardIcon(todaysReward.type)}
                </Text>
                <Text style={styles.rewardAmount}>
                  {todaysReward.amount || todaysReward.packType}
                </Text>
                <Text style={styles.rewardType}>
                  {todaysReward.type.charAt(0).toUpperCase() + todaysReward.type.slice(1)}
                </Text>
              </View>
            </View>
          )}

          {/* Weekly Progress */}
          <View style={styles.weeklyProgress}>
            <Text style={[styles.weeklyLabel, { color: theme.colors.text }]}>
              Weekly Progress
            </Text>
            <View style={styles.progressDots}>
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const dayInCycle = ((streak.currentStreak - 1) % 7) + 1;
                const isCompleted = day <= dayInCycle;
                const isCurrent = day === dayInCycle;
                const reward = getStreakRewardPreview(day);

                return (
                  <View key={day} style={styles.dayContainer}>
                    <View
                      style={[
                        styles.dayDot,
                        {
                          backgroundColor: isCompleted
                            ? getRewardColor(reward.type)
                            : theme.colors.surface,
                          borderColor: isCurrent
                            ? getRewardColor(reward.type)
                            : theme.colors.border,
                          borderWidth: isCurrent ? 3 : 1,
                        },
                      ]}
                    >
                      <Text style={styles.dayIcon}>
                        {isCompleted ? '✓' : getRewardIcon(reward.type)}
                      </Text>
                    </View>
                    <Text style={[styles.dayLabel, { color: theme.colors.textMuted }]}>
                      Day {day}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {canClaimRewards ? (
              <TouchableOpacity
                style={[
                  styles.claimButton,
                  { backgroundColor: todaysReward ? getRewardColor(todaysReward.type) : theme.colors.primary },
                ]}
                onPress={handleClaimReward}
                disabled={isClaimingReward}
              >
                <Text style={styles.claimButtonText}>
                  {isClaimingReward ? '🎁 Claiming...' : '🎁 Claim Reward!'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.alreadyClaimed, { color: theme.colors.success }]}>
                ✅ Already claimed today!
              </Text>
            )}

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
              onPress={onClose}
            >
              <Text style={[styles.closeButtonText, { color: theme.colors.text }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats Footer */}
          <View style={styles.statsFooter}>
            <Text style={[styles.statsText, { color: theme.colors.textMuted }]}>
              Total Logins: {streak.totalLogins} • Current Streak: {streak.currentStreak} days
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: Math.min(screenWidth * 0.9, 400),
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  todayRewardContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  todayLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  rewardCard: {
    width: 120,
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  rewardIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  rewardAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  rewardType: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
  },
  weeklyProgress: {
    width: '100%',
    marginBottom: 24,
  },
  weeklyLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayIcon: {
    fontSize: 16,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  actionButtons: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  claimButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  claimButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  alreadyClaimed: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
    width: '100%',
  },
  statsText: {
    fontSize: 12,
    textAlign: 'center',
  },
});