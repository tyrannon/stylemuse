import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useDailyRewards } from '../hooks/useDailyRewards';
import { DailyRewardsModal } from './DailyRewardsModal';
import { soundService } from '../services/SoundService';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

interface DailyRewardNotificationProps {
  userId: string;
  onWardrobeItemsEarned?: (items: any[]) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const DailyRewardNotification: React.FC<DailyRewardNotificationProps> = ({
  userId,
  onWardrobeItemsEarned,
}) => {
  const { theme } = useTheme();
  const {
    streak,
    todaysReward,
    canClaimRewards,
    isLoading,
    checkDailyLogin,
    claimDailyReward,
  } = useDailyRewards(userId);

  const [showNotification, setShowNotification] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [notificationAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  // Check for rewards when component mounts
  useEffect(() => {
    if (userId && !isLoading) {
      checkForDailyRewards();
    }
  }, [userId, isLoading]);

  // Show notification when rewards are available
  useEffect(() => {
    if (canClaimRewards && todaysReward && !showNotification) {
      showRewardNotification();
    }
  }, [canClaimRewards, todaysReward]);

  const checkForDailyRewards = async () => {
    try {
      await checkDailyLogin();
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to check daily rewards in notification', error as Error);
    }
  };

  const showRewardNotification = async () => {
    setShowNotification(true);
    
    // Play notification sound
    await soundService.playSuccess();

    // Animate notification in
    Animated.sequence([
      Animated.spring(notificationAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Auto-hide notification after 10 seconds if not interacted with
    setTimeout(() => {
      if (showNotification) {
        hideNotification();
      }
    }, 10000);
  };

  const hideNotification = () => {
    Animated.timing(notificationAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowNotification(false);
    });
  };

  const handleNotificationPress = () => {
    hideNotification();
    setShowModal(true);
  };

  const handleClaimFromModal = async () => {
    try {
      const result = await claimDailyReward();
      
      if (result.success) {
        // Handle wardrobe items earned
        if (result.earnedWardrobeItems && result.earnedWardrobeItems.length > 0) {
          onWardrobeItemsEarned?.(result.earnedWardrobeItems);
        }

        // Show celebration for special milestones
        if (result.isSpecialMilestone) {
          await soundService.playAchievement();
        }

        logger.info(LogCategories.GAMIFICATION, 'Daily reward claimed from notification', {
          rewardType: result.claimedReward?.type,
          isSpecialMilestone: result.isSpecialMilestone,
          earnedItemsCount: result.earnedWardrobeItems?.length || 0,
        });
      }
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to claim reward from notification', error as Error);
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
      case 'wardrobe_item':
        return '👕';
      default:
        return '🎁';
    }
  };

  const getRewardMessage = () => {
    if (!todaysReward || !streak) return '';

    const isSpecialDay = streak.currentStreak % 7 === 0;
    const baseMessage = `Day ${streak.currentStreak} reward ready!`;

    if (isSpecialDay) {
      return `🎉 ${baseMessage} Special milestone bonus!`;
    }

    return baseMessage;
  };

  const getRewardColor = (rewardType: string) => {
    switch (rewardType) {
      case 'coins':
        return '#FFD700';
      case 'gems':
        return '#FF69B4';
      case 'pack':
        return '#8B4513';
      case 'wardrobe_item':
        return '#9932CC';
      default:
        return theme.colors.primary;
    }
  };

  if (!showNotification || !todaysReward || !canClaimRewards) {
    return (
      <>
        {showModal && (
          <DailyRewardsModal
            visible={showModal}
            onClose={() => setShowModal(false)}
            userId={userId}
          />
        )}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.notification,
          {
            backgroundColor: theme.colors.card,
            borderColor: getRewardColor(todaysReward.type),
            transform: [
              {
                translateY: notificationAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0],
                }),
              },
              { scale: pulseAnim },
            ],
            opacity: notificationAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.notificationContent}
          onPress={handleNotificationPress}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.rewardIcon}>
              {getRewardIcon(todaysReward.type)}
            </Text>
            {streak && streak.currentStreak % 7 === 0 && (
              <View style={styles.specialBadge}>
                <Text style={styles.specialBadgeText}>!</Text>
              </View>
            )}
          </View>

          <View style={styles.messageContainer}>
            <Text style={[styles.messageTitle, { color: theme.colors.text }]}>
              Daily Reward Available!
            </Text>
            <Text style={[styles.messageSubtitle, { color: theme.colors.textSecondary }]}>
              {getRewardMessage()}
            </Text>
            <Text style={[styles.rewardDetails, { color: getRewardColor(todaysReward.type) }]}>
              {todaysReward.amount
                ? `${todaysReward.amount} ${todaysReward.type}`
                : `${todaysReward.packType || todaysReward.type}`}
            </Text>
          </View>

          <View style={styles.actionContainer}>
            <Text style={[styles.tapHint, { color: theme.colors.textMuted }]}>
              Tap to claim
            </Text>
            <View
              style={[
                styles.claimButton,
                { backgroundColor: getRewardColor(todaysReward.type) },
              ]}
            >
              <Text style={styles.claimButtonText}>CLAIM</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Close button */}
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
          onPress={hideNotification}
        >
          <Text style={[styles.closeButtonText, { color: theme.colors.textMuted }]}>
            ×
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <DailyRewardsModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        userId={userId}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  notification: {
    borderRadius: 16,
    borderWidth: 2,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginHorizontal: 8,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  rewardIcon: {
    fontSize: 32,
  },
  specialBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF4757',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  messageContainer: {
    flex: 1,
    marginRight: 12,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  messageSubtitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  rewardDetails: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  actionContainer: {
    alignItems: 'center',
  },
  tapHint: {
    fontSize: 10,
    marginBottom: 4,
  },
  claimButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
});