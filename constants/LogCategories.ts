export const LogCategories = {
  // Core App
  APP_LIFECYCLE: 'app.lifecycle',
  NAVIGATION: 'navigation',
  AUTHENTICATION: 'auth',
  
  // Features
  WARDROBE: 'wardrobe',
  OUTFIT_GENERATION: 'outfit.generation',
  AI_ANALYSIS: 'ai.analysis',
  CAMERA: 'camera',
  IMAGE_PROCESSING: 'image.processing',
  
  // Data
  API_CALLS: 'api',
  DATABASE: 'database',
  CACHE: 'cache',
  STORAGE: 'storage',
  MIGRATION: 'migration',
  
  // UI/UX
  USER_ACTION: 'user.action',
  PERFORMANCE: 'performance',
  RENDER: 'render',
  
  // System
  SYSTEM: 'system',
  NETWORK: 'network',
  MEMORY: 'memory',
  CRASH: 'crash',
  ERROR_BOUNDARY: 'error.boundary',
  
  // Business
  MONETIZATION: 'monetization',
  ANALYTICS: 'analytics',
  SUBSCRIPTION: 'subscription',
  
  // Gamification
  GAMIFICATION: 'gamification',
  SOUND: 'sound',
  ACHIEVEMENTS: 'achievements'
} as const;

export type LogCategory = typeof LogCategories[keyof typeof LogCategories];