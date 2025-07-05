import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeArea } from '../utils/SafeArea';
import { 
  getColorAnalytics, 
  suggestWardrobeGaps, 
  getColorFamilyEmoji, 
  getSeasonalEmoji,
  COLOR_FAMILIES 
} from '../utils/colorIntelligence';
import { WardrobeItem } from '../hooks/useWardrobeData';

const { width: screenWidth } = Dimensions.get('window');

interface ColorIntelligenceDemoProps {
  wardrobeItems: WardrobeItem[];
}

export const ColorIntelligenceDemo: React.FC<ColorIntelligenceDemoProps> = ({
  wardrobeItems,
}) => {
  const [showDemo, setShowDemo] = useState(false);
  
  // Calculate analytics
  const analytics = getColorAnalytics(wardrobeItems);
  const gaps = suggestWardrobeGaps(wardrobeItems);
  
  // Filter items with color intelligence
  const intelligentItems = wardrobeItems.filter(item => item.colorIntelligence);

  return (
    <>
      <TouchableOpacity
        style={styles.demoButton}
        onPress={() => setShowDemo(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.demoButtonText}>🎨 View Color Intelligence</Text>
      </TouchableOpacity>

      <Modal
        visible={showDemo}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeArea style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDemo(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Color Intelligence Dashboard</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Color Analytics Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎨 Color Analytics</Text>
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticCard}>
                  <Text style={styles.analyticNumber}>{intelligentItems.length}</Text>
                  <Text style={styles.analyticLabel}>Items Analyzed</Text>
                </View>
                <View style={styles.analyticCard}>
                  <Text style={styles.analyticNumber}>{analytics.neutralPercentage}%</Text>
                  <Text style={styles.analyticLabel}>Neutrals</Text>
                </View>
                <View style={styles.analyticCard}>
                  <Text style={styles.analyticNumber}>{Object.keys(analytics.colorFamilies).length}</Text>
                  <Text style={styles.analyticLabel}>Color Families</Text>
                </View>
              </View>
            </View>

            {/* Color Family Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌈 Color Family Distribution</Text>
              {Object.entries(analytics.colorFamilies).map(([family, count]) => (
                <View key={family} style={styles.colorFamilyRow}>
                  <Text style={styles.colorFamilyEmoji}>
                    {getColorFamilyEmoji(family)}
                  </Text>
                  <Text style={styles.colorFamilyName}>
                    {family.charAt(0).toUpperCase() + family.slice(1)}
                  </Text>
                  <View style={styles.colorFamilyCount}>
                    <Text style={styles.colorFamilyCountText}>{count}</Text>
                  </View>
                  <View style={[
                    styles.colorFamilyBar,
                    { width: `${(count / analytics.totalItems) * 100}%` }
                  ]} />
                </View>
              ))}
            </View>

            {/* Seasonal Balance */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌸 Seasonal Balance</Text>
              {Object.entries(analytics.seasonalBalance).map(([season, percentage]) => (
                <View key={season} style={styles.seasonalRow}>
                  <Text style={styles.seasonalEmoji}>
                    {getSeasonalEmoji(season)}
                  </Text>
                  <Text style={styles.seasonalName}>
                    {season.charAt(0).toUpperCase() + season.slice(1)}
                  </Text>
                  <Text style={styles.seasonalPercentage}>{percentage}%</Text>
                </View>
              ))}
            </View>

            {/* Wardrobe Gaps & Suggestions */}
            {gaps.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 Smart Suggestions</Text>
                {gaps.map((gap, index) => (
                  <View key={index} style={styles.suggestionCard}>
                    <Text style={styles.suggestionIcon}>✨</Text>
                    <Text style={styles.suggestionText}>{gap}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Color Intelligence Examples */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔍 Intelligence Examples</Text>
              {intelligentItems.slice(0, 3).map((item, index) => (
                <View key={index} style={styles.exampleCard}>
                  <Text style={styles.exampleTitle}>{item.title}</Text>
                  <View style={styles.intelligenceGrid}>
                    <View style={styles.intelligenceItem}>
                      <Text style={styles.intelligenceLabel}>Primary Color</Text>
                      <Text style={styles.intelligenceValue}>
                        {item.colorIntelligence?.primaryColor}
                      </Text>
                    </View>
                    <View style={styles.intelligenceItem}>
                      <Text style={styles.intelligenceLabel}>Undertones</Text>
                      <Text style={styles.intelligenceValue}>
                        {item.colorIntelligence?.undertones}
                      </Text>
                    </View>
                    <View style={styles.intelligenceItem}>
                      <Text style={styles.intelligenceLabel}>Season</Text>
                      <Text style={styles.intelligenceValue}>
                        {getSeasonalEmoji(item.colorIntelligence?.seasonalMapping || '')} {item.colorIntelligence?.seasonalMapping}
                      </Text>
                    </View>
                    <View style={styles.intelligenceItem}>
                      <Text style={styles.intelligenceLabel}>Coordination</Text>
                      <Text style={styles.intelligenceValue}>
                        {item.colorIntelligence?.coordinationPotential}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Color Intelligence Features */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🚀 Features Unlocked</Text>
              <View style={styles.featuresList}>
                <Text style={styles.featureItem}>🎯 Precise color categorization with undertones</Text>
                <Text style={styles.featureItem}>🌈 Seasonal color mapping for perfect timing</Text>
                <Text style={styles.featureItem}>⚖️ Color temperature analysis for harmony</Text>
                <Text style={styles.featureItem}>🎨 Smart coordination suggestions</Text>
                <Text style={styles.featureItem}>📊 Wardrobe gap analysis and recommendations</Text>
                <Text style={styles.featureItem}>🔍 Advanced filtering by color intelligence</Text>
              </View>
            </View>
          </ScrollView>
        </SafeArea>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  demoButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    margin: 10,
    alignItems: 'center',
  },
  demoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticCard: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  analyticNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  analyticLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  colorFamilyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  colorFamilyEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  colorFamilyName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  colorFamilyCount: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  colorFamilyCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  colorFamilyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: '#FF6B35',
    opacity: 0.3,
  },
  seasonalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  seasonalEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  seasonalName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  seasonalPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  suggestionIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  exampleCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  intelligenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  intelligenceItem: {
    width: '50%',
    marginBottom: 8,
  },
  intelligenceLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  intelligenceValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  featuresList: {
    
  },
  featureItem: {
    fontSize: 14,
    color: '#333',
    paddingVertical: 4,
    lineHeight: 20,
  },
});