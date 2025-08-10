/**
 * Image Recovery Service
 * Self-healing system for missing or broken images after app updates
 * Automatically detects and repairs broken image references
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import { DailyWeatherSceneService } from './DailyWeatherSceneService';
import { WeatherService } from './WeatherService';
import { Image } from 'react-native';

export interface ImageRecoveryReport {
  checkedAt: string;
  issuesFound: number;
  issuesFixed: number;
  details: RecoveryDetail[];
}

export interface RecoveryDetail {
  type: 'weather_scene' | 'wardrobe_item' | 'profile_image';
  issue: string;
  resolution: string;
  success: boolean;
}

class ImageRecoveryService {
  private static instance: ImageRecoveryService;
  private readonly STORAGE_KEY = 'image_recovery_last_check';
  private readonly CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  private isRecovering = false;
  private lastCheckTime: number = 0;

  static getInstance(): ImageRecoveryService {
    if (!ImageRecoveryService.instance) {
      ImageRecoveryService.instance = new ImageRecoveryService();
    }
    return ImageRecoveryService.instance;
  }

  /**
   * Check and recover broken images on app launch
   * Only runs once per session or after app updates
   */
  async checkAndRecoverOnLaunch(): Promise<ImageRecoveryReport | null> {
    try {
      // Prevent multiple simultaneous recovery attempts
      if (this.isRecovering) {
        logger.info(LogCategories.STORAGE, 'Image recovery already in progress, skipping');
        return null;
      }

      // Check if we've already run recently (prevent infinite loops)
      const now = Date.now();
      if (now - this.lastCheckTime < 60000) { // Don't run more than once per minute
        logger.info(LogCategories.STORAGE, 'Image recovery ran recently, skipping');
        return null;
      }

      this.isRecovering = true;
      this.lastCheckTime = now;

      // Check if we need to run based on stored timestamp
      const shouldRun = await this.shouldRunRecovery();
      if (!shouldRun) {
        this.isRecovering = false;
        return null;
      }

      logger.info(LogCategories.STORAGE, 'Starting image recovery check');
      
      const report: ImageRecoveryReport = {
        checkedAt: new Date().toISOString(),
        issuesFound: 0,
        issuesFixed: 0,
        details: []
      };

      // Check and recover different image types
      await this.recoverWeatherSceneImages(report);
      await this.checkImageCache(report);
      
      // Save last check time
      await AsyncStorage.setItem(this.STORAGE_KEY, now.toString());
      
      this.isRecovering = false;

      if (report.issuesFound > 0) {
        logger.info(LogCategories.STORAGE, 'Image recovery completed', {
          found: report.issuesFound,
          fixed: report.issuesFixed
        });
      }

      return report;
      
    } catch (error) {
      this.isRecovering = false;
      logger.error(LogCategories.STORAGE, 'Image recovery failed', error as Error);
      return null;
    }
  }

  /**
   * Determine if recovery should run
   */
  private async shouldRunRecovery(): Promise<boolean> {
    try {
      // Check for app version change (indicates update)
      const lastVersion = await AsyncStorage.getItem('app_version');
      const currentVersion = '1.0.0'; // You could get this from package.json
      
      if (lastVersion !== currentVersion) {
        await AsyncStorage.setItem('app_version', currentVersion);
        logger.info(LogCategories.STORAGE, 'App version changed, running recovery', {
          from: lastVersion,
          to: currentVersion
        });
        return true;
      }

      // Check last run time
      const lastCheck = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!lastCheck) {
        return true; // First run
      }

      const timeSinceLastCheck = Date.now() - parseInt(lastCheck);
      return timeSinceLastCheck > this.CHECK_INTERVAL;
      
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to check recovery conditions', error as Error);
      return false; // Default to not running on error
    }
  }

  /**
   * Recover weather scene images
   */
  private async recoverWeatherSceneImages(report: ImageRecoveryReport): Promise<void> {
    try {
      // Check today's weather scene
      const storedScenes = await AsyncStorage.getItem('daily_weather_scenes');
      if (!storedScenes) {
        return; // No scenes to recover
      }

      const scenes = JSON.parse(storedScenes);
      const today = new Date().toISOString().split('T')[0];
      const todaysScene = scenes[today];

      if (todaysScene) {
        // Test if image URL is still valid
        const isValid = await this.validateImageUrl(todaysScene.imageUrl);
        
        if (!isValid) {
          report.issuesFound++;
          
          const detail: RecoveryDetail = {
            type: 'weather_scene',
            issue: 'Today\'s style scene image is unavailable',
            resolution: 'Regenerating weather scene',
            success: false
          };

          try {
            // Clear today's cache to force regeneration
            await DailyWeatherSceneService.clearTodaysCache();
            
            // Get weather data and regenerate
            const weatherData = await WeatherService.getCurrentWeather();
            if (weatherData) {
              const styleDNA = await AsyncStorage.getItem('style_dna');
              const gender = await AsyncStorage.getItem('selected_gender');
              
              const newScene = await DailyWeatherSceneService.getTodaysWeatherScene(
                weatherData,
                styleDNA ? JSON.parse(styleDNA) : undefined,
                gender as 'male' | 'female' | 'nonbinary' | null
              );
              
              if (newScene) {
                detail.success = true;
                detail.resolution = 'Successfully regenerated weather scene';
                report.issuesFixed++;
              }
            }
          } catch (error) {
            logger.error(LogCategories.STORAGE, 'Failed to regenerate weather scene', error as Error);
          }

          report.details.push(detail);
        }
      } else {
        // No scene for today, try to generate one
        logger.info(LogCategories.STORAGE, 'No weather scene for today, attempting to generate');
        
        try {
          const weatherData = await WeatherService.getCurrentWeather();
          if (weatherData) {
            const styleDNA = await AsyncStorage.getItem('style_dna');
            const gender = await AsyncStorage.getItem('selected_gender');
            
            await DailyWeatherSceneService.getTodaysWeatherScene(
              weatherData,
              styleDNA ? JSON.parse(styleDNA) : undefined,
              gender as 'male' | 'female' | 'nonbinary' | null
            );
            
            report.details.push({
              type: 'weather_scene',
              issue: 'No weather scene for today',
              resolution: 'Generated new weather scene',
              success: true
            });
          }
        } catch (error) {
          logger.error(LogCategories.STORAGE, 'Failed to generate today\'s weather scene', error as Error);
        }
      }
      
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to recover weather scene images', error as Error);
    }
  }

  /**
   * Validate if an image URL is still accessible
   */
  private async validateImageUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!url || url === 'undefined' || url === 'null') {
        resolve(false);
        return;
      }

      // Use Image.prefetch to check if image is loadable
      Image.prefetch(url)
        .then(() => {
          resolve(true);
        })
        .catch((error) => {
          logger.warn(LogCategories.STORAGE, 'Image validation failed', { url, error: error.message });
          resolve(false);
        });

      // Timeout after 5 seconds
      setTimeout(() => {
        resolve(false);
      }, 5000);
    });
  }

  /**
   * Check and clear stale image cache
   */
  private async checkImageCache(report: ImageRecoveryReport): Promise<void> {
    try {
      // Check for stale regeneration counters
      const keys = await AsyncStorage.getAllKeys();
      const regenerationKeys = keys.filter(key => key.startsWith('weather_scene_regenerations_'));
      
      // Clean up old regeneration counters (older than 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      for (const key of regenerationKeys) {
        const dateStr = key.replace('weather_scene_regenerations_', '');
        const keyDate = new Date(dateStr);
        
        if (keyDate < sevenDaysAgo) {
          await AsyncStorage.removeItem(key);
          logger.info(LogCategories.STORAGE, 'Cleaned up old regeneration counter', { date: dateStr });
        }
      }
      
      // Reset today's regeneration counter if needed (for debugging)
      if (__DEV__) {
        const today = new Date().toISOString().split('T')[0];
        const todayKey = `weather_scene_regenerations_${today}`;
        const currentCount = await AsyncStorage.getItem(todayKey);
        
        if (currentCount && parseInt(currentCount) >= 3) {
          // In dev mode, allow resetting if stuck
          logger.info(LogCategories.STORAGE, 'DEV: Resetting regeneration counter for today');
          await AsyncStorage.setItem(todayKey, '0');
        }
      }
      
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to check image cache', error as Error);
    }
  }

  /**
   * Force recovery check (for debugging)
   */
  async forceRecoveryCheck(): Promise<ImageRecoveryReport | null> {
    if (__DEV__) {
      logger.info(LogCategories.STORAGE, 'Forcing image recovery check');
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      this.lastCheckTime = 0;
      return this.checkAndRecoverOnLaunch();
    }
    return null;
  }

  /**
   * Get recovery statistics
   */
  async getRecoveryStats(): Promise<{
    lastCheck: string | null;
    nextCheck: string;
    isRecovering: boolean;
  }> {
    const lastCheck = await AsyncStorage.getItem(this.STORAGE_KEY);
    const nextCheckTime = lastCheck 
      ? new Date(parseInt(lastCheck) + this.CHECK_INTERVAL).toISOString()
      : 'Due now';
    
    return {
      lastCheck: lastCheck ? new Date(parseInt(lastCheck)).toISOString() : null,
      nextCheck: nextCheckTime,
      isRecovering: this.isRecovering
    };
  }
}

export const imageRecoveryService = ImageRecoveryService.getInstance();