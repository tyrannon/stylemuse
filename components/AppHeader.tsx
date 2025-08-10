import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CurrencyDisplay } from './CurrencyDisplay';
import { useTheme } from '../contexts/ThemeContext';

interface AppHeaderProps {
  showCurrency?: boolean;
  userId?: string;
}

export default function AppHeader({ showCurrency = true, userId = 'user123' }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  
  const isCompact = width < 380; // Adjust for smaller devices

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

      {showCurrency && !isCompact && (
        <View style={styles.actions} pointerEvents="box-none">
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
    flexShrink: 1,
    minWidth: 0,
    marginRight: 12,
  },
  title: { 
    fontSize: 24, 
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
});