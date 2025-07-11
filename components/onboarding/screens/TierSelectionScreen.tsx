import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { logger } from '../../../utils/DebugLogger';
import { LogCategories } from '../../../constants/LogCategories';

interface TierOption {
  id: 'free' | 'pro' | 'elite';
  name: string;
  price: string;
  monthlyPrice?: string;
  popular?: boolean;
  features: string[];
  limits: string[];
  color: string;
  description: string;
}

interface TierSelectionScreenProps {
  navigation: any;
  route: any;
}

const { width } = Dimensions.get('window');

export const TierSelectionScreen: React.FC<TierSelectionScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [selectedTier, setSelectedTier] = useState<'free' | 'pro' | 'elite'>('pro');
  const [showAnnualPricing, setShowAnnualPricing] = useState(true);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(1);

  const { onboardingData, setOnboardingData, currentStep, totalSteps, completeOnboarding } = route.params;

  useEffect(() => {
    logger.info(LogCategories.USER_ACTION, 'Tier selection screen opened', {
      screen: 'onboarding_tier_selection',
      step: currentStep,
      totalSteps
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const tiers: TierOption[] = [
    {
      id: 'free',
      name: 'StyleMuse Explorer',
      price: 'Free',
      monthlyPrice: 'Always Free',
      features: [
        '5 AI outfit suggestions/month',
        'Basic wardrobe (50 items)',
        '3 saved outfits',
        'Basic style analytics',
        'Core styling features'
      ],
      limits: [
        'Limited AI generations',
        'Basic analytics only',
        'No advanced features'
      ],
      color: theme.colors.textSecondary,
      description: 'Perfect for getting started with AI styling'
    },
    {
      id: 'pro',
      name: 'StyleMuse Pro',
      price: showAnnualPricing ? '$99/year' : '$9.99/month',
      monthlyPrice: showAnnualPricing ? '$8.25/month' : '$9.99/month',
      popular: true,
      features: [
        'Unlimited AI outfit suggestions',
        'Unlimited wardrobe items',
        'Unlimited saved outfits',
        'Advanced style analytics',
        'Weather-based recommendations',
        'Seasonal style updates',
        'Outfit history tracking',
        'Priority support'
      ],
      limits: [],
      color: theme.colors.primary,
      description: 'The complete StyleMuse experience for serious fashion enthusiasts'
    },
    {
      id: 'elite',
      name: 'StyleMuse Elite',
      price: showAnnualPricing ? '$199/year' : '$19.99/month',
      monthlyPrice: showAnnualPricing ? '$16.60/month' : '$19.99/month',
      features: [
        'Everything in Pro',
        'Personal AI stylist chat',
        'Trend forecasts & insights',
        'Virtual styling sessions',
        'Early access to new features',
        'Custom style profiles',
        'API access for developers',
        'Dedicated account manager'
      ],
      limits: [],
      color: theme.colors.accent || '#FF6B6B',
      description: 'For fashion professionals and ultimate style enthusiasts'
    }
  ];

  const handleSelectTier = (tierId: 'free' | 'pro' | 'elite') => {
    setSelectedTier(tierId);
    
    // Animate selection
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();

    logger.debug(LogCategories.USER_ACTION, 'Tier selected', {
      selectedTier: tierId,
      screen: 'onboarding_tier_selection'
    });
  };

  const handleComplete = async () => {
    logger.info(LogCategories.USER_ACTION, 'Onboarding completed', {
      selectedTier,
      showAnnualPricing,
      totalSteps,
      screen: 'onboarding_tier_selection'
    });

    const finalData = {
      ...onboardingData,
      selectedTier,
      pricingChoice: showAnnualPricing ? 'annual' : 'monthly'
    };

    await completeOnboarding(finalData);
  };

  const togglePricingMode = () => {
    setShowAnnualPricing(!showAnnualPricing);
    logger.debug(LogCategories.USER_ACTION, 'Pricing mode toggled', {
      showAnnualPricing: !showAnnualPricing,
      screen: 'onboarding_tier_selection'
    });
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
            <Text style={styles.progressText}>Final Step!</Text>
          </View>

          <Text style={styles.title}>Choose Your StyleMuse Journey</Text>
          <Text style={styles.subtitle}>
            Start with a 7-day free trial of any paid plan
          </Text>
          
          <View style={styles.pricingToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                !showAnnualPricing && styles.toggleButtonActive
              ]}
              onPress={togglePricingMode}
            >
              <Text style={[
                styles.toggleText,
                !showAnnualPricing && styles.toggleTextActive
              ]}>
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                showAnnualPricing && styles.toggleButtonActive
              ]}
              onPress={togglePricingMode}
            >
              <Text style={[
                styles.toggleText,
                showAnnualPricing && styles.toggleTextActive
              ]}>
                Annual
              </Text>
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>Save 30%</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.tiersContainer}
        >
          {tiers.map((tier) => (
            <TouchableOpacity
              key={tier.id}
              onPress={() => handleSelectTier(tier.id)}
              activeOpacity={0.9}
              style={styles.tierCardContainer}
            >
              <Animated.View
                style={[
                  styles.tierCard,
                  {
                    borderColor: selectedTier === tier.id ? tier.color : theme.colors.border,
                    borderWidth: selectedTier === tier.id ? 2 : 1,
                    transform: selectedTier === tier.id ? [{ scale: scaleAnim }] : [],
                  }
                ]}
              >
                {tier.popular && (
                  <View style={[styles.popularBadge, { backgroundColor: tier.color }]}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}
                
                <View style={styles.tierHeader}>
                  <Text style={styles.tierName}>{tier.name}</Text>
                  <Text style={styles.tierDescription}>{tier.description}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.tierPrice, { color: tier.color }]}>
                      {tier.price}
                    </Text>
                    {tier.monthlyPrice && tier.price !== tier.monthlyPrice && (
                      <Text style={styles.monthlyPrice}>
                        {tier.monthlyPrice}
                      </Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.featuresContainer}>
                  {tier.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Text style={[styles.featureCheck, { color: tier.color }]}>✓</Text>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                  
                  {tier.limits.length > 0 && (
                    <View style={styles.limitsContainer}>
                      {tier.limits.map((limit, index) => (
                        <View key={index} style={styles.limitRow}>
                          <Text style={styles.limitIcon}>⚠️</Text>
                          <Text style={styles.limitText}>{limit}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                
                {selectedTier === tier.id && (
                  <View style={[styles.selectedIndicator, { backgroundColor: tier.color }]}>
                    <Text style={styles.selectedText}>Selected</Text>
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleComplete}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>
            {selectedTier === 'free' ? 'Start Free' : 'Start 7-Day Free Trial'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.disclaimer}>
          {selectedTier !== 'free' && 'Cancel anytime. No credit card required for trial.'}
          {selectedTier === 'free' && 'You can upgrade anytime in settings.'}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: theme.colors.success,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.success,
    textAlign: 'center',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  pricingToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  saveBadge: {
    backgroundColor: theme.colors.success,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  saveText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  tiersContainer: {
    paddingBottom: 20,
  },
  tierCardContainer: {
    marginBottom: 16,
  },
  tierCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tierHeader: {
    marginBottom: 20,
  },
  tierName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  tierDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tierPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  monthlyPrice: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureCheck: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
    lineHeight: 18,
  },
  limitsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  limitIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  limitText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
  selectedIndicator: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomContainer: {
    paddingTop: 20,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
});