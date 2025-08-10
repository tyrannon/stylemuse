import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleCurrency } from '../types/StyleCards';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import { soundService } from './SoundService';

interface CurrencyEarningSource {
  source: 'daily_login' | 'pack_opening' | 'outfit_creation' | 'battle_victory' | 'achievement' | 'purchase' | 'trade';
  amount: number;
  description: string;
}

interface CurrencySpendingSource {
  source: 'pack_purchase' | 'card_upgrade' | 'battle_entry' | 'cosmetic' | 'trade';
  amount: number;
  description: string;
}

interface CurrencyTransaction {
  id: string;
  type: 'earn' | 'spend';
  currency: 'coins' | 'gems' | 'dust' | 'trophies';
  amount: number;
  source: string;
  description: string;
  timestamp: Date;
  balanceAfter: number;
}

class CurrencyService {
  private static instance: CurrencyService;
  private readonly STORAGE_KEY = 'user_currency';
  private readonly TRANSACTIONS_KEY = 'currency_transactions';
  private currency: StyleCurrency | null = null;

  static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  // Initialize user currency (for new users)
  async initializeCurrency(userId: string): Promise<StyleCurrency> {
    try {
      const initialCurrency: StyleCurrency = {
        userId,
        styleCoins: 500,        // Starting coins
        fashionGems: 50,        // Starting gems
        dustParticles: 0,       // Earned from duplicates
        trophyTokens: 0,        // Earned from battles
        totalCoinsEarned: 500,
        totalGemsEarned: 50,
        totalSpent: 0,
        lastUpdated: new Date(),
      };

      await this.saveCurrency(initialCurrency);
      this.currency = initialCurrency;

      logger.info(LogCategories.GAMIFICATION, 'Currency initialized for new user', {
        userId,
        startingCoins: initialCurrency.styleCoins,
        startingGems: initialCurrency.fashionGems
      });

      return initialCurrency;
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to initialize currency', error);
      throw error;
    }
  }

