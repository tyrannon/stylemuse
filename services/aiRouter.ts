/**
 * AI Model Router with GPT-5 Family Support
 * 
 * Implements intelligent routing between GPT-5, GPT-5-mini, and GPT-5-nano
 * based on use-case complexity, cost optimization, and reliability requirements.
 * 
 * ClaudePrompter-style reasoning:
 * - Analyze task complexity before routing
 * - Optimize for cost vs performance trade-offs
 * - Implement fallback chains for reliability
 * - Track model performance metrics
 */

import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import Constants from 'expo-constants';

// Model family definitions with cost and capability profiles
export enum AIModel {
  // GPT-5 Family (hypothetical pricing based on expected scaling)
  GPT5 = 'gpt-5',           // $0.06/1K tokens - Full capability
  GPT5_MINI = 'gpt-5-mini',  // $0.012/1K tokens - 80% capability
  GPT5_NANO = 'gpt-5-nano',  // $0.003/1K tokens - 60% capability
  
  // GPT-4 Family (existing)
  GPT4O = 'gpt-4o',          // $0.03/1K tokens - Current flagship
  GPT4_TURBO = 'gpt-4-turbo', // $0.02/1K tokens
  GPT3_5 = 'gpt-3.5-turbo',  // $0.002/1K tokens - Legacy fast
}

// Task classification for routing decisions
export enum TaskClass {
  // Nano-suitable tasks (simple, short, ephemeral)
  TAG_GENERATION = 'tag_generation',
  COLOR_EXTRACTION = 'color_extraction',
  SIMPLE_VALIDATION = 'simple_validation',
  SHORT_COPY = 'short_copy',
  
  // Mini-suitable tasks (standard complexity)
  OUTFIT_GENERATION = 'outfit_generation',
  WEATHER_CONTEXT = 'weather_context',
  STYLE_MATCHING = 'style_matching',
  ITEM_DESCRIPTION = 'item_description',
  
  // GPT-5 required tasks (complex, critical)
  WARDROBE_ANALYSIS = 'wardrobe_analysis',
  STRUCTURED_JSON = 'structured_json',
  MULTI_ITEM_DETECTION = 'multi_item_detection',
  STYLE_DNA_ANALYSIS = 'style_dna_analysis',
  FALLBACK_PLANNING = 'fallback_planning',
  RANKING_EVALUATION = 'ranking_evaluation',
}

// Model capabilities scoring
interface ModelCapabilities {
  reasoning: number;      // 0-100
  creativity: number;     // 0-100
  speed: number;         // 0-100 (inverse of latency)
  costEfficiency: number; // 0-100 (inverse of cost)
  reliability: number;    // 0-100
  contextWindow: number;  // max tokens
  structuredOutput: boolean;
}

// Model profiles with capabilities
const MODEL_PROFILES: Record<AIModel, ModelCapabilities> = {
  [AIModel.GPT5]: {
    reasoning: 100,
    creativity: 100,
    speed: 60,
    costEfficiency: 20,
    reliability: 95,
    contextWindow: 128000,
    structuredOutput: true,
  },
  [AIModel.GPT5_MINI]: {
    reasoning: 80,
    creativity: 85,
    speed: 85,
    costEfficiency: 70,
    reliability: 90,
    contextWindow: 64000,
    structuredOutput: true,
  },
  [AIModel.GPT5_NANO]: {
    reasoning: 60,
    creativity: 65,
    speed: 95,
    costEfficiency: 95,
    reliability: 85,
    contextWindow: 32000,
    structuredOutput: true,
  },
  [AIModel.GPT4O]: {
    reasoning: 90,
    creativity: 90,
    speed: 70,
    costEfficiency: 40,
    reliability: 92,
    contextWindow: 128000,
    structuredOutput: false,
  },
  [AIModel.GPT4_TURBO]: {
    reasoning: 85,
    creativity: 85,
    speed: 75,
    costEfficiency: 50,
    reliability: 90,
    contextWindow: 128000,
    structuredOutput: false,
  },
  [AIModel.GPT3_5]: {
    reasoning: 50,
    creativity: 55,
    speed: 95,
    costEfficiency: 98,
    reliability: 80,
    contextWindow: 16385,
    structuredOutput: false,
  },
};

