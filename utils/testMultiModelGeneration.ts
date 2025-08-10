/**
 * Test file for Multi-Model Outfit Generation
 * 
 * Quick validation script to test the multi-model generation functionality
 */

import { multiModelGenerator } from './multiModelOutfitGenerator';
import { AIModel } from '../services/aiRouter';

// Mock clothing items for testing
const mockClothingItems = [
  {
    title: 'Navy Blue Cotton T-Shirt',
    color: 'navy blue',
    material: 'cotton',
    style: 'casual t-shirt',
    fit: 'regular',
    category: 'top',
    description: 'Comfortable navy blue cotton t-shirt with regular fit',
  },
  {
    title: 'Dark Denim Jeans',
    color: 'dark blue',
    material: 'denim',
    style: 'straight leg jeans',
    fit: 'slim',
    category: 'bottom',
    description: 'Dark wash denim jeans with slim fit',
  },
  {
    title: 'White Canvas Sneakers',
    color: 'white',
    material: 'canvas',
    style: 'casual sneakers',
    fit: 'true to size',
    category: 'shoes',
    description: 'Classic white canvas sneakers',
  },
];

const mockStyleDNA = {
  style_preferences: {
    aesthetic_shown: 'casual modern',
    preferred_styles: ['contemporary', 'minimalist'],
    color_palette: ['neutrals', 'blues'],
    fit_preferences: 'tailored',
  },
  appearance: {
    build: 'average',
    complexion: 'medium',
  },
};

const mockContext = {
  occasion: 'casual',
  weather: 'sunny',
  style: 'contemporary',
};

/**
 * Test basic multi-model generation
 */
export async function testBasicGeneration(): Promise<void> {
  console.log('🧪 Testing basic multi-model generation...');
  
  try {
    const startTime = Date.now();
    
    const { results, recommendedIndex } = await multiModelGenerator.generateMultiModelOutfits(
      mockClothingItems,
      mockStyleDNA,
      mockContext
    );

    const duration = (Date.now() - startTime) / 1000;
    
    console.log('✅ Generation completed successfully!');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📊 Results: ${results.length} models`);
    console.log(`🎯 Recommended: Index ${recommendedIndex} (${results[recommendedIndex]?.model})`);
    
    // Log individual results
    results.forEach((result, index) => {
      const status = result.imageUrl ? '✅' : '❌';
      const rec = index === recommendedIndex ? '👑' : '  ';
      console.log(`${rec}${status} ${result.model}: ${result.generationTime.toFixed(1)}s, $${result.cost.toFixed(3)}`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });

    const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
    const successRate = results.filter(r => r.imageUrl).length / results.length;
    
    console.log(`💰 Total cost: $${totalCost.toFixed(3)}`);
    console.log(`📈 Success rate: ${(successRate * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Generation test failed:', error);
    throw error;
  }
}

/**
 * Test user preference tracking
 */
export async function testPreferenceTracking(): Promise<void> {
  console.log('🧪 Testing preference tracking...');
  
  try {
    // Track some mock preferences
    await multiModelGenerator.trackUserPreference(AIModel.GPT5_MINI, 4, mockContext);
    await multiModelGenerator.trackUserPreference(AIModel.GPT5_NANO, 3, mockContext);
    await multiModelGenerator.trackUserPreference(AIModel.GPT5, 5, { occasion: 'formal' });

    // Get analytics summary
    const analytics = multiModelGenerator.getAnalyticsSummary();
    
    console.log('✅ Preference tracking completed!');
    console.log(`📊 Total generations tracked: ${analytics.totalGenerations}`);
    console.log(`💰 Cost savings: $${analytics.costSavings.toFixed(3)}`);
    console.log('📈 Model preferences:');
    
    Object.entries(analytics.modelPreferences).forEach(([model, count]) => {
      const avgRating = analytics.averageRatings[model] || 0;
      console.log(`   ${model}: ${count} selections, ${avgRating.toFixed(1)}⭐ avg rating`);
    });
    
  } catch (error) {
    console.error('❌ Preference tracking test failed:', error);
    throw error;
  }
}

/**
 * Test analytics service integration
 */
export async function testAnalyticsIntegration(): Promise<void> {
  console.log('🧪 Testing analytics service integration...');
  
  try {
    const { AnalyticsService } = await import('../services/AnalyticsService');
    
    // Get multi-model analytics
    const analytics = await AnalyticsService.getMultiModelAnalytics();
    
    console.log('✅ Analytics integration working!');
    console.log(`📊 Total generations: ${analytics.totalGenerations}`);
    console.log(`💰 Cost savings: $${analytics.costSavings.toFixed(3)}`);
    console.log('🏆 Preferred models:');
    
    analytics.preferredModels.slice(0, 3).forEach((model, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      console.log(`   ${medal} ${model.model}: ${model.selections} selections`);
    });
    
  } catch (error) {
    console.error('❌ Analytics integration test failed:', error);
    throw error;
  }
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Multi-Model Generation Tests\n');
  
  try {
    await testBasicGeneration();
    console.log('');
    
    await testPreferenceTracking();
    console.log('');
    
    await testAnalyticsIntegration();
    console.log('');
    
    console.log('🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    throw error;
  }
}

// Export for manual testing
if (require.main === module) {
  runAllTests().catch(console.error);
}