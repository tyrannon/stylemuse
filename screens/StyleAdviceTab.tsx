import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DiscoverScreen } from './components/StyleAdvice/DiscoverScreen';
import { WishlistScreen } from './components/StyleAdvice/WishlistScreen';
import { OutfitCompletionScreen } from './components/StyleAdvice/OutfitCompletionScreen';

type StyleAdviceSubTab = 'discover' | 'complete' | 'wishlist';

interface StyleAdviceTabProps {
  // Navigation and state props will be passed from parent
  onClose?: () => void;
}

export const StyleAdviceTab: React.FC<StyleAdviceTabProps> = ({ onClose }) => {
  const [activeSubTab, setActiveSubTab] = useState<StyleAdviceSubTab>('discover');

  const handleSubTabChange = async (tab: StyleAdviceSubTab) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveSubTab(tab);
  };

  const renderTabButton = (tab: StyleAdviceSubTab, label: string, icon: string) => (
    <TouchableOpacity
      key={tab}
      onPress={() => handleSubTabChange(tab)}
      style={[
        styles.tabButton,
        activeSubTab === tab && styles.activeTabButton
      ]}
    >
      <Text style={[
        styles.tabIcon,
        activeSubTab === tab && styles.activeTabIcon
      ]}>
        {icon}
      </Text>
      <Text style={[
        styles.tabLabel,
        activeSubTab === tab && styles.activeTabLabel
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderActiveScreen = () => {
    switch (activeSubTab) {
      case 'discover':
        return <DiscoverScreen />;
      case 'complete':
        return <OutfitCompletionScreen />;
      case 'wishlist':
        return <WishlistScreen />;
      default:
        return <DiscoverScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Style Advice</Text>
        <Text style={styles.headerSubtitle}>Discover new items & complete your looks ✨</Text>
      </View>

      {/* Sub-tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton('discover', 'Discover', '🔍')}
        {renderTabButton('complete', 'Complete', '✨')}
        {renderTabButton('wishlist', 'Wishlist', '💝')}
      </View>

      {/* Active Screen Content */}
      <View style={styles.content}>
        {renderActiveScreen()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  activeTabButton: {
    backgroundColor: '#007AFF',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
    color: '#666',
  },
  activeTabIcon: {
    color: '#fff',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  activeTabLabel: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
});