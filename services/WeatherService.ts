import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

export interface WeatherData {
  temperature: number;
  condition: 'sunny' | 'rainy' | 'cloudy' | 'snowy' | 'windy' | 'moderate';
  humidity: number;
  timestamp: number;
  location: string;
  description: string;
}

export interface WeatherContext {
  temperature: number;
  condition: string;
  description: string;
  appropriateFor: string[];
}

export class WeatherService {
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private static readonly STORAGE_KEY = 'stylemuse_weather_cache';
  private static readonly LOCATION_TIMEOUT = 5000; // 5 seconds
  private static readonly NETWORK_TIMEOUT = 5000; // 5 seconds
  
  /**
   * Get current weather with intelligent caching and graceful fallbacks
   */
  static async getCurrentWeather(): Promise<WeatherData | null> {
    try {
      console.log('🌤️ WeatherService: Fetching current weather...');
      
      // Check cache first
      const cached = await this.getCachedWeather();
      if (cached && !this.isCacheExpired(cached)) {
        console.log('🌤️ WeatherService: Using cached weather data');
        return cached;
      }
      
      // Get fresh weather data
      const location = await this.getCurrentLocation();
      if (!location) {
        console.warn('🌤️ WeatherService: Could not get location, using fallback');
        return null;
      }
      
      const weather = await this.fetchWeatherData(location);
      if (weather) {
        await this.cacheWeatherData(weather);
        console.log('🌤️ WeatherService: Fresh weather data cached');
      }
      
      return weather;
    } catch (error) {
      console.warn('🌤️ WeatherService: Weather fetch failed, using moderate fallback:', error);
      return null; // Graceful fallback to 'moderate'
    }
  }
  
  /**
   * Convert weather data to outfit context
   */
  static getWeatherContext(weather: WeatherData): WeatherContext {
    const temp = weather.temperature;
    const condition = weather.condition;
    
    // Temperature-based outfit suggestions
    let appropriateFor: string[] = [];
    if (temp < 0) {
      appropriateFor = ['heavy_jacket', 'warm_layers', 'boots', 'gloves'];
    } else if (temp < 10) {
      appropriateFor = ['jacket', 'long_sleeves', 'closed_shoes'];
    } else if (temp < 20) {
      appropriateFor = ['light_jacket', 'layering', 'versatile'];
    } else if (temp < 30) {
      appropriateFor = ['light_clothing', 'breathable_fabric', 'casual'];
    } else {
      appropriateFor = ['minimal_clothing', 'summer_wear', 'sandals'];
    }
    
    // Weather condition adjustments
    if (condition === 'rainy') {
      appropriateFor.push('waterproof', 'closed_shoes', 'avoid_light_colors');
    } else if (condition === 'sunny') {
      appropriateFor.push('sunglasses', 'hat', 'light_colors');
    } else if (condition === 'windy') {
      appropriateFor.push('fitted_clothing', 'avoid_loose_fabrics');
    }
    
    return {
      temperature: temp,
      condition: condition,
      description: this.getWeatherDescription(weather),
      appropriateFor
    };
  }
  
  /**
   * Get human-readable weather description for outfit suggestions
   */
  private static getWeatherDescription(weather: WeatherData): string {
    const temp = weather.temperature;
    const condition = weather.condition;
    
    if (temp < 0) return `Very cold (${temp}°C) - bundle up!`;
    if (temp < 10) return `Cold (${temp}°C) - wear layers`;
    if (temp < 20) return `Cool (${temp}°C) - light jacket recommended`;
    if (temp < 30) return `Warm (${temp}°C) - comfortable weather`;
    return `Hot (${temp}°C) - stay cool!`;
  }
  
  /**
   * Get current location with timeout and permission handling
   */
  private static async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      // Check permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('🌤️ WeatherService: Location permission denied');
        return null;
      }
      
      // Get location with timeout
      const location = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Location timeout')), this.LOCATION_TIMEOUT)
        )
      ]);
      
      return location;
    } catch (error) {
      console.warn('🌤️ WeatherService: Failed to get location:', error);
      return null;
    }
  }
  
  /**
   * Fetch weather data from OpenWeather API
   */
  private static async fetchWeatherData(location: Location.LocationObject): Promise<WeatherData | null> {
    try {
      const apiKey = Constants.expoConfig?.extra?.openWeatherApiKey;
      if (!apiKey) {
        console.warn('🌤️ WeatherService: OpenWeather API key not found');
        return null;
      }
      
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.coords.latitude}&lon=${location.coords.longitude}&appid=${apiKey}&units=metric`;
      
      const response = await Promise.race([
        fetch(url),
        new Promise<Response>((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), this.NETWORK_TIMEOUT)
        )
      ]);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        temperature: Math.round(data.main.temp),
        condition: this.mapWeatherCondition(data.weather[0].main),
        humidity: data.main.humidity,
        timestamp: Date.now(),
        location: data.name || 'Unknown',
        description: data.weather[0].description
      };
    } catch (error) {
      console.warn('🌤️ WeatherService: Failed to fetch weather data:', error);
      return null;
    }
  }
  
  /**
   * Map OpenWeather conditions to our simplified conditions
   */
  private static mapWeatherCondition(condition: string): WeatherData['condition'] {
    const lowerCondition = condition.toLowerCase();
    
    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      return 'rainy';
    }
    if (lowerCondition.includes('cloud')) {
      return 'cloudy';
    }
    if (lowerCondition.includes('snow')) {
      return 'snowy';
    }
    if (lowerCondition.includes('wind')) {
      return 'windy';
    }
    if (lowerCondition.includes('clear') || lowerCondition.includes('sun')) {
      return 'sunny';
    }
    
    return 'moderate'; // Default fallback
  }
  
  /**
   * Cache weather data in AsyncStorage
   */
  private static async cacheWeatherData(weather: WeatherData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(weather));
    } catch (error) {
      console.warn('🌤️ WeatherService: Failed to cache weather data:', error);
    }
  }
  
  /**
   * Get cached weather data
   */
  private static async getCachedWeather(): Promise<WeatherData | null> {
    try {
      const cached = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!cached) return null;
      
      return JSON.parse(cached) as WeatherData;
    } catch (error) {
      console.warn('🌤️ WeatherService: Failed to read cached weather:', error);
      return null;
    }
  }
  
  /**
   * Check if cached weather data is expired
   */
  private static isCacheExpired(weather: WeatherData): boolean {
    return Date.now() - weather.timestamp > this.CACHE_DURATION;
  }
  
  /**
   * Clear weather cache (useful for testing)
   */
  static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('🌤️ WeatherService: Cache cleared');
    } catch (error) {
      console.warn('🌤️ WeatherService: Failed to clear cache:', error);
    }
  }
  
  /**
   * Get weather emoji for UI display
   */
  static getWeatherEmoji(condition: WeatherData['condition']): string {
    switch (condition) {
      case 'sunny': return '☀️';
      case 'cloudy': return '☁️';
      case 'rainy': return '🌧️';
      case 'snowy': return '❄️';
      case 'windy': return '💨';
      default: return '🌤️';
    }
  }
}