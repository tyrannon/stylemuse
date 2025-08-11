import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { subscriptionService, SubscriptionProduct } from '../services/SubscriptionService';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (tier: 'pro' | 'elite') => void;
  initialTrigger?: 'limit_reached' | 'upgrade_button' | 'feature_gate';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  visible,
  onClose,
  onSuccess,
  initialTrigger = 'upgrade_button'
}) => {
  const { theme } = useTheme();
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  const styles = createStyles(theme);

  useEffect(() => {
    if (visible) {
      loadProducts();
      trackModalOpen();
    }
  }, [visible]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      logger.info(LogCategories.MONETIZATION, 'Loading subscription products for modal');
      
      const availableProducts = await subscriptionService.getAvailableProducts();
      
      // Sort products by tier and billing cycle for optimal display
      const sortedProducts = availableProducts.sort((a, b) => {
        // Pro first, then Elite
        if (a.tier !== b.tier) {
          return a.tier === 'pro' ? -1 : 1;
        }
        // Monthly first, then yearly
        return a.productId.includes('monthly') ? -1 : 1;
      });
      
      setProducts(sortedProducts);
      
      // Pre-select the Pro Monthly as default
      const defaultProduct = sortedProducts.find(p => p.tier === 'pro' && p.productId.includes('monthly'));
      if (defaultProduct) {
        setSelectedProductId(defaultProduct.productId);
      }
      
      logger.info(LogCategories.MONETIZATION, 'Subscription products loaded', {
        count: sortedProducts.length,
        products: sortedProducts.map(p => ({ id: p.productId, price: p.price }))
      });
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to load subscription products', error as Error);
      Alert.alert('Error', 'Unable to load subscription options. Please try again.');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const trackModalOpen = () => {
    logger.info(LogCategories.MONETIZATION, 'Subscription modal opened', {
      trigger: initialTrigger,
      timestamp: new Date().toISOString()
    });
  };

  const handlePurchase = async (productId: string) => {
    if (isPurchasing) return;
    
    setIsPurchasing(true);
    setSelectedProductId(productId);
    
    const product = products.find(p => p.productId === productId);
    logger.info(LogCategories.MONETIZATION, 'Initiating subscription purchase', {
      productId,
      tier: product?.tier,
      price: product?.price
    });

    try {
      const result = await subscriptionService.purchaseSubscription(productId);
      
      if (result.success && result.tier) {
        logger.info(LogCategories.MONETIZATION, 'Subscription purchase successful', {
          tier: result.tier,
          transactionId: result.transactionId
        });
        
        Alert.alert(
          'Welcome to StyleMuse Pro!',
          `Your ${result.tier === 'pro' ? 'Pro' : 'Elite'} subscription is now active. Enjoy unlimited AI generations and premium features!`,
          [
            {
              text: 'Continue',
              onPress: () => {
                onSuccess?.(result.tier as 'pro' | 'elite');
                onClose();
              }
            }
          ]
        );
      } else {
        throw new Error(result.error || 'Purchase failed');
      }
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Subscription purchase failed', error as Error);
      Alert.alert(
        'Purchase Failed',
        'Unable to complete your subscription purchase. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsPurchasing(false);
      setSelectedProductId(null);
    }
  };

  const formatPrice = (product: SubscriptionProduct) => {
    // Extract numeric value for calculations
    const numericPrice = product.priceAmountMicros / 1000000;
    
    if (product.productId.includes('yearly')) {
      const monthlyEquivalent = numericPrice / 12;
      return {
        mainPrice: product.price,
        subPrice: `${product.priceCurrencyCode === 'USD' ? '$' : ''}${monthlyEquivalent.toFixed(2)}/month`,
        badge: '2 MONTHS FREE'
      };
    }
    
    return {
      mainPrice: product.price,
      subPrice: 'per month',
      badge: null
    };
  };

  const getTierBenefits = (tier: 'pro' | 'elite') => {
    const baseBenefits = [
      'Unlimited AI outfit generations',
      'Unlimited wardrobe items',
      'Advanced analytics dashboard',
      'Weather-based recommendations',
      'Priority customer support'
    ];
    
    if (tier === 'elite') {
      return [
        ...baseBenefits,
        'Exclusive trend forecasts',
        'API access for developers',
        'Virtual personal stylist',
        'Early access to new features'
      ];
    }
    
    return baseBenefits;
  };

  const renderProduct = (product: SubscriptionProduct) => {
    const pricing = formatPrice(product);
    const benefits = getTierBenefits(product.tier);
    const isSelected = selectedProductId === product.productId;
    const isPurchasingThis = isPurchasing && selectedProductId === product.productId;
    const isPopular = product.tier === 'pro' && product.productId.includes('yearly');
    
    return (
      <TouchableOpacity
        key={product.productId}
        style={[
          styles.productCard,
          isSelected && styles.productCardSelected,
          isPopular && styles.productCardPopular
        ]}
        onPress={() => setSelectedProductId(product.productId)}
        disabled={isPurchasing}
      >
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
          </View>
        )}
        
        {pricing.badge && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsBadgeText}>{pricing.badge}</Text>
          </View>
        )}
        
        <View style={styles.productHeader}>
          <Text style={styles.productTitle}>
            StyleMuse {product.tier === 'pro' ? 'Pro' : 'Elite'}
          </Text>
          <Text style={styles.productSubtitle}>
            {product.productId.includes('yearly') ? 'Annual Plan' : 'Monthly Plan'}
          </Text>
        </View>
        
        <View style={styles.pricingContainer}>
          <Text style={styles.mainPrice}>{pricing.mainPrice}</Text>
          <Text style={styles.subPrice}>{pricing.subPrice}</Text>
        </View>
        
        <View style={styles.benefitsList}>
          {benefits.slice(0, 4).map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
          {benefits.length > 4 && (
            <Text style={styles.moreBenefits}>
              +{benefits.length - 4} more premium features
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Upgrade to Pro</Text>
            <Text style={styles.headerSubtitle}>
              {initialTrigger === 'limit_reached' 
                ? "You've reached your free limit. Upgrade for unlimited access!"
                : "Unlock the full StyleMuse experience with premium features"}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={isPurchasing}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading subscription options...</Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.productsContainer}>
                {products.map(renderProduct)}
              </View>
              
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.subscribeButton,
                    (!selectedProductId || isPurchasing) && styles.subscribeButtonDisabled
                  ]}
                  onPress={() => selectedProductId && handlePurchase(selectedProductId)}
                  disabled={!selectedProductId || isPurchasing}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.subscribeButtonText}>
                      Start Subscription
                    </Text>
                  )}
                </TouchableOpacity>
                
                <Text style={styles.disclaimer}>
                  Cancel anytime. Subscription automatically renews unless cancelled.
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.85,
    paddingBottom: 34, // Safe area for home indicator
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  productsContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  productCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  productCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '08',
  },
  productCardPopular: {
    borderColor: '#FF6B35',
    backgroundColor: '#FF6B35' + '08',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  savingsBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  productHeader: {
    marginBottom: 12,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  productSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  pricingContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  mainPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
    lineHeight: 38,
  },
  subPrice: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  benefitsList: {
    gap: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
    width: 16,
  },
  benefitText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
    flex: 1,
  },
  moreBenefits: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: 4,
    marginLeft: 24,
  },
  footer: {
    padding: 20,
    paddingTop: 10,
  },
  subscribeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 56,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});