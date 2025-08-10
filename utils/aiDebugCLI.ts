/**
 * AI Router Debug CLI
 * 
 * Provides command-line interface for debugging and configuring
 * AI model routing behavior during development.
 */

import { logger } from './DebugLogger';
import { LogCategories } from '../constants/LogCategories';
import { aiRouter, AIModel, TaskClass } from '../services/aiRouter';
import * as FileSystem from 'expo-file-system';

export class AIDebugCLI {
  private static commands: Map<string, (args: string[]) => Promise<void> | void> = new Map();

  private static initializeCommands() {
    if (this.commands.size === 0) {
      // Register debug commands
      this.commands.set('model-status', this.showModelStatus);
      this.commands.set('force-model', this.forceModel);
      this.commands.set('cost-mode', this.setCostMode);
      this.commands.set('analytics', this.showAnalytics);
      this.commands.set('test-routing', this.testRouting);
      this.commands.set('clear-metrics', this.clearMetrics);
      this.commands.set('export-metrics', this.exportMetrics);
      this.commands.set('benchmark', this.runBenchmark);
      this.commands.set('help', this.showHelp);
    }
  }

  /**
   * Parse and execute debug command
   */
  static async execute(commandString: string): Promise<void> {
    this.initializeCommands(); // Ensure commands are initialized
    
    const parts = commandString.trim().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    if (!command || command.startsWith('#')) {
      return; // Skip empty lines and comments
    }

    const handler = this.commands.get(command);
    if (!handler) {
      console.log(`❌ Unknown command: ${command}. Type 'help' for available commands.`);
      return;
    }

    try {
      await handler(args);
    } catch (error) {
      console.error(`❌ Command failed: ${error}`);
      logger.error(LogCategories.AI_ANALYSIS, 'Debug command failed', error as Error, { command, args });
    }
  }

  /**
   * Show current model status and configuration
   */
  private static showModelStatus = (): void => {
    const config = (aiRouter as any).config; // Access private config for debugging
    console.log('\n🤖 AI Router Status:');
    console.log('─'.repeat(50));
    console.log(`Force Model: ${config.forceModel || 'None (auto-select)'}`);
    console.log(`Cost Mode: ${config.costOptimization || 'balanced'}`);
    console.log(`Parallel Processing: ${config.enableParallel ? 'Enabled' : 'Disabled'}`);
    console.log(`Fallbacks: ${config.enableFallbacks ? 'Enabled' : 'Disabled'}`);
    console.log(`Max Cost/Request: ${config.maxCostPerRequest || 'None'}`);
    console.log(`Max Latency: ${config.maxLatency || 'None'}`);
  };

  /**
   * Force a specific model for testing
   */
  private static forceModel = (args: string[]): void => {
    if (args.length === 0) {
      console.log('Usage: force-model <model-name> | clear');
      console.log('Available models: gpt-5, gpt-5-mini, gpt-5-nano, gpt-4o, gpt-4-turbo, gpt-3.5-turbo');
      return;
    }

    const modelArg = args[0].toLowerCase();
    
    if (modelArg === 'clear') {
      aiRouter.configure({ forceModel: undefined });
      console.log('✅ Force model cleared - auto-selection enabled');
      return;
    }

    // Map command line input to AIModel enum
    const modelMap: Record<string, AIModel> = {
      'gpt-5': AIModel.GPT5,
      'gpt5': AIModel.GPT5,
      'gpt-5-mini': AIModel.GPT5_MINI,
      'gpt5-mini': AIModel.GPT5_MINI,
      'mini': AIModel.GPT5_MINI,
      'gpt-5-nano': AIModel.GPT5_NANO,
      'gpt5-nano': AIModel.GPT5_NANO,
      'nano': AIModel.GPT5_NANO,
      'gpt-4o': AIModel.GPT4O,
      'gpt4o': AIModel.GPT4O,
      '4o': AIModel.GPT4O,
      'gpt-4-turbo': AIModel.GPT4_TURBO,
      'gpt4-turbo': AIModel.GPT4_TURBO,
      'turbo': AIModel.GPT4_TURBO,
      'gpt-3.5-turbo': AIModel.GPT3_5,
      'gpt3.5': AIModel.GPT3_5,
      '3.5': AIModel.GPT3_5,
    };

    const selectedModel = modelMap[modelArg];
    if (!selectedModel) {
      console.log(`❌ Invalid model: ${modelArg}`);
      return;
    }

    aiRouter.configure({ forceModel: selectedModel });
    console.log(`✅ Forced model: ${selectedModel}`);
  };

