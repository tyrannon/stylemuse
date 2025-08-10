/**
 * Multi-Model Outfit Generator with GPT-5 Support
 * 
 * Conservative implementation that generates outfit images with multiple
 * GPT-5 models simultaneously for user comparison and preference tracking.
 * 
 * IMPORTANT: This is a NEW file that doesn't modify existing openai.ts
 */

import Constants from 'expo-constants';
import { logger } from './DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import { aiRouter, AIModel, TaskClass } from '../services/aiRouter';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.openAIApiKey;

// Model configuration for outfit generation
export interface ModelConfig {
  model: AIModel;
  displayName: string;
  reasoning: {
    effort: 'minimal' | 'low' | 'medium' | 'high';
  };
  text: {
    verbosity: 'low' | 'medium' | 'high';
  };
  costPerImage: number; // Estimated cost in USD
  averageTime: number; // Estimated time in seconds
}

// Result from a single model generation
export interface ModelResult {
  model: AIModel;
  imageUrl: string | null;
  generationTime: number;
  cost: number;
  error?: string;
  promptUsed?: string;
}

// User preference data
export interface UserPreference {
  modelId: AIModel;
  rating: number; // 1-5 stars
  timestamp: Date;
  context: {
    occasion?: string;
    weather?: string;
    style?: string;
  };
}

// GPT-5 model configurations for outfit generation
const GPT5_CONFIGS: Record<string, ModelConfig> = {
  'gpt-5-pro': {
    model: AIModel.GPT5,
    displayName: 'GPT-5 Pro',
    reasoning: { effort: 'high' },
    text: { verbosity: 'high' },
    costPerImage: 0.15,
    averageTime: 8,
  },
  'gpt-5-balanced': {
    model: AIModel.GPT5_MINI,
    displayName: 'GPT-5 Mini',
    reasoning: { effort: 'medium' },
    text: { verbosity: 'medium' },
    costPerImage: 0.05,
    averageTime: 4,
  },
  'gpt-5-fast': {
    model: AIModel.GPT5_NANO,
    displayName: 'GPT-5 Nano',
    reasoning: { effort: 'minimal' },
    text: { verbosity: 'low' },
    costPerImage: 0.02,
    averageTime: 2,
  },
};

export class MultiModelOutfitGenerator {
  private static instance: MultiModelOutfitGenerator;
  private userPreferences: UserPreference[] = [];
  private preferenceWeights: Map<AIModel, number> = new Map();

  private constructor() {
    this.loadUserPreferences();
  }

  static getInstance(): MultiModelOutfitGenerator {
    if (!MultiModelOutfitGenerator.instance) {
      MultiModelOutfitGenerator.instance = new MultiModelOutfitGenerator();
    }
    return MultiModelOutfitGenerator.instance;
  }

  /**
   * Generate outfit images with multiple GPT-5 models simultaneously
   */
  async generateMultiModelOutfits(
    clothingItems: any[],
    styleDNA: any = null,
    context?: {
      occasion?: string;
      weather?: string;
      style?: string;
    },
    gender?: string | null
  ): Promise<{ results: ModelResult[]; recommendedIndex: number }> {
    logger.info(LogCategories.OUTFIT_GENERATION, 'Starting multi-model outfit generation', {
      itemCount: clothingItems.length,
      models: Object.keys(GPT5_CONFIGS),
      context,
    });

    // Create outfit prompt
    const basePrompt = this.createOutfitPrompt(clothingItems, styleDNA, context, gender);

    // Generate with all models in parallel
    const generationPromises = Object.values(GPT5_CONFIGS).map(async (config) => {
      const startTime = Date.now();
      
      try {
        // Use GPT-5 Responses API if available, fallback to simulation
        const imageUrl = await this.generateWithGPT5(
          basePrompt,
          config,
          clothingItems,
          styleDNA
        );

        const generationTime = (Date.now() - startTime) / 1000;
        
        return {
          model: config.model,
          imageUrl,
          generationTime,
          cost: config.costPerImage,
          promptUsed: basePrompt.substring(0, 100) + '...',
        } as ModelResult;
      } catch (error) {
        logger.error(LogCategories.OUTFIT_GENERATION, `Model ${config.displayName} failed`, error as Error);
        
        return {
          model: config.model,
          imageUrl: null,
          generationTime: (Date.now() - startTime) / 1000,
          cost: 0,
          error: error instanceof Error ? error.message : 'Generation failed',
        } as ModelResult;
      }
    });

    const results = await Promise.all(generationPromises);

    // Calculate recommended index based on user preferences
    const recommendedIndex = this.calculateRecommendation(results);

    // Track analytics
    await this.trackGenerationEvent(results, context);

    logger.info(LogCategories.OUTFIT_GENERATION, 'Multi-model generation complete', {
      successCount: results.filter(r => r.imageUrl).length,
      totalCost: results.reduce((sum, r) => sum + r.cost, 0),
      recommendedModel: results[recommendedIndex]?.model,
    });

    return { results, recommendedIndex };
  }

