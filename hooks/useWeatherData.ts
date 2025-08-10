import { useState, useEffect, useCallback } from 'react';
import { WeatherService, WeatherData, WeatherContext } from '../services/WeatherService';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import { temperatureUtils } from '../utils/TemperatureUtils';

export interface UseWeatherDataReturn {
  weatherData: WeatherData | null;
  weatherContext: WeatherContext | null;
  isLoading: boolean;
  error: string | null;
  refreshWeather: () => Promise<void>;
  hasWeatherData: boolean;
}

/**
 * React hook for managing weather data with caching and error handling
 */
export const useWeatherData = (): UseWeatherDataReturn => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherContext, setWeatherContext] = useState<WeatherContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch weather data with error handling and logging
   */
  const fetchWeatherData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const startTime = logger.startPerformanceTracking('weather-fetch');
    
    try {
      logger.info(LogCategories.API_CALLS, 'Fetching weather data');
      
      const data = await WeatherService.getCurrentWeather();
      
      if (data) {
        setWeatherData(data);
        
        // Get weather context with outfit suggestions (async)
        const context = await WeatherService.getWeatherContext(data);
        setWeatherContext(context);
        
        // Initialize temperature unit based on country if available
        if (data.country) {
          await temperatureUtils.initialize(data.country);
        }
        
        logger.info(LogCategories.API_CALLS, 'Weather data fetched successfully', {
          temperature: data.temperature,
          condition: data.condition,
          location: data.location,
          country: data.country,
          cached: Date.now() - data.timestamp > 1000 // Was it from cache?
        });
      } else {
        // Graceful fallback - no error, just no weather data
        setWeatherData(null);
        setWeatherContext(null);
        
        logger.warn(LogCategories.API_CALLS, 'Weather data unavailable, using fallback');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown weather error';
      setError(errorMessage);
      setWeatherData(null);
      setWeatherContext(null);
      
      logger.error(LogCategories.API_CALLS, 'Weather fetch failed', err as Error, {
        errorMessage
      });
    } finally {
      setIsLoading(false);
      startTime();
    }
  }, []);

  /**
   * Refresh weather data (force fetch)
   */
  const refreshWeather = useCallback(async () => {
    logger.info(LogCategories.USER_ACTION, 'User triggered weather refresh');
    
    // Clear cache to force fresh fetch
    await WeatherService.clearCache();
    await fetchWeatherData();
  }, [fetchWeatherData]);

  /**
   * Initialize weather data on mount
   */
  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  return {
    weatherData,
    weatherContext,
    isLoading,
    error,
    refreshWeather,
    hasWeatherData: weatherData !== null,
  };
};