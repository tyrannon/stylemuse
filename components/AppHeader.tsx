import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CurrencyDisplay } from './CurrencyDisplay';
import { useTheme } from '../contexts/ThemeContext';
import { StreakDisplay } from './StreakDisplay';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../types/navigation';

interface AppHeaderProps {
  showCurrency?: boolean;
  userId?: string;
  showStreak?: boolean;
}

export default function AppHeader({ showCurrency = true, userId = 'user123', showStreak = true }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const navigation = useNavigation<RootStackNavigationProp>();
  
  const isCompact = width < 380; // Adjust for smaller devices
  
  const handleStreakPress = () => {
    // Navigate to StreakCalendarScreen
    navigation.navigate('StreakCalendar');
  };

  return (
    <View 
      style={[
        styles.container, 
        { 
          paddingTop: insets.top + 8,
          backgroundColor: theme.background
        }
      ]}
      pointerEvents="box-none"
    >
      {/* Row 1: StyleMuse Brand */}
      <View style={styles.brandRow} pointerEvents="box-none">
        <Text style={[styles.title, { color: theme.text }]}>
          StyleMuse
        </Text>
        <View style={[styles.betaBadge, { backgroundColor: theme.accent }]}>
          <Text style={styles.betaText}>BETA</Text>
        </View>
      </View>

      {/* Row 2: Gamification Elements */}
      {!isCompact && (showStreak || showCurrency) && (
        <View style={styles.gamificationRow} pointerEvents="box-none">
          {showStreak && (
            <View style={styles.streakWrapper}>
              <StreakDisplay 
                compact={true}
                onPress={handleStreakPress}
              />
            </View>
          )}
          {showCurrency && (
            <View style={styles.currencyWrapper}>
              <CurrencyDisplay 
                userId={userId} 
                compact={true}
                onCurrencyPress={(type) => {
                  console.log(`Currency ${type} pressed`);
                  // TODO: Navigate to store or show currency details
                }}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800',
    letterSpacing: -0.5,
    marginRight: 8,
  },
  betaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  betaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gamificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  currencyWrapper: {
    minWidth: 120,
    height: 36,
  },
  streakWrapper: {
    minWidth: 80,
    height: 36,
  },
});