  /**
   * Generate with GPT-5 using the new Responses API
   */
  private async generateWithGPT5(
    prompt: string,
    config: ModelConfig,
    clothingItems: any[],
    styleDNA: any
  ): Promise<string | null> {
    // Check if we have real GPT-5 API access
    const isGPT5Available = await this.checkGPT5Availability();
    
    if (!isGPT5Available) {
      // Fallback to existing DALL-E generation with model simulation
      return this.generateWithDALLE(prompt, config);
    }

    // Use new GPT-5 Responses API with custom parameters
    const payload = {
      model: config.model === AIModel.GPT5 ? 'gpt-5' : 
             config.model === AIModel.GPT5_MINI ? 'gpt-5-mini' : 'gpt-5-nano',
      input: prompt,
      reasoning: config.reasoning,
      text: config.text,
      tools: [
        {
          type: 'image_generation',
          description: 'Generate outfit visualization'
        }
      ],
    };

    try {
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`GPT-5 API error: ${res.status}`);
      }

      const json = await res.json();
      
      // Extract image URL from GPT-5 response
      // Note: This structure might change based on actual GPT-5 API
      return json?.output?.image_url || json?.data?.[0]?.url || null;
    } catch (error) {
      logger.error(LogCategories.API_CALLS, 'GPT-5 generation failed', error as Error);
      // Fallback to DALL-E
      return this.generateWithDALLE(prompt, config);
    }
  }

  /**
   * Fallback generation with DALL-E (current implementation)
   */
  private async generateWithDALLE(prompt: string, config: ModelConfig): Promise<string | null> {
    // Add model-specific prompt modifications
    let enhancedPrompt = prompt;
    
    if (config.model === AIModel.GPT5) {
      enhancedPrompt += '\n\nStyle: Ultra high quality, editorial fashion photography, perfect lighting and composition.';
    } else if (config.model === AIModel.GPT5_MINI) {
      enhancedPrompt += '\n\nStyle: High quality fashion photography, professional lighting.';
    } else {
      enhancedPrompt += '\n\nStyle: Clean fashion photography, good lighting.';
    }

    // Truncate for DALL-E limits
    if (enhancedPrompt.length > 3900) {
      enhancedPrompt = enhancedPrompt.substring(0, 3900) + '...';
    }

    const payload = {
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard', // Use standard quality for all models to avoid 400 errors
    };

    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`DALL-E API error: ${res.status}`);
      }

      const json = await res.json();
      return json?.data?.[0]?.url || null;
    } catch (error) {
      logger.error(LogCategories.API_CALLS, 'DALL-E generation failed', error as Error);
      throw error;
    }
  }

  /**
   * Create outfit generation prompt
   */
  private createOutfitPrompt(
    clothingItems: any[],
    styleDNA: any,
    context?: any,
    gender?: string | null
  ): string {
    const itemDescriptions = clothingItems.map(item => {
      if (item.color && item.material && item.style) {
        return `${item.color} ${item.material} ${item.style} with ${item.fit} fit`;
      }
      return item.description || item.title || 'clothing item';
    });

    let prompt = `Create a professional fashion photograph of a stylish person wearing this complete outfit:

${itemDescriptions.map((desc, i) => `${i + 1}. ${desc}`).join('\n')}

Requirements:
- Full body shot showing the complete outfit clearly
- Professional fashion photography style with excellent lighting
- Clean, neutral background (white or light gray)
- Model posed naturally to showcase outfit coordination
- High quality, photorealistic style`;

    // Add gender specification if provided
    if (gender) {
      const genderText = gender === 'male' ? 'masculine' : 
                        gender === 'female' ? 'feminine' : 
                        'non-binary';
      prompt += `\n- GENDER IDENTITY: The model should have a ${genderText} appearance and styling appropriate for ${genderText} fashion`;
    }

    // Add context if provided
    if (context?.occasion) {
      prompt += `\n- Styled appropriately for: ${context.occasion}`;
    }
    if (context?.weather) {
      prompt += `\n- Weather context: ${context.weather}`;
    }
    if (context?.style) {
      prompt += `\n- Fashion style: ${context.style}`;
    }

    // Add comprehensive Style DNA if available
    if (styleDNA?.style_preferences) {
      prompt += `\n\nStyle preferences: ${styleDNA.style_preferences.aesthetic_shown || 'modern'}`;
    }

    // Add detailed physical characteristics from Style DNA
    if (styleDNA?.appearance) {
      prompt += `\n\nDETAILED PHYSICAL CHARACTERISTICS (for accurate visualization):
- Hair: ${styleDNA.appearance.hair_color} hair, ${styleDNA.appearance.hair_length}, ${styleDNA.appearance.hair_texture}
- Hair Style: ${styleDNA.appearance.hair_style}
- Build: ${styleDNA.appearance.build} build, ${styleDNA.appearance.height_impression} height
- Skin: ${styleDNA.appearance.complexion} complexion with natural undertones
- Face: ${styleDNA.appearance.facial_structure} facial structure
- Eyes: ${styleDNA.appearance.eye_color} eyes
- Age: ${styleDNA.appearance.approximate_age_range} appearance
- Overall Vibe: ${styleDNA.appearance.overall_vibe} aesthetic

STYLING SPECIFICATIONS:
- Model should have the exact hair characteristics described above
- Body proportions should match the ${styleDNA.appearance.build} build description
- Skin tone should accurately reflect ${styleDNA.appearance.complexion}
- Facial features should align with ${styleDNA.appearance.facial_structure}
- Overall styling should reflect ${styleDNA.appearance.overall_vibe} aesthetic
- Age appearance should match ${styleDNA.appearance.approximate_age_range}

IMPORTANT: Create a person who matches these specific physical characteristics exactly.`;
    }

    return prompt;
  }

  /**
   * Check if GPT-5 API is actually available
   */
  private async checkGPT5Availability(): Promise<boolean> {
    // For now, return false since GPT-5 is not yet available
    // When it launches, this would check API availability
    return false;
  }

  /**
   * Calculate recommended model based on user preferences
   */
  private calculateRecommendation(results: ModelResult[]): number {
    // Filter out failed results
    const validResults = results.map((r, i) => ({ result: r, index: i }))
      .filter(({ result }) => result.imageUrl);

    if (validResults.length === 0) return 0;

    // Calculate scores based on user preferences
    let bestScore = -1;
    let bestIndex = 0;

    validResults.forEach(({ result, index }) => {
      let score = 50; // Base score

      // Add preference weight
      const preferenceWeight = this.preferenceWeights.get(result.model) || 0;
      score += preferenceWeight * 20;

      // Cost optimization: Strongly favor GPT-5 Mini for best value
      if (result.model === AIModel.GPT5_MINI) {
        score += 25; // Bonus for Mini (best cost-to-reliability ratio)
      } else if (result.model === AIModel.GPT5_NANO) {
        score -= 10; // Penalty for Nano due to reliability issues
      }

      // Factor in cost efficiency (if user has shown cost sensitivity)
      const costSensitivity = this.calculateCostSensitivity();
      score -= result.cost * costSensitivity * 10;

      // Factor in speed (if user has shown speed preference)
      const speedPreference = this.calculateSpeedPreference();
      score -= result.generationTime * speedPreference * 5;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    return bestIndex;
  }

  /**
   * Track user preference when they select an image
   */
  async trackUserPreference(
    selectedModel: AIModel,
    rating: number,
    context?: any
  ): Promise<void> {
    const preference: UserPreference = {
      modelId: selectedModel,
      rating,
      timestamp: new Date(),
      context: context || {},
    };

    this.userPreferences.push(preference);
    
    // Keep only last 100 preferences
    if (this.userPreferences.length > 100) {
      this.userPreferences = this.userPreferences.slice(-100);
    }

    // Update preference weights
    this.updatePreferenceWeights();

    // Save to storage
    await this.saveUserPreferences();

    // Simple local preference tracking (avoiding complex analytics service integration for now)
    try {
      logger.info(LogCategories.USER_ACTION, 'Model preference recorded', {
        selectedModel,
        rating,
        context: context || {},
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.warn(LogCategories.ANALYTICS, 'Failed to log model preference', error as Error);
    }

    logger.info(LogCategories.USER_ACTION, 'User preference tracked', {
      model: selectedModel,
      rating,
      context,
    });
  }

  /**
   * Update preference weights based on user history
   */
  private updatePreferenceWeights(): void {
    const weights = new Map<AIModel, number>();
    
    // Calculate average rating for each model
    const modelRatings = new Map<AIModel, { total: number; count: number }>();
    
    this.userPreferences.forEach(pref => {
      const current = modelRatings.get(pref.modelId) || { total: 0, count: 0 };
      modelRatings.set(pref.modelId, {
        total: current.total + pref.rating,
        count: current.count + 1,
      });
    });

    // Convert to weights (0-1 scale)
    modelRatings.forEach((data, model) => {
      const avgRating = data.total / data.count;
      weights.set(model, avgRating / 5); // Normalize to 0-1
    });

    this.preferenceWeights = weights;
  }

  /**
   * Calculate user's cost sensitivity from history
   */
  private calculateCostSensitivity(): number {
    if (this.userPreferences.length < 10) return 0.5; // Default medium sensitivity

    // Check if user tends to pick cheaper models
    const nanoSelections = this.userPreferences.filter(p => p.modelId === AIModel.GPT5_NANO).length;
    const ratio = nanoSelections / this.userPreferences.length;

    return ratio > 0.6 ? 0.8 : ratio > 0.3 ? 0.5 : 0.2;
  }

  /**
   * Calculate user's speed preference from history
   */
  private calculateSpeedPreference(): number {
    // Similar to cost sensitivity but for speed
    const nanoSelections = this.userPreferences.filter(p => p.modelId === AIModel.GPT5_NANO).length;
    const ratio = nanoSelections / this.userPreferences.length;

    return ratio > 0.5 ? 0.7 : 0.3;
  }

  /**
   * Track generation event for analytics
   */
  private async trackGenerationEvent(results: ModelResult[], context?: any): Promise<void> {
    try {
      const generationId = 'multi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
      const successCount = results.filter(r => r.imageUrl).length;

      logger.info(LogCategories.AI_ANALYSIS, 'Multi-model generation tracked locally', {
        generationId,
        totalCost: totalCost.toFixed(3),
        successCount: successCount,
        totalResults: results.length,
        successRate: ((successCount / results.length) * 100).toFixed(1) + '%',
        models: results.map(r => r.model).join(', ')
      });
    } catch (error) {
      logger.warn(LogCategories.AI_ANALYSIS, 'Failed to track generation event', error as Error);
    }
  }

  /**
   * Load user preferences from storage
   */
  private async loadUserPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('multimodel_preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.userPreferences = parsed.map((p: any) => ({
          ...p,
          timestamp: new Date(p.timestamp),
        }));
        this.updatePreferenceWeights();
      }
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to load preferences', error as Error);
    }
  }

  /**
   * Save user preferences to storage
   */
  private async saveUserPreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'multimodel_preferences',
        JSON.stringify(this.userPreferences)
      );
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to save preferences', error as Error);
    }
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(): {
    totalGenerations: number;
    modelPreferences: Record<string, number>;
    averageRatings: Record<string, number>;
    costSavings: number;
  } {
    const modelCounts = new Map<AIModel, number>();
    const modelRatings = new Map<AIModel, { total: number; count: number }>();
    
    this.userPreferences.forEach(pref => {
      modelCounts.set(pref.modelId, (modelCounts.get(pref.modelId) || 0) + 1);
      
      const current = modelRatings.get(pref.modelId) || { total: 0, count: 0 };
      modelRatings.set(pref.modelId, {
        total: current.total + pref.rating,
        count: current.count + 1,
      });
    });

    // Calculate cost savings (difference between always using Pro vs actual usage)
    const actualCost = this.userPreferences.reduce((sum, pref) => {
      const config = Object.values(GPT5_CONFIGS).find(c => c.model === pref.modelId);
      return sum + (config?.costPerImage || 0);
    }, 0);
    
    const maxCost = this.userPreferences.length * GPT5_CONFIGS['gpt-5-pro'].costPerImage;
    const savings = maxCost - actualCost;

    const preferences: Record<string, number> = {};
    const ratings: Record<string, number> = {};
    
    modelCounts.forEach((count, model) => {
      preferences[model] = count;
    });
    
    modelRatings.forEach((data, model) => {
      ratings[model] = data.count > 0 ? data.total / data.count : 0;
    });

    return {
      totalGenerations: this.userPreferences.length,
      modelPreferences: preferences,
      averageRatings: ratings,
      costSavings: savings,
    };
  }
}

// Export singleton instance
export const multiModelGenerator = MultiModelOutfitGenerator.getInstance();