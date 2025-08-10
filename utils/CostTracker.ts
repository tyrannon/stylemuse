/**
 * Cost Tracking Utility for AI Outfit Generation
 * 
 * Tracks generation costs and usage statistics for monitoring
 * and future token-based pricing implementation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './DebugLogger';
import { LogCategories } from '../constants/LogCategories';

export interface GenerationRecord {
  id: string;
  model: 'gpt-5-nano' | 'gpt-5-mini' | 'gpt-5';
  cost: number;
  timestamp: Date;
  successful: boolean;
  type?: 'outfit' | 'weather-scene' | 'suggestion'; // Track different generation types
  imageUrl?: string; // Store image URL if available
  metadata?: {
    outfitId?: string;
    weatherData?: any;
    description?: string;
  };
}

export interface UsageStats {
  totalGenerations: number;
  totalCost: number;
  costByModel: Record<string, number>;
  generationsByModel: Record<string, number>;
  dailyCost: number;
  weeklyCost: number;
  monthlyCost: number;
  lastGeneration?: Date;
}

// Model costs (same as in multiModelOutfitGenerator.ts)
const MODEL_COSTS = {
  'gpt-5-nano': 0.02,
  'gpt-5-mini': 0.05,
  'gpt-5': 0.15,
} as const;

const STORAGE_KEY = 'cost_tracking_data';

export class CostTracker {
  private static instance: CostTracker;
  
  private constructor() {}

  static getInstance(): CostTracker {
    if (!CostTracker.instance) {
      CostTracker.instance = new CostTracker();
    }
    return CostTracker.instance;
  }

  /**
   * Record a new generation event
   */
  async recordGeneration(
    model: 'gpt-5-nano' | 'gpt-5-mini' | 'gpt-5',
    successful: boolean = true,
    options?: {
      type?: 'outfit' | 'weather-scene' | 'suggestion';
      imageUrl?: string;
      metadata?: {
        outfitId?: string;
        weatherData?: any;
        description?: string;
      };
    }
  ): Promise<void> {
    try {
      const cost = MODEL_COSTS[model] || 0;
      const record: GenerationRecord = {
        id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        model,
        cost,
        timestamp: new Date(),
        successful,
        type: options?.type,
        imageUrl: options?.imageUrl,
        metadata: options?.metadata,
      };

      const existingData = await this.loadGenerationData();
      const updatedData = [...existingData, record];

      // Keep only last 1000 records to prevent storage bloat
      if (updatedData.length > 1000) {
        updatedData.splice(0, updatedData.length - 1000);
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

      logger.info(LogCategories.ANALYTICS, 'Generation cost recorded', {
        model,
        cost,
        successful,
      });
    } catch (error) {
      logger.error(LogCategories.ANALYTICS, 'Failed to record generation cost', error as Error);
    }
  }

  /**
   * Get current usage statistics
   */
  async getUsageStats(): Promise<UsageStats> {
    try {
      const data = await this.loadGenerationData();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats: UsageStats = {
        totalGenerations: data.length,
        totalCost: data.reduce((sum, record) => sum + record.cost, 0),
        costByModel: {},
        generationsByModel: {},
        dailyCost: 0,
        weeklyCost: 0,
        monthlyCost: 0,
        lastGeneration: data.length > 0 ? new Date(data[data.length - 1].timestamp) : undefined,
      };

      // Calculate stats by model and time period
      data.forEach(record => {
        const recordDate = new Date(record.timestamp);
        
        // By model
        stats.costByModel[record.model] = (stats.costByModel[record.model] || 0) + record.cost;
        stats.generationsByModel[record.model] = (stats.generationsByModel[record.model] || 0) + 1;

        // By time period
        if (recordDate >= today) {
          stats.dailyCost += record.cost;
        }
        if (recordDate >= weekAgo) {
          stats.weeklyCost += record.cost;
        }
        if (recordDate >= monthAgo) {
          stats.monthlyCost += record.cost;
        }
      });

      return stats;
    } catch (error) {
      logger.error(LogCategories.ANALYTICS, 'Failed to get usage stats', error as Error);
      return {
        totalGenerations: 0,
        totalCost: 0,
        costByModel: {},
        generationsByModel: {},
        dailyCost: 0,
        weeklyCost: 0,
        monthlyCost: 0,
      };
    }
  }

  /**
   * Get generation history with images
   */
  async getGenerationHistory(limit?: number): Promise<GenerationRecord[]> {
    try {
      const data = await this.loadGenerationData();
      const sorted = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return limit ? sorted.slice(0, limit) : sorted;
    } catch (error) {
      logger.error(LogCategories.ANALYTICS, 'Failed to get generation history', error as Error);
      return [];
    }
  }

  /**
   * Get only image generations (with URLs)
   */
  async getImageGenerations(limit?: number): Promise<GenerationRecord[]> {
    try {
      const history = await this.getGenerationHistory();
      const images = history.filter(record => record.imageUrl && record.successful);
      return limit ? images.slice(0, limit) : images;
    } catch (error) {
      logger.error(LogCategories.ANALYTICS, 'Failed to get image generations', error as Error);
      return [];
    }
  }

  /**
   * Reset all tracking data
   */
  async resetData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      logger.info(LogCategories.ANALYTICS, 'Cost tracking data reset');
    } catch (error) {
      logger.error(LogCategories.ANALYTICS, 'Failed to reset cost tracking data', error as Error);
    }
  }

  /**
   * Load generation data from storage
   */
  private async loadGenerationData(): Promise<GenerationRecord[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        return parsed.map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp),
        }));
      }
      return [];
    } catch (error) {
      logger.error(LogCategories.ANALYTICS, 'Failed to load generation data', error as Error);
      return [];
    }
  }
}

// Export singleton instance
export const costTracker = CostTracker.getInstance();