  /**
   * Set cost optimization mode
   */
  private static setCostMode = (args: string[]): void => {
    if (args.length === 0) {
      console.log('Usage: cost-mode <aggressive|balanced|quality>');
      console.log('  aggressive: Prioritize cheapest models');
      console.log('  balanced:   Balance cost and quality (default)');
      console.log('  quality:    Prioritize best models');
      return;
    }

    const mode = args[0].toLowerCase();
    if (!['aggressive', 'balanced', 'quality'].includes(mode)) {
      console.log('❌ Invalid mode. Use: aggressive, balanced, or quality');
      return;
    }

    aiRouter.configure({ costOptimization: mode as any });
    console.log(`✅ Cost optimization set to: ${mode}`);
  };

  /**
   * Show analytics and metrics
   */
  private static showAnalytics = (args: string[]): void => {
    const days = args.length > 0 ? parseInt(args[0]) : 7;
    const period = {
      start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      end: new Date(),
    };

    const analytics = aiRouter.getAnalytics(period);
    
    console.log(`\n📊 AI Analytics (Last ${days} days):`);
    console.log('─'.repeat(60));
    console.log(`Total Cost: $${analytics.totalCost.toFixed(3)}`);
    
    console.log('\nBy Model:');
    Object.entries(analytics.byModel).forEach(([model, stats]) => {
      console.log(`  ${model}: $${stats.cost.toFixed(3)} (${stats.count} requests, ${(stats.successRate * 100).toFixed(1)}% success)`);
    });

    console.log('\nBy Task:');
    Object.entries(analytics.byTask).forEach(([task, stats]) => {
      console.log(`  ${task}: $${stats.cost.toFixed(3)} (${stats.count} requests, ${(stats.avgLatency / 1000).toFixed(2)}s avg)`);
    });

    if (analytics.recommendations.length > 0) {
      console.log('\nRecommendations:');
      analytics.recommendations.forEach(rec => console.log(`  💡 ${rec}`));
    }
  };

  /**
   * Test routing for different task types
   */
  private static testRouting = (args: string[]): void => {
    console.log('\n🧪 Model Routing Test:');
    console.log('─'.repeat(50));

    const taskClasses = [
      TaskClass.TAG_GENERATION,
      TaskClass.OUTFIT_GENERATION,
      TaskClass.WARDROBE_ANALYSIS,
      TaskClass.STYLE_DNA_ANALYSIS,
      TaskClass.RANKING_EVALUATION,
    ];

    const userTiers: Array<'free' | 'plus' | 'premium'> = ['free', 'plus', 'premium'];

    taskClasses.forEach(taskClass => {
      console.log(`\n${taskClass}:`);
      userTiers.forEach(tier => {
        const selectedModel = aiRouter.selectModel(taskClass, { userTier: tier });
        console.log(`  ${tier.padEnd(8)}: ${selectedModel}`);
      });
    });
  };

  /**
   * Clear metrics history
   */
  private static clearMetrics = (): void => {
    aiRouter.clearMetrics();
    console.log('✅ Metrics history cleared');
  };

  /**
   * Export metrics to file
   */
  private static exportMetrics = async (args: string[]): Promise<void> => {
    const filename = args[0] || `ai-metrics-${new Date().toISOString().split('T')[0]}.json`;
    const metrics = aiRouter.exportMetrics();
    
    const exportPath = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(exportPath, JSON.stringify(metrics, null, 2));
    
    console.log(`✅ Metrics exported to: ${exportPath}`);
    console.log(`📊 Exported ${metrics.length} metric entries`);
  };

