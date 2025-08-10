/**
 * Test Multi-Model Workflow
 * 
 * Demonstrates the GPT-5 family integration with weather+event context
 * using parallel processing and intelligent routing.
 */

import { logger } from './DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import { aiRouter, AIModel, TaskClass } from '../services/aiRouter';
import { generateOutfitWithRanking, configureAIRouter, getAIAnalytics } from './openaiEnhanced';
import { modelEvaluationAgent } from '../services/ModelEvaluationAgent';
import { aiDebugShortcuts, processAIDebugCommand } from './aiDebugCLI';

// Mock wardrobe data for testing
const TEST_WARDROBE = [
  {
    id: '1',
    title: 'Navy Blue Cotton Blazer',
    color: 'navy blue',
    material: 'cotton',
    style: 'tailored blazer',
    category: 'jackets',
    fit: 'slim fit',
    description: 'Professional navy blazer with structured shoulders',
    tags: ['business', 'professional', 'navy', 'cotton', 'blazer'],
  },
  {
    id: '2',
    title: 'White Cotton Button-Down Shirt',
    color: 'white',
    material: 'cotton',
    style: 'classic button-down',
    category: 'tops',
    fit: 'regular fit',
    description: 'Crisp white dress shirt with French cuffs',
    tags: ['business', 'white', 'cotton', 'dress-shirt', 'professional'],
  },
  {
    id: '3',
    title: 'Charcoal Wool Dress Pants',
    color: 'charcoal gray',
    material: 'wool',
    style: 'straight-leg trousers',
    category: 'bottoms',
    fit: 'tailored fit',
    description: 'High-quality wool dress pants with crisp crease',
    tags: ['business', 'wool', 'charcoal', 'dress-pants', 'formal'],
  },
  {
    id: '4',
    title: 'Black Leather Oxford Shoes',
    color: 'black',
    material: 'leather',
    style: 'oxford shoes',
    category: 'shoes',
    fit: 'true to size',
    description: 'Classic black leather dress shoes with cap toe',
    tags: ['business', 'leather', 'oxford', 'black', 'formal'],
  },
  {
    id: '5',
    title: 'Burgundy Cashmere Sweater',
    color: 'burgundy',
    material: 'cashmere',
    style: 'crew neck sweater',
    category: 'tops',
    fit: 'regular fit',
    description: 'Luxurious burgundy cashmere pullover sweater',
    tags: ['casual', 'cashmere', 'burgundy', 'sweater', 'warm'],
  },
  {
    id: '6',
    title: 'Dark Wash Straight-Leg Jeans',
    color: 'dark indigo',
    material: 'denim',
    style: 'straight-leg jeans',
    category: 'bottoms',
    fit: 'regular fit',
    description: 'Classic dark wash jeans with minimal distressing',
    tags: ['casual', 'denim', 'dark-wash', 'jeans', 'versatile'],
  },
  {
    id: '7',
    title: 'White Leather Sneakers',
    color: 'white',
    material: 'leather',
    style: 'minimalist sneakers',
    category: 'shoes',
    fit: 'true to size',
    description: 'Clean white leather sneakers with minimal branding',
    tags: ['casual', 'white', 'leather', 'sneakers', 'minimalist'],
  },
  {
    id: '8',
    title: 'Camel Wool Overcoat',
    color: 'camel',
    material: 'wool',
    style: 'long overcoat',
    category: 'jackets',
    fit: 'relaxed fit',
    description: 'Elegant camel-colored wool overcoat for cold weather',
    tags: ['formal', 'wool', 'camel', 'overcoat', 'winter'],
  },
];

// Mock Style DNA for testing
const TEST_STYLE_DNA = {
  appearance: {
    build: 'average',
    complexion: 'medium',
    hair_color: 'dark brown',
    hair_length: 'medium',
    overall_vibe: 'professional modern',
  },
  style_preferences: {
    aesthetic_shown: 'business professional',
    preferred_styles: ['classic', 'minimalist', 'business-casual'],
    color_harmony: ['neutrals', 'navy', 'white', 'gray'],
    fit_preferences: 'tailored fit',
  },
};

