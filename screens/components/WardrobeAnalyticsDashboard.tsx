import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WardrobeItem } from '../../hooks/useWardrobeData';
import { AnalyticsService } from '../../services/AnalyticsService';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../utils/DebugLogger';
import { LogCategories } from '../../constants/LogCategories';

interface WardrobeAnalyticsDashboardProps {
  savedItems: WardrobeItem[];
  onItemPress?: (item: WardrobeItem) => void;
}

interface AnalyticsData {
  utilization: {
    totalItems: number;
    itemsUsedInOutfits: number;
    utilizationRate: number;
    averageUsagePerItem: number;
    mostUsedItems: Array<{ item: WardrobeItem; usage: number }>;
    leastUsedItems: Array<{ item: WardrobeItem; usage: number }>;
  };
  costPerWear: {
    itemsWithCostData: number;
    averageCostPerWear: number;
    bestValueItems: Array<{ item: WardrobeItem; costPerWear: number }>;
    expensiveUnusedItems: Array<{ item: WardrobeItem; daysUnused: number }>;
  };
  patterns: {
    totalGenerations: number;
    generationsThisWeek: number;
    generationsThisMonth: number;
    averageItemsPerOutfit: number;
    mostActiveHours: Array<{ hour: number; count: number }>;
  };
}

