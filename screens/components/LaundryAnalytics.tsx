import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { WardrobeItem, LaundryStatus } from '../../hooks/useWardrobeData';
import { SafeImage } from '../../utils/SafeImage';

interface LaundryStats {
  totalItems: number;
  cleanItems: number;
  dirtyItems: number;
  inLaundryItems: number;
  dryingItems: number;
  needsIroningItems: number;
  totalWashes: number;
  averageWashFrequency: number;
  needsWashingSoon: number;
  cleanPercentage: number;
}

interface SmartWashSuggestions {
  regularLoad: number;
  delicateLoad: number;
  canDoFullLoad: boolean;
  suggestions: string[];
}

interface LaundryAnalyticsProps {
  stats: LaundryStats;
  suggestions: SmartWashSuggestions;
  savedItems: WardrobeItem[];
  onItemPress: (item: WardrobeItem) => void;
  getItemsByLaundryStatus: (status: LaundryStatus) => WardrobeItem[];
}

// Helper function to get laundry status display info
const getLaundryStatusDisplay = (status: LaundryStatus) => {
  switch (status) {
    case 'clean':
      return { emoji: '✨', text: 'Clean', color: '#4CAF50' };
    case 'dirty':
      return { emoji: '🧺', text: 'Dirty', color: '#FF5722' };
    case 'in-laundry':
      return { emoji: '🌊', text: 'Washing', color: '#2196F3' };
    case 'drying':
      return { emoji: '💨', text: 'Drying', color: '#FF9800' };
    case 'needs-ironing':
      return { emoji: '👔', text: 'Iron', color: '#9C27B0' };
    case 'out-of-rotation':
      return { emoji: '📦', text: 'Stored', color: '#607D8B' };
    default:
      return { emoji: '✨', text: 'Clean', color: '#4CAF50' };
  }
};

