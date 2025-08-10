/**
 * Daily Weather Scene Image Service
 * 
 * Generates one beautiful weather scene per day featuring a person in weather-appropriate
 * outfit based on StyleDNA. Uses cheapest image model with daily caching to minimize costs.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import { costTracker } from '../utils/CostTracker';
import { temperatureUtils } from '../utils/TemperatureUtils';
import type { WeatherData } from './WeatherService';

export interface DailyWeatherScene {
  imageUrl: string;
  date: string; // YYYY-MM-DD format
  prompt: string;
  weatherData: WeatherData;
  styleDNA?: any;
  timestamp: number;
}

interface WeatherSceneContext {
  weather: WeatherData;
  styleDNA?: any;
  temperatureDisplay: string;
  dateKey: string;
  selectedGender?: 'male' | 'female' | 'nonbinary' | null;
}

export class DailyWeatherSceneService {
  private static readonly STORAGE_KEY = 'daily_weather_scenes';
  private static readonly MAX_STORED_SCENES = 30; // Keep 30 days of scenes

  /**
   * Get today's weather scene (cached or generate new)
   */
  static async getTodaysWeatherScene(
    weatherData: WeatherData, 
    styleDNA?: any,
    selectedGender?: 'male' | 'female' | 'nonbinary' | null
  ): Promise<DailyWeatherScene | null> {
    try {
      const today = this.getTodayKey();
      const cached = await this.getCachedScene(today);

      if (cached) {
        logger.info(LogCategories.API_CALLS, 'Using cached daily weather scene', {
          date: today
        });
        return cached;
      }

      // Generate new scene for today
      logger.info(LogCategories.API_CALLS, 'Generating new daily weather scene', {
        date: today,
        location: weatherData.location,
        temperature: weatherData.temperature,
        condition: weatherData.condition
      });

      const scene = await this.generateWeatherScene({
        weather: weatherData,
        styleDNA,
        temperatureDisplay: temperatureUtils.formatTemperature(weatherData.temperature),
        dateKey: today,
        selectedGender
      });

      if (scene) {
        await this.cacheScene(scene);
        
        // Track cost for this generation
        await costTracker.recordGeneration('gpt-5-nano', true, {
          type: 'weather-scene',
          imageUrl: scene.imageUrl,
          metadata: {
            weatherData: weatherData,
            description: `Daily scene for ${weatherData.location}`
          }
        });

        return scene;
      }

      return null;
    } catch (error) {
      logger.error(LogCategories.API_CALLS, 'Failed to get daily weather scene', error as Error);
      
      // Track failed generation
      await costTracker.recordGeneration('gpt-5-nano', false, {
        type: 'weather-scene'
      });
      
      return null;
    }
  }

  /**
   * Generate weather scene using DALL-E 3 (cheapest image model)
   */
  private static async generateWeatherScene(context: WeatherSceneContext): Promise<DailyWeatherScene | null> {
    try {
      const apiKey = Constants.expoConfig?.extra?.openAIApiKey;
      if (!apiKey) {
        logger.warn(LogCategories.API_CALLS, 'OpenAI API key not available for scene generation');
        return null;
      }

      const prompt = this.buildScenePrompt(context);
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard', // Use standard quality for cost optimization
        }),
      });

      if (!response.ok) {
        throw new Error(`DALL-E API error: ${response.status}`);
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;

      if (imageUrl) {
        return {
          imageUrl,
          date: context.dateKey,
          prompt,
          weatherData: context.weather,
          styleDNA: context.styleDNA,
          timestamp: Date.now()
        };
      }

      return null;
    } catch (error) {
      logger.error(LogCategories.API_CALLS, 'Failed to generate weather scene', error as Error);
      return null;
    }
  }

  /**
   * Build creative prompt for weather scene
   */
  private static buildScenePrompt(context: WeatherSceneContext): string {
    const { weather, styleDNA, temperatureDisplay, selectedGender } = context;
    
    // Gender-aware person description
    let personDescription = 'fashionable person';
    if (selectedGender === 'male') {
      personDescription = 'stylish man';
    } else if (selectedGender === 'female') {
      personDescription = 'fashionable woman';
    } else if (selectedGender === 'nonbinary') {
      personDescription = 'stylish nonbinary person';
    }
    
    // Base scene description with gender awareness
    let prompt = `Beautiful, stylized illustration of a ${personDescription} in ${weather.location} `;
    prompt += `on a ${weather.condition} day with ${temperatureDisplay} weather. `;

    // Weather-specific styling
    switch (weather.condition) {
      case 'sunny':
        prompt += 'Bright, warm lighting with clear blue skies and sunshine. ';
        break;
      case 'rainy':
        prompt += 'Moody atmosphere with gentle rain, wet streets reflecting lights. ';
        break;
      case 'cloudy':
        prompt += 'Soft, diffused lighting with interesting cloud formations. ';
        break;
      case 'snowy':
        prompt += 'Winter wonderland with falling snow and cozy atmosphere. ';
        break;
      case 'windy':
        prompt += 'Dynamic scene with movement, flowing fabrics and leaves. ';
        break;
      default:
        prompt += 'Pleasant, comfortable weather with natural lighting. ';
    }

    // Outfit based on temperature and StyleDNA
    prompt += this.getOutfitDescription(weather.temperature, styleDNA, selectedGender);

    // Artistic style
    prompt += ' Modern illustration style, vibrant colors, fashionable and appealing. ';
    prompt += 'Person should look confident and stylish. Urban or city setting. ';
    prompt += 'High quality, detailed, Instagram-worthy aesthetic.';

    return prompt;
  }

  /**
   * Get outfit description based on temperature and style preferences
   */
  private static getOutfitDescription(
    temperature: number, 
    styleDNA?: any, 
    selectedGender?: 'male' | 'female' | 'nonbinary' | null
  ): string {
    // Gender-aware pronoun selection
    let pronoun = 'they';
    let possessive = 'their';
    if (selectedGender === 'male') {
      pronoun = 'he';
      possessive = 'his';
    } else if (selectedGender === 'female') {
      pronoun = 'she';
      possessive = 'her';
    }
    
    let outfit = `The person is wearing `;

    // Temperature-based outfit with gender considerations
    if (temperature < 0) {
      outfit += 'a warm winter coat, cozy scarf, stylish boots, and layered clothing. ';
    } else if (temperature < 10) {
      if (selectedGender === 'female') {
        outfit += 'a chic jacket or elegant sweater, fashionable pants or skirt, and stylish boots or closed-toe shoes. ';
      } else if (selectedGender === 'male') {
        outfit += 'a smart jacket or pullover, well-fitted pants, and polished shoes or boots. ';
      } else {
        outfit += 'a fashionable jacket or sweater, comfortable pants, and closed-toe shoes. ';
      }
    } else if (temperature < 20) {
      if (selectedGender === 'female') {
        outfit += 'a light blazer or cardigan, trendy blouse or top, and versatile bottoms or dress. ';
      } else if (selectedGender === 'male') {
        outfit += 'a casual blazer or light sweater, crisp shirt, and comfortable chinos or jeans. ';
      } else {
        outfit += 'a light jacket or cardigan, trendy top, and versatile bottoms. ';
      }
    } else if (temperature < 30) {
      outfit += 'comfortable casual wear, a stylish top, and breathable fabrics. ';
    } else {
      outfit += 'light, airy clothing, summer fabrics, and open footwear. ';
    }

    // Add StyleDNA influence if available
    if (styleDNA?.dominantStyles) {
      const styles = Array.isArray(styleDNA.dominantStyles) 
        ? styleDNA.dominantStyles 
        : [styleDNA.dominantStyles];
      
      if (styles.includes('minimalist') || styles.includes('classic')) {
        outfit += 'Clean lines, neutral colors, timeless pieces. ';
      } else if (styles.includes('bohemian') || styles.includes('romantic')) {
        outfit += 'Flowing fabrics, artistic patterns, creative styling. ';
      } else if (styles.includes('edgy') || styles.includes('contemporary')) {
        outfit += 'Bold choices, modern cuts, statement pieces. ';
      } else if (styles.includes('casual') || styles.includes('comfortable')) {
        outfit += 'Relaxed fit, practical yet stylish, everyday chic. ';
      }
    }

    return outfit;
  }

  /**
   * Get cached scene for specific date
   */
  private static async getCachedScene(dateKey: string): Promise<DailyWeatherScene | null> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const scenes: Record<string, DailyWeatherScene> = JSON.parse(stored);
        return scenes[dateKey] || null;
      }
      return null;
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to get cached scene', error as Error);
      return null;
    }
  }

  /**
   * Cache scene with daily cleanup
   */
  private static async cacheScene(scene: DailyWeatherScene): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      const scenes: Record<string, DailyWeatherScene> = stored ? JSON.parse(stored) : {};
      
      scenes[scene.date] = scene;

      // Clean up old scenes (keep only last 30 days)
      const sortedDates = Object.keys(scenes).sort().reverse();
      if (sortedDates.length > this.MAX_STORED_SCENES) {
        const toDelete = sortedDates.slice(this.MAX_STORED_SCENES);
        toDelete.forEach(date => delete scenes[date]);
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(scenes));
      
      logger.info(LogCategories.STORAGE, 'Daily weather scene cached', {
        date: scene.date,
        totalScenes: Object.keys(scenes).length
      });
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to cache scene', error as Error);
    }
  }

  /**
   * Get all previous scenes for gallery
   */
  static async getPreviousScenes(limit?: number): Promise<DailyWeatherScene[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const scenes: Record<string, DailyWeatherScene> = JSON.parse(stored);
        const sortedScenes = Object.values(scenes)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        return limit ? sortedScenes.slice(0, limit) : sortedScenes;
      }
      return [];
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to get previous scenes', error as Error);
      return [];
    }
  }

  /**
   * Get today's date key (YYYY-MM-DD)
   */
  private static getTodayKey(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Clear all cached scenes (for testing)
   */
  static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      logger.info(LogCategories.STORAGE, 'Daily weather scenes cache cleared');
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to clear scenes cache', error as Error);
    }
  }

  /**
   * Clear only today's cached scene (for regeneration)
   */
  static async clearTodaysCache(): Promise<void> {
    try {
      const today = this.getTodayKey();
      const cached = await this.loadCachedSuggestions();
      
      if (cached[today]) {
        delete cached[today];
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(cached));
        logger.info(LogCategories.STORAGE, 'Today\'s weather scene cache cleared for regeneration', {
          date: today
        });
      }
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to clear today\'s scene cache', error as Error);
    }
  }

  /**
   * Load cached scenes (helper method for clearTodaysCache)
   */
  private static async loadCachedSuggestions(): Promise<Record<string, DailyWeatherScene>> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to load cached scenes', error as Error);
      return {};
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    totalScenes: number;
    oldestScene?: string;
    newestScene?: string;
    totalSize?: number;
  }> {
    try {
      const scenes = await this.getPreviousScenes();
      if (scenes.length === 0) {
        return { totalScenes: 0 };
      }

      const dates = scenes.map(s => s.date).sort();
      
      return {
        totalScenes: scenes.length,
        oldestScene: dates[0],
        newestScene: dates[dates.length - 1],
        totalSize: scenes.reduce((size, scene) => size + JSON.stringify(scene).length, 0)
      };
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to get cache stats', error as Error);
      return { totalScenes: 0 };
    }
  }
}