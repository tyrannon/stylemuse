import { getProductsAsync, purchaseItemAsync, finishTransactionAsync, getPurchaseHistoryAsync, getAvailablePurchasesAsync, connectAsync, disconnectAsync, IAPQueryResponse, IAPItemDetails, InAppPurchase } from 'expo-in-app-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TierManager, UserTier } from '../utils/TierManager';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import { Alert } from 'react-native';

export interface SubscriptionProduct {
  productId: string;
  tier: UserTier;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  type: 'subscription' | 'managed';
}

export interface SubscriptionStatus {
  isActive: boolean;
  tier: UserTier;
  expiryDate?: string;
  productId?: string;
  originalTransactionId?: string;
  isTrialPeriod?: boolean;
  autoRenewing?: boolean;
}

export interface PurchaseResult {
  success: boolean;
  tier?: UserTier;
  error?: string;
  transactionId?: string;
  originalTransactionId?: string;
}

export class SubscriptionService {
  private static instance: SubscriptionService;
  private isInitialized = false;
  private availableProducts: SubscriptionProduct[] = [];
  
  // Product IDs - these would be configured in App Store Connect
  private static readonly PRODUCT_IDS = {
    pro_monthly: 'stylemuse_pro_monthly',
    pro_yearly: 'stylemuse_pro_yearly',
    elite_monthly: 'stylemuse_elite_monthly',
    elite_yearly: 'stylemuse_elite_yearly',
  } as const;

  private static readonly STORAGE_KEYS = {
    SUBSCRIPTION_STATUS: 'subscription_status',
    PURCHASE_CACHE: 'purchase_cache',
    LAST_RECEIPT_VALIDATION: 'last_receipt_validation',
  } as const;

  private constructor() {}

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  /**
   * Initialize the subscription service
   */
  async initialize(): Promise<boolean> {
    try {
      logger.info(LogCategories.MONETIZATION, 'Initializing subscription service');
      
      // Connect to the in-app purchase service
      const isAvailable = await connectAsync();
      
      if (!isAvailable) {
        logger.warn(LogCategories.MONETIZATION, 'In-app purchases not available on this device');
        return false;
      }

      // Load available products
      await this.loadProducts();
      
      // Restore existing purchases
      await this.restorePurchases();
      
      this.isInitialized = true;
      logger.info(LogCategories.MONETIZATION, 'Subscription service initialized successfully', {
        productsCount: this.availableProducts.length
      });
      
      return true;
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to initialize subscription service', error);
      return false;
    }
  }

  /**
   * Load available subscription products from the store
   */
  private async loadProducts(): Promise<void> {
    try {
      const productIds = Object.values(SubscriptionService.PRODUCT_IDS);
      const response: IAPQueryResponse<IAPItemDetails> = await getProductsAsync(productIds);
      
      if (response.responseCode !== 0) {
        throw new Error(`Failed to load products: ${response.errorCode}`);
      }

      this.availableProducts = response.results?.map(this.mapStoreProductToSubscriptionProduct) || [];
      
      logger.info(LogCategories.MONETIZATION, 'Products loaded successfully', {
        count: this.availableProducts.length,
        products: this.availableProducts.map(p => ({ id: p.productId, title: p.title }))
      });
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to load products', error);
      throw error;
    }
  }

