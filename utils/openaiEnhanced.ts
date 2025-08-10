/**
 * Enhanced OpenAI Service with GPT-5 Model Router Integration
 * 
 * This service wraps the existing OpenAI functionality with intelligent
 * model routing, parallel processing, and cost optimization.
 */

import Constants from 'expo-constants';
import { logger } from './DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import { PromptTruncator, PROMPT_LIMITS } from './PromptTruncator';
import { aiRouter, AIModel, TaskClass } from '../services/aiRouter';
import * as openai from './openai';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.openAIApiKey;

// Enhanced API configuration with model mapping
const MODEL_ENDPOINTS: Record<AIModel, string> = {
  [AIModel.GPT5]: 'gpt-5',              // Future model
  [AIModel.GPT5_MINI]: 'gpt-5-mini',    // Future model
  [AIModel.GPT5_NANO]: 'gpt-5-nano',    // Future model
  [AIModel.GPT4O]: 'gpt-4o',            // Current
  [AIModel.GPT4_TURBO]: 'gpt-4-turbo',  // Current
  [AIModel.GPT3_5]: 'gpt-3.5-turbo',    // Current
};

// User tier detection (would normally come from user profile)
export function getUserTier(): 'free' | 'plus' | 'premium' {
  // TODO: Implement actual tier detection from user profile
  return 'plus'; // Default for testing
}

/**
 * Execute an AI request with intelligent routing and fallbacks
 */
async function executeWithRouter(
  prompt: string,
  taskClass: TaskClass,
  options?: {
    maxTokens?: number;
    temperature?: number;
    requiresStructuredOutput?: boolean;
    imageData?: string;
    preferredModel?: AIModel;
  }
): Promise<any> {
  const userTier = getUserTier();
  
  // Select optimal model
  const primaryModel = options?.preferredModel || aiRouter.selectModel(taskClass, {
    contextSize: prompt.length,
    requiresStructuredOutput: options?.requiresStructuredOutput,
    userTier,
  });

  // Get fallback chain
  const fallbackModels = aiRouter.getFallbackChain(primaryModel);
  const modelChain = [primaryModel, ...fallbackModels];

  logger.info(LogCategories.AI_ANALYSIS, 'Executing with router', {
    taskClass,
    primaryModel,
    fallbackCount: fallbackModels.length,
    userTier,
  });

  // Try each model in the chain
  for (let i = 0; i < modelChain.length; i++) {
    const model = modelChain[i];
    const isLastAttempt = i === modelChain.length - 1;

    try {
      const startTime = Date.now();
      
      // Check if model supports the current API
      const modelEndpoint = MODEL_ENDPOINTS[model];
      if (!modelEndpoint.startsWith('gpt-5')) {
        // Use existing OpenAI API for GPT-4 family
        const result = await executeLegacyModel(prompt, modelEndpoint, options);
        
        // Record success metrics
        const latency = Date.now() - startTime;
        logger.info(LogCategories.AI_ANALYSIS, 'Request successful', {
          model,
          latency,
          attempt: i + 1,
        });
        
        return result;
      } else {
        // Simulate GPT-5 API call (would be real in production)
        const result = await executeGPT5Model(prompt, model, options);
        
        const latency = Date.now() - startTime;
        logger.info(LogCategories.AI_ANALYSIS, 'GPT-5 request successful', {
          model,
          latency,
          attempt: i + 1,
        });
        
        return result;
      }
    } catch (error) {
      logger.error(LogCategories.AI_ANALYSIS, `Model ${model} failed`, error as Error, {
        attempt: i + 1,
        willRetry: !isLastAttempt,
      });

      if (isLastAttempt) {
        throw new Error(`All models failed. Last error: ${error}`);
      }
    }
  }
}

/**
 * Execute with existing GPT-4 family models
 */
