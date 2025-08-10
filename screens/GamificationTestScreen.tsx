import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SoundButton } from '../components/SoundButton';
import { PackOpeningModal } from '../components/gamification/PackOpeningModal';
import { soundService } from '../services/SoundService';
import { dailyRewardsService } from '../services/DailyRewardsService';
import { cardGenerationService } from '../services/CardGenerationService';
import { currencyService, CurrencyEarning, CurrencySpending } from '../services/CurrencyService';
import { StyleCard, StylePack, CardRarity, StyleCurrency } from '../types/StyleCards';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

const { width: screenWidth } = Dimensions.get('window');

interface GamificationTestScreenProps {
  onNavigateToCardCollection: () => void;
  onGoBack: () => void;
}

export default function GamificationTestScreen({ onNavigateToCardCollection, onGoBack }: GamificationTestScreenProps) {
  const [currency, setCurrency] = useState<StyleCurrency | null>(null);
  const [packModalVisible, setPackModalVisible] = useState(false);
  const [currentPack, setCurrentPack] = useState<StylePack | null>(null);
  const [packCards, setPackCards] = useState<StyleCard[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);

  useEffect(() => {
    initializeGamification();
  }, []);

  const initializeGamification = async () => {
    try {
      // Initialize currency for test user
      const testUserId = 'test_user_gamification';
      const userCurrency = await currencyService.getCurrency(testUserId);
      setCurrency(userCurrency);
      
      // Initialize sound system
      await soundService.initialize();
      setSoundEnabled(soundService.getSoundEnabled());
      setMusicEnabled(soundService.getMusicEnabled());
      
      logger.info(LogCategories.GAMIFICATION, 'Gamification test screen initialized', {
        coins: userCurrency.styleCoins,
        gems: userCurrency.fashionGems
      });
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to initialize gamification test', error);
    }
  };

  const testButtonSounds = async () => {
    await soundService.playButtonTap();
    Alert.alert('🔊 Sound Test', 'Button tap sound played!');
  };

  const testSuccessSound = async () => {
    await soundService.playSuccess();
    Alert.alert('✅ Success Sound', 'Success sound played!');
  };

  const testErrorSound = async () => {
    await soundService.playError();
    Alert.alert('❌ Error Sound', 'Error sound played!');
  };

  const testAchievementSound = async () => {
    await soundService.playAchievement();
    Alert.alert('🏆 Achievement!', 'Achievement unlock sound played!');
  };

  const testBackgroundMusic = async () => {
    await soundService.startBackgroundMusic();
    const timeOfDay = soundService.getCurrentTimeOfDay();
    Alert.alert('🎵 Background Music', `${timeOfDay} ambient music started! Check console for mood details.`);
  };

  const testDailyRewards = async () => {
    try {
      const loginCheck = await dailyRewardsService.checkDailyLogin();
      
      if (loginCheck.canClaimRewards && loginCheck.todaysReward) {
        const claimResult = await dailyRewardsService.claimDailyReward(loginCheck.todaysReward);
        
        if (claimResult.success) {
          Alert.alert(
            '🎁 Daily Reward Claimed!',
            `Day ${loginCheck.todaysReward.day}: +${loginCheck.todaysReward.amount} ${loginCheck.todaysReward.type}!\nStreak: ${loginCheck.streak.currentStreak} days`
          );
          // Refresh currency display
          if (currency) {
            const updatedCurrency = await currencyService.getCurrency(currency.userId);
            setCurrency(updatedCurrency);
          }
        }
      } else {
        Alert.alert(
          '⏰ Daily Rewards',
          `Current streak: ${loginCheck.streak.currentStreak} days\n${loginCheck.isNewDay ? 'Already claimed today!' : 'Come back tomorrow!'}`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check daily rewards');
      logger.error(LogCategories.GAMIFICATION, 'Daily rewards test failed', error);
    }
  };

  const testFreePack = async () => {
    try {
      const canClaim = await dailyRewardsService.canClaimFreeDailyPack();
      
      if (canClaim) {
        const packResult = await dailyRewardsService.claimFreeDailyPack();
        
        if (packResult.success && packResult.pack) {
          // Generate cards for the pack
          const cards = cardGenerationService.generateCardsForPack(3); // 3 cards for free pack
          
          setCurrentPack(packResult.pack);
          setPackCards(cards);
          setPackModalVisible(true);
        }
      } else {
        const timeUntilNext = await dailyRewardsService.getTimeUntilNextFreePack();
        const hours = Math.floor(timeUntilNext / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));
        
        Alert.alert(
          '⏰ Free Pack Cooldown',
          `Next free pack available in: ${hours}h ${minutes}m`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to claim free pack');
      logger.error(LogCategories.GAMIFICATION, 'Free pack test failed', error);
    }
  };

  const testPremiumPack = async () => {
    try {
      if (!currency) return;
      
      const costGems = 100;
      const affordability = await currencyService.canAfford(currency.userId, 0, costGems);
      
      if (!affordability.canAfford) {
        Alert.alert(
          '💎 Insufficient Gems',
          `You need ${affordability.missingGems} more gems to buy this premium pack!`
        );
        return;
      }
      
      // Spend gems
      const spendResult = await currencyService.spendGems(
        currency.userId,
        CurrencySpending.PREMIUM_PACK(costGems)
      );
      
      if (spendResult.success) {
        // Generate premium pack with guaranteed rare
        const cards = cardGenerationService.generateCardsForPack(5, CardRarity.RARE);
        
        const premiumPack: StylePack = {
          id: `premium_${Date.now()}`,
          name: 'Premium Style Pack',
          description: 'Exclusive premium cards with guaranteed rare!',
          type: 'premium',
          cardCount: 5,
          guaranteedRarity: CardRarity.RARE,
          costGems: costGems,
          isFree: false,
          openingAnimation: 'premium',
          isLimitedTime: false,
          totalOpened: 0
        };
        
        setCurrentPack(premiumPack);
        setPackCards(cards);
        setPackModalVisible(true);
        
        // Refresh currency display
        setCurrency({ ...currency, fashionGems: spendResult.newBalance });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to purchase premium pack');
      logger.error(LogCategories.GAMIFICATION, 'Premium pack test failed', error);
    }
  };

  const testCurrencyEarning = async () => {
    if (!currency) return;
    
    const earnResult = await currencyService.earnCoins(
      currency.userId,
      CurrencyEarning.OUTFIT_CREATED(50)
    );
    
    if (earnResult.success) {
      setCurrency({ ...currency, styleCoins: earnResult.newBalance });
      Alert.alert('💰 Coins Earned!', '+50 Style Coins for creating an outfit!');
    }
  };

  // Achievement testing functions
  const testFirstUploadAchievement = async () => {
    try {
      const { achievementService } = await import('../services/AchievementService');
      const result = await achievementService.forceUnlockAchievement('test_user_gamification', 'first_upload');
      
      if (result.unlocked) {
        Alert.alert(
          '🏆 Achievement Unlocked!',
          `${result.achievement?.name}\n\n${result.achievement?.description}\n\nRewards: +${result.rewards?.coins || 0} coins, +${result.rewards?.wardrobeItems?.length || 0} items`
        );
      } else {
        Alert.alert('Achievement Test', 'Achievement was already unlocked or failed to unlock');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to test achievement system');
      logger.error(LogCategories.GAMIFICATION, 'Achievement test failed', error);
    }
  };

  const testOutfitCreationAchievement = async () => {
    try {
      const { achievementService } = await import('../services/AchievementService');
      const result = await achievementService.forceUnlockAchievement('test_user_gamification', 'first_outfit');
      
      if (result.unlocked) {
        Alert.alert(
          '🎨 Achievement Unlocked!',
          `${result.achievement?.name}\n\n${result.achievement?.description}\n\nRewards: +${result.rewards?.coins || 0} coins, +${result.rewards?.wardrobeItems?.length || 0} items`
        );
      } else {
        Alert.alert('Achievement Test', 'Achievement was already unlocked or failed to unlock');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to test achievement system');
      logger.error(LogCategories.GAMIFICATION, 'Achievement test failed', error);
    }
  };

  const testStreakAchievement = async () => {
    try {
      const { achievementService } = await import('../services/AchievementService');
      const result = await achievementService.forceUnlockAchievement('test_user_gamification', 'streak_7_days');
      
      if (result.unlocked) {
        Alert.alert(
          '🔥 Achievement Unlocked!',
          `${result.achievement?.name}\n\n${result.achievement?.description}\n\nRewards: +${result.rewards?.coins || 0} coins, +${result.rewards?.gems || 0} gems, +${result.rewards?.wardrobeItems?.length || 0} items`
        );
      } else {
        Alert.alert('Achievement Test', 'Achievement was already unlocked or failed to unlock');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to test achievement system');
      logger.error(LogCategories.GAMIFICATION, 'Achievement test failed', error);
    }
  };

  const testHiddenAchievement = async () => {
    try {
      const { achievementService } = await import('../services/AchievementService');
      const result = await achievementService.forceUnlockAchievement('test_user_gamification', 'night_owl_stylist');
      
      if (result.unlocked) {
        Alert.alert(
          '🦉 Hidden Achievement Unlocked!',
          `${result.achievement?.name}\n\n${result.achievement?.description}\n\nRewards: +${result.rewards?.coins || 0} coins, +${result.rewards?.wardrobeItems?.length || 0} rare items`
        );
      } else {
        Alert.alert('Achievement Test', 'Achievement was already unlocked or failed to unlock');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to test achievement system');
      logger.error(LogCategories.GAMIFICATION, 'Achievement test failed', error);
    }
  };

  const showAchievementStats = async () => {
    try {
      const { achievementService } = await import('../services/AchievementService');
      const stats = await achievementService.getAchievementStats('test_user_gamification');
      
      if (stats) {
        const categoryStats = Object.entries(stats.byCategory)
          .map(([category, data]) => `${category}: ${data.unlocked}/${data.total}`)
          .join('\n');
        
        Alert.alert(
          '📊 Achievement Stats',
          `Total: ${stats.unlocked}/${stats.total} (${Math.round(stats.completionPercentage)}%)\n\nBy Category:\n${categoryStats}\n\nLast Unlocked: ${stats.lastUnlocked?.name || 'None'}`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load achievement stats');
      logger.error(LogCategories.GAMIFICATION, 'Failed to load achievement stats', error);
    }
  };

  const openCardCollection = () => {
    onNavigateToCardCollection();
  };

  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled;
    soundService.setSoundEnabled(newSoundEnabled);
    setSoundEnabled(newSoundEnabled);
    Alert.alert('🔊 Sound Effects', newSoundEnabled ? 'Enabled' : 'Disabled');
  };

  const toggleMusic = () => {
    const newMusicEnabled = !musicEnabled;
    soundService.setMusicEnabled(newMusicEnabled);
    setMusicEnabled(newMusicEnabled);
    Alert.alert('🎵 Background Music', newMusicEnabled ? 'Enabled' : 'Disabled');
  };

  const getRarityColor = (rarity: CardRarity): string => {
    switch (rarity) {
      case CardRarity.COMMON: return '#9CA3AF';
      case CardRarity.UNCOMMON: return '#10B981';
      case CardRarity.RARE: return '#3B82F6';
      case CardRarity.LEGENDARY: return '#F59E0B';
      case CardRarity.MYTHIC: return '#8B5CF6';
      default: return '#9CA3AF';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SoundButton onPress={onGoBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </SoundButton>
        <Text style={styles.headerTitle}>🎮 Gamification Test</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Currency Display */}
      {currency && (
        <View style={styles.currencyBar}>
          <View style={styles.currencyItem}>
            <Text style={styles.currencyIcon}>💰</Text>
            <Text style={styles.currencyAmount}>{currency.styleCoins}</Text>
            <Text style={styles.currencyLabel}>Coins</Text>
          </View>
          <View style={styles.currencyItem}>
            <Text style={styles.currencyIcon}>💎</Text>
            <Text style={styles.currencyAmount}>{currency.fashionGems}</Text>
            <Text style={styles.currencyLabel}>Gems</Text>
          </View>
          <View style={styles.currencyItem}>
            <Text style={styles.currencyIcon}>✨</Text>
            <Text style={styles.currencyAmount}>{currency.dustParticles}</Text>
            <Text style={styles.currencyLabel}>Dust</Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sound System Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 Sound System Tests</Text>
          <View style={styles.buttonGrid}>
            <SoundButton style={styles.testButton} onPress={testButtonSounds}>
              <Text style={styles.testButtonText}>Button Tap Sound</Text>
            </SoundButton>
            <SoundButton style={styles.testButton} onPress={testSuccessSound} soundType="success">
              <Text style={styles.testButtonText}>Success Sound</Text>
            </SoundButton>
            <SoundButton style={styles.testButton} onPress={testErrorSound} soundType="error">
              <Text style={styles.testButtonText}>Error Sound</Text>
            </SoundButton>
            <SoundButton style={styles.testButton} onPress={testAchievementSound}>
              <Text style={styles.testButtonText}>Achievement Sound</Text>
            </SoundButton>
            <SoundButton style={styles.testButton} onPress={testBackgroundMusic}>
              <Text style={styles.testButtonText}>Background Music</Text>
            </SoundButton>
          </View>
          
          {/* Sound Controls */}
          <View style={styles.soundControls}>
            <SoundButton 
              style={[styles.toggleButton, soundEnabled && styles.toggleButtonActive]} 
              onPress={toggleSound}
            >
              <Text style={[styles.toggleButtonText, soundEnabled && styles.toggleButtonTextActive]}>
                Sound: {soundEnabled ? 'ON' : 'OFF'}
              </Text>
            </SoundButton>
            <SoundButton 
              style={[styles.toggleButton, musicEnabled && styles.toggleButtonActive]} 
              onPress={toggleMusic}
            >
              <Text style={[styles.toggleButtonText, musicEnabled && styles.toggleButtonTextActive]}>
                Music: {musicEnabled ? 'ON' : 'OFF'}
              </Text>
            </SoundButton>
          </View>
        </View>

        {/* Pack System Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Pack System Tests</Text>
          <View style={styles.buttonGrid}>
            <SoundButton style={styles.packButton} onPress={testFreePack}>
              <Text style={styles.packButtonText}>🎁 Free Daily Pack</Text>
              <Text style={styles.packButtonSubtext}>3 cards, 24h cooldown</Text>
            </SoundButton>
            <SoundButton style={styles.premiumPackButton} onPress={testPremiumPack}>
              <Text style={styles.packButtonText}>💎 Premium Pack</Text>
              <Text style={styles.packButtonSubtext}>5 cards, guaranteed rare (100 gems)</Text>
            </SoundButton>
          </View>
        </View>

        {/* Rewards System Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎁 Rewards System Tests</Text>
          <View style={styles.buttonGrid}>
            <SoundButton style={styles.rewardButton} onPress={testDailyRewards}>
              <Text style={styles.testButtonText}>Daily Login Rewards</Text>
            </SoundButton>
            <SoundButton style={styles.rewardButton} onPress={testCurrencyEarning}>
              <Text style={styles.testButtonText}>Earn Coins (+50)</Text>
            </SoundButton>
          </View>
        </View>

        {/* Achievement System Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Achievement System Tests</Text>
          <View style={styles.buttonGrid}>
            <SoundButton style={styles.achievementButton} onPress={testFirstUploadAchievement}>
              <Text style={styles.testButtonText}>First Upload Achievement</Text>
            </SoundButton>
            <SoundButton style={styles.achievementButton} onPress={testOutfitCreationAchievement}>
              <Text style={styles.testButtonText}>Outfit Creation Achievement</Text>
            </SoundButton>
            <SoundButton style={styles.achievementButton} onPress={testStreakAchievement}>
              <Text style={styles.testButtonText}>Weekly Streak Achievement</Text>
            </SoundButton>
            <SoundButton style={styles.achievementButton} onPress={testHiddenAchievement}>
              <Text style={styles.testButtonText}>Hidden Achievement</Text>
            </SoundButton>
          </View>
          <SoundButton style={styles.statsButton} onPress={showAchievementStats}>
            <Text style={styles.statsButtonText}>📊 View Achievement Stats</Text>
          </SoundButton>
        </View>

        {/* Navigation Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧭 Navigation Tests</Text>
          <SoundButton style={styles.navigationButton} onPress={openCardCollection}>
            <Text style={styles.navigationButtonText}>📚 Open Card Collection</Text>
          </SoundButton>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>🎯 Test Instructions</Text>
          <Text style={styles.instructionsText}>
            1. Test all sound effects with volume on{'\n'}
            2. Try claiming daily rewards (resets daily){'\n'}
            3. Open packs to see card animations{'\n'}
            4. Test achievement unlocks and rewards{'\n'}
            5. Check console logs for detailed feedback{'\n'}
            6. Visit Card Collection to see your cards{'\n'}
            7. View achievement stats and progress{'\n'}
            8. Toggle sound/music settings
          </Text>
        </View>
      </ScrollView>

      {/* Pack Opening Modal */}
      <PackOpeningModal
        visible={packModalVisible}
        pack={currentPack}
        cards={packCards}
        onClose={() => {
          setPackModalVisible(false);
          setCurrentPack(null);
          setPackCards([]);
        }}
        onOpenPack={() => {
          // Pack opening logic handled by modal
          logger.info(LogCategories.GAMIFICATION, 'Pack opened from test screen', {
            packType: currentPack?.type,
            cardCount: packCards.length
          });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerRight: {
    width: 50, // Balance the header
  },
  currencyBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currencyItem: {
    alignItems: 'center',
  },
  currencyIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  currencyAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  currencyLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  testButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    width: (screenWidth - 50) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  packButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    width: (screenWidth - 50) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  premiumPackButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    width: (screenWidth - 50) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  packButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  packButtonSubtext: {
    color: '#E5E7EB',
    fontSize: 11,
    textAlign: 'center',
  },
  rewardButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    width: (screenWidth - 50) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  achievementButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    width: (screenWidth - 50) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statsButton: {
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navigationButton: {
    backgroundColor: '#EC4899',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  navigationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  soundControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  toggleButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  toggleButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  toggleButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  instructions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});