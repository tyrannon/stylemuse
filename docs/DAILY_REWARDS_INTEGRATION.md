# Daily Rewards System Integration Guide

## Overview
The StyleMuse daily rewards system is a Pokemon TCG-inspired gamification feature that provides users with daily login streaks, wardrobe items, style coins, fashion gems, and pack opening experiences.

## Components Created

### 1. Services
- **`DailyRewardsService`** - Core logic for daily login streaks and reward claiming ✅ (Already existed)
- **`CurrencyService`** - Manages style coins, fashion gems, dust, and trophies ✅ (Already existed)
- **`WardrobeRewardService`** - Generates wardrobe items as rewards ✅ (New)
- **`CardGenerationService`** - Creates style cards from wardrobe items ✅ (Already existed)
- **`SoundService`** - Provides sound effects for pack opening ✅ (Already existed)

### 2. UI Components
- **`DailyRewardsModal`** - Full-screen daily rewards claim interface ✅ (New)
- **`PackOpeningModal`** - Pokemon pack opening animation experience ✅ (New)
- **`CurrencyDisplay`** - Shows current coins/gems with animations ✅ (New)
- **`DailyRewardNotification`** - Top notification when rewards are available ✅ (New)

### 3. Hooks
- **`useDailyRewards`** - Main hook for daily reward functionality ✅ (New)
- **`useRewardIntegration`** - Integrates rewards with wardrobe system ✅ (New)

### 4. Type Definitions
- **`StyleCards.ts`** - Complete Pokemon TCG-style card system ✅ (Already existed)

## Integration Steps

### Step 1: Add to Main App Layout

```tsx
// In your main App.tsx or root layout component
import { DailyRewardNotification } from './components/DailyRewardNotification';
import { CurrencyDisplay } from './components/CurrencyDisplay';

function App() {
  const [userId] = useState('user123'); // Get from your auth system

  const handleWardrobeItemsEarned = (items: WardrobeItem[]) => {
    // This will be called when user earns wardrobe items
    console.log('User earned wardrobe items:', items);
    // You can show a success message, update UI, etc.
  };

  return (
    <NavigationContainer>
      {/* Your existing navigation */}
      <YourNavigationStack />
      
      {/* Daily reward notification overlay */}
      <DailyRewardNotification 
        userId={userId}
        onWardrobeItemsEarned={handleWardrobeItemsEarned}
      />
    </NavigationContainer>
  );
}
```

### Step 2: Add Currency Display to Header

```tsx
// In your header or top bar component
import { CurrencyDisplay } from './components/CurrencyDisplay';

function HeaderComponent({ userId }: { userId: string }) {
  return (
    <View style={styles.header}>
      <CurrencyDisplay 
        userId={userId} 
        compact={true}
        onCurrencyPress={(currencyType) => {
          // Navigate to store or currency details
          console.log(`User tapped ${currencyType}`);
        }}
      />
    </View>
  );
}
```

### Step 3: Integration with Wardrobe Screen

```tsx
// In your WardrobeUploadScreen.tsx or main wardrobe component
import { useRewardIntegration } from '../hooks/useRewardIntegration';

function WardrobeUploadScreen() {
  const { 
    streak,
    canClaimRewards,
    claimDailyReward,
    addRewardItemsToWardrobe,
    getRewardStats 
  } = useRewardIntegration(userId);

  // Show reward stats in wardrobe
  const rewardStats = getRewardStats();

  const handleClaimReward = async () => {
    const result = await claimDailyReward();
    
    if (result.success && result.earnedWardrobeItems) {
      // Add earned items to wardrobe
      const addResult = await addRewardItemsToWardrobe(result.earnedWardrobeItems);
      
      if (addResult.success) {
        Alert.alert(
          '🎉 Reward Claimed!',
          `Added ${addResult.addedCount} new items to your wardrobe!`
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Show reward stats */}
      <View style={styles.rewardStats}>
        <Text>Reward Items: {rewardStats.totalRewardItems}</Text>
        <Text>Current Streak: {streak?.currentStreak || 0} days</Text>
      </View>

      {/* Daily reward claim button */}
      {canClaimRewards && (
        <TouchableOpacity 
          style={styles.claimButton}
          onPress={handleClaimReward}
        >
          <Text>🎁 Claim Daily Reward!</Text>
        </TouchableOpacity>
      )}

      {/* Your existing wardrobe UI */}
    </View>
  );
}
```

