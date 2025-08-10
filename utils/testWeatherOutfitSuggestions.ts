/**
 * Test Weather Outfit Suggestions
 * Run this with: npx ts-node utils/testWeatherOutfitSuggestions.ts
 */

import { WeatherOutfitSuggestionService } from '../services/WeatherOutfitSuggestionService';
import type { WeatherData } from '../services/WeatherService';

async function testWeatherOutfitSuggestions() {
  console.log('🧪 Testing Weather Outfit Suggestions...');

  // Test scenarios
  const testCases: WeatherData[] = [
    {
      temperature: 22,
      condition: 'sunny',
      humidity: 45,
      timestamp: Date.now(),
      location: 'San Francisco',
      description: 'Clear sky',
      country: 'US'
    },
    {
      temperature: 5,
      condition: 'snowy',
      humidity: 85,
      timestamp: Date.now(),
      location: 'New York',
      description: 'Heavy snow',
      country: 'US'
    },
    {
      temperature: 15,
      condition: 'rainy',
      humidity: 90,
      timestamp: Date.now(),
      location: 'Seattle',
      description: 'Light rain',
      country: 'US'
    },
    {
      temperature: 30,
      condition: 'sunny',
      humidity: 30,
      timestamp: Date.now(),
      location: 'Phoenix',
      description: 'Hot and sunny',
      country: 'US'
    }
  ];

  console.log('\n🌤️ Testing outfit suggestions:');
  
  for (const weather of testCases) {
    try {
      console.log(`\n📍 ${weather.location}: ${weather.temperature}°C, ${weather.condition}`);
      const suggestion = await WeatherOutfitSuggestionService.getOutfitSuggestion(weather);
      console.log(`💡 Suggestion: ${suggestion}`);
    } catch (error) {
      console.error(`❌ Failed for ${weather.location}:`, error);
    }
  }

  // Test cache functionality
  console.log('\n🗄️ Testing cache functionality:');
  const cacheStats = await WeatherOutfitSuggestionService.getCacheStats();
  console.log('Cache stats:', cacheStats);

  // Test same weather again (should use cache)
  console.log('\n🔄 Testing cache hit:');
  const cachedSuggestion = await WeatherOutfitSuggestionService.getOutfitSuggestion(testCases[0]);
  console.log(`💾 Cached suggestion: ${cachedSuggestion}`);

  console.log('\n✅ Weather outfit suggestions test complete!');
}

// Only run if called directly
if (require.main === module) {
  testWeatherOutfitSuggestions().catch(console.error);
}