// Test scenarios with different weather and event contexts
const TEST_SCENARIOS = [
  {
    name: 'Morning Business Meeting',
    context: {
      occasion: 'business meeting',
      location: 'office building',
      weather: 'cloudy',
      temperature: 65,
      time: 'morning',
      style: 'business professional',
    },
    expectedModels: [AIModel.GPT5_MINI, AIModel.GPT5], // Standard + ranking
  },
  {
    name: 'Rainy Day Casual',
    context: {
      occasion: 'casual day out',
      location: 'city walk',
      weather: 'rainy',
      temperature: 55,
      time: 'afternoon',
      style: 'casual',
    },
    expectedModels: [AIModel.GPT5_MINI], // Standard weather context
  },
  {
    name: 'Hot Summer Date Night',
    context: {
      occasion: 'dinner date',
      location: 'upscale restaurant',
      weather: 'clear',
      temperature: 85,
      time: 'evening',
      style: 'smart casual',
    },
    expectedModels: [AIModel.GPT5_MINI, AIModel.GPT5], // Standard + ranking for important occasion
  },
  {
    name: 'Extreme Cold Weather',
    context: {
      occasion: 'work commute',
      location: 'outdoor',
      weather: 'snow',
      temperature: 25,
      time: 'morning',
      style: 'business casual',
    },
    expectedModels: [AIModel.GPT5], // Complex weather reasoning needed
  },
];

export class MultiModelWorkflowTester {
  private results: Array<{
    scenario: string;
    success: boolean;
    outfit: any;
    modelUsage: AIModel[];
    cost: number;
    latency: number;
    reasoning: string;
  }> = [];

  /**
   * Run comprehensive test suite
   */
  async runTestSuite(): Promise<void> {
    console.log('🧪 Starting Multi-Model Workflow Test Suite');
    console.log('='.repeat(60));

    try {
      // Configure router for testing
      await this.setupTestEnvironment();

      // Run scenario tests
      for (const scenario of TEST_SCENARIOS) {
        await this.testScenario(scenario);
        await this.delay(2000); // Prevent rate limiting
      }

      // Run parallel processing test
      await this.testParallelProcessing();

      // Run model evaluation test
      await this.testModelEvaluation();

      // Generate summary report
      this.generateTestReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      logger.error(LogCategories.AI_ANALYSIS, 'Test suite failed', error as Error);
    }
  }

  /**
   * Setup test environment
   */
  private async setupTestEnvironment(): Promise<void> {
    console.log('⚙️ Setting up test environment...');

    // Configure router for testing
    configureAIRouter({
      costOptimization: 'balanced',
      enableParallel: true,
    });

    // Clear previous metrics
    await processAIDebugCommand('clear-metrics');

    // Show initial status
    await aiDebugShortcuts.showStatus();

    console.log('✅ Test environment ready\n');
  }

