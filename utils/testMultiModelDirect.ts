/**
 * Direct test of multi-model generation without UI dependencies
 * Use this to isolate and test just the core generation logic
 */

import { generateDebugMultiModelOutfits } from './debugMultiModel';

/**
 * Test the core generation functionality
 */
export async function testDirectGeneration(): Promise<boolean> {
  console.log('🧪 Testing direct multi-model generation...');
  
  try {
    const result = await generateDebugMultiModelOutfits();
    
    console.log('✅ Direct generation successful!', {
      results: result.results.length,
      recommendedIndex: result.recommendedIndex,
      models: result.results.map(r => r.model).join(', '),
      totalCost: result.results.reduce((sum, r) => sum + r.cost, 0).toFixed(3)
    });
    
    return true;
  } catch (error) {
    console.error('❌ Direct generation failed:', error);
    return false;
  }
}

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).testMultiModel = testDirectGeneration;
  console.log('💡 Test available: window.testMultiModel()');
}

export default { testDirectGeneration };