### Step 4: Achievement Integration

```tsx
// When user completes achievements
import { useRewardIntegration } from '../hooks/useRewardIntegration';

function achievementUnlocked(achievementId: string) {
  const { generateAchievementReward, addRewardItemsToWardrobe } = useRewardIntegration(userId);

  const handleAchievementReward = async () => {
    // Generate reward based on achievement difficulty
    const rarity = achievementId.includes('rare') ? 'rare' : 'uncommon';
    const result = await generateAchievementReward(achievementId, rarity);
    
    if (result.success) {
      await addRewardItemsToWardrobe(result.items);
      
      Alert.alert(
        '🏆 Achievement Unlocked!',
        `You earned ${result.items.length} new wardrobe item(s)!`
      );
    }
  };

  handleAchievementReward();
}
```

### Step 5: Pack Opening Experience

```tsx
// For special events or premium rewards
import { PackOpeningModal } from '../components/PackOpeningModal';

function SpecialEventScreen() {
  const [showPackOpening, setShowPackOpening] = useState(false);
  const [currentPack, setCurrentPack] = useState(null);

  const handleOpenPack = (pack: StylePack) => {
    setCurrentPack(pack);
    setShowPackOpening(true);
  };

  const handleCardsRevealed = (cards: StyleCard[]) => {
    // Handle the revealed cards
    console.log('Cards revealed:', cards);
    // Convert to wardrobe items, add to collection, etc.
  };

  return (
    <View>
      {/* Pack opening modal */}
      <PackOpeningModal
        visible={showPackOpening}
        onClose={() => setShowPackOpening(false)}
        pack={currentPack}
        onCardsRevealed={handleCardsRevealed}
      />
    </View>
  );
}
```

## Configuration

### Daily Reward Schedule (7-day cycle)
1. **Day 1**: 100 Style Coins
2. **Day 2**: 150 Style Coins
3. **Day 3**: 25 Fashion Gems
4. **Day 4**: 200 Style Coins
5. **Day 5**: Standard Pack (3-5 cards)
6. **Day 6**: 50 Fashion Gems
7. **Day 7**: Premium Pack (5-8 cards, guaranteed rare)

### Special Milestones
- **Every 7 days**: Guaranteed wardrobe item (Rare)
- **Every 14 days**: Legendary pack with guaranteed legendary card
- **Every 30 days**: Guaranteed wardrobe item (Mythic rarity)

### Rarity Rates (Pokemon TCG-style)
- **Common**: 60% chance
- **Uncommon**: 25% chance
- **Rare**: 10% chance
- **Legendary**: 4% chance
- **Mythic**: 1% chance

## Sound Integration

The system uses the existing `SoundService` for:
- **Daily login**: Success notification sound
- **Pack opening**: Exciting reveal sequence with haptics
- **Achievement unlock**: Victory fanfare
- **Special milestones**: Enhanced celebration sounds

## Storage Structure

All data is stored locally using AsyncStorage:
- `daily_login_streak` - User's streak information
- `user_currency` - Style coins, gems, dust, trophies
- `currency_transactions_${userId}` - Transaction history
- `last_free_pack_claim` - Cooldown tracking
- Wardrobe items include `isRewardItem: true` flag for tracking

## Benefits

1. **Increased Daily Engagement** - Users return daily for rewards
2. **Progression Satisfaction** - Clear milestone system with escalating rewards
3. **Wardrobe Growth** - Free items help build collections
4. **Gamification** - Pokemon TCG mechanics increase enjoyment
5. **Retention** - Streak psychology encourages consistency

## Testing Checklist

- [ ] Daily login streak increments correctly
- [ ] Rewards reset at midnight local time
- [ ] Pack opening animations work smoothly
- [ ] Wardrobe items are added successfully
- [ ] Currency transactions are tracked
- [ ] Sound effects play appropriately
- [ ] Milestone rewards trigger correctly
- [ ] Notification appears for unclaimed rewards

## Future Enhancements

1. **Social Features** - Share streak achievements
2. **Seasonal Events** - Limited-time reward themes
3. **Trading System** - Exchange duplicate cards/items
4. **Battle System** - Use style cards in fashion battles
5. **Premium Battle Pass** - Enhanced reward tracks