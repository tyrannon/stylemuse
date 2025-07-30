/**
 * Feature Flags Configuration
 * Manages experimental and development features with emergency safety
 */

// Environment-based feature flags
const isDevelopment = __DEV__;

// CRITICAL FIX: Static flags to prevent circular imports during build
export const FeatureFlags = {
  // Camera Features - Will be checked at runtime
  TERMINATOR_CAMERA_ENABLED: true, // Runtime safety checks in components
  
  // Debug Features (only in development)
  ENABLE_DEBUG_LOGGING: isDevelopment,
  SHOW_PERFORMANCE_METRICS: isDevelopment,
  
  // Experimental Features
  ADVANCED_ANIMATIONS: true,
  SKIA_GRAPHICS: true, // Runtime safety checks in components
  
} as const;

// Helper function to check if feature is enabled
export const isFeatureEnabled = (feature: keyof typeof FeatureFlags): boolean => {
  return FeatureFlags[feature];
};

// Development override (can be modified in dev tools)
if (isDevelopment) {
  // @ts-ignore - Allow runtime modification in development
  global.FeatureFlags = FeatureFlags;
  
  console.log('🎛️ Feature Flags initialized:', FeatureFlags);
}