/**
 * Weather Outfit Suggestion Service
 * 
 * Generates cute, practical outfit suggestions based on weather conditions
 * using the cheapest AI model (GPT-5 Nano) with smart caching to minimize costs.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import { costTracker } from '../utils/CostTracker';
import { temperatureUtils } from '../utils/TemperatureUtils';
import type { WeatherData } from './WeatherService';

interface WeatherOutfitSuggestion {
  suggestion: string;
  timestamp: number;
  cacheKey: string;
}

interface SuggestionContext {
  temperature: number;
  condition: string;
  location: string;
  temperatureDisplay: string;
}

export class WeatherOutfitSuggestionService {
  private static readonly CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours
  private static readonly STORAGE_KEY = 'weather_outfit_suggestions_cache';
  private static readonly MAX_CACHE_ENTRIES = 50; // Prevent storage bloat

  /**
   * Get outfit suggestion for weather conditions
   */
  static async getOutfitSuggestion(weatherData: WeatherData): Promise<string> {
    try {
      const context: SuggestionContext = {
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        location: weatherData.location,
        temperatureDisplay: temperatureUtils.formatTemperature(weatherData.temperature)
      };

      // Check cache first
      const cached = await this.getCachedSuggestion(context);
      if (cached) {
        logger.info(LogCategories.API_CALLS, 'Using cached weather outfit suggestion', {
          cacheKey: cached.cacheKey
        });
        return cached.suggestion;
      }

      // Generate new suggestion using cheapest model
      const suggestion = await this.generateSuggestion(context);
      
      if (suggestion) {
        await this.cacheSuggestion(context, suggestion);
        
        // Track cost for this generation
        await costTracker.recordGeneration('gpt-5-nano', true);
        
        logger.info(LogCategories.API_CALLS, 'Generated new weather outfit suggestion', {
          temperature: context.temperature,
          condition: context.condition,
          location: context.location
        });
        
        return suggestion;
      }

      // Fallback to template-based suggestion
      return this.getFallbackSuggestion(context);
      
    } catch (error) {
      logger.error(LogCategories.API_CALLS, 'Failed to get weather outfit suggestion', error as Error);
      
      // Track failed generation
      await costTracker.recordGeneration('gpt-5-nano', false);
      
      // Return fallback
      return this.getFallbackSuggestion({
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        location: weatherData.location,
        temperatureDisplay: temperatureUtils.formatTemperature(weatherData.temperature)
      });
    }
  }

  /**
   * Generate AI suggestion using GPT-5 Nano (cheapest model)
   */
  private static async generateSuggestion(context: SuggestionContext): Promise<string | null> {
    try {
      const apiKey = Constants.expoConfig?.extra?.openAIApiKey;
      if (!apiKey) {
        logger.warn(LogCategories.API_CALLS, 'OpenAI API key not available for outfit suggestions');
        return null;
      }

      const prompt = this.buildPrompt(context);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Using mini as nano equivalent for now
          messages: [
            {
              role: 'system',
              content: 'You are a friendly fashion assistant. Give cute, practical outfit suggestions in 1-2 short sentences. Be concise, fun, and helpful.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 60,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const suggestion = data.choices?.[0]?.message?.content?.trim();
      
      if (suggestion && suggestion.length > 10) {
        return suggestion;
      }
      
      return null;
    } catch (error) {
      logger.error(LogCategories.API_CALLS, 'Failed to generate AI outfit suggestion', error as Error);
      return null;
    }
  }

  /**
   * Build prompt for AI suggestion
   */
  private static buildPrompt(context: SuggestionContext): string {
    return `It's ${context.temperatureDisplay} and ${context.condition} in ${context.location}. Give a cute, practical outfit suggestion in 1-2 sentences. Be friendly and concise!`;
  }

  /**
   * Get cached suggestion if available and not expired
   */
  private static async getCachedSuggestion(context: SuggestionContext): Promise<WeatherOutfitSuggestion | null> {
    try {
      const cacheKey = this.generateCacheKey(context);
      const cached = await this.loadCachedSuggestions();
      const suggestion = cached[cacheKey];

      if (suggestion && (Date.now() - suggestion.timestamp) < this.CACHE_DURATION) {
        return suggestion;
      }

      return null;
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to get cached suggestion', error as Error);
      return null;
    }
  }

  /**
   * Cache suggestion for future use
   */
  private static async cacheSuggestion(context: SuggestionContext, suggestion: string): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(context);
      const cached = await this.loadCachedSuggestions();
      
      cached[cacheKey] = {
        suggestion,
        timestamp: Date.now(),
        cacheKey
      };

      // Limit cache size
      const entries = Object.entries(cached);
      if (entries.length > this.MAX_CACHE_ENTRIES) {
        // Remove oldest entries
        const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toKeep = sorted.slice(-this.MAX_CACHE_ENTRIES);
        const newCache: Record<string, WeatherOutfitSuggestion> = {};
        toKeep.forEach(([key, value]) => {
          newCache[key] = value;
        });
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(newCache));
      } else {
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(cached));
      }

    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to cache suggestion', error as Error);
    }
  }

  /**
   * Generate cache key based on weather context
   */
  private static generateCacheKey(context: SuggestionContext): string {
    // Round temperature to nearest 5 degrees for better cache hits
    const roundedTemp = Math.round(context.temperature / 5) * 5;
    return `${context.condition}_${roundedTemp}_${context.location.toLowerCase().replace(/\s+/g, '_')}`;
  }

  /**
   * Load cached suggestions from storage
   */
  private static async loadCachedSuggestions(): Promise<Record<string, WeatherOutfitSuggestion>> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to load cached suggestions', error as Error);
      return {};
    }
  }

  /**
   * Fallback suggestions when AI generation fails
   */
  private static getFallbackSuggestion(context: SuggestionContext): string {
    const temp = context.temperature;
    const condition = context.condition;

    // Template-based suggestions
    if (temp < 0) {
      return "Bundle up time! Layer up with a warm coat, scarf, and cozy boots. ❄️";
    } else if (temp < 10) {
      return "Perfect sweater weather! Try a cozy cardigan with your favorite jeans. 🧥";
    } else if (temp < 20) {
      return "Light jacket weather! Great for layering with a cute top underneath. 👕";
    } else if (temp < 30) {
      return "Comfortable weather ahead! Perfect for your go-to casual outfit. ☀️";
    } else {
      return "Stay cool and stylish! Light fabrics and breathable clothes are your best friends. 🌞";
    }
  }

  /**
   * Clear cached suggestions (for testing or storage management)
   */
  static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      logger.info(LogCategories.STORAGE, 'Weather outfit suggestions cache cleared');
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to clear suggestions cache', error as Error);
    }
  }

  /**
   * Get cache statistics for debugging
   */
  static async getCacheStats(): Promise<{
    totalEntries: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  }> {
    try {
      const cached = await this.loadCachedSuggestions();
      const entries = Object.values(cached);
      
      if (entries.length === 0) {
        return { totalEntries: 0 };
      }

      const timestamps = entries.map(e => e.timestamp);
      return {
        totalEntries: entries.length,
        oldestEntry: new Date(Math.min(...timestamps)),
        newestEntry: new Date(Math.max(...timestamps))
      };
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to get cache stats', error as Error);
      return { totalEntries: 0 };
    }
  }
}