  /**
   * Test individual scenario
   */
  private async testScenario(scenario: {
    name: string;
    context: any;
    expectedModels: AIModel[];
  }): Promise<void> {
    console.log(`🎯 Testing Scenario: ${scenario.name}`);
    console.log(`   Context: ${JSON.stringify(scenario.context, null, 2)}`);

    const startTime = Date.now();

    try {
      // Test the enhanced outfit generation with ranking
      const outfit = await generateOutfitWithRanking(
        TEST_WARDROBE,
        scenario.context,
        TEST_STYLE_DNA
      );

      const latency = Date.now() - startTime;
      
      // Validate results
      const isValid = this.validateOutfitResult(outfit, scenario.context);
      
      // Check model usage from metadata
      const modelsUsed = this.extractModelsUsed(outfit);
      
      // Estimate cost (would be tracked automatically in production)
      const estimatedCost = this.estimateScenarioCost(modelsUsed);

      this.results.push({
        scenario: scenario.name,
        success: isValid,
        outfit,
        modelUsage: modelsUsed,
        cost: estimatedCost,
        latency,
        reasoning: outfit._metadata?.rankingRationale || 'No ranking rationale provided',
      });

      console.log(`   ${isValid ? '✅' : '❌'} Result: ${isValid ? 'Valid' : 'Invalid'}`);
      console.log(`   ⏱️ Latency: ${latency}ms`);
      console.log(`   💰 Estimated Cost: $${estimatedCost.toFixed(4)}`);
      console.log(`   🤖 Models Used: ${modelsUsed.join(', ')}`);
      console.log(`   📝 Reasoning: ${outfit._metadata?.rankingRationale || 'N/A'}`);
      
      if (outfit.outfit) {
        console.log(`   👔 Outfit: ${this.formatOutfit(outfit.outfit)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error}`);
      this.results.push({
        scenario: scenario.name,
        success: false,
        outfit: null,
        modelUsage: [],
        cost: 0,
        latency: Date.now() - startTime,
        reasoning: `Error: ${error}`,
      });
    }

    console.log(''); // Empty line for readability
  }

  /**
   * Test parallel processing capabilities
   */
  private async testParallelProcessing(): Promise<void> {
    console.log('🔄 Testing Parallel Processing...');

    const parallelPrompts = [
      { prompt: 'Generate casual outfit tags', model: AIModel.GPT5_NANO, taskClass: TaskClass.TAG_GENERATION },
      { prompt: 'Generate business outfit tags', model: AIModel.GPT5_NANO, taskClass: TaskClass.TAG_GENERATION },
      { prompt: 'Generate party outfit tags', model: AIModel.GPT5_NANO, taskClass: TaskClass.TAG_GENERATION },
    ];

    const startTime = Date.now();

    try {
      const results = await aiRouter.executeParallel(
        parallelPrompts,
        async (prompt: string, model: AIModel) => {
          // Simulate API call
          await this.delay(500 + Math.random() * 1000);
          return `Mock response for: ${prompt} using ${model}`;
        }
      );

      const totalLatency = Date.now() - startTime;
      const successCount = results.filter(r => r.result).length;

      console.log(`   ✅ Parallel execution completed`);
      console.log(`   ⏱️ Total time: ${totalLatency}ms`);
      console.log(`   📊 Success rate: ${successCount}/${results.length}`);
      console.log(`   💰 Total cost: $${results.reduce((sum, r) => sum + r.metrics.cost, 0).toFixed(4)}`);

    } catch (error) {
      console.log(`   ❌ Parallel processing failed: ${error}`);
    }

    console.log('');
  }

  /**
   * Test model evaluation system
   */
  private async testModelEvaluation(): Promise<void> {
    console.log('🏆 Testing Model Evaluation System...');

    try {
      // Get current rankings
      const rankings = modelEvaluationAgent.getRankings();
      console.log(`   📊 Current Rankings: ${JSON.stringify(rankings.overall, null, 2)}`);
      console.log(`   🎯 Confidence: ${rankings.confidence.toFixed(1)}%`);
      console.log(`   📈 Sample Size: ${rankings.sampleSize}`);

      // Generate recommendations
      const recommendations = modelEvaluationAgent.generateRecommendations();
      if (recommendations.length > 0) {
        console.log(`   💡 Recommendations:`);
        recommendations.forEach(rec => console.log(`      - ${rec}`));
      }

      // Run a small benchmark (would be more comprehensive in production)
      console.log(`   🧪 Running mini benchmark...`);
      await modelEvaluationAgent.runRandomBenchmark();
      console.log(`   ✅ Benchmark complete`);

    } catch (error) {
      console.log(`   ❌ Model evaluation test failed: ${error}`);
    }

    console.log('');
  }

  /**
   * Validate outfit result
   */
  private validateOutfitResult(outfit: any, context: any): boolean {
    if (!outfit || typeof outfit !== 'object') return false;
    
    // Check for required metadata
    if (!outfit._metadata) return false;
    
    // Check for basic outfit structure
    if (!outfit.outfit) return false;
    
    // Validate weather appropriateness
    if (context.temperature < 40 && !this.hasWarmClothing(outfit.outfit)) {
      return false;
    }
    
    if (context.temperature > 80 && this.hasWarmClothing(outfit.outfit)) {
      return false;
    }

    // Check occasion appropriateness
    if (context.occasion === 'business meeting' && !this.isBusinessAppropriate(outfit.outfit)) {
      return false;
    }

    return true;
  }

  /**
   * Extract models used from outfit metadata
   */
  private extractModelsUsed(outfit: any): AIModel[] {
    const models: AIModel[] = [];
    
    if (outfit._metadata?.modelUsed) {
      models.push(outfit._metadata.modelUsed);
    }
    
    if (outfit._metadata?.alternativeOutfits) {
      outfit._metadata.alternativeOutfits.forEach((alt: any) => {
        if (alt.model && !models.includes(alt.model)) {
          models.push(alt.model);
        }
      });
    }
    
    return models;
  }

  /**
   * Estimate cost for scenario
   */
  private estimateScenarioCost(models: AIModel[]): number {
    const costs: Record<AIModel, number> = {
      [AIModel.GPT5]: 0.06,
      [AIModel.GPT5_MINI]: 0.012,
      [AIModel.GPT5_NANO]: 0.003,
      [AIModel.GPT4O]: 0.03,
      [AIModel.GPT4_TURBO]: 0.02,
      [AIModel.GPT3_5]: 0.002,
    };

    // Estimate ~1000 tokens per model call
    return models.reduce((total, model) => total + costs[model], 0);
  }

  /**
   * Helper methods for validation
   */
  private hasWarmClothing(outfit: any): boolean {
    const warmItems = ['coat', 'sweater', 'boots', 'jacket', 'wool', 'cashmere'];
    const outfitString = JSON.stringify(outfit).toLowerCase();
    return warmItems.some(item => outfitString.includes(item));
  }

  private isBusinessAppropriate(outfit: any): boolean {
    const businessItems = ['blazer', 'dress', 'shirt', 'pants', 'suit', 'professional'];
    const outfitString = JSON.stringify(outfit).toLowerCase();
    return businessItems.some(item => outfitString.includes(item));
  }

  private formatOutfit(outfit: any): string {
    const items = [];
    if (outfit.top) items.push(`Top: ${outfit.top}`);
    if (outfit.bottom) items.push(`Bottom: ${outfit.bottom}`);
    if (outfit.shoes) items.push(`Shoes: ${outfit.shoes}`);
    if (outfit.jacket) items.push(`Jacket: ${outfit.jacket}`);
    return items.join(', ') || 'No specific items';
  }

  /**
   * Generate comprehensive test report
   */
  private generateTestReport(): void {
    console.log('📊 Test Suite Summary Report');
    console.log('='.repeat(60));

    const successCount = this.results.filter(r => r.success).length;
    const totalCost = this.results.reduce((sum, r) => sum + r.cost, 0);
    const avgLatency = this.results.reduce((sum, r) => sum + r.latency, 0) / this.results.length;

    console.log(`Total Scenarios: ${this.results.length}`);
    console.log(`Success Rate: ${successCount}/${this.results.length} (${((successCount / this.results.length) * 100).toFixed(1)}%)`);
    console.log(`Total Cost: $${totalCost.toFixed(4)}`);
    console.log(`Average Latency: ${avgLatency.toFixed(0)}ms`);

    // Model usage statistics
    const modelUsage: Record<string, number> = {};
    this.results.forEach(result => {
      result.modelUsage.forEach(model => {
        modelUsage[model] = (modelUsage[model] || 0) + 1;
      });
    });

    console.log('\nModel Usage:');
    Object.entries(modelUsage).forEach(([model, count]) => {
      console.log(`  ${model}: ${count} times`);
    });

    // Failed scenarios
    const failed = this.results.filter(r => !r.success);
    if (failed.length > 0) {
      console.log('\nFailed Scenarios:');
      failed.forEach(result => {
        console.log(`  ❌ ${result.scenario}: ${result.reasoning}`);
      });
    }

    // Show current analytics
    console.log('\nAI Router Analytics:');
    const analytics = getAIAnalytics();
    console.log(`  Total requests: ${Object.values(analytics.byModel).reduce((sum, stats) => sum + stats.count, 0)}`);
    console.log(`  Total cost: $${analytics.totalCost.toFixed(4)}`);
    
    if (analytics.recommendations.length > 0) {
      console.log('\nRecommendations:');
      analytics.recommendations.forEach(rec => console.log(`  💡 ${rec}`));
    }

    console.log('\n✅ Test suite complete!');
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Quick test runner function
 */
export async function runMultiModelTest(): Promise<void> {
  const tester = new MultiModelWorkflowTester();
  await tester.runTestSuite();
}

/**
 * Individual feature tests
 */
export const testFunctions = {
  testRouting: async () => {
    console.log('🧪 Testing Model Routing...');
    await processAIDebugCommand('test-routing');
  },
  
  testCostModes: async () => {
    console.log('🧪 Testing Cost Optimization Modes...');
    
    const modes = ['aggressive', 'balanced', 'quality'];
    for (const mode of modes) {
      console.log(`\nTesting ${mode} mode:`);
      await processAIDebugCommand(`cost-mode ${mode}`);
      
      // Test a simple task
      const model = aiRouter.selectModel(TaskClass.TAG_GENERATION);
      console.log(`  Selected model for tag generation: ${model}`);
    }
  },
  
  testDebugCommands: async () => {
    console.log('🧪 Testing Debug Commands...');
    
    const commands = [
      'model-status',
      'force-model nano',
      'model-status',
      'force-model clear',
      'analytics 1',
    ];
    
    for (const command of commands) {
      console.log(`\n> ${command}`);
      await processAIDebugCommand(command);
    }
  },
  
  testModelEvaluation: async () => {
    console.log('🧪 Testing Model Evaluation...');
    
    // Get current rankings
    const rankings = modelEvaluationAgent.getRankings();
    console.log('Current rankings:', rankings);
    
    // Run a benchmark
    await modelEvaluationAgent.runRandomBenchmark();
    
    // Get recommendations
    const recs = modelEvaluationAgent.generateRecommendations();
    console.log('Recommendations:', recs);
  },
};

// Export for easy testing
export default {
  runMultiModelTest,
  testFunctions,
  MultiModelWorkflowTester,
};