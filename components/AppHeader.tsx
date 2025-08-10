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
        styles.header, 
        { 
          paddingTop: insets.top + 8,
          backgroundColor: theme.background
        }
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.brand} pointerEvents="box-none">
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
          StyleMuse
        </Text>
        <View style={[styles.betaBadge, { backgroundColor: theme.accent }]}>
          <Text style={styles.betaText}>BETA</Text>
        </View>
      </View>

      {!isCompact && (
        <View style={styles.actions} pointerEvents="box-none">
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
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
    marginRight: 12,
  },
  title: { 
    fontSize: 20, 
    fontWeight: '800',
    flexShrink: 1,
    minWidth: 0,
    marginRight: 8,
  },
  betaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  betaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actions: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    flexGrow: 0,
  },
  currencyWrapper: {
    minWidth: 120,
    height: 32,
    flexGrow: 0,
    flexShrink: 0,
  },
  streakWrapper: {
    marginRight: 8,
    flexShrink: 0,
  },
});