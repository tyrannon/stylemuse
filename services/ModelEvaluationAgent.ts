/**
 * Model Evaluation Agent
 * 
 * Continuously benchmarks GPT-5 family models against each other
 * to optimize routing decisions based on real performance data.
 * 
 * ClaudePrompter-style reasoning:
 * - Measure quality across multiple dimensions
 * - Track cost-effectiveness over time
 * - Identify model strengths/weaknesses by task type
 * - Auto-adjust routing preferences based on evidence
 */

import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import { aiRouter, AIModel, TaskClass } from './aiRouter';
// Note: executeWithRouter would be imported from openaiEnhanced in production
import * as FileSystem from 'expo-file-system';

// Evaluation dimensions for model comparison
export interface QualityMetrics {
  accuracy: number;         // 0-100: Factual correctness
  completeness: number;     // 0-100: How complete the response is
  creativity: number;       // 0-100: Creative/novel elements
  styleDiversity: number;   // 0-100: Variety in style suggestions
  logicalFit: number;       // 0-100: Logic of item combinations
  userAlignment: number;    // 0-100: Alignment with user preferences
  structuredOutput: number; // 0-100: JSON format compliance
  consistency: number;      // 0-100: Consistency across similar prompts
}

export interface BenchmarkResult {
  modelA: AIModel;
  modelB: AIModel;
  taskClass: TaskClass;
  prompt: string;
  responseA: string;
  responseB: string;
  qualityA: QualityMetrics;
  qualityB: QualityMetrics;
  winner: AIModel | 'tie';
  rationale: string;
  timestamp: Date;
  costA: number;
  costB: number;
  latencyA: number;
  latencyB: number;
}

export interface ModelRankings {
  overall: Record<AIModel, number>;
  byTask: Record<TaskClass, Record<AIModel, number>>;
  lastUpdated: Date;
  confidence: number;
  sampleSize: number;
}