// Task requirements mapping
const TASK_REQUIREMENTS: Record<TaskClass, Partial<ModelCapabilities>> = {
  [TaskClass.TAG_GENERATION]: {
    reasoning: 30,
    creativity: 40,
    speed: 90,
    reliability: 70,
  },
  [TaskClass.COLOR_EXTRACTION]: {
    reasoning: 20,
    creativity: 10,
    speed: 95,
    reliability: 80,
  },
  [TaskClass.SIMPLE_VALIDATION]: {
    reasoning: 40,
    creativity: 10,
    speed: 95,
    reliability: 85,
  },
  [TaskClass.SHORT_COPY]: {
    reasoning: 30,
    creativity: 60,
    speed: 90,
    reliability: 75,
  },
  [TaskClass.OUTFIT_GENERATION]: {
    reasoning: 70,
    creativity: 80,
    speed: 70,
    reliability: 85,
  },
  [TaskClass.WEATHER_CONTEXT]: {
    reasoning: 60,
    creativity: 50,
    speed: 80,
    reliability: 85,
  },
  [TaskClass.STYLE_MATCHING]: {
    reasoning: 65,
    creativity: 70,
    speed: 75,
    reliability: 85,
  },
  [TaskClass.ITEM_DESCRIPTION]: {
    reasoning: 60,
    creativity: 60,
    speed: 80,
    reliability: 90,
  },
  [TaskClass.WARDROBE_ANALYSIS]: {
    reasoning: 90,
    creativity: 85,
    speed: 50,
    reliability: 95,
    structuredOutput: true,
  },
  [TaskClass.STRUCTURED_JSON]: {
    reasoning: 85,
    creativity: 40,
    speed: 60,
    reliability: 95,
    structuredOutput: true,
  },
  [TaskClass.MULTI_ITEM_DETECTION]: {
    reasoning: 85,
    creativity: 30,
    speed: 60,
    reliability: 90,
  },
  [TaskClass.STYLE_DNA_ANALYSIS]: {
    reasoning: 95,
    creativity: 90,
    speed: 40,
    reliability: 95,
  },
  [TaskClass.FALLBACK_PLANNING]: {
    reasoning: 95,
    creativity: 85,
    speed: 50,
    reliability: 98,
  },
  [TaskClass.RANKING_EVALUATION]: {
    reasoning: 90,
    creativity: 70,
    speed: 60,
    reliability: 95,
  },
};

// Cost tracking
interface CostMetrics {
  model: AIModel;
  tokens: number;
  cost: number;
  latency: number;
  success: boolean;
  taskClass: TaskClass;
  timestamp: Date;
}

// Router configuration
export interface RouterConfig {
  preferredModel?: AIModel;
  maxCostPerRequest?: number;
  maxLatency?: number;
  forceModel?: AIModel; // Debug override
  enableParallel?: boolean;
  enableFallbacks?: boolean;
  costOptimization?: 'aggressive' | 'balanced' | 'quality';
}

export class AIRouter {
  private static instance: AIRouter;
  private costHistory: CostMetrics[] = [];
  private modelPerformance: Map<AIModel, { success: number; total: number }> = new Map();
  private config: RouterConfig = {
    enableParallel: true,
    enableFallbacks: true,
    costOptimization: 'balanced',
  };

  private constructor() {
    // Initialize model performance tracking
    Object.values(AIModel).forEach(model => {
      this.modelPerformance.set(model, { success: 0, total: 0 });
    });
  }

  static getInstance(): AIRouter {
    if (!AIRouter.instance) {
      AIRouter.instance = new AIRouter();
    }
    return AIRouter.instance;
  }

  /**
   * Configure router settings
   */
  configure(config: Partial<RouterConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info(LogCategories.AI_ANALYSIS, 'AI Router configured', this.config);
  }

