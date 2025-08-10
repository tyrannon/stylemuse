import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { currencyService } from '../services/CurrencyService';
import { StyleCurrency } from '../types/StyleCards';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

interface CurrencyDisplayProps {
  userId: string;
  onCurrencyPress?: (currencyType: 'coins' | 'gems' | 'dust' | 'trophies') => void;
  showAllCurrencies?: boolean;
  compact?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  userId,
  onCurrencyPress,
  showAllCurrencies = false,
  compact = false,
}) => {
  const { theme } = useTheme();
  const [currency, setCurrency] = useState<StyleCurrency | null>(null);
  const [loading, setLoading] = useState(true);
  const [animationValues] = useState({
    coins: new Animated.Value(0),
    gems: new Animated.Value(0),
    dust: new Animated.Value(0),
    trophies: new Animated.Value(0),
  });

  useEffect(() => {
    if (userId) {
      loadCurrency();
    }
  }, [userId]);

  const loadCurrency = async () => {
    try {
      setLoading(true);
      const userCurrency = await currencyService.getCurrency(userId);
      setCurrency(userCurrency);

      // Animate currency amounts
      Object.values(animationValues).forEach((anim) => {
        anim.setValue(0);
        Animated.spring(anim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      });

      logger.debug(LogCategories.GAMIFICATION, 'Currency loaded for display', {
        userId,
        coins: userCurrency.styleCoins,
        gems: userCurrency.fashionGems,
      });
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to load currency for display', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  const getCurrencyIcon = (type: 'coins' | 'gems' | 'dust' | 'trophies'): string => {
    switch (type) {
      case 'coins':
        return '🪙';
      case 'gems':
        return '💎';
      case 'dust':
        return '✨';
      case 'trophies':
        return '🏆';
      default:
        return '💰';
    }
  };

  const getCurrencyColor = (type: 'coins' | 'gems' | 'dust' | 'trophies'): string => {
    switch (type) {
      case 'coins':
        return '#FFD700';
      case 'gems':
        return '#FF69B4';
      case 'dust':
        return '#E6E6FA';
      case 'trophies':
        return '#FF8C00';
      default:
        return theme.colors.text;
    }
  };

  const renderCurrencyItem = (
    type: 'coins' | 'gems' | 'dust' | 'trophies',
    amount: number,
    animValue: Animated.Value
  ) => {
    const handlePress = () => {
      onCurrencyPress?.(type);
    };

    return (
      <TouchableOpacity
        key={type}
        style={[
          compact ? styles.currencyItemCompact : styles.currencyItem,
          {
            backgroundColor: compact ? 'transparent' : theme.colors.surface,
            borderColor: getCurrencyColor(type),
          },
        ]}
        onPress={handlePress}
        disabled={!onCurrencyPress}
        activeOpacity={onCurrencyPress ? 0.7 : 1}
      >
        <Animated.View
          style={[
            styles.currencyContent,
            {
              transform: [{ scale: animValue }],
              opacity: animValue,
            },
          ]}
        >
          <Text style={styles.currencyIcon}>{getCurrencyIcon(type)}</Text>
          <View style={styles.currencyTextContainer}>
            <Text
              style={[
                compact ? styles.currencyAmountCompact : styles.currencyAmount,
                { color: getCurrencyColor(type) },
              ]}
            >
              {formatCurrency(amount)}
            </Text>
            {!compact && (
              <Text
                style={[
                  styles.currencyLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  if (loading || !currency) {
    return (
      <View style={compact ? styles.containerCompact : styles.container}>
        <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={compact ? styles.containerCompact : styles.container}>
      {/* Always show coins and gems */}
      <View style={styles.primaryCurrencies}>
        {renderCurrencyItem('coins', currency.styleCoins, animationValues.coins)}
        {renderCurrencyItem('gems', currency.fashionGems, animationValues.gems)}
      </View>

      {/* Show additional currencies if requested */}
      {showAllCurrencies && (currency.dustParticles > 0 || currency.trophyTokens > 0) && (
        <View style={styles.secondaryCurrencies}>
          {currency.dustParticles > 0 &&
            renderCurrencyItem('dust', currency.dustParticles, animationValues.dust)}
          {currency.trophyTokens > 0 &&
            renderCurrencyItem('trophies', currency.trophyTokens, animationValues.trophies)}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  containerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryCurrencies: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  secondaryCurrencies: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  currencyItem: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  currencyItemCompact: {
    marginHorizontal: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  currencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  currencyTextContainer: {
    alignItems: 'center',
  },
  currencyAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  currencyAmountCompact: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  currencyLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});