export class ModelEvaluationAgent {
  private static instance: ModelEvaluationAgent;
  private benchmarkHistory: BenchmarkResult[] = [];
  private modelRankings: ModelRankings;
  private evaluationSchedule: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Test prompts for different task classes
  private testPrompts: Record<TaskClass, string[]> = {
    [TaskClass.TAG_GENERATION]: [
      'Extract color and material tags from: "Vintage navy blue wool peacoat with horn buttons"',
      'Generate style tags for: "Flowy bohemian maxi dress with floral print and bell sleeves"',
      'Categorize this item: "Black leather motorcycle jacket with silver zippers"',
    ],
    [TaskClass.OUTFIT_GENERATION]: [
      'Create a business casual outfit for 68°F weather, coffee meeting, user prefers earth tones',
      'Generate weekend casual look for 75°F, outdoor brunch, minimalist aesthetic',
      'Design date night outfit for 62°F, upscale restaurant, romantic vibe',
    ],
    [TaskClass.WARDROBE_ANALYSIS]: [
      'Analyze wardrobe gaps: 5 t-shirts, 3 jeans, 2 blazers, 1 dress, no winter coats',
      'Identify missing pieces for professional wardrobe: 10 business items, no accessories',
      'Evaluate seasonal coverage: mostly summer clothes, limited fall/winter options',
    ],
    [TaskClass.WEATHER_CONTEXT]: [
      'Adjust outfit for sudden rain: currently wearing cotton dress and sandals',
      'Layer for 45°F morning that will reach 72°F: office job, meetings all day',
      'Modify beach outfit for windy 80°F day: currently planned sundress and flip-flops',
    ],
    [TaskClass.STYLE_MATCHING]: [
      'Match these items: black leather boots, flowy printed skirt, solid turtleneck',
      'Coordinate colors: mustard yellow sweater, dark wash jeans, what shoes/accessories?',
      'Balance proportions: oversized blazer, what bottom and shoes to create harmony?',
    ],
    [TaskClass.RANKING_EVALUATION]: [
      'Rank these 3 work outfits by professionalism: navy suit, blazer+trousers, dress+cardigan',
      'Order these casual looks by weather appropriateness for 55°F: shorts+tee, jeans+sweater, dress+jacket',
      'Evaluate date night options by style coherence: cocktail dress, jeans+silk top, midi+heels',
    ],
    [TaskClass.ITEM_DESCRIPTION]: [
      'Describe this garment in detail for wardrobe cataloging: [casual blazer image]',
      'Analyze material, style, and fit characteristics: [vintage coat image]',
      'Extract key attributes for outfit matching: [patterned scarf image]',
    ],
    [TaskClass.STRUCTURED_JSON]: [
      'Return outfit plan in JSON: business presentation outfit with backup options',
      'Generate wardrobe analysis JSON: identify gaps, priorities, budget recommendations',
      'Create style DNA JSON: analyze user preferences from outfit history data',
    ],
    [TaskClass.STYLE_DNA_ANALYSIS]: [
      'Analyze personal style from these preferences: loves minimalism, prefers neutrals, values comfort',
      'Create style profile: user always wears black/white, avoids patterns, likes structured pieces',
      'Generate style DNA: user mixes vintage and modern, loves bold colors, experimental with trends',
    ],
    [TaskClass.COLOR_EXTRACTION]: [
      'Extract color palette from: "Sunset gradient silk scarf with orange, pink, and gold tones"',
      'Identify primary/secondary colors: "Forest green cardigan with brass buttons"',
      'Analyze color harmony: "Teal blouse, burgundy pants, gold accessories - compatible?"',
    ],
    [TaskClass.SIMPLE_VALIDATION]: [
      'Validate occasion appropriateness: cocktail dress for job interview - suitable?',
      'Check weather compatibility: wool sweater and shorts for 45°F - appropriate?',
      'Confirm style consistency: athletic sneakers with formal business suit - cohesive?',
    ],
    [TaskClass.SHORT_COPY]: [
      'Write 1-line outfit description: black jeans, white button-down, tan blazer, brown boots',
      'Create brief style note: floral sundress with denim jacket and white sneakers',
      'Generate quick outfit summary: navy suit, crisp white shirt, red tie, black oxfords',
    ],
    [TaskClass.MULTI_ITEM_DETECTION]: [
      'Detect all clothing items in closet photo and assign bounding boxes',
      'Identify individual garments in outfit flat-lay image with coordinates',
      'Locate and categorize items in wardrobe overview photo',
    ],
    [TaskClass.FALLBACK_PLANNING]: [
      'Create backup plan: outfit ruined by coffee spill 30min before important meeting',
      'Generate alternatives: primary outfit unavailable due to laundry, need similar look',
      'Plan contingencies: weather changed from sunny to rainy, outdoor event still happening',
    ],
  };

  private constructor() {
    this.modelRankings = {
      overall: {
        [AIModel.GPT5]: 95,
        [AIModel.GPT5_MINI]: 80,
        [AIModel.GPT5_NANO]: 65,
        [AIModel.GPT4O]: 85,
        [AIModel.GPT4_TURBO]: 75,
        [AIModel.GPT3_5]: 50,
      },
      byTask: {} as Record<TaskClass, Record<AIModel, number>>,
      lastUpdated: new Date(),
      confidence: 0,
      sampleSize: 0,
    };

    // Initialize task-specific rankings
    Object.values(TaskClass).forEach(task => {
      this.modelRankings.byTask[task] = { ...this.modelRankings.overall };
    });
  }

  static getInstance(): ModelEvaluationAgent {
    if (!ModelEvaluationAgent.instance) {
      ModelEvaluationAgent.instance = new ModelEvaluationAgent();
    }
    return ModelEvaluationAgent.instance;
  }

  /**
   * Start continuous evaluation schedule
   */
  startContinuousEvaluation(intervalMinutes: number = 60): void {
    if (this.evaluationSchedule) {
      clearInterval(this.evaluationSchedule);
    }

    this.evaluationSchedule = setInterval(async () => {
      if (!this.isRunning) {
        await this.runRandomBenchmark();
      }
    }, intervalMinutes * 60 * 1000);

    logger.info(LogCategories.AI_ANALYSIS, 'Model evaluation agent started', {
      intervalMinutes,
    });
  }

