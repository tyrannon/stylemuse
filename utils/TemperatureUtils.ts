/**
 * Temperature Unit Utilities
 * 
 * Handles temperature unit conversions and country-based default detection.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './DebugLogger';
import { LogCategories } from '../constants/LogCategories';

export type TemperatureUnit = 'celsius' | 'fahrenheit';

// Countries that primarily use Fahrenheit
const FAHRENHEIT_COUNTRIES = [
  'US', 'USA', 'United States',
  'BZ', 'Belize',
  'KY', 'Cayman Islands',
  'PW', 'Palau',
  'FM', 'Federated States of Micronesia',
  'MH', 'Marshall Islands'
];

const STORAGE_KEY = 'temperature_unit_preference';

export class TemperatureUtils {
  private static instance: TemperatureUtils;
  private currentUnit: TemperatureUnit = 'celsius';
  private isInitialized = false;

  private constructor() {}

  static getInstance(): TemperatureUtils {
    if (!TemperatureUtils.instance) {
      TemperatureUtils.instance = new TemperatureUtils();
    }
    return TemperatureUtils.instance;
  }

  /**
   * Initialize temperature unit from storage or auto-detect
   */
  async initialize(countryCode?: string): Promise<TemperatureUnit> {
    if (this.isInitialized) {
      return this.currentUnit;
    }

    try {
      // First, check if user has a saved preference
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'celsius' || saved === 'fahrenheit')) {
        this.currentUnit = saved as TemperatureUnit;
        logger.info(LogCategories.USER_ACTION, 'Temperature unit loaded from storage', {
          unit: this.currentUnit
        });
      } else if (countryCode) {
        // Auto-detect based on country
        this.currentUnit = this.getDefaultUnitForCountry(countryCode);
        await this.savePreference(this.currentUnit);
        logger.info(LogCategories.USER_ACTION, 'Temperature unit auto-detected', {
          countryCode,
          unit: this.currentUnit
        });
      } else {
        // Default to Celsius
        this.currentUnit = 'celsius';
        await this.savePreference(this.currentUnit);
        logger.info(LogCategories.USER_ACTION, 'Temperature unit defaulted to Celsius');
      }
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to initialize temperature unit', error as Error);
      this.currentUnit = 'celsius'; // Safe default
    }

    this.isInitialized = true;
    return this.currentUnit;
  }

  /**
   * Get current temperature unit
   */
  getCurrentUnit(): TemperatureUnit {
    return this.currentUnit;
  }

  /**
   * Set temperature unit preference
   */
  async setUnit(unit: TemperatureUnit): Promise<void> {
    this.currentUnit = unit;
    await this.savePreference(unit);
    logger.info(LogCategories.USER_ACTION, 'Temperature unit changed', { unit });
  }

  /**
   * Convert Celsius to Fahrenheit
   */
  celsiusToFahrenheit(celsius: number): number {
    return Math.round((celsius * 9/5) + 32);
  }

  /**
   * Convert Fahrenheit to Celsius
   */
  fahrenheitToCelsius(fahrenheit: number): number {
    return Math.round((fahrenheit - 32) * 5/9);
  }

  /**
   * Format temperature with unit symbol
   */
  formatTemperature(tempCelsius: number, unit?: TemperatureUnit): string {
    const unitToUse = unit || this.currentUnit;
    
    if (unitToUse === 'fahrenheit') {
      const fahrenheit = this.celsiusToFahrenheit(tempCelsius);
      return `${fahrenheit}°F`;
    } else {
      return `${Math.round(tempCelsius)}°C`;
    }
  }

  /**
   * Get display name for unit
   */
  getUnitDisplayName(unit: TemperatureUnit): string {
    return unit === 'fahrenheit' ? 'Fahrenheit (°F)' : 'Celsius (°C)';
  }

  /**
   * Determine default temperature unit based on country code
   */
  private getDefaultUnitForCountry(countryCode: string): TemperatureUnit {
    const upperCountryCode = countryCode.toUpperCase();
    
    // Check if country uses Fahrenheit
    const usesFahrenheit = FAHRENHEIT_COUNTRIES.some(country => 
      upperCountryCode === country.toUpperCase() || 
      upperCountryCode.includes(country.toUpperCase())
    );

    return usesFahrenheit ? 'fahrenheit' : 'celsius';
  }

  /**
   * Save preference to AsyncStorage
   */
  private async savePreference(unit: TemperatureUnit): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, unit);
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to save temperature unit preference', error as Error);
    }
  }

  /**
   * Get temperature conversion info for debugging
   */
  getConversionInfo(tempCelsius: number): {
    celsius: string;
    fahrenheit: string;
    current: string;
    currentUnit: TemperatureUnit;
  } {
    return {
      celsius: `${Math.round(tempCelsius)}°C`,
      fahrenheit: `${this.celsiusToFahrenheit(tempCelsius)}°F`,
      current: this.formatTemperature(tempCelsius),
      currentUnit: this.currentUnit,
    };
  }
}

// Export singleton instance
export const temperatureUtils = TemperatureUtils.getInstance();