  /**
   * Map store product to our subscription product interface
   */
  private mapStoreProductToSubscriptionProduct(storeProduct: IAPItemDetails): SubscriptionProduct {
    let tier: UserTier = 'pro';
    if (storeProduct.productId.includes('elite')) {
      tier = 'elite';
    }

    return {
      productId: storeProduct.productId,
      tier,
      title: storeProduct.title || `StyleMuse ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
      description: storeProduct.description || `StyleMuse ${tier} subscription`,
      price: storeProduct.price || '$9.99',
      priceAmountMicros: storeProduct.priceAmountMicros || 9990000,
      priceCurrencyCode: storeProduct.priceCurrencyCode || 'USD',
      type: storeProduct.type === 'inapp' ? 'managed' : 'subscription',
    };
  }

  /**
   * Get available subscription products
   */
  async getAvailableProducts(): Promise<SubscriptionProduct[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return [...this.availableProducts];
  }

  /**
   * Purchase a subscription product
   */
  async purchaseSubscription(productId: string): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.info(LogCategories.MONETIZATION, 'Initiating subscription purchase', { productId });

      const product = this.availableProducts.find(p => p.productId === productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      // Initiate purchase
      const purchaseResponse = await purchaseItemAsync(productId);
      
      if (purchaseResponse.responseCode !== 0) {
        throw new Error(`Purchase failed: ${purchaseResponse.errorCode}`);
      }

      const purchase = purchaseResponse.results?.[0];
      if (!purchase) {
        throw new Error('No purchase result received');
      }

      // Validate and process the purchase
      const isValid = await this.validatePurchase(purchase);
      if (!isValid) {
        throw new Error('Purchase validation failed');
      }

      // Update user tier
      await TierManager.setUserTier(product.tier);
      
      // Cache subscription status
      await this.cacheSubscriptionStatus({
        isActive: true,
        tier: product.tier,
        productId: purchase.productId,
        originalTransactionId: purchase.originalTransactionId,
        autoRenewing: true,
      });

      // Finish the transaction
      await finishTransactionAsync(purchase);

      logger.info(LogCategories.MONETIZATION, 'Subscription purchase completed successfully', {
        productId,
        tier: product.tier,
        transactionId: purchase.transactionId
      });

      return {
        success: true,
        tier: product.tier,
        transactionId: purchase.transactionId,
        originalTransactionId: purchase.originalTransactionId,
      };

    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Subscription purchase failed', error, { productId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  /**
   * Restore previous purchases (for users who reinstall the app)
   */
  async restorePurchases(): Promise<boolean> {
    try {
      logger.info(LogCategories.MONETIZATION, 'Restoring previous purchases');

      const purchaseHistory = await getPurchaseHistoryAsync();
      
      if (purchaseHistory.responseCode !== 0) {
        logger.warn(LogCategories.MONETIZATION, 'Failed to get purchase history', {
          errorCode: purchaseHistory.errorCode
        });
        return false;
      }

      const activePurchases = purchaseHistory.results || [];
      
      // Find the most recent valid subscription
      let highestTier: UserTier = 'free';
      let activeSubscription: SubscriptionStatus | null = null;

      for (const purchase of activePurchases) {
        const isValid = await this.validatePurchase(purchase);
        if (isValid) {
          const product = this.availableProducts.find(p => p.productId === purchase.productId);
          if (product && (product.tier === 'elite' || (product.tier === 'pro' && highestTier === 'free'))) {
            highestTier = product.tier;
            activeSubscription = {
              isActive: true,
              tier: product.tier,
              productId: purchase.productId,
              originalTransactionId: purchase.originalTransactionId,
              autoRenewing: true,
            };
          }
        }
      }

      // Update user tier if we found an active subscription
      if (activeSubscription) {
        await TierManager.setUserTier(activeSubscription.tier);
        await this.cacheSubscriptionStatus(activeSubscription);
        
        logger.info(LogCategories.MONETIZATION, 'Purchases restored successfully', {
          tier: activeSubscription.tier,
          productId: activeSubscription.productId
        });
        return true;
      }

      // No active subscriptions found - ensure user is on free tier
      await TierManager.setUserTier('free');
      await this.cacheSubscriptionStatus({
        isActive: false,
        tier: 'free',
      });

      logger.info(LogCategories.MONETIZATION, 'No active subscriptions found during restore');
      return false;

    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to restore purchases', error);
      return false;
    }
  }

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const cached = await AsyncStorage.getItem(SubscriptionService.STORAGE_KEYS.SUBSCRIPTION_STATUS);
      if (cached) {
        const status: SubscriptionStatus = JSON.parse(cached);
        
        // Check if cached status is still valid (not expired)
        if (status.expiryDate && new Date(status.expiryDate) < new Date()) {
          // Subscription expired - fall back to free
          await TierManager.setUserTier('free');
          await this.cacheSubscriptionStatus({
            isActive: false,
            tier: 'free',
          });
          return { isActive: false, tier: 'free' };
        }
        
        return status;
      }
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to get cached subscription status', error);
    }

    // Default to free tier if no cached status
    return { isActive: false, tier: 'free' };
  }

  /**
   * Check if user can access premium features
   */
  async canAccessPremiumFeatures(): Promise<boolean> {
    const status = await this.getSubscriptionStatus();
    return status.isActive && (status.tier === 'pro' || status.tier === 'elite');
  }

  /**
   * Check if user can access elite features
   */
  async canAccessEliteFeatures(): Promise<boolean> {
    const status = await this.getSubscriptionStatus();
    return status.isActive && status.tier === 'elite';
  }

  /**
   * Validate a purchase receipt (simplified validation)
   */
  private async validatePurchase(purchase: InAppPurchase): Promise<boolean> {
    try {
      // Basic validation - in production, you'd validate with your server and Apple/Google
      const hasRequiredFields = !!(
        purchase.productId &&
        purchase.transactionId &&
        purchase.transactionDate
      );

      // Check if transaction is recent enough to be valid
      const transactionDate = new Date(purchase.transactionDate);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const isRecentTransaction = transactionDate > thirtyDaysAgo;

      const isValid = hasRequiredFields && isRecentTransaction;
      
      logger.debug(LogCategories.MONETIZATION, 'Purchase validation result', {
        productId: purchase.productId,
        isValid,
        hasRequiredFields,
        isRecentTransaction,
        transactionDate: purchase.transactionDate
      });

      return isValid;
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Purchase validation error', error);
      return false;
    }
  }

  /**
   * Cache subscription status locally
   */
  private async cacheSubscriptionStatus(status: SubscriptionStatus): Promise<void> {
    try {
      await AsyncStorage.setItem(
        SubscriptionService.STORAGE_KEYS.SUBSCRIPTION_STATUS,
        JSON.stringify(status)
      );
      logger.debug(LogCategories.MONETIZATION, 'Subscription status cached', status);
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to cache subscription status', error);
    }
  }

  /**
   * Handle subscription renewal/expiry (called periodically or on app launch)
   */
  async refreshSubscriptionStatus(): Promise<void> {
    try {
      // Check for any new purchases or status changes
      const availablePurchases = await getAvailablePurchasesAsync();
      
      if (availablePurchases.responseCode === 0 && availablePurchases.results) {
        // Process any pending purchases
        for (const purchase of availablePurchases.results) {
          const isValid = await this.validatePurchase(purchase);
          if (isValid) {
            const product = this.availableProducts.find(p => p.productId === purchase.productId);
            if (product) {
              await TierManager.setUserTier(product.tier);
              await this.cacheSubscriptionStatus({
                isActive: true,
                tier: product.tier,
                productId: purchase.productId,
                originalTransactionId: purchase.originalTransactionId,
                autoRenewing: true,
              });
            }
          }
          
          // Finish processed transactions
          await finishTransactionAsync(purchase);
        }
      }
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to refresh subscription status', error);
    }
  }

  /**
   * Show upgrade prompt with available products (legacy Alert-based)
   */
  async showUpgradeOptions(): Promise<void> {
    try {
      const products = await this.getAvailableProducts();
      if (products.length === 0) {
        Alert.alert(
          'Upgrade Unavailable',
          'Subscription options are not available at the moment. Please try again later.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show product selection - this would integrate with your existing UI
      const productOptions = products.map(p => ({
        text: `${p.title} - ${p.price}`,
        onPress: () => this.purchaseSubscription(p.productId)
      }));

      Alert.alert(
        'Choose Your Plan',
        'Select a StyleMuse subscription plan:',
        [
          ...productOptions,
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to show upgrade options', error);
      Alert.alert('Error', 'Unable to load upgrade options. Please try again.');
    }
  }

  /**
   * Show upgrade options with callback (for modal integration)
   */
  async showUpgradeWithCallback(
    onShow: (show: boolean, trigger?: 'limit_reached' | 'upgrade_button' | 'feature_gate') => void,
    trigger: 'limit_reached' | 'upgrade_button' | 'feature_gate' = 'upgrade_button'
  ): Promise<void> {
    try {
      logger.info(LogCategories.MONETIZATION, 'Showing upgrade options via callback', { trigger });
      onShow(true, trigger);
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Failed to show upgrade options via callback', error);
      Alert.alert('Error', 'Unable to load upgrade options. Please try again.');
    }
  }

  /**
   * Disconnect from the in-app purchase service
   */
  async disconnect(): Promise<void> {
    try {
      await disconnectAsync();
      this.isInitialized = false;
      logger.info(LogCategories.MONETIZATION, 'Subscription service disconnected');
    } catch (error) {
      logger.error(LogCategories.MONETIZATION, 'Error disconnecting subscription service', error);
    }
  }

  /**
   * Get subscription analytics for reporting
   */
  async getSubscriptionAnalytics(): Promise<{
    currentTier: UserTier;
    subscriptionStatus: SubscriptionStatus;
    availableProducts: SubscriptionProduct[];
    lifetimeValue?: number;
  }> {
    const [currentTier, status, products] = await Promise.all([
      TierManager.getUserTier(),
      this.getSubscriptionStatus(),
      this.getAvailableProducts(),
    ]);

    return {
      currentTier,
      subscriptionStatus: status,
      availableProducts: products,
      // TODO: Calculate lifetime value from purchase history
    };
  }
}

// Export singleton instance
export const subscriptionService = SubscriptionService.getInstance();