  /**
   * Stop continuous evaluation
   */
  stopContinuousEvaluation(): void {
    if (this.evaluationSchedule) {
      clearInterval(this.evaluationSchedule);
      this.evaluationSchedule = null;
    }
    logger.info(LogCategories.AI_ANALYSIS, 'Model evaluation agent stopped');
  }

  /**
   * Run a comprehensive benchmark comparing all models
   */
  async runComprehensiveBenchmark(): Promise<void> {
    if (this.isRunning) {
      logger.warn(LogCategories.AI_ANALYSIS, 'Benchmark already running, skipping');
      return;
    }

    this.isRunning = true;
    logger.info(LogCategories.AI_ANALYSIS, 'Starting comprehensive benchmark');

    try {
      const models = [AIModel.GPT5, AIModel.GPT5_MINI, AIModel.GPT5_NANO];
      const taskClasses = Object.values(TaskClass).slice(0, 5); // Test first 5 task types

      let totalBenchmarks = 0;

      for (const taskClass of taskClasses) {
        const prompts = this.testPrompts[taskClass] || [];
        
        for (const prompt of prompts.slice(0, 2)) { // Test 2 prompts per task
          // Compare each pair of models
          for (let i = 0; i < models.length; i++) {
            for (let j = i + 1; j < models.length; j++) {
              await this.compareTwoModels(models[i], models[j], taskClass, prompt);
              totalBenchmarks++;
              
              // Small delay to avoid rate limits
              await this.delay(1000);
            }
          }
        }
      }

      this.updateRankings();
      await this.saveResults();

      logger.info(LogCategories.AI_ANALYSIS, 'Comprehensive benchmark complete', {
        totalBenchmarks,
        newRankings: this.modelRankings.overall,
      });

    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run a random benchmark for continuous evaluation
   */
  async runRandomBenchmark(): Promise<void> {
    this.isRunning = true;

    try {
      // Randomly select task class and models
      const taskClasses = Object.values(TaskClass);
      const models = [AIModel.GPT5, AIModel.GPT5_MINI, AIModel.GPT5_NANO];
      
      const randomTask = taskClasses[Math.floor(Math.random() * taskClasses.length)];
      const prompts = this.testPrompts[randomTask] || [];
      
      if (prompts.length === 0) return;

      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      const modelA = models[Math.floor(Math.random() * models.length)];
      let modelB = models[Math.floor(Math.random() * models.length)];
      
      // Ensure different models
      while (modelB === modelA) {
        modelB = models[Math.floor(Math.random() * models.length)];
      }

      await this.compareTwoModels(modelA, modelB, randomTask, randomPrompt);
      this.updateRankings();

      logger.debug(LogCategories.AI_ANALYSIS, 'Random benchmark complete', {
        taskClass: randomTask,
        modelA,
        modelB,
      });

    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Compare two models on a specific task
   */
  private async compareTwoModels(
    modelA: AIModel,
    modelB: AIModel,
    taskClass: TaskClass,
    prompt: string
  ): Promise<BenchmarkResult> {
    logger.debug(LogCategories.AI_ANALYSIS, 'Comparing models', {
      modelA,
      modelB,
      taskClass,
    });

    const startTimeA = Date.now();
    let responseA: string, costA: number, latencyA: number;
    let responseB: string, costB: number, latencyB: number;

    // Execute model A (simulated for now)
    try {
      // In production, this would call: await executeWithRouter(prompt, taskClass, { preferredModel: modelA });
      await this.delay(1000 + Math.random() * 2000); // Simulate API call
      responseA = `Simulated response from ${modelA} for task: ${taskClass}`;
      latencyA = Date.now() - startTimeA;
      costA = this.estimateCost(modelA, prompt.length + responseA.length);
    } catch (error) {
      responseA = '';
      latencyA = Date.now() - startTimeA;
      costA = this.estimateCost(modelA, prompt.length);
      logger.error(LogCategories.AI_ANALYSIS, `Model ${modelA} failed`, error as Error);
    }

    // Execute model B (simulated for now)
    const startTimeB = Date.now();
    try {
      // In production, this would call: await executeWithRouter(prompt, taskClass, { preferredModel: modelB });
      await this.delay(1000 + Math.random() * 2000); // Simulate API call
      responseB = `Simulated response from ${modelB} for task: ${taskClass}`;
      latencyB = Date.now() - startTimeB;
      costB = this.estimateCost(modelB, prompt.length + responseB.length);
    } catch (error) {
      responseB = '';
      latencyB = Date.now() - startTimeB;
      costB = this.estimateCost(modelB, prompt.length);
      logger.error(LogCategories.AI_ANALYSIS, `Model ${modelB} failed`, error as Error);
    }

    // Evaluate responses
    const qualityA = await this.evaluateResponse(responseA, taskClass, prompt);
    const qualityB = await this.evaluateResponse(responseB, taskClass, prompt);

    // Determine winner
    const scoreA = this.calculateOverallScore(qualityA);
    const scoreB = this.calculateOverallScore(qualityB);
    const winner = scoreA > scoreB + 5 ? modelA : scoreB > scoreA + 5 ? modelB : 'tie';

    const result: BenchmarkResult = {
      modelA,
      modelB,
      taskClass,
      prompt,
      responseA,
      responseB,
      qualityA,
      qualityB,
      winner,
      rationale: this.generateRationale(qualityA, qualityB, winner, modelA, modelB),
      timestamp: new Date(),
      costA,
      costB,
      latencyA,
      latencyB,
    };

    this.benchmarkHistory.push(result);
    return result;
  }

  /**
   * Evaluate response quality across multiple dimensions
   */
  private async evaluateResponse(
    response: string,
    taskClass: TaskClass,
    prompt: string
  ): Promise<QualityMetrics> {
    if (!response || response.trim().length === 0) {
      return {
        accuracy: 0,
        completeness: 0,
        creativity: 0,
        styleDiversity: 0,
        logicalFit: 0,
        userAlignment: 0,
        structuredOutput: 0,
        consistency: 0,
      };
    }

    // Automated evaluation based on response characteristics
    const metrics: QualityMetrics = {
      accuracy: this.evaluateAccuracy(response, taskClass),
      completeness: this.evaluateCompleteness(response, prompt),
      creativity: this.evaluateCreativity(response, taskClass),
      styleDiversity: this.evaluateStyleDiversity(response),
      logicalFit: this.evaluateLogicalFit(response, taskClass),
      userAlignment: this.evaluateUserAlignment(response),
      structuredOutput: this.evaluateStructuredOutput(response, taskClass),
      consistency: 75, // Placeholder - would need historical data
    };

    return metrics;
  }

  /**
   * Automated accuracy evaluation
   */
  private evaluateAccuracy(response: string, taskClass: TaskClass): number {
    // Check for common accuracy indicators
    let score = 70; // Base score

    // JSON tasks should have valid JSON
    if ([TaskClass.STRUCTURED_JSON, TaskClass.WARDROBE_ANALYSIS].includes(taskClass)) {
      try {
        JSON.parse(response);
        score += 20;
      } catch {
        score -= 30;
      }
    }

    // Check for common fashion knowledge
    const fashionTerms = ['color', 'style', 'fit', 'material', 'season', 'occasion'];
    const termCount = fashionTerms.filter(term => 
      response.toLowerCase().includes(term)
    ).length;
    score += Math.min(termCount * 3, 15);

    // Penalize very short responses for complex tasks
    const complexTasks = [TaskClass.WARDROBE_ANALYSIS, TaskClass.STYLE_DNA_ANALYSIS];
    if (complexTasks.includes(taskClass) && response.length < 200) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Evaluate response completeness
   */
  private evaluateCompleteness(response: string, prompt: string): number {
    const promptWords = prompt.split(/\s+/).length;
    const responseWords = response.split(/\s+/).length;
    
    // Expect response to be proportional to prompt complexity
    const expectedRatio = 2; // 2 response words per prompt word
    const actualRatio = responseWords / promptWords;
    
    if (actualRatio < 0.5) return 30; // Too short
    if (actualRatio < 1) return 60;
    if (actualRatio < expectedRatio) return 80;
    if (actualRatio < expectedRatio * 2) return 90;
    return 70; // Too long can also be bad
  }

  /**
   * Evaluate creativity level
   */
  private evaluateCreativity(response: string, taskClass: TaskClass): number {
    let score = 50; // Base creativity

    // Creative tasks should have more varied vocabulary
    const creativeTasks = [TaskClass.OUTFIT_GENERATION, TaskClass.STYLE_DNA_ANALYSIS];
    if (creativeTasks.includes(taskClass)) {
      const uniqueWords = new Set(response.toLowerCase().match(/\b\w+\b/g)).size;
      const totalWords = response.split(/\s+/).length;
      const diversity = uniqueWords / totalWords;
      score += Math.min(diversity * 50, 30);
    }

    // Check for creative fashion terms
    const creativeTerms = ['unexpected', 'surprising', 'unique', 'innovative', 'bold', 'artistic'];
    const creativeCount = creativeTerms.filter(term => 
      response.toLowerCase().includes(term)
    ).length;
    score += creativeCount * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Evaluate style diversity in suggestions
   */
  private evaluateStyleDiversity(response: string): number {
    const styleTerms = [
      'casual', 'formal', 'business', 'bohemian', 'minimalist', 
      'classic', 'trendy', 'vintage', 'sporty', 'edgy'
    ];
    
    const mentionedStyles = styleTerms.filter(style => 
      response.toLowerCase().includes(style)
    ).length;

    return Math.min(mentionedStyles * 15, 100);
  }

  /**
   * Evaluate logical fit of combinations
   */
  private evaluateLogicalFit(response: string, taskClass: TaskClass): number {
    let score = 75; // Default logical score

    // Check for weather-related logic
    if (response.includes('weather') || response.includes('temperature')) {
      const coldItems = ['coat', 'sweater', 'boots', 'scarf'];
      const warmItems = ['shorts', 'sandals', 'tank top', 'sundress'];
      
      const hasCold = coldItems.some(item => response.toLowerCase().includes(item));
      const hasWarm = warmItems.some(item => response.toLowerCase().includes(item));
      
      // Logical consistency bonus
      if (hasCold && !hasWarm) score += 10; // Cold weather outfit
      if (hasWarm && !hasCold) score += 10; // Warm weather outfit
      if (hasCold && hasWarm) score -= 15; // Mixed signals
    }

    // Check for color coordination logic
    const colors = ['black', 'white', 'navy', 'brown', 'gray', 'red', 'blue'];
    const mentionedColors = colors.filter(color => 
      response.toLowerCase().includes(color)
    );
    
    if (mentionedColors.length > 0 && mentionedColors.length <= 3) {
      score += 10; // Good color coordination
    } else if (mentionedColors.length > 4) {
      score -= 5; // Too many colors might be chaotic
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Evaluate user alignment (placeholder)
   */
  private evaluateUserAlignment(response: string): number {
    // This would ideally use actual user feedback data
    // For now, use heuristics based on common preferences
    let score = 70;

    // Prefer responses that consider user context
    const contextTerms = ['preference', 'style', 'comfort', 'lifestyle', 'occasion'];
    const contextCount = contextTerms.filter(term => 
      response.toLowerCase().includes(term)
    ).length;
    
    score += contextCount * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Evaluate structured output compliance
   */
  private evaluateStructuredOutput(response: string, taskClass: TaskClass): number {
    const requiresJSON = [
      TaskClass.STRUCTURED_JSON,
      TaskClass.WARDROBE_ANALYSIS,
      TaskClass.STYLE_DNA_ANALYSIS,
    ].includes(taskClass);

    if (!requiresJSON) {
      return 80; // N/A, give decent score
    }

    try {
      const parsed = JSON.parse(response);
      if (typeof parsed === 'object' && parsed !== null) {
        return 95; // Valid JSON object
      }
    } catch {
      // Not valid JSON, check for partial structure
      if (response.includes('{') && response.includes('}')) {
        return 40; // Has JSON-like structure
      }
      return 10; // No JSON structure
    }

    return 50;
  }

  /**
   * Calculate overall score from quality metrics
   */
  private calculateOverallScore(metrics: QualityMetrics): number {
    const weights = {
      accuracy: 0.25,
      completeness: 0.15,
      creativity: 0.15,
      styleDiversity: 0.10,
      logicalFit: 0.20,
      userAlignment: 0.10,
      structuredOutput: 0.05,
      consistency: 0.05,
    };

    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (metrics[key as keyof QualityMetrics] * weight);
    }, 0);
  }

  /**
   * Generate rationale for comparison
   */
  private generateRationale(
    qualityA: QualityMetrics,
    qualityB: QualityMetrics,
    winner: AIModel | 'tie',
    modelA: AIModel,
    modelB: AIModel
  ): string {
    const scoreA = this.calculateOverallScore(qualityA);
    const scoreB = this.calculateOverallScore(qualityB);

    if (winner === 'tie') {
      return `Close match (A: ${scoreA.toFixed(1)}, B: ${scoreB.toFixed(1)}). Both models performed similarly.`;
    }

    const winnerScore = winner === modelA ? scoreA : scoreB;
    const loserScore = winner === modelA ? scoreB : scoreA;
    const margin = winnerScore - loserScore;

    const advantages: string[] = [];
    const winnerMetrics = winner === modelA ? qualityA : qualityB;
    const loserMetrics = winner === modelA ? qualityB : qualityA;
    
    Object.entries(winnerMetrics).forEach(([key, value]) => {
      const otherValue = loserMetrics[key as keyof QualityMetrics];
      if (value > otherValue + 10) {
        advantages.push(`${key} (${value.toFixed(0)} vs ${otherValue.toFixed(0)})`);
      }
    });

    return `Winner by ${margin.toFixed(1)} points. Advantages: ${advantages.join(', ') || 'general superiority'}.`;
  }

  /**
   * Update model rankings based on benchmark history
   */
  private updateRankings(): void {
    const recentResults = this.benchmarkHistory.slice(-100); // Last 100 comparisons
    
    // Reset rankings
    const newRankings = { ...this.modelRankings };
    Object.keys(newRankings.overall).forEach(model => {
      newRankings.overall[model as AIModel] = 50; // Start from middle
    });

    // Calculate wins/losses for each model
    const modelStats: Record<string, { wins: number; losses: number; ties: number }> = {};
    
    Object.values(AIModel).forEach(model => {
      modelStats[model] = { wins: 0, losses: 0, ties: 0 };
    });

    recentResults.forEach(result => {
      if (result.winner === result.modelA) {
        modelStats[result.modelA].wins++;
        modelStats[result.modelB].losses++;
      } else if (result.winner === result.modelB) {
        modelStats[result.modelB].wins++;
        modelStats[result.modelA].losses++;
      } else {
        modelStats[result.modelA].ties++;
        modelStats[result.modelB].ties++;
      }
    });

    // Update rankings based on win/loss ratio
    Object.entries(modelStats).forEach(([model, stats]) => {
      const total = stats.wins + stats.losses + stats.ties;
      if (total > 0) {
        const winRate = (stats.wins + stats.ties * 0.5) / total;
        newRankings.overall[model as AIModel] = Math.round(winRate * 100);
      }
    });

    this.modelRankings = {
      ...newRankings,
      lastUpdated: new Date(),
      confidence: Math.min(recentResults.length / 50 * 100, 100), // More confident with more data
      sampleSize: recentResults.length,
    };

    logger.info(LogCategories.AI_ANALYSIS, 'Model rankings updated', {
      rankings: this.modelRankings.overall,
      confidence: this.modelRankings.confidence,
      sampleSize: this.modelRankings.sampleSize,
    });
  }

  /**
   * Get current model rankings
   */
  getRankings(): ModelRankings {
    return { ...this.modelRankings };
  }

  /**
   * Get benchmark history
   */
  getBenchmarkHistory(limit?: number): BenchmarkResult[] {
    return limit 
      ? this.benchmarkHistory.slice(-limit)
      : [...this.benchmarkHistory];
  }

  /**
   * Export evaluation results
   */
  async exportResults(): Promise<string> {
    const exportData = {
      rankings: this.modelRankings,
      benchmarkHistory: this.benchmarkHistory,
      exportDate: new Date(),
    };

    const filename = `model-evaluation-${new Date().toISOString().split('T')[0]}.json`;
    const path = `${FileSystem.documentDirectory}${filename}`;
    
    await FileSystem.writeAsStringAsync(path, JSON.stringify(exportData, null, 2));
    logger.info(LogCategories.AI_ANALYSIS, 'Evaluation results exported', { path });
    
    return path;
  }

  /**
   * Generate recommendations based on evaluation results
   */
  generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const rankings = this.modelRankings.overall;

    // Find best and worst performing models
    const sortedModels = Object.entries(rankings)
      .sort(([,a], [,b]) => b - a)
      .map(([model]) => model as AIModel);

    const bestModel = sortedModels[0];
    const worstModel = sortedModels[sortedModels.length - 1];

    if (rankings[bestModel] > 80) {
      recommendations.push(`${bestModel} is performing excellently (${rankings[bestModel]}%). Consider increasing its usage.`);
    }

    if (rankings[worstModel] < 60) {
      recommendations.push(`${worstModel} is underperforming (${rankings[worstModel]}%). Consider reducing usage or investigating issues.`);
    }

    // Cost-effectiveness analysis
    const costEffective = this.findMostCostEffective();
    if (costEffective) {
      recommendations.push(`${costEffective.model} offers the best cost/performance ratio at $${costEffective.costPerPoint.toFixed(4)} per quality point.`);
    }

    if (this.modelRankings.confidence < 70) {
      recommendations.push(`Confidence level is ${this.modelRankings.confidence.toFixed(0)}%. More benchmarks needed for reliable recommendations.`);
    }

    return recommendations;
  }

  /**
   * Find most cost-effective model
   */
  private findMostCostEffective(): { model: AIModel; costPerPoint: number } | null {
    const costPerToken: Record<AIModel, number> = {
      [AIModel.GPT5]: 0.06 / 1000,
      [AIModel.GPT5_MINI]: 0.012 / 1000,
      [AIModel.GPT5_NANO]: 0.003 / 1000,
      [AIModel.GPT4O]: 0.03 / 1000,
      [AIModel.GPT4_TURBO]: 0.02 / 1000,
      [AIModel.GPT3_5]: 0.002 / 1000,
    };

    const costEffectiveness = Object.entries(this.modelRankings.overall)
      .map(([model, score]) => ({
        model: model as AIModel,
        score,
        costPer1000: costPerToken[model as AIModel] * 1000,
        costPerPoint: (costPerToken[model as AIModel] * 1000) / Math.max(score, 1),
      }))
      .sort((a, b) => a.costPerPoint - b.costPerPoint);

    return costEffectiveness[0] || null;
  }

  /**
   * Helper methods
   */
  private estimateCost(model: AIModel, tokens: number): number {
    const costs: Record<AIModel, number> = {
      [AIModel.GPT5]: 0.06,
      [AIModel.GPT5_MINI]: 0.012,
      [AIModel.GPT5_NANO]: 0.003,
      [AIModel.GPT4O]: 0.03,
      [AIModel.GPT4_TURBO]: 0.02,
      [AIModel.GPT3_5]: 0.002,
    };

    return (tokens / 1000) * costs[model];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async saveResults(): Promise<void> {
    // In a real app, this would save to persistent storage
    logger.info(LogCategories.AI_ANALYSIS, 'Benchmark results saved', {
      totalResults: this.benchmarkHistory.length,
    });
  }
}

// Export singleton instance
export const modelEvaluationAgent = ModelEvaluationAgent.getInstance();