  // Get current currency balance
  async getCurrency(userId: string): Promise<StyleCurrency> {
    try {
      if (this.currency && this.currency.userId === userId) {
        return this.currency;
      }

      const currencyStr = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!currencyStr) {
        return await this.initializeCurrency(userId);
      }

      const currency: StyleCurrency = JSON.parse(currencyStr);
      this.currency = currency;
      return currency;
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to get currency', error);
      // Return safe defaults on error
      return await this.initializeCurrency(userId);
    }
  }

  // Earn Style Coins
  async earnCoins(userId: string, earning: CurrencyEarningSource): Promise<{
    success: boolean;
    newBalance: number;
    transaction?: CurrencyTransaction;
  }> {
    try {
      const currency = await this.getCurrency(userId);
      
      const newCoins = currency.styleCoins + earning.amount;
      const updatedCurrency: StyleCurrency = {
        ...currency,
        styleCoins: newCoins,
        totalCoinsEarned: currency.totalCoinsEarned + earning.amount,
        lastUpdated: new Date(),
      };

      await this.saveCurrency(updatedCurrency);
      this.currency = updatedCurrency;

      // Create transaction record
      const transaction = await this.recordTransaction({
        type: 'earn',
        currency: 'coins',
        amount: earning.amount,
        source: earning.source,
        description: earning.description,
        balanceAfter: newCoins,
      });

      // Play success sound
      await soundService.playSuccess();

      logger.info(LogCategories.GAMIFICATION, 'Style coins earned', {
        userId,
        amount: earning.amount,
        source: earning.source,
        newBalance: newCoins
      });

      return { success: true, newBalance: newCoins, transaction };
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to earn coins', error);
      return { success: false, newBalance: 0 };
    }
  }

  // Earn Fashion Gems
  async earnGems(userId: string, earning: CurrencyEarningSource): Promise<{
    success: boolean;
    newBalance: number;
    transaction?: CurrencyTransaction;
  }> {
    try {
      const currency = await this.getCurrency(userId);
      
      const newGems = currency.fashionGems + earning.amount;
      const updatedCurrency: StyleCurrency = {
        ...currency,
        fashionGems: newGems,
        totalGemsEarned: currency.totalGemsEarned + earning.amount,
        lastUpdated: new Date(),
      };

      await this.saveCurrency(updatedCurrency);
      this.currency = updatedCurrency;

      // Create transaction record
      const transaction = await this.recordTransaction({
        type: 'earn',
        currency: 'gems',
        amount: earning.amount,
        source: earning.source,
        description: earning.description,
        balanceAfter: newGems,
      });

      // Play special gem sound
      await soundService.playSuccess();

      logger.info(LogCategories.GAMIFICATION, 'Fashion gems earned', {
        userId,
        amount: earning.amount,
        source: earning.source,
        newBalance: newGems
      });

      return { success: true, newBalance: newGems, transaction };
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to earn gems', error);
      return { success: false, newBalance: 0 };
    }
  }

  // Spend Style Coins
  async spendCoins(userId: string, spending: CurrencySpendingSource): Promise<{
    success: boolean;
    newBalance: number;
    transaction?: CurrencyTransaction;
  }> {
    try {
      const currency = await this.getCurrency(userId);
      
      if (currency.styleCoins < spending.amount) {
        logger.warn(LogCategories.GAMIFICATION, 'Insufficient coins for purchase', {
          userId,
          required: spending.amount,
          available: currency.styleCoins
        });
        return { success: false, newBalance: currency.styleCoins };
      }

      const newCoins = currency.styleCoins - spending.amount;
      const updatedCurrency: StyleCurrency = {
        ...currency,
        styleCoins: newCoins,
        totalSpent: currency.totalSpent + spending.amount,
        lastUpdated: new Date(),
      };

      await this.saveCurrency(updatedCurrency);
      this.currency = updatedCurrency;

      // Create transaction record
      const transaction = await this.recordTransaction({
        type: 'spend',
        currency: 'coins',
        amount: spending.amount,
        source: spending.source,
        description: spending.description,
        balanceAfter: newCoins,
      });

      logger.info(LogCategories.GAMIFICATION, 'Style coins spent', {
        userId,
        amount: spending.amount,
        source: spending.source,
        newBalance: newCoins
      });

      return { success: true, newBalance: newCoins, transaction };
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to spend coins', error);
      return { success: false, newBalance: 0 };
    }
  }

  // Spend Fashion Gems
  async spendGems(userId: string, spending: CurrencySpendingSource): Promise<{
    success: boolean;
    newBalance: number;
    transaction?: CurrencyTransaction;
  }> {
    try {
      const currency = await this.getCurrency(userId);
      
      if (currency.fashionGems < spending.amount) {
        logger.warn(LogCategories.GAMIFICATION, 'Insufficient gems for purchase', {
          userId,
          required: spending.amount,
          available: currency.fashionGems
        });
        return { success: false, newBalance: currency.fashionGems };
      }

      const newGems = currency.fashionGems - spending.amount;
      const updatedCurrency: StyleCurrency = {
        ...currency,
        fashionGems: newGems,
        totalSpent: currency.totalSpent + spending.amount,
        lastUpdated: new Date(),
      };

      await this.saveCurrency(updatedCurrency);
      this.currency = updatedCurrency;

      // Create transaction record
      const transaction = await this.recordTransaction({
        type: 'spend',
        currency: 'gems',
        amount: spending.amount,
        source: spending.source,
        description: spending.description,
        balanceAfter: newGems,
      });

      logger.info(LogCategories.GAMIFICATION, 'Fashion gems spent', {
        userId,
        amount: spending.amount,
        source: spending.source,
        newBalance: newGems
      });

      return { success: true, newBalance: newGems, transaction };
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to spend gems', error);
      return { success: false, newBalance: 0 };
    }
  }

  // Earn dust particles (from duplicate cards)
  async earnDust(userId: string, amount: number, description: string): Promise<number> {
    try {
      const currency = await this.getCurrency(userId);
      const newDust = currency.dustParticles + amount;
      
      const updatedCurrency: StyleCurrency = {
        ...currency,
        dustParticles: newDust,
        lastUpdated: new Date(),
      };

      await this.saveCurrency(updatedCurrency);
      this.currency = updatedCurrency;

      await this.recordTransaction({
        type: 'earn',
        currency: 'dust',
        amount,
        source: 'duplicate_card',
        description,
        balanceAfter: newDust,
      });

      logger.info(LogCategories.GAMIFICATION, 'Dust particles earned', {
        userId,
        amount,
        newBalance: newDust
      });

      return newDust;
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to earn dust', error);
      return 0;
    }
  }

  // Earn trophy tokens (from battle victories)
  async earnTrophyTokens(userId: string, amount: number, description: string): Promise<number> {
    try {
      const currency = await this.getCurrency(userId);
      const newTrophies = currency.trophyTokens + amount;
      
      const updatedCurrency: StyleCurrency = {
        ...currency,
        trophyTokens: newTrophies,
        lastUpdated: new Date(),
      };

      await this.saveCurrency(updatedCurrency);
      this.currency = updatedCurrency;

      await this.recordTransaction({
        type: 'earn',
        currency: 'trophies',
        amount,
        source: 'battle_victory',
        description,
        balanceAfter: newTrophies,
      });

      logger.info(LogCategories.GAMIFICATION, 'Trophy tokens earned', {
        userId,
        amount,
        newBalance: newTrophies
      });

      return newTrophies;
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to earn trophies', error);
      return 0;
    }
  }

  // Get transaction history
  async getTransactionHistory(userId: string, limit: number = 50): Promise<CurrencyTransaction[]> {
    try {
      const transactionsStr = await AsyncStorage.getItem(`${this.TRANSACTIONS_KEY}_${userId}`);
      if (!transactionsStr) return [];

      const transactions: CurrencyTransaction[] = JSON.parse(transactionsStr);
      return transactions.slice(-limit); // Get last N transactions
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to get transaction history', error);
      return [];
    }
  }

  // Check if user can afford something
  async canAfford(userId: string, costCoins?: number, costGems?: number): Promise<{
    canAfford: boolean;
    missingCoins: number;
    missingGems: number;
  }> {
    try {
      const currency = await this.getCurrency(userId);
      
      const missingCoins = costCoins ? Math.max(0, costCoins - currency.styleCoins) : 0;
      const missingGems = costGems ? Math.max(0, costGems - currency.fashionGems) : 0;
      
      const canAfford = missingCoins === 0 && missingGems === 0;
      
      return { canAfford, missingCoins, missingGems };
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to check affordability', error);
      return { canAfford: false, missingCoins: 0, missingGems: 0 };
    }
  }

  // Private helper methods
  private async saveCurrency(currency: StyleCurrency): Promise<void> {
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(currency));
  }

  private async recordTransaction(transactionData: Omit<CurrencyTransaction, 'id' | 'timestamp'>): Promise<CurrencyTransaction> {
    const transaction: CurrencyTransaction = {
      ...transactionData,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    try {
      const userId = this.currency?.userId || 'unknown';
      const transactionsStr = await AsyncStorage.getItem(`${this.TRANSACTIONS_KEY}_${userId}`);
      const transactions: CurrencyTransaction[] = transactionsStr ? JSON.parse(transactionsStr) : [];
      
      transactions.push(transaction);
      
      // Keep only last 100 transactions to avoid storage bloat
      const recentTransactions = transactions.slice(-100);
      
      await AsyncStorage.setItem(`${this.TRANSACTIONS_KEY}_${userId}`, JSON.stringify(recentTransactions));
      
      return transaction;
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to record transaction', error);
      return transaction;
    }
  }
}

