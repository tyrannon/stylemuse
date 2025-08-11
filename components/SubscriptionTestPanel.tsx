import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useTierManagement } from '../hooks/useTierManagement';
import { subscriptionService } from '../services/SubscriptionService';
import { TierManager, UserTier } from '../utils/TierManager';
import { SubscriptionModal } from './SubscriptionModal';
import { UsageStatsCard } from './UsageStatsCard';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

/**
 * Comprehensive testing panel for Phase 4A subscription flow validation
 * This component helps test all subscription scenarios systematically
 */
export const SubscriptionTestPanel: React.FC = () => {
  const { theme } = useTheme();
  const tierManagement = useTierManagement();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [modalTrigger, setModalTrigger] = useState<'limit_reached' | 'upgrade_button' | 'feature_gate'>('upgrade_button');
  const [testMode, setTestMode] = useState(false);
  
  const styles = createStyles(theme);

  const testScenarios = [
    {
      id: 'free_user_limit',
      title: 'Test: Free User Hits AI Limit',
      description: 'Simulates free user reaching monthly AI generation limit',
      action: async () => {
        await TierManager.setUserTier('free');
        await TierManager.updateUsageStats({ aiGenerationsThisMonth: 3 }); // Free tier limit
        await tierManagement.refreshData();
        
        // Trigger the limit check
        const canGenerate = await tierManagement.checkAIGeneration();
        if (!canGenerate.allowed) {
          setModalTrigger('limit_reached');
          setShowSubscriptionModal(true);
        } else {
          Alert.alert('Test Failed', 'Free user should be at limit but still shows as allowed');
        }
      }
    },
    {
      id: 'pro_user_unlimited',
      title: 'Test: Pro User Unlimited Access',
      description: 'Verifies Pro users have unlimited AI generations',
      action: async () => {
        await TierManager.setUserTier('pro');
        await tierManagement.refreshData();
        
        const canGenerate = await tierManagement.checkAIGeneration();
        Alert.alert(
          'Pro User Test',
          `Allowed: ${canGenerate.allowed}\nRemaining: ${canGenerate.remaining}\nLimit: ${canGenerate.limit}`,
          [{ text: 'OK' }]
        );
      }
    },
    {
      id: 'elite_user_features',
      title: 'Test: Elite User Feature Access',
      description: 'Verifies Elite users have all premium features',
      action: async () => {
        await TierManager.setUserTier('elite');
        await tierManagement.refreshData();
        
        const canAccessPremium = await subscriptionService.canAccessPremiumFeatures();
        const canAccessElite = await subscriptionService.canAccessEliteFeatures();
        
        Alert.alert(
          'Elite User Test',
          `Premium Access: ${canAccessPremium}\nElite Access: ${canAccessElite}`,
          [{ text: 'OK' }]
        );
      }
    },
    {
      id: 'purchase_flow_test',
      title: 'Test: Purchase Flow',
      description: 'Opens subscription modal for purchase testing',
      action: async () => {
        setModalTrigger('upgrade_button');
        setShowSubscriptionModal(true);
      }
    },
    {
      id: 'restore_purchases',
      title: 'Test: Restore Purchases',
      description: 'Tests purchase restoration functionality',
      action: async () => {
        logger.info(LogCategories.MONETIZATION, 'Testing purchase restoration');
        const restored = await subscriptionService.restorePurchases();
        await tierManagement.refreshData();
        
        Alert.alert(
          'Restore Test',
          `Restoration ${restored ? 'successful' : 'failed'}\nCurrent tier: ${tierManagement.userTier}`,
          [{ text: 'OK' }]
        );
      }
    },
    {
      id: 'subscription_analytics',
      title: 'Test: Subscription Analytics',
      description: 'Views comprehensive subscription analytics',
      action: async () => {
        const analytics = await subscriptionService.getSubscriptionAnalytics();
        
        Alert.alert(
          'Subscription Analytics',
          `Current Tier: ${analytics.currentTier}\nActive: ${analytics.subscriptionStatus.isActive}\nProducts Available: ${analytics.availableProducts.length}`,
          [{ text: 'OK' }]
        );
      }
    },
    {
      id: 'reset_to_free',
      title: 'Reset: Free Tier',
      description: 'Resets user to free tier for testing',
      action: async () => {
        await TierManager.setUserTier('free');
        await TierManager.updateUsageStats({ 
          aiGenerationsThisMonth: 0,
          currentWardrobeItems: 10,
          currentSavedOutfits: 1 
        });
        await tierManagement.refreshData();
        Alert.alert('Reset Complete', 'User reset to free tier with clean usage stats');
      }
    }
  ];

  const handleSubscriptionSuccess = async (tier: 'pro' | 'elite') => {
    await tierManagement.refreshData();
    logger.info(LogCategories.MONETIZATION, 'Subscription test completed successfully', { tier });
    Alert.alert(
      'Subscription Test Complete',
      `Successfully upgraded to ${tier.toUpperCase()} tier!`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Subscription Testing Panel</Text>
        <Text style={styles.subtitle}>Phase 4A - Week 2 Testing Suite</Text>
        
        <View style={styles.testModeToggle}>
          <Text style={styles.testModeLabel}>Debug Mode</Text>
          <Switch
            value={testMode}
            onValueChange={setTestMode}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>
      </View>

      {/* Current Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Current Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>User Tier:</Text>
          <Text style={[styles.statusValue, { color: TierManager.getTierColor(tierManagement.userTier) }]}>
            {TierManager.getTierDisplayName(tierManagement.userTier)}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>AI Generations Used:</Text>
          <Text style={styles.statusValue}>
            {tierManagement.usage.aiGenerationsThisMonth} / {tierManagement.limits.aiGenerationsPerMonth === -1 ? '∞' : tierManagement.limits.aiGenerationsPerMonth}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Wardrobe Items:</Text>
          <Text style={styles.statusValue}>
            {tierManagement.usage.currentWardrobeItems} / {tierManagement.limits.maxWardrobeItems === -1 ? '∞' : tierManagement.limits.maxWardrobeItems}
          </Text>
        </View>
      </View>

      {/* Usage Stats Card Integration */}
      <UsageStatsCard
        style={styles.usageCard}
        onUpgrade={() => {
          setModalTrigger('upgrade_button');
          setShowSubscriptionModal(true);
        }}
      />

      {/* Test Scenarios */}
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Test Scenarios</Text>
        {testScenarios.map((scenario, index) => (
          <TouchableOpacity
            key={scenario.id}
            style={styles.testButton}
            onPress={scenario.action}
          >
            <View style={styles.testButtonContent}>
              <Text style={styles.testButtonTitle}>{scenario.title}</Text>
              <Text style={styles.testButtonDescription}>{scenario.description}</Text>
            </View>
            <View style={styles.testButtonIcon}>
              <Text style={styles.testButtonIconText}>▶</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* App Store Configuration Info */}
      <View style={styles.configSection}>
        <Text style={styles.sectionTitle}>App Store Configuration</Text>
        <View style={styles.configCard}>
          <Text style={styles.configTitle}>Required SKUs</Text>
          <View style={styles.configList}>
            <Text style={styles.configItem}>• stylemuse_pro_monthly</Text>
            <Text style={styles.configItem}>• stylemuse_pro_yearly</Text>
            <Text style={styles.configItem}>• stylemuse_elite_monthly</Text>
            <Text style={styles.configItem}>• stylemuse_elite_yearly</Text>
          </View>
          <Text style={styles.configNote}>
            Configure these Product IDs in App Store Connect and Google Play Console
          </Text>
        </View>
      </View>

      {/* Revenue Projection */}
      <View style={styles.revenueSection}>
        <Text style={styles.sectionTitle}>Revenue Projections</Text>
        <View style={styles.revenueCard}>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>Conservative (5% conversion):</Text>
            <Text style={styles.revenueValue}>$30K/year</Text>
          </View>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>Target (10% conversion):</Text>
            <Text style={styles.revenueValue}>$75K/year</Text>
          </View>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>Optimistic (15% conversion):</Text>
            <Text style={styles.revenueValue}>$180K/year</Text>
          </View>
        </View>
      </View>

      {/* Premium Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={handleSubscriptionSuccess}
        initialTrigger={modalTrigger}
      />
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    margin: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  testModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testModeLabel: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  usageCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  testSection: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  testButton: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButtonContent: {
    flex: 1,
  },
  testButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  testButtonDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  testButtonIcon: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  configSection: {
    margin: 16,
    marginTop: 8,
  },
  configCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  configList: {
    marginBottom: 12,
  },
  configItem: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: 'monospace',
    marginBottom: 4,
    paddingLeft: 4,
  },
  configNote: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  revenueSection: {
    margin: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  revenueCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  revenueLabel: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  revenueValue: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '700',
  },
});