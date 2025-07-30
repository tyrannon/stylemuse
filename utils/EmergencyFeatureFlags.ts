/**
 * Emergency Feature Flags
 * Automatically disable problematic features after crashes
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface EmergencyFlags {
  terminatorCameraDisabled: boolean;
  skiaGraphicsDisabled: boolean;
  complexAnimationsDisabled: boolean;
  lastCrashTime: number | null;
  crashCount: number;
}

class EmergencyFeatureFlagManager {
  private static instance: EmergencyFeatureFlagManager;
  private flags: EmergencyFlags = {
    terminatorCameraDisabled: false,
    skiaGraphicsDisabled: false, 
    complexAnimationsDisabled: false,
    lastCrashTime: null,
    crashCount: 0,
  };

  private readonly STORAGE_KEY = '@emergency_feature_flags';
  private readonly MAX_CRASHES = 3;
  private readonly CRASH_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

  static getInstance(): EmergencyFeatureFlagManager {
    if (!EmergencyFeatureFlagManager.instance) {
      EmergencyFeatureFlagManager.instance = new EmergencyFeatureFlagManager();
    }
    return EmergencyFeatureFlagManager.instance;
  }

  /**
   * Load emergency flags from storage
   */
  async loadFlags(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.flags = { ...this.flags, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.log('Failed to load emergency flags:', error);
    }
  }

  /**
   * Save emergency flags to storage
   */
  async saveFlags(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.flags));
    } catch (error) {
      console.log('Failed to save emergency flags:', error);
    }
  }

  /**
   * CRITICAL: Report a crash and potentially disable features
   */
  async reportCrash(feature: 'terminator' | 'skia' | 'animations'): Promise<void> {
    this.flags.crashCount++;
    this.flags.lastCrashTime = Date.now();

    console.log(`🚨 EMERGENCY: Crash reported for ${feature} (count: ${this.flags.crashCount})`);

    // Disable features after too many crashes
    if (this.flags.crashCount >= this.MAX_CRASHES) {
      switch (feature) {
        case 'terminator':
          this.flags.terminatorCameraDisabled = true;
          console.log('🚨 EMERGENCY: Terminator Camera DISABLED due to crashes');
          break;
        case 'skia':
          this.flags.skiaGraphicsDisabled = true;
          console.log('🚨 EMERGENCY: Skia Graphics DISABLED due to crashes');
          break;
        case 'animations':
          this.flags.complexAnimationsDisabled = true;
          console.log('🚨 EMERGENCY: Complex Animations DISABLED due to crashes');
          break;
      }
    }

    await this.saveFlags();
  }

  /**
   * Check if Terminator Camera should be disabled
   */
  isTerminatorCameraDisabled(): boolean {
    return this.flags.terminatorCameraDisabled;
  }

  /**
   * Check if Skia graphics should be disabled
   */
  isSkiaGraphicsDisabled(): boolean {
    return this.flags.skiaGraphicsDisabled;
  }

  /**
   * Check if complex animations should be disabled
   */
  areComplexAnimationsDisabled(): boolean {
    return this.flags.complexAnimationsDisabled;
  }

  /**
   * Get current crash count
   */
  getCrashCount(): number {
    return this.flags.crashCount;
  }

  /**
   * Reset emergency flags (for testing or recovery)
   */
  async resetFlags(): Promise<void> {
    this.flags = {
      terminatorCameraDisabled: false,
      skiaGraphicsDisabled: false,
      complexAnimationsDisabled: false,
      lastCrashTime: null,
      crashCount: 0,
    };
    await this.saveFlags();
    console.log('🔧 Emergency flags reset');
  }

  /**
   * Auto-recovery: Re-enable features after cooldown period with no crashes
   */
  async checkAutoRecovery(): Promise<void> {
    if (this.flags.lastCrashTime && this.flags.crashCount > 0) {
      const timeSinceLastCrash = Date.now() - this.flags.lastCrashTime;
      
      if (timeSinceLastCrash > this.CRASH_COOLDOWN_MS) {
        // Reduce crash count over time (gradual recovery)
        this.flags.crashCount = Math.max(0, this.flags.crashCount - 1);
        
        // Re-enable features if crash count is low enough
        if (this.flags.crashCount < this.MAX_CRASHES) {
          const wasDisabled = this.flags.terminatorCameraDisabled || 
                             this.flags.skiaGraphicsDisabled || 
                             this.flags.complexAnimationsDisabled;
                             
          this.flags.terminatorCameraDisabled = false;
          this.flags.skiaGraphicsDisabled = false;
          this.flags.complexAnimationsDisabled = false;
          
          if (wasDisabled) {
            console.log('🔧 AUTO-RECOVERY: Features re-enabled after cooldown period');
          }
        }
        
        await this.saveFlags();
      }
    }
  }

  /**
   * Get human-readable status
   */
  getStatus(): string {
    if (this.flags.crashCount === 0) {
      return 'All systems operational';
    }
    
    const disabled = [];
    if (this.flags.terminatorCameraDisabled) disabled.push('Terminator Camera');
    if (this.flags.skiaGraphicsDisabled) disabled.push('Skia Graphics');
    if (this.flags.complexAnimationsDisabled) disabled.push('Complex Animations');
    
    if (disabled.length > 0) {
      return `Emergency mode: ${disabled.join(', ')} disabled (${this.flags.crashCount} crashes)`;
    }
    
    return `${this.flags.crashCount} recent crashes, monitoring...`;
  }
}

// Export singleton instance
export const emergencyFlags = EmergencyFeatureFlagManager.getInstance();

// Initialize on import
emergencyFlags.loadFlags().then(() => {
  emergencyFlags.checkAutoRecovery();
});

// Helper function to check if Terminator Camera is safe to use
export const isTerminatorCameraSafe = (): boolean => {
  return !emergencyFlags.isTerminatorCameraDisabled();
};

// Helper function to report Terminator Camera crashes
export const reportTerminatorCrash = async (): Promise<void> => {
  await emergencyFlags.reportCrash('terminator');
};