export const currencyService = CurrencyService.getInstance();

// Currency earning utilities
export const CurrencyEarning = {
  // Daily login rewards
  DAILY_LOGIN_COINS: (amount: number): CurrencyEarningSource => ({
    source: 'daily_login',
    amount,
    description: `Daily login bonus: ${amount} coins`
  }),

  DAILY_LOGIN_GEMS: (amount: number): CurrencyEarningSource => ({
    source: 'daily_login',
    amount,
    description: `Daily login bonus: ${amount} gems`
  }),

  // Outfit creation rewards
  OUTFIT_CREATED: (amount: number = 25): CurrencyEarningSource => ({
    source: 'outfit_creation',
    amount,
    description: `Created outfit: +${amount} coins`
  }),

  // Achievement rewards
  ACHIEVEMENT_UNLOCKED: (amount: number, achievementName: string): CurrencyEarningSource => ({
    source: 'achievement',
    amount,
    description: `Achievement "${achievementName}": +${amount} coins`
  }),

  // Battle victory rewards
  BATTLE_VICTORY: (amount: number): CurrencyEarningSource => ({
    source: 'battle_victory',
    amount,
    description: `Battle victory: +${amount} coins`
  }),
};

export const CurrencySpending = {
  // Pack purchases
  STANDARD_PACK: (amount: number = 500): CurrencySpendingSource => ({
    source: 'pack_purchase',
    amount,
    description: `Standard pack purchase: -${amount} coins`
  }),

  PREMIUM_PACK: (amount: number = 100): CurrencySpendingSource => ({
    source: 'pack_purchase',
    amount,
    description: `Premium pack purchase: -${amount} gems`
  }),

  // Card upgrades
  CARD_UPGRADE: (amount: number): CurrencySpendingSource => ({
    source: 'card_upgrade',
    amount,
    description: `Card upgrade: -${amount} coins`
  }),
};