  /**
   * Run benchmark test
   */
  private static runBenchmark = async (args: string[]): Promise<void> => {
    const iterations = args.length > 0 ? parseInt(args[0]) : 3;
    
    console.log(`🏃 Running benchmark (${iterations} iterations)...`);
    console.log('─'.repeat(50));

    const testPrompt = "Generate 3 color-coordinated outfit suggestions for a business casual work day in 65°F weather.";
    const models = [AIModel.GPT5_NANO, AIModel.GPT5_MINI, AIModel.GPT5];
    
    const results: Record<string, { avgLatency: number; successRate: number }> = {};

    for (const model of models) {
      console.log(`Testing ${model}...`);
      const modelResults: { latency: number; success: boolean }[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        try {
          // Simulate API call (in production, this would be a real call)
          await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
          const latency = Date.now() - start;
          modelResults.push({ latency, success: true });
          console.log(`  Iteration ${i + 1}: ${latency}ms ✅`);
        } catch (error) {
          const latency = Date.now() - start;
          modelResults.push({ latency, success: false });
          console.log(`  Iteration ${i + 1}: ${latency}ms ❌`);
        }
      }

      const avgLatency = modelResults.reduce((sum, r) => sum + r.latency, 0) / modelResults.length;
      const successRate = modelResults.filter(r => r.success).length / modelResults.length;
      
      results[model] = { avgLatency, successRate };
      console.log(`  Average: ${avgLatency.toFixed(0)}ms, Success: ${(successRate * 100).toFixed(1)}%\n`);
    }

    // Show summary
    console.log('📊 Benchmark Results:');
    Object.entries(results).forEach(([model, stats]) => {
      console.log(`  ${model}: ${stats.avgLatency.toFixed(0)}ms avg, ${(stats.successRate * 100).toFixed(1)}% success`);
    });
  };

  /**
   * Show help
   */
  private static showHelp = (): void => {
    console.log('\n🤖 AI Router Debug Commands:');
    console.log('─'.repeat(50));
    console.log('model-status                  Show current router configuration');
    console.log('force-model <model|clear>     Force specific model or clear override');
    console.log('cost-mode <mode>              Set cost optimization (aggressive|balanced|quality)');
    console.log('analytics [days]              Show metrics for last N days (default: 7)');
    console.log('test-routing                  Test model selection for different tasks');
    console.log('clear-metrics                 Clear metrics history');
    console.log('export-metrics [filename]     Export metrics to JSON file');
    console.log('benchmark [iterations]        Run performance benchmark (default: 3)');
    console.log('help                         Show this help message');
    console.log('\nExamples:');
    console.log('  force-model gpt-5-nano     # Force nano model for testing');
    console.log('  cost-mode aggressive       # Prioritize cost savings');
    console.log('  analytics 30               # Show 30-day analytics');
    console.log('  benchmark 5                # Run 5-iteration benchmark');
  };
}

/**
 * Helper function to process debug commands from console
 */
export async function processAIDebugCommand(command: string): Promise<void> {
  await AIDebugCLI.execute(command);
}

/**
 * Interactive debug session
 */
export function startAIDebugSession(): void {
  console.log('🤖 AI Router Debug Session Started');
  console.log('Type "help" for available commands, "exit" to quit');
  
  // In a real React Native environment, you'd integrate with a debug console
  // For now, this provides the framework for CLI integration
}

// Export common debug shortcuts
export const aiDebugShortcuts = {
  forceNano: () => AIDebugCLI.execute('force-model nano'),
  forceMini: () => AIDebugCLI.execute('force-model mini'),
  forceGPT5: () => AIDebugCLI.execute('force-model gpt-5'),
  clearForce: () => AIDebugCLI.execute('force-model clear'),
  showStatus: () => AIDebugCLI.execute('model-status'),
  showAnalytics: () => AIDebugCLI.execute('analytics'),
  aggressiveMode: () => AIDebugCLI.execute('cost-mode aggressive'),
  qualityMode: () => AIDebugCLI.execute('cost-mode quality'),
  balancedMode: () => AIDebugCLI.execute('cost-mode balanced'),
};