export const LaundryAnalytics: React.FC<LaundryAnalyticsProps> = ({
  stats,
  suggestions,
  savedItems,
  onItemPress,
  getItemsByLaundryStatus,
}) => {
  // Helper function to safely format dates
  const formatDate = (date: any): string => {
    try {
      if (!date) return 'Never';
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString();
    } catch (error) {
      console.warn('Invalid date in laundry analytics:', error);
      return 'Invalid date';
    }
  };

  // Get items that need washing most urgently
  const getMostWornItems = (): WardrobeItem[] => {
    return savedItems
      .filter(item => (item.timesWashed || 0) > 0)
      .sort((a, b) => (b.timesWashed || 0) - (a.timesWashed || 0))
      .slice(0, 3);
  };

  const mostWornItems = getMostWornItems();
  const dirtyItems = getItemsByLaundryStatus('dirty');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>🧺 Laundry Analytics</Text>
        <Text style={styles.subtitle}>
          Insights into your laundry patterns and suggestions
        </Text>
      </View>

      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.successCard]}>
          <Text style={styles.statNumber}>{stats.cleanItems}</Text>
          <Text style={styles.statLabel}>Clean Items</Text>
        </View>
        
        <View style={[styles.statCard, styles.warningCard]}>
          <Text style={styles.statNumber}>{stats.dirtyItems}</Text>
          <Text style={styles.statLabel}>Need Washing</Text>
        </View>
        
        <View style={[styles.statCard, styles.infoCard]}>
          <Text style={styles.statNumber}>{stats.inLaundryItems + stats.dryingItems}</Text>
          <Text style={styles.statLabel}>In Process</Text>
        </View>
        
        <View style={[styles.statCard, styles.primaryCard]}>
          <Text style={styles.statNumber}>{stats.totalWashes}</Text>
          <Text style={styles.statLabel}>Total Washes</Text>
        </View>
      </View>

      {/* Cleanliness Rate */}
      <View style={styles.utilizationCard}>
        <Text style={styles.utilizationTitle}>🧽 Wardrobe Cleanliness</Text>
        <View style={styles.utilizationBarContainer}>
          <View style={styles.utilizationBar}>
            <View 
              style={[
                styles.utilizationFill, 
                { 
                  width: `${stats.cleanPercentage}%`,
                  backgroundColor: stats.cleanPercentage >= 80 ? '#4CAF50' : 
                                   stats.cleanPercentage >= 60 ? '#FF9800' : '#FF5722'
                }
              ]} 
            />
          </View>
          <Text style={styles.utilizationText}>
            {stats.cleanPercentage}% of your wardrobe is clean
          </Text>
        </View>
        
        <Text style={styles.utilizationSubtext}>
          Average: {stats.averageWashFrequency} washes per item
        </Text>
      </View>

      {/* Smart Wash Suggestions */}
      {stats.dirtyItems > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Smart Wash Suggestions</Text>
          <View style={styles.suggestionsCard}>
            <View style={styles.loadSuggestions}>
              <View style={styles.loadSuggestion}>
                <Text style={styles.loadNumber}>{suggestions.regularLoad}</Text>
                <Text style={styles.loadLabel}>Regular Load</Text>
              </View>
              
              <View style={styles.loadSuggestion}>
                <Text style={styles.loadNumber}>{suggestions.delicateLoad}</Text>
                <Text style={styles.loadLabel}>Delicate Load</Text>
              </View>
              
              {suggestions.canDoFullLoad && (
                <View style={[styles.loadSuggestion, styles.fullLoadSuggestion]}>
                  <Text style={styles.fullLoadEmoji}>🎉</Text>
                  <Text style={styles.fullLoadLabel}>Ready for Full Load!</Text>
                </View>
              )}
            </View>
            
            {suggestions.suggestions.length > 0 && (
              <View style={styles.suggestionsList}>
                {suggestions.suggestions.map((suggestion, index) => (
                  <Text key={index} style={styles.suggestionText}>
                    • {suggestion}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Dirty Items Preview */}
      {dirtyItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🧺 Items Needing Wash ({dirtyItems.length})
          </Text>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dirtyItemsContainer}
          >
            {dirtyItems.slice(0, 8).map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dirtyItemCard}
                onPress={() => onItemPress(item)}
              >
                <SafeImage
                  uri={item.image}
                  style={styles.dirtyItemImage}
                  resizeMode="cover"
                />
                
                <View style={styles.dirtyItemInfo}>
                  <Text style={styles.dirtyItemTitle} numberOfLines={1}>
                    {item.title || 'Untitled'}
                  </Text>
                  <View style={styles.dirtyItemBadge}>
                    <Text style={styles.dirtyItemBadgeText}>🧺 Dirty</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Most Washed Items */}
      {mostWornItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🏆 Most Washed Items
          </Text>
          <View style={styles.mostWashedContainer}>
            {mostWornItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.mostWashedCard}
                onPress={() => onItemPress(item)}
              >
                <View style={styles.mostWashedRank}>
                  <Text style={styles.mostWashedRankText}>#{index + 1}</Text>
                </View>
                
                <SafeImage
                  uri={item.image}
                  style={styles.mostWashedImage}
                  resizeMode="cover"
                />
                
                <View style={styles.mostWashedInfo}>
                  <Text style={styles.mostWashedTitle} numberOfLines={1}>
                    {item.title || 'Untitled'}
                  </Text>
                  <Text style={styles.mostWashedStats}>
                    {item.timesWashed} wash{(item.timesWashed || 0) !== 1 ? 'es' : ''}
                  </Text>
                  {item.lastWashed && (
                    <Text style={styles.mostWashedDate}>
                      Last: {formatDate(item.lastWashed)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Status Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Status Breakdown</Text>
        <View style={styles.statusBreakdown}>
          {[
            { status: 'clean' as LaundryStatus, count: stats.cleanItems },
            { status: 'dirty' as LaundryStatus, count: stats.dirtyItems },
            { status: 'in-laundry' as LaundryStatus, count: stats.inLaundryItems },
            { status: 'drying' as LaundryStatus, count: stats.dryingItems },
            { status: 'needs-ironing' as LaundryStatus, count: stats.needsIroningItems },
          ].filter(item => item.count > 0).map((item) => {
            const statusDisplay = getLaundryStatusDisplay(item.status);
            return (
              <View key={item.status} style={styles.statusCard}>
                <View style={[styles.statusIcon, { backgroundColor: statusDisplay.color }]}>
                  <Text style={styles.statusEmoji}>{statusDisplay.emoji}</Text>
                </View>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusCount}>{item.count}</Text>
                  <Text style={styles.statusLabel}>{statusDisplay.text}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Tips Section */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Laundry Tips</Text>
        <View style={styles.tipsList}>
          {stats.dirtyItems >= 8 && (
            <Text style={styles.tipText}>
              • You have enough dirty items for a full wash load!
            </Text>
          )}
          {stats.cleanPercentage < 50 && (
            <Text style={styles.tipText}>
              • Consider doing laundry soon - less than half your wardrobe is clean.
            </Text>
          )}
          {stats.needsIroningItems > 0 && (
            <Text style={styles.tipText}>
              • Don't forget about {stats.needsIroningItems} item{stats.needsIroningItems !== 1 ? 's' : ''} that need ironing!
            </Text>
          )}
          {suggestions.delicateLoad >= 4 && (
            <Text style={styles.tipText}>
              • You have enough delicate items for a separate gentle cycle.
            </Text>
          )}
          {stats.averageWashFrequency > 0 && (
            <Text style={styles.tipText}>
              • Track your washing patterns to optimize your laundry schedule.
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  successCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
  },
  infoCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  utilizationCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  utilizationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  utilizationBarContainer: {
    marginBottom: 12,
  },
  utilizationBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  utilizationFill: {
    height: '100%',
    borderRadius: 4,
  },
  utilizationText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  utilizationSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  suggestionsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadSuggestions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  loadSuggestion: {
    alignItems: 'center',
  },
  loadNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  loadLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  fullLoadSuggestion: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  fullLoadEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  fullLoadLabel: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  suggestionsList: {
    gap: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  dirtyItemsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  dirtyItemCard: {
    width: 100,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#FF5722',
  },
  dirtyItemImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  dirtyItemInfo: {
    alignItems: 'center',
  },
  dirtyItemTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  dirtyItemBadge: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dirtyItemBadgeText: {
    fontSize: 8,
    color: 'white',
    fontWeight: 'bold',
  },
  mostWashedContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  mostWashedCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  mostWashedRank: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mostWashedRankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  mostWashedImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  mostWashedInfo: {
    flex: 1,
  },
  mostWashedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  mostWashedStats: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 2,
  },
  mostWashedDate: {
    fontSize: 12,
    color: '#666',
  },
  statusBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  statusCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusEmoji: {
    fontSize: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});