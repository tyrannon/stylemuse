/**
 * Simple test for TemperatureUtils
 * Run this with: npx ts-node utils/testTemperatureUtils.ts
 */

import { temperatureUtils } from './TemperatureUtils';

async function testTemperatureUtils() {
  console.log('🧪 Testing TemperatureUtils...');

  // Test auto-detection
  console.log('\n🌍 Country-based detection:');
  await temperatureUtils.initialize('US');
  console.log('US detected:', temperatureUtils.getCurrentUnit());

  await temperatureUtils.initialize('CA');  
  console.log('Canada detected:', temperatureUtils.getCurrentUnit());

  await temperatureUtils.initialize('DE');
  console.log('Germany detected:', temperatureUtils.getCurrentUnit());

  // Test conversions
  console.log('\n🌡️ Temperature conversions:');
  const testTemps = [0, 10, 20, 25, 30];
  
  for (const temp of testTemps) {
    await temperatureUtils.setUnit('celsius');
    const celsius = temperatureUtils.formatTemperature(temp);
    
    await temperatureUtils.setUnit('fahrenheit');
    const fahrenheit = temperatureUtils.formatTemperature(temp);
    
    console.log(`${temp}°C → ${celsius} (C mode), ${fahrenheit} (F mode)`);
  }

  // Test conversion info
  console.log('\n📊 Conversion info:');
  const info = temperatureUtils.getConversionInfo(22);
  console.log('22°C conversion info:', info);

  console.log('\n✅ TemperatureUtils test complete!');
}

// Only run if called directly
if (require.main === module) {
  testTemperatureUtils().catch(console.error);
}