async function executeLegacyModel(
  prompt: string,
  model: string,
  options?: any
): Promise<any> {
  const payload = {
    model,
    messages: [
      {
        role: "user",
        content: options?.imageData
          ? [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${options.imageData}`,
                },
              },
            ]
          : prompt,
      },
    ],
    max_tokens: options?.maxTokens || 800,
    temperature: options?.temperature || 0.7,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API error: ${res.status} - ${errorText}`);
  }

  const json = await res.json();
  return json?.choices?.[0]?.message?.content;
}

/**
 * Simulate GPT-5 model execution (placeholder for future API)
 */
async function executeGPT5Model(
  prompt: string,
  model: AIModel,
  options?: any
): Promise<any> {
  // In production, this would call the actual GPT-5 API
  // For now, we'll use GPT-4o as a fallback with a simulated enhancement
  
  logger.info(LogCategories.AI_ANALYSIS, 'Simulating GPT-5 call, using GPT-4o with enhancements', {
    requestedModel: model,
    fallbackModel: 'gpt-4o',
  });

  // Add model-specific prompt enhancements
  let enhancedPrompt = prompt;
  
  if (model === AIModel.GPT5) {
    enhancedPrompt = `[SYSTEM: Use advanced reasoning and structured output formatting]\n\n${prompt}\n\nProvide a comprehensive, well-structured response with clear reasoning.`;
  } else if (model === AIModel.GPT5_MINI) {
    enhancedPrompt = `[SYSTEM: Provide a balanced, efficient response]\n\n${prompt}`;
  } else if (model === AIModel.GPT5_NANO) {
    enhancedPrompt = `[SYSTEM: Provide a concise, direct response]\n\n${prompt}`;
  }

  // Use GPT-4o as fallback
  return executeLegacyModel(enhancedPrompt, 'gpt-4o', {
    ...options,
    temperature: model === AIModel.GPT5_NANO ? 0.3 : options?.temperature, // Lower temp for nano
  });
}

/**
 * Enhanced clothing item description with model routing
 */
async function describeClothingItemEnhanced(base64Image: string) {
  logger.info(LogCategories.AI_ANALYSIS, 'Starting enhanced clothing description');

  const prompt = openai.describeClothingItem.toString().match(/prompt = `([\s\S]*?)`;/)?.[1] || '';
  
  return executeWithRouter(prompt, TaskClass.ITEM_DESCRIPTION, {
    imageData: base64Image,
    maxTokens: 800,
    temperature: 0.7,
    requiresStructuredOutput: true,
  });
}

/**
 * Generate outfit with parallel mini models and GPT-5 ranking
 */
async function generateOutfitWithRanking(
  wardrobeItems: any[],
  context: any,
  styleDNA: any = null
): Promise<any> {
  logger.info(LogCategories.OUTFIT_GENERATION, 'Starting parallel outfit generation with ranking');

  // Step 1: Generate 3 different outfit options in parallel with Mini
  const outfitPrompts = [
    {
      prompt: createOutfitPrompt(wardrobeItems, { ...context, style: 'casual' }, styleDNA),
      model: AIModel.GPT5_MINI,
      taskClass: TaskClass.OUTFIT_GENERATION,
    },
    {
      prompt: createOutfitPrompt(wardrobeItems, { ...context, style: 'smart-casual' }, styleDNA),
      model: AIModel.GPT5_MINI,
      taskClass: TaskClass.OUTFIT_GENERATION,
    },
    {
      prompt: createOutfitPrompt(wardrobeItems, { ...context, style: 'business-casual' }, styleDNA),
      model: AIModel.GPT5_MINI,
      taskClass: TaskClass.OUTFIT_GENERATION,
    },
  ];

  // Execute outfit generation in parallel
  const outfitResults = await aiRouter.executeParallel(
    outfitPrompts,
    async (prompt, model) => {
      return executeWithRouter(prompt, TaskClass.OUTFIT_GENERATION, {
        preferredModel: model,
        maxTokens: 1000,
        temperature: 0.7,
        requiresStructuredOutput: true,
      });
    }
  );

  // Step 2: Use GPT-5 to rank and select the best outfit
  const validOutfits = outfitResults
    .filter(r => r.result)
    .map((r, i) => ({
      index: i,
      outfit: JSON.parse(r.result),
      model: r.model,
      metrics: r.metrics,
    }));

  if (validOutfits.length === 0) {
    throw new Error('No valid outfits generated');
  }

  const rankingPrompt = createRankingPrompt(validOutfits, context, styleDNA);
  
  const rankedResult = await executeWithRouter(
    rankingPrompt,
    TaskClass.RANKING_EVALUATION,
    {
      preferredModel: AIModel.GPT5,
      maxTokens: 500,
      temperature: 0.3,
      requiresStructuredOutput: true,
    }
  );

  const ranking = JSON.parse(rankedResult);
  const bestOutfit = validOutfits[ranking.bestIndex];

  logger.info(LogCategories.OUTFIT_GENERATION, 'Outfit generation complete', {
    optionsGenerated: validOutfits.length,
    selectedIndex: ranking.bestIndex,
    totalCost: validOutfits.reduce((sum, o) => sum + o.metrics.cost, 0),
  });

  return {
    ...bestOutfit.outfit,
    _metadata: {
      generationMethod: 'parallel-ranked',
      optionsEvaluated: validOutfits.length,
      rankingRationale: ranking.rationale,
      modelUsed: bestOutfit.model,
      alternativeOutfits: validOutfits.filter((_, i) => i !== ranking.bestIndex),
    },
  };
}

/**
 * Create outfit generation prompt
 */
function createOutfitPrompt(wardrobeItems: any[], context: any, styleDNA: any): string {
  return `Generate a ${context.style} outfit for ${context.occasion} in ${context.weather} weather.
  
Wardrobe items: ${JSON.stringify(wardrobeItems.map(i => ({
  title: i.title,
  color: i.color,
  style: i.style,
  category: i.category,
})))}

User style preferences: ${styleDNA ? JSON.stringify(styleDNA.style_preferences) : 'Not specified'}

Return a JSON object with outfit selections and reasoning.`;
}

/**
 * Create ranking prompt for outfit evaluation
 */
function createRankingPrompt(outfits: any[], context: any, styleDNA: any): string {
  return `Evaluate and rank these outfit options for the given context:

Context:
- Occasion: ${context.occasion}
- Weather: ${context.weather}
- Location: ${context.location}
- Time: ${context.time}

User Style DNA: ${styleDNA ? JSON.stringify(styleDNA.style_preferences) : 'Not specified'}

Outfit Options:
${outfits.map((o, i) => `
Option ${i + 1}:
${JSON.stringify(o.outfit, null, 2)}
`).join('\n')}

Evaluate based on:
1. Appropriateness for the occasion
2. Weather suitability
3. Style coherence
4. Color harmony
5. User preference alignment

Return JSON:
{
  "bestIndex": <0-based index of best outfit>,
  "rankings": [<ordered indices from best to worst>],
  "rationale": "Explanation of why this outfit was selected",
  "scores": {
    "0": { "overall": 85, "appropriateness": 90, "style": 80, "weather": 85 },
    ...
  }
}`;
}

/**
 * Analyze multiple clothing items in parallel with nano models
 */
async function analyzeMultipleItemsParallel(
  images: string[]
): Promise<any[]> {
  logger.info(LogCategories.AI_ANALYSIS, 'Analyzing multiple items in parallel', {
    count: images.length,
  });

  // Create prompts for each image
  const analysisPrompts = images.map((image, i) => ({
    prompt: 'Analyze this clothing item and return color, material, and style tags in JSON format.',
    model: AIModel.GPT5_NANO,
    taskClass: TaskClass.TAG_GENERATION,
    imageData: image,
    index: i,
  }));

  // Execute in parallel with nano models
  const results = await aiRouter.executeParallel(
    analysisPrompts.map(p => ({
      prompt: p.prompt,
      model: p.model,
      taskClass: p.taskClass,
    })),
    async (prompt, model) => {
      const image = analysisPrompts.find(p => p.model === model)?.imageData;
      return executeWithRouter(prompt, TaskClass.TAG_GENERATION, {
        preferredModel: model,
        imageData: image,
        maxTokens: 200,
        temperature: 0.3,
        requiresStructuredOutput: true,
      });
    }
  );

  return results.map(r => r.result ? JSON.parse(r.result) : null).filter(Boolean);
}

/**
 * Weather-aware outfit generation with context routing
 */
async function generateWeatherAwareOutfit(
  wardrobeItems: any[],
  weatherData: any,
  occasion: string
): Promise<any> {
  const taskClass = weatherData.temperature < 40 || weatherData.temperature > 85
    ? TaskClass.OUTFIT_GENERATION  // Extreme weather needs more reasoning
    : TaskClass.WEATHER_CONTEXT;    // Normal weather can use mini

  const prompt = `Create a weather-appropriate outfit for ${weatherData.temperature}°F with ${weatherData.condition}.
  
Occasion: ${occasion}
Wardrobe: ${JSON.stringify(wardrobeItems.slice(0, 20))} // Truncate for length

Requirements:
- Temperature appropriate layers
- Weather protection if needed
- Style appropriate for occasion

Return JSON with outfit and weather reasoning.`;

  return executeWithRouter(prompt, taskClass, {
    maxTokens: 800,
    temperature: 0.5,
    requiresStructuredOutput: true,
  });
}

/**
 * Export analytics for monitoring
 */
export function getAIAnalytics(period?: { start: Date; end: Date }) {
  return aiRouter.getAnalytics(period);
}

/**
 * Configure router settings
 */
export function configureAIRouter(config: {
  costOptimization?: 'aggressive' | 'balanced' | 'quality';
  forceModel?: AIModel;
  enableParallel?: boolean;
}) {
  aiRouter.configure(config);
  logger.info(LogCategories.AI_ANALYSIS, 'AI Router configured', config);
}

/**
 * Get routing decision tree for debugging
 */
export function getRoutingDecisionTree() {
  return aiRouter.getRoutingDecisionTree();
}

// Export all enhanced functions
export {
  describeClothingItemEnhanced,
  generateOutfitWithRanking,
  analyzeMultipleItemsParallel,
  generateWeatherAwareOutfit,
};