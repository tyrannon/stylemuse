/**
 * Simple test for CostTracker utility
 * Run this with: npx ts-node utils/testCostTracker.ts
 */

import { costTracker } from './CostTracker';

async function testCostTracker() {
  console.log('🧪 Testing CostTracker...');

  // Record some test generations
  await costTracker.recordGeneration('gpt-5-mini', true);
  await costTracker.recordGeneration('gpt-5-nano', true);
  await costTracker.recordGeneration('gpt-5', true);
  await costTracker.recordGeneration('gpt-5-mini', false); // Failed generation

  // Get stats
  const stats = await costTracker.getUsageStats();
  
  console.log('📊 Usage Stats:', {
    totalGenerations: stats.totalGenerations,
    totalCost: `$${stats.totalCost.toFixed(2)}`,
    dailyCost: `$${stats.dailyCost.toFixed(2)}`,
    costByModel: stats.costByModel,
    generationsByModel: stats.generationsByModel,
  });

  console.log('✅ CostTracker test complete!');
}

// Only run if called directly
if (require.main === module) {
  testCostTracker().catch(console.error);
}