  /**
   * Select optimal model for a given task
   */
  selectModel(taskClass: TaskClass, options?: {
    contextSize?: number;
    requiresStructuredOutput?: boolean;
    userTier?: 'free' | 'plus' | 'premium';
  }): AIModel {
    // Check for debug override
    if (this.config.forceModel) {
      logger.debug(LogCategories.AI_ANALYSIS, `Force model override: ${this.config.forceModel}`);
      return this.config.forceModel;
    }

    const requirements = TASK_REQUIREMENTS[taskClass];
    const candidates: { model: AIModel; score: number }[] = [];

    // Score each model based on requirements
    Object.entries(MODEL_PROFILES).forEach(([model, capabilities]) => {
      let score = 0;
      let eligible = true;

      // Check hard requirements
      if (requirements.structuredOutput && !capabilities.structuredOutput) {
        eligible = false;
      }
      if (options?.contextSize && capabilities.contextWindow < options.contextSize) {
        eligible = false;
      }

      if (!eligible) return;

      // Calculate weighted score
      if (requirements.reasoning) {
        score += (capabilities.reasoning / requirements.reasoning) * 30;
      }
      if (requirements.creativity) {
        score += (capabilities.creativity / requirements.creativity) * 25;
      }
      if (requirements.speed) {
        score += (capabilities.speed / requirements.speed) * 20;
      }
      if (requirements.reliability) {
        score += (capabilities.reliability / requirements.reliability) * 25;
      }

      // Apply cost optimization bias
      if (this.config.costOptimization === 'aggressive') {
        score += capabilities.costEfficiency * 0.5;
      } else if (this.config.costOptimization === 'balanced') {
        score += capabilities.costEfficiency * 0.2;
      }
      // 'quality' mode adds no cost bonus

      // Apply user tier restrictions
      if (options?.userTier === 'free') {
        // Free tier can only use nano and legacy models
        if (![AIModel.GPT5_NANO, AIModel.GPT3_5].includes(model as AIModel)) {
          score *= 0.1; // Heavily penalize but don't exclude
        }
      } else if (options?.userTier === 'plus') {
        // Plus tier prefers mini over full GPT-5
        if (model === AIModel.GPT5) {
          score *= 0.7;
        }
      }

      // Boost score based on recent performance
      const perf = this.modelPerformance.get(model as AIModel);
      if (perf && perf.total > 0) {
        const successRate = perf.success / perf.total;
        score *= (0.8 + successRate * 0.2);
      }

      candidates.push({ model: model as AIModel, score });
    });

    // Sort by score and select best
    candidates.sort((a, b) => b.score - a.score);
    const selected = candidates[0]?.model || AIModel.GPT4O;

    logger.info(LogCategories.AI_ANALYSIS, 'Model selected', {
      taskClass,
      selected,
      score: candidates[0]?.score,
      alternatives: candidates.slice(1, 3).map(c => ({ model: c.model, score: c.score })),
    });

    return selected;
  }

  /**
   * Get fallback chain for a model
   */
  getFallbackChain(primaryModel: AIModel): AIModel[] {
    const fallbacks: Record<AIModel, AIModel[]> = {
      [AIModel.GPT5_NANO]: [AIModel.GPT5_MINI, AIModel.GPT4O],
      [AIModel.GPT5_MINI]: [AIModel.GPT5, AIModel.GPT4O],
      [AIModel.GPT5]: [AIModel.GPT4O, AIModel.GPT4_TURBO],
      [AIModel.GPT4O]: [AIModel.GPT4_TURBO, AIModel.GPT5_MINI],
      [AIModel.GPT4_TURBO]: [AIModel.GPT4O, AIModel.GPT3_5],
      [AIModel.GPT3_5]: [AIModel.GPT4_TURBO, AIModel.GPT5_NANO],
    };

    return this.config.enableFallbacks ? fallbacks[primaryModel] || [] : [];
  }