export const WardrobeAnalyticsDashboard: React.FC<WardrobeAnalyticsDashboardProps> = ({
  savedItems,
  onItemPress
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'utilization' | 'cost' | 'patterns'>('utilization');

  useEffect(() => {
    loadAnalyticsData();
  }, [savedItems]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      logger.info(LogCategories.ANALYTICS, 'Loading wardrobe analytics dashboard data');

      const [utilization, costPerWear, patterns] = await Promise.all([
        AnalyticsService.getWardrobeUtilizationStats(savedItems),
        Promise.resolve(AnalyticsService.getCostPerWearAnalytics(savedItems)),
        AnalyticsService.getOutfitGenerationPatterns()
      ]);

      setAnalyticsData({
        utilization,
        costPerWear,
        patterns
      });

      logger.info(LogCategories.ANALYTICS, 'Analytics dashboard data loaded', {
        utilizationRate: Math.round(utilization.utilizationRate),
        itemsWithCostData: costPerWear.itemsWithCostData,
        totalGenerations: patterns.totalGenerations
      });

    } catch (error) {
      logger.error(LogCategories.ANALYTICS, 'Failed to load analytics data', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Analyzing your wardrobe...</Text>
      </View>
    );
  }

  if (!analyticsData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load analytics data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAnalyticsData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Wardrobe Analytics</Text>
        <Text style={styles.subtitle}>
          Insights from your styling patterns
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'utilization' && styles.activeTab]}
          onPress={() => setActiveTab('utilization')}
        >
          <Text style={[styles.tabText, activeTab === 'utilization' && styles.activeTabText]}>
            Utilization
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cost' && styles.activeTab]}
          onPress={() => setActiveTab('cost')}
        >
          <Text style={[styles.tabText, activeTab === 'cost' && styles.activeTabText]}>
            Cost Analysis
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'patterns' && styles.activeTab]}
          onPress={() => setActiveTab('patterns')}
        >
          <Text style={[styles.tabText, activeTab === 'patterns' && styles.activeTabText]}>
            Patterns
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'utilization' && (
        <View style={styles.tabContent}>
          {/* Utilization Overview */}
          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>📈 Wardrobe Utilization</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Items:</Text>
              <Text style={styles.statValue}>{analyticsData.utilization.totalItems}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Items Used in Outfits:</Text>
              <Text style={styles.statValue}>{analyticsData.utilization.itemsUsedInOutfits}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Utilization Rate:</Text>
              <Text style={[styles.statValue, styles.primaryValue]}>
                {Math.round(analyticsData.utilization.utilizationRate)}%
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Avg Usage Per Item:</Text>
              <Text style={styles.statValue}>
                {analyticsData.utilization.averageUsagePerItem.toFixed(1)} times
              </Text>
            </View>
          </View>

          {/* Most Used Items */}
          {analyticsData.utilization.mostUsedItems.length > 0 && (
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>⭐ Most Used Items</Text>
              {analyticsData.utilization.mostUsedItems.slice(0, 5).map((data, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.itemRow}
                  onPress={() => onItemPress?.(data.item)}
                >
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {data.item.title || 'Untitled Item'}
                  </Text>
                  <Text style={styles.itemUsage}>{data.usage} times</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Least Used Items */}
          {analyticsData.utilization.leastUsedItems.length > 0 && (
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>💤 Underutilized Items</Text>
              {analyticsData.utilization.leastUsedItems.slice(0, 5).map((data, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.itemRow}
                  onPress={() => onItemPress?.(data.item)}
                >
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {data.item.title || 'Untitled Item'}
                  </Text>
                  <Text style={styles.itemUsage}>
                    {data.usage === 0 ? 'Never used' : `${data.usage} times`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {activeTab === 'cost' && (
        <View style={styles.tabContent}>
          {/* Cost Overview */}
          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>💰 Cost Per Wear Analysis</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Items with Cost Data:</Text>
              <Text style={styles.statValue}>{analyticsData.costPerWear.itemsWithCostData}</Text>
            </View>
            {analyticsData.costPerWear.averageCostPerWear > 0 && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Average Cost Per Wear:</Text>
                <Text style={[styles.statValue, styles.primaryValue]}>
                  {formatCurrency(analyticsData.costPerWear.averageCostPerWear)}
                </Text>
              </View>
            )}
          </View>

          {/* Best Value Items */}
          {analyticsData.costPerWear.bestValueItems.length > 0 && (
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>🏆 Best Value Items</Text>
              {analyticsData.costPerWear.bestValueItems.slice(0, 5).map((data, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.itemRow}
                  onPress={() => onItemPress?.(data.item)}
                >
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {data.item.title || 'Untitled Item'}
                  </Text>
                  <Text style={styles.itemUsage}>{formatCurrency(data.costPerWear)} per wear</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Expensive Unused Items */}
          {analyticsData.costPerWear.expensiveUnusedItems.length > 0 && (
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>⚠️ Expensive Underused Items</Text>
              {analyticsData.costPerWear.expensiveUnusedItems.slice(0, 5).map((data, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.itemRow}
                  onPress={() => onItemPress?.(data.item)}
                >
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {data.item.title || 'Untitled Item'}
                  </Text>
                  <Text style={styles.itemUsage}>
                    {data.daysUnused > 0 ? `${data.daysUnused} days unused` : 'Recently unused'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {analyticsData.costPerWear.itemsWithCostData === 0 && (
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>💡 Add Cost Data</Text>
              <Text style={styles.cardDescription}>
                Add purchase prices to your items to unlock cost-per-wear insights and discover your best value pieces!
              </Text>
            </View>
          )}
        </View>
      )}

      {activeTab === 'patterns' && (
        <View style={styles.tabContent}>
          {/* Generation Patterns */}
          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>🎨 Outfit Generation Patterns</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Outfits Generated:</Text>
              <Text style={styles.statValue}>{analyticsData.patterns.totalGenerations}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>This Week:</Text>
              <Text style={styles.statValue}>{analyticsData.patterns.generationsThisWeek}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>This Month:</Text>
              <Text style={styles.statValue}>{analyticsData.patterns.generationsThisMonth}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Avg Items Per Outfit:</Text>
              <Text style={styles.statValue}>
                {analyticsData.patterns.averageItemsPerOutfit.toFixed(1)} items
              </Text>
            </View>
          </View>

          {/* Most Active Hours */}
          {analyticsData.patterns.mostActiveHours.length > 0 && (
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>⏰ Most Active Hours</Text>
              {analyticsData.patterns.mostActiveHours.map((data, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemTitle}>{formatHour(data.hour)}</Text>
                  <Text style={styles.itemUsage}>{data.count} generations</Text>
                </View>
              ))}
            </View>
          )}

          {analyticsData.patterns.totalGenerations === 0 && (
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>🚀 Start Generating!</Text>
              <Text style={styles.cardDescription}>
                Use the Speed Dial to generate outfits and unlock pattern insights about your styling habits!
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: theme.colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.secondaryText,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondaryText,
  },
  activeTabText: {
    color: theme.colors.buttonText,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.secondaryText,
    lineHeight: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.secondaryText,
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  primaryValue: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemTitle: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
    marginRight: 12,
  },
  itemUsage: {
    fontSize: 12,
    color: theme.colors.secondaryText,
    fontWeight: '600',
  },
});