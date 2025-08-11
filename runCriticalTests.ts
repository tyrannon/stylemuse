import { TierManager } from './utils/TierManager';
import { subscriptionService } from './services/SubscriptionService';

console.log('🧪 Running Critical Subscription Security Tests');

async function runTests() {
  try {
    console.log('\n🔒 Testing AI Generation Limits...');
    
    // Test 1: Set free user at limit
    await TierManager.setUserTier('free');
    await TierManager.updateUsageStats({ 
      aiGenerationsThisMonth: 3 // At free tier limit
    });
    
    const aiCheck = await TierManager.canGenerateAI();
    console.log(`AI Generation Check - Allowed: ${aiCheck.allowed}, Remaining: ${aiCheck.remaining}`);
    
    if (!aiCheck.allowed && aiCheck.remaining === 0) {
      console.log('✅ PASS: AI generation properly blocked at limit');
    } else {
      console.log('❌ CRITICAL: AI generation limits not enforced!');
    }
    
    console.log('\n📱 Testing Subscription Status...');
    const status = await subscriptionService.getSubscriptionStatus();
    console.log(`Current Status - Active: ${status.isActive}, Tier: ${status.tier}`);
    
    console.log('\n💳 Testing Product Availability...');
    const products = await subscriptionService.getAvailableProducts();
    console.log(`Available Products: ${products.length}`);
    products.forEach(p => console.log(`- ${p.productId}: ${p.price}`));
    
    if (products.length === 4) {
      console.log('✅ PASS: All required SKUs available');
    } else {
      console.log('❌ CRITICAL: Missing subscription products!');
    }
    
    // Test Pro tier access
    console.log('\n🏆 Testing Pro Tier Access...');
    await TierManager.setUserTier('pro');
    const proCheck = await TierManager.canGenerateAI();
    console.log(`Pro AI Generation - Allowed: ${proCheck.allowed}, Remaining: ${proCheck.remaining}`);
    
    if (proCheck.allowed && proCheck.remaining === -1) {
      console.log('✅ PASS: Pro tier has unlimited access');
    } else {
      console.log('❌ FAIL: Pro tier limits not working correctly');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTests().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });