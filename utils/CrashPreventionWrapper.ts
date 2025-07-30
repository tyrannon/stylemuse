/**
 * Critical Crash Prevention Wrapper
 * Prevents Hermes engine crashes during Terminator Camera operations
 */

import * as Haptics from 'expo-haptics';

interface SafeExecutionOptions {
  maxRetries?: number;
  timeoutMs?: number;
  onError?: (error: Error) => void;
  fallbackValue?: any;
}

export class CrashPreventionWrapper {
  private static crashCount = 0;
  private static isEmergencyMode = false;

  /**
   * CRITICAL: Safely execute async operations that might crash Hermes
   */
  static async safeAsync<T>(
    operation: () => Promise<T>,
    options: SafeExecutionOptions = {}
  ): Promise<T | null> {
    const { maxRetries = 2, timeoutMs = 5000, onError, fallbackValue = null } = options;

    // Emergency mode - skip complex operations
    if (this.isEmergencyMode) {
      console.log('🚨 EMERGENCY MODE: Skipping complex operation');
      return fallbackValue;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Simple timeout wrapper to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), timeoutMs);
        });

        const result = await Promise.race([operation(), timeoutPromise]);
        
        // Reset crash count on success
        if (this.crashCount > 0) {
          this.crashCount = Math.max(0, this.crashCount - 1);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        this.crashCount++;
        
        console.log(`🚨 Safe execution failed (attempt ${attempt + 1}):`, error);
        
        // Enable emergency mode after too many crashes
        if (this.crashCount >= 3) {
          this.isEmergencyMode = true;
          console.log('🚨 EMERGENCY MODE ACTIVATED - Disabling complex features');
        }
        
        if (onError) {
          onError(lastError);
        }
        
        // Don't retry on final attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Simple delay between retries (no setTimeout chains)
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }

    console.log('🚨 All safe execution attempts failed, returning fallback');
    return fallbackValue;
  }

  /**
   * CRITICAL: Safe string processing to prevent stringPrototypeCharCodeAt crashes
   */
  static safeStringProcess(str: string, maxLength = 1000): string {
    try {
      if (!str || typeof str !== 'string') {
        return '';
      }
      
      // Truncate very long strings that might cause memory issues
      if (str.length > maxLength) {
        return str.substring(0, maxLength) + '...';
      }
      
      // Avoid complex template literals that trigger Hermes bugs
      return String(str);
    } catch (error) {
      console.log('🚨 String processing error:', error);
      return 'ERROR';
    }
  }

  /**
   * CRITICAL: Safe console logging to prevent Hermes string crashes
   */
  static safeLog(message: string, ...args: any[]): void {
    try {
      // Simple string concatenation instead of template literals
      const safeMessage = this.safeStringProcess(message);
      
      // Log without complex formatting that might crash Hermes
      if (args.length > 0) {
        console.log(safeMessage, ...args.slice(0, 3)); // Limit args to prevent memory issues
      } else {
        console.log(safeMessage);
      }
    } catch (error) {
      // Silent failure - don't crash the app for logging
    }
  }

  /**
   * Reset crash prevention state (for testing)
   */
  static reset(): void {
    this.crashCount = 0;
    this.isEmergencyMode = false;
  }

  /**
   * Check if in emergency mode
   */
  static isInEmergencyMode(): boolean {
    return this.isEmergencyMode;
  }

  /**
   * Get current crash count
   */
  static getCrashCount(): number {
    return this.crashCount;
  }
}

/**
 * CRITICAL: Safe haptic feedback to prevent setTimeout chains
 */
export const safeHaptics = {
  impact: (style: any = 'Medium') => {
    CrashPreventionWrapper.safeAsync(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle[style]);
    }).catch(() => {
      // Silent failure for haptics
    });
  },

  notification: (type: any = 'Success') => {
    CrashPreventionWrapper.safeAsync(async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType[type]);
    }).catch(() => {
      // Silent failure for haptics
    });
  },

  selection: () => {
    CrashPreventionWrapper.safeAsync(async () => {
      await Haptics.selectionAsync();
    }).catch(() => {
      // Silent failure for haptics
    });
  },
};