  /**
   * Execute parallel prompts across multiple models
   */
  async executeParallel(
    prompts: Array<{ prompt: string; model: AIModel; taskClass: TaskClass }>,
    executor: (prompt: string, model: AIModel) => Promise<any>
  ): Promise<Array<{ result: any; model: AIModel; metrics: CostMetrics }>> {
    if (!this.config.enableParallel) {
      // Sequential execution if parallel disabled
      const results = [];
      for (const { prompt, model, taskClass } of prompts) {
        const start = Date.now();
        try {
          const result = await executor(prompt, model);
          const metrics = this.recordMetrics(model, prompt.length, Date.now() - start, true, taskClass);
          results.push({ result, model, metrics });
        } catch (error) {
          const metrics = this.recordMetrics(model, prompt.length, Date.now() - start, false, taskClass);
          logger.error(LogCategories.AI_ANALYSIS, 'Parallel execution failed', error as Error, { model });
          results.push({ result: null, model, metrics });
        }
      }
      return results;
    }

    // Parallel execution
    const promises = prompts.map(async ({ prompt, model, taskClass }) => {
      const start = Date.now();
      try {
        const result = await executor(prompt, model);
        const metrics = this.recordMetrics(model, prompt.length, Date.now() - start, true, taskClass);
        return { result, model, metrics };
      } catch (error) {
        const metrics = this.recordMetrics(model, prompt.length, Date.now() - start, false, taskClass);
        logger.error(LogCategories.AI_ANALYSIS, 'Parallel execution failed', error as Error, { model });
        return { result: null, model, metrics };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Record cost and performance metrics
   */
  private recordMetrics(
    model: AIModel,
    tokens: number,
    latency: number,
    success: boolean,
    taskClass: TaskClass
  ): CostMetrics {
    // Estimated costs per 1K tokens
    const costs: Record<AIModel, number> = {
      [AIModel.GPT5]: 0.06,
      [AIModel.GPT5_MINI]: 0.012,
      [AIModel.GPT5_NANO]: 0.003,
      [AIModel.GPT4O]: 0.03,
      [AIModel.GPT4_TURBO]: 0.02,
      [AIModel.GPT3_5]: 0.002,
    };

    const cost = (tokens / 1000) * costs[model];
    const metrics: CostMetrics = {
      model,
      tokens,
      cost,
      latency,
      success,
      taskClass,
      timestamp: new Date(),
    };

    this.costHistory.push(metrics);

    // Update performance tracking
    const perf = this.modelPerformance.get(model)!;
    perf.total++;
    if (success) perf.success++;

    // Keep only last 1000 entries
    if (this.costHistory.length > 1000) {
      this.costHistory = this.costHistory.slice(-1000);
    }

    logger.debug(LogCategories.AI_ANALYSIS, 'Metrics recorded', metrics);
    return metrics;
  }

  /**
   * Get cost analytics for optimization
   */
  getAnalytics(period?: { start: Date; end: Date }): {
    totalCost: number;
    byModel: Record<string, { cost: number; count: number; successRate: number }>;
    byTask: Record<string, { cost: number; count: number; avgLatency: number }>;
    recommendations: string[];
  } {
    const relevantMetrics = period
      ? this.costHistory.filter(m => m.timestamp >= period.start && m.timestamp <= period.end)
      : this.costHistory;

    const byModel: Record<string, { cost: number; count: number; success: number }> = {};
    const byTask: Record<string, { cost: number; count: number; totalLatency: number }> = {};
    let totalCost = 0;

    relevantMetrics.forEach(metric => {
      totalCost += metric.cost;

      // By model
      if (!byModel[metric.model]) {
        byModel[metric.model] = { cost: 0, count: 0, success: 0 };
      }
      byModel[metric.model].cost += metric.cost;
      byModel[metric.model].count++;
      if (metric.success) byModel[metric.model].success++;

      // By task
      if (!byTask[metric.taskClass]) {
        byTask[metric.taskClass] = { cost: 0, count: 0, totalLatency: 0 };
      }
      byTask[metric.taskClass].cost += metric.cost;
      byTask[metric.taskClass].count++;
      byTask[metric.taskClass].totalLatency += metric.latency;
    });

    // Calculate success rates and avg latencies
    const modelAnalytics: Record<string, { cost: number; count: number; successRate: number }> = {};
    Object.entries(byModel).forEach(([model, stats]) => {
      modelAnalytics[model] = {
        cost: stats.cost,
        count: stats.count,
        successRate: stats.count > 0 ? stats.success / stats.count : 0,
      };
    });

    const taskAnalytics: Record<string, { cost: number; count: number; avgLatency: number }> = {};
    Object.entries(byTask).forEach(([task, stats]) => {
      taskAnalytics[task] = {
        cost: stats.cost,
        count: stats.count,
        avgLatency: stats.count > 0 ? stats.totalLatency / stats.count : 0,
      };
    });

    // Generate recommendations
    const recommendations: string[] = [];
    
    // Check for underperforming models
    Object.entries(modelAnalytics).forEach(([model, stats]) => {
      if (stats.successRate < 0.8 && stats.count > 10) {
        recommendations.push(`Consider reducing usage of ${model} (${(stats.successRate * 100).toFixed(1)}% success rate)`);
      }
    });

    // Check for expensive task patterns
    Object.entries(taskAnalytics).forEach(([task, stats]) => {
      if (stats.cost / stats.count > 0.05) {
        recommendations.push(`Task '${task}' has high avg cost ($${(stats.cost / stats.count).toFixed(3)}). Consider using lighter models.`);
      }
      if (stats.avgLatency > 5000) {
        recommendations.push(`Task '${task}' has high latency (${(stats.avgLatency / 1000).toFixed(1)}s). Consider optimization.`);
      }
    });

    return {
      totalCost,
      byModel: modelAnalytics,
      byTask: taskAnalytics,
      recommendations,
    };
  }

  /**
   * Get routing decision tree for visualization
   */
  getRoutingDecisionTree(): any {
    return {
      name: 'AI Model Router',
      children: [
        {
          name: 'Task Classification',
          children: [
            {
              name: 'Simple Tasks (Nano)',
              children: Object.entries(TASK_REQUIREMENTS)
                .filter(([task]) => {
                  const req = TASK_REQUIREMENTS[task as TaskClass];
                  return (req.reasoning || 0) <= 40;
                })
                .map(([task]) => ({ name: task })),
            },
            {
              name: 'Standard Tasks (Mini)',
              children: Object.entries(TASK_REQUIREMENTS)
                .filter(([task]) => {
                  const req = TASK_REQUIREMENTS[task as TaskClass];
                  const reasoning = req.reasoning || 0;
                  return reasoning > 40 && reasoning <= 75;
                })
                .map(([task]) => ({ name: task })),
            },
            {
              name: 'Complex Tasks (GPT-5)',
              children: Object.entries(TASK_REQUIREMENTS)
                .filter(([task]) => {
                  const req = TASK_REQUIREMENTS[task as TaskClass];
                  return (req.reasoning || 0) > 75;
                })
                .map(([task]) => ({ name: task })),
            },
          ],
        },
        {
          name: 'Fallback Chains',
          children: Object.entries(this.getFallbackChains()).map(([model, fallbacks]) => ({
            name: model,
            children: fallbacks.map(fb => ({ name: fb })),
          })),
        },
        {
          name: 'Cost Optimization',
          children: [
            {
              name: 'Aggressive',
              description: 'Prioritize Nano > Mini > GPT-5',
            },
            {
              name: 'Balanced',
              description: 'Balance cost and quality',
            },
            {
              name: 'Quality',
              description: 'Prioritize GPT-5 > Mini > Nano',
            },
          ],
        },
      ],
    };
  }

  private getFallbackChains(): Record<string, string[]> {
    const chains: Record<string, string[]> = {};
    Object.values(AIModel).forEach(model => {
      chains[model] = this.getFallbackChain(model);
    });
    return chains;
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): CostMetrics[] {
    return [...this.costHistory];
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.costHistory = [];
    this.modelPerformance.forEach((value, key) => {
      this.modelPerformance.set(key, { success: 0, total: 0 });
    });
    logger.info(LogCategories.AI_ANALYSIS, 'Metrics cleared');
  }
}

// Export singleton instance
export const aiRouter = AIRouter.getInstance();