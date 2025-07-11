import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useTierManagement } from '../hooks/useTierManagement';
import { TierManager } from '../utils/TierManager';

interface UsageStatsCardProps {
  onUpgrade?: () => void;
  style?: any;
}

export const UsageStatsCard: React.FC<UsageStatsCardProps> = ({ onUpgrade, style }) => {
  const { theme } = useTheme();
  const { userTier, limits, usage, isLoading } = useTierManagement();
  
  const styles = createStyles(theme);

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.loadingText}>Loading usage stats...</Text>
      </View>
    );
  }

  const tierDisplayName = TierManager.getTierDisplayName(userTier);
  const tierColor = TierManager.getTierColor(userTier);

  const aiUsagePercent = limits.aiGenerationsPerMonth === -1 
    ? 0 
    : Math.min((usage.aiGenerationsThisMonth / limits.aiGenerationsPerMonth) * 100, 100);

  const wardrobeUsagePercent = limits.maxWardrobeItems === -1 
    ? 0 
    : Math.min((usage.currentWardrobeItems / limits.maxWardrobeItems) * 100, 100);

  const outfitUsagePercent = limits.maxSavedOutfits === -1 
    ? 0 
    : Math.min((usage.currentSavedOutfits / limits.maxSavedOutfits) * 100, 100);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Usage Stats</Text>
        <View style={[styles.tierBadge, { backgroundColor: tierColor + '20' }]}>
          <Text style={[styles.tierText, { color: tierColor }]}>
            {tierDisplayName}
          </Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        {/* AI Generations */}
        <View style={styles.statItem}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>AI Generations</Text>
            <Text style={styles.statValue}>
              {usage.aiGenerationsThisMonth} / {limits.aiGenerationsPerMonth === -1 ? '∞' : limits.aiGenerationsPerMonth}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${aiUsagePercent}%` },
                aiUsagePercent > 80 && styles.progressFillWarning
              ]}
            />
          </View>
        </View>

        {/* Wardrobe Items */}
        <View style={styles.statItem}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Wardrobe Items</Text>
            <Text style={styles.statValue}>
              {usage.currentWardrobeItems} / {limits.maxWardrobeItems === -1 ? '∞' : limits.maxWardrobeItems}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${wardrobeUsagePercent}%` },
                wardrobeUsagePercent > 80 && styles.progressFillWarning
              ]}
            />
          </View>
        </View>

        {/* Saved Outfits */}
        <View style={styles.statItem}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Saved Outfits</Text>
            <Text style={styles.statValue}>
              {usage.currentSavedOutfits} / {limits.maxSavedOutfits === -1 ? '∞' : limits.maxSavedOutfits}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${outfitUsagePercent}%` },
                outfitUsagePercent > 80 && styles.progressFillWarning
              ]}
            />
          </View>
        </View>
      </View>

      {userTier === 'free' && onUpgrade && (
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={onUpgrade}
          activeOpacity={0.8}
        >
          <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    gap: 16,
  },
  statItem: {
    gap: 8,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressFillWarning: {
    backgroundColor: '#FF9500',
  },
  upgradeButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});