/**
 * AsyncStorage Performance Test - Reality Check
 * 
 * Tests actual performance characteristics of current wardrobe data
 * to determine if SQLite migration is justified or premature optimization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { WardrobeItem } from '../hooks/useWardrobeData';
import { STORAGE_KEYS } from '../constants/storage';

interface PerformanceTestResult {
  itemCount: number;
  totalSizeKB: number;
  avgItemSizeBytes: number;
  writeTimeMs: number;
  readTimeMs: number;
  serializedSizeKB: number;
}

export class AsyncStoragePerformanceTest {
  /**
   * Generate realistic wardrobe item data for testing
   */
  private static generateMockWardrobeItem(index: number): WardrobeItem {
    const categories = ['top', 'bottom', 'shoes', 'jacket', 'accessories', 'hat'];
    const colors = ['black', 'white', 'blue', 'red', 'green', 'brown', 'gray'];
    const materials = ['cotton', 'polyester', 'wool', 'denim', 'leather', 'silk'];
    const styles = ['casual', 'formal', 'athletic', 'vintage', 'modern'];
    
    // Simulate realistic image URIs (file:// or https://)
    const imageUri = Math.random() > 0.5 
      ? `file:///var/mobile/Containers/Data/Application/ABC123/Documents/ExponentExperienceData/%40anonymous%2Fstylemuse-${index}/ImagePicker/item_${index}.jpg`
      : `https://stylemuse-images.s3.amazonaws.com/user123/wardrobe/item_${index}.jpg`;

    return {
      image: imageUri,
      title: `Fashion Item ${index}`,
      description: `This is a ${materials[index % materials.length]} ${categories[index % categories.length]} in ${colors[index % colors.length]} color with modern styling and comfortable fit`,
      tags: [
        styles[index % styles.length],
        colors[index % colors.length], 
        categories[index % categories.length],
        `tag_${index % 10}`
      ],
      color: colors[index % colors.length],
      material: materials[index % materials.length],
      style: styles[index % styles.length],
      fit: index % 3 === 0 ? 'slim' : index % 3 === 1 ? 'regular' : 'loose',
      category: categories[index % categories.length],
      isNew: index % 5 === 0 // 20% are new items
    };
  }

  /**
   * Calculate realistic data size for given item count
   */
  private static calculateDataSize(items: WardrobeItem[]): { bytes: number; kb: number } {
    const serialized = JSON.stringify(items);
    const bytes = new Blob([serialized]).size;
    return { bytes, kb: bytes / 1024 };
  }

  /**
   * Test AsyncStorage performance with specified item count
   */
  static async testPerformance(itemCount: number): Promise<PerformanceTestResult> {
    console.log(`🧪 Testing AsyncStorage with ${itemCount} wardrobe items...`);

    // Generate test data
    const testItems: WardrobeItem[] = [];
    for (let i = 0; i < itemCount; i++) {
      testItems.push(this.generateMockWardrobeItem(i));
    }

    // Calculate data size
    const { bytes: totalBytes, kb: totalSizeKB } = this.calculateDataSize(testItems);
    const avgItemSizeBytes = totalBytes / itemCount;
    const serializedSizeKB = totalSizeKB;

    // Test WRITE performance
    const writeStartTime = performance.now();
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.WARDROBE_ITEMS}_test`,
      JSON.stringify(testItems)
    );
    const writeEndTime = performance.now();
    const writeTimeMs = writeEndTime - writeStartTime;

    // Test READ performance
    const readStartTime = performance.now();
    const retrievedData = await AsyncStorage.getItem(`${STORAGE_KEYS.WARDROBE_ITEMS}_test`);
    const parsedData = retrievedData ? JSON.parse(retrievedData) : [];
    const readEndTime = performance.now();
    const readTimeMs = readEndTime - readStartTime;

    // Cleanup test data
    await AsyncStorage.removeItem(`${STORAGE_KEYS.WARDROBE_ITEMS}_test`);

    // Verify data integrity
    if (parsedData.length !== itemCount) {
      throw new Error(`Data integrity check failed: expected ${itemCount}, got ${parsedData.length}`);
    }

    const result: PerformanceTestResult = {
      itemCount,
      totalSizeKB,
      avgItemSizeBytes,
      writeTimeMs,
      readTimeMs,
      serializedSizeKB
    };

    console.log(`📊 Results for ${itemCount} items:`);
    console.log(`   Total Size: ${totalSizeKB.toFixed(2)} KB`);
    console.log(`   Avg Item Size: ${avgItemSizeBytes.toFixed(0)} bytes`);
    console.log(`   Write Time: ${writeTimeMs.toFixed(2)}ms`);
    console.log(`   Read Time: ${readTimeMs.toFixed(2)}ms`);

    return result;
  }

  /**
   * Run comprehensive performance test suite
   */
  static async runBenchmarkSuite(): Promise<{
    results: PerformanceTestResult[];
    recommendations: string[];
  }> {
    console.log('🚀 Starting AsyncStorage Performance Benchmark Suite...\n');

    const testSizes = [50, 100, 200, 500, 1000, 2000]; // Realistic user scenarios
    const results: PerformanceTestResult[] = [];
    const recommendations: string[] = [];

    try {
      for (const size of testSizes) {
        const result = await this.testPerformance(size);
        results.push(result);
        
        // Add 100ms delay between tests to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Analyze results and generate recommendations
      const slowReads = results.filter(r => r.readTimeMs > 100); // > 100ms is noticeable
      const slowWrites = results.filter(r => r.writeTimeMs > 200); // > 200ms is problematic
      const largeSizes = results.filter(r => r.totalSizeKB > 5000); // > 5MB is concerning

      if (slowReads.length === 0 && slowWrites.length === 0) {
        recommendations.push('✅ AsyncStorage performs well for all tested scenarios');
        recommendations.push('🚫 SQLite migration appears to be PREMATURE OPTIMIZATION');
        recommendations.push('💡 Focus on user-facing features instead');
      } else {
        if (slowReads.length > 0) {
          const threshold = slowReads[0].itemCount;
          recommendations.push(`⚠️ Read performance degrades after ${threshold} items`);
        }
        if (slowWrites.length > 0) {
          const threshold = slowWrites[0].itemCount;
          recommendations.push(`⚠️ Write performance degrades after ${threshold} items`);
        }
        if (largeSizes.length > 0) {
          recommendations.push('📈 Consider SQLite for power users with 1000+ items');
        }
      }

      // Memory usage analysis
      const maxSize = Math.max(...results.map(r => r.totalSizeKB));
      if (maxSize < 1000) { // < 1MB
        recommendations.push('💚 Memory usage is well within acceptable limits');
      } else if (maxSize < 5000) { // < 5MB  
        recommendations.push('🟡 Memory usage is moderate - monitor on lower-end devices');
      } else {
        recommendations.push('🔴 Memory usage is high - SQLite migration recommended');
      }

    } catch (error) {
      console.error('❌ Benchmark suite failed:', error);
      recommendations.push('❌ Performance testing failed - investigate AsyncStorage issues');
    }

    return { results, recommendations };
  }

  /**
   * Quick sanity check - test with current app's actual data volume
   */
  static async quickSanityCheck(): Promise<{
    currentItemCount: number;
    currentSizeKB: number;
    readTimeMs: number;
    isPerformant: boolean;
    recommendation: string;
  }> {
    try {
      // Get current wardrobe data
      const currentData = await AsyncStorage.getItem(STORAGE_KEYS.WARDROBE_ITEMS);
      const currentItems = currentData ? JSON.parse(currentData) : [];
      
      // Measure read performance
      const readStart = performance.now();
      await AsyncStorage.getItem(STORAGE_KEYS.WARDROBE_ITEMS);
      const readTimeMs = performance.now() - readStart;

      // Calculate size
      const { kb: currentSizeKB } = this.calculateDataSize(currentItems);
      
      // Performance assessment
      const isPerformant = readTimeMs < 50 && currentSizeKB < 1000; // < 50ms, < 1MB
      
      let recommendation: string;
      if (isPerformant) {
        recommendation = 'AsyncStorage is performing well - SQLite migration not needed';
      } else if (readTimeMs > 100) {
        recommendation = 'Performance issues detected - consider SQLite migration';  
      } else {
        recommendation = 'Performance is borderline - monitor user feedback';
      }

      return {
        currentItemCount: currentItems.length,
        currentSizeKB,
        readTimeMs,
        isPerformant,
        recommendation
      };

    } catch (error) {
      console.error('Quick sanity check failed:', error);
      return {
        currentItemCount: 0,
        currentSizeKB: 0,
        readTimeMs: 999,
        isPerformant: false,
        recommendation: 'Unable to assess - investigate AsyncStorage errors'
      };
    }
  }
}