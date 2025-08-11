# App Store & Google Play Subscription Setup Guide
**Phase 4A Implementation Support**

## 🍎 App Store Connect Configuration

### Step 1: Create Subscription Group
1. Login to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **Apps** → **StyleMuse** → **Subscriptions**
3. Click **"Create Subscription Group"**
4. **Group Reference Name**: `stylemuse_subscriptions`
5. **Group Display Name**: `StyleMuse Subscriptions`

### Step 2: Create Subscription Products
Create 4 subscription products with these exact Product IDs:

#### StyleMuse Pro Monthly
- **Product ID**: `stylemuse_pro_monthly`
- **Reference Name**: `StyleMuse Pro Monthly`
- **Duration**: 1 Month
- **Price**: $9.99/month (Tier 10)
- **Display Name**: `StyleMuse Pro`
- **Description**: `Unlimited AI outfit generations, advanced analytics, and weather-based recommendations`

#### StyleMuse Pro Yearly
- **Product ID**: `stylemuse_pro_yearly`
- **Reference Name**: `StyleMuse Pro Yearly`
- **Duration**: 1 Year  
- **Price**: $99.99/year (Tier 55) - *2 months free compared to monthly*
- **Display Name**: `StyleMuse Pro Annual`
- **Description**: `StyleMuse Pro with 2 months free - best value!`

#### StyleMuse Elite Monthly
- **Product ID**: `stylemuse_elite_monthly`
- **Reference Name**: `StyleMuse Elite Monthly`
- **Duration**: 1 Month
- **Price**: $19.99/month (Tier 20)
- **Display Name**: `StyleMuse Elite`
- **Description**: `Everything in Pro plus trend forecasts, API access, and virtual personal stylist`

#### StyleMuse Elite Yearly
- **Product ID**: `stylemuse_elite_yearly`
- **Reference Name**: `StyleMuse Elite Yearly`
- **Duration**: 1 Year
- **Price**: $199.99/year (Tier 60) - *2 months free compared to monthly*
- **Display Name**: `StyleMuse Elite Annual`
- **Description**: `StyleMuse Elite with 2 months free - ultimate fashion experience!`

### Step 3: App Information
1. **Subscription Group Display Name**: `Choose Your StyleMuse Plan`
2. **App Name**: `StyleMuse - AI Fashion Assistant`
3. **Subscription Terms of Use**: [Required - create legal doc]

### Step 4: Testing Setup
1. Navigate to **Users and Roles** → **Sandbox Testers**
2. Create test accounts for different regions:
   - US: `test.us@stylemuse.app`
   - Europe: `test.eu@stylemuse.app` 
   - Canada: `test.ca@stylemuse.app`

## 🤖 Google Play Console Configuration

### Step 1: Create Subscription Products
1. Login to [Google Play Console](https://play.google.com/console)
2. Navigate to **StyleMuse App** → **Subscriptions**
3. Create subscription products with identical Product IDs:

#### Required SKUs (must match iOS exactly)
- `stylemuse_pro_monthly` - $9.99/month
- `stylemuse_pro_yearly` - $99.99/year
- `stylemuse_elite_monthly` - $19.99/month  
- `stylemuse_elite_yearly` - $199.99/year

### Step 2: Subscription Details
For each SKU, configure:
- **Name**: Match iOS display names
- **Description**: Match iOS descriptions
- **Benefits**: 
  - Pro: "Unlimited AI generations, Analytics, Weather integration"
  - Elite: "Everything in Pro + Trends, API access, Virtual stylist"
- **Billing Period**: Monthly/Yearly as appropriate
- **Price**: Match iOS pricing in local currencies

### Step 3: Testing Setup
1. Navigate to **Release** → **Testing** → **License Testing**
2. Add test accounts:
   - Gmail accounts for internal testing
   - Enable license testing for development builds

## 💻 Development Integration

### Required Environment Variables
Add to your `.env` file:
```bash
# App Store Connect
IOS_BUNDLE_ID=com.tyrannon.stylemuseapp
APP_STORE_SHARED_SECRET=your_shared_secret

# Google Play Console  
ANDROID_PACKAGE_NAME=com.tyrannon.stylemuseapp
GOOGLE_PLAY_LICENSE_KEY=your_license_key

# Testing
SUBSCRIPTION_TEST_MODE=true
```

### Expo Configuration Updates
Update `app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.tyrannon.stylemuseapp",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "android": {
      "package": "com.tyrannon.stylemuseapp",
      "permissions": [
        "com.android.vending.BILLING"
      ]
    }
  }
}
```

## 🧪 Testing Strategy

### Phase 1: Sandbox Testing (Current)
- [x] Subscription service implementation complete
- [x] Premium subscription modal implemented
- [x] Tier management system working
- [ ] **TODO**: Test all 4 SKUs in iOS simulator
- [ ] **TODO**: Test all 4 SKUs in Android emulator
- [ ] **TODO**: Test subscription restoration flow
- [ ] **TODO**: Test purchase cancellation/refund

### Phase 2: TestFlight/Internal Testing
- [ ] Upload build with subscriptions to TestFlight
- [ ] Test with sandbox accounts on real devices
- [ ] Verify upgrade prompts work correctly
- [ ] Test multi-model AI gating
- [ ] Validate analytics tracking

### Phase 3: Production Release
- [ ] Submit for App Store review
- [ ] Monitor subscription metrics
- [ ] Track conversion rates
- [ ] Optimize pricing based on data

## 📊 Revenue Projections

### Conservative Scenario (5% conversion rate)
- **Monthly Active Users**: 1,000
- **Subscribers**: 50
- **Average Revenue Per User**: $10/month
- **Monthly Revenue**: $500
- **Annual Revenue**: **$30,000**

### Target Scenario (10% conversion rate)
- **Monthly Active Users**: 2,000
- **Subscribers**: 200
- **Average Revenue Per User**: $12/month
- **Monthly Revenue**: $2,400
- **Annual Revenue**: **$75,000**

### Optimistic Scenario (15% conversion rate)
- **Monthly Active Users**: 3,000
- **Subscribers**: 450
- **Average Revenue Per User**: $14/month
- **Monthly Revenue**: $6,300
- **Annual Revenue**: **$180,000**

## ⚠️ Critical Implementation Notes

### Security Requirements
1. **Receipt Validation**: Implement server-side receipt validation before production
2. **Subscription Status**: Verify subscription status server-side, not just client-side
3. **Webhook Handling**: Implement App Store and Play Store webhook handlers

### Legal Requirements
1. **Privacy Policy**: Update to include subscription data handling
2. **Terms of Service**: Add subscription terms and auto-renewal disclosure
3. **Cancellation Policy**: Clear cancellation instructions in app

### User Experience
1. **Onboarding**: Show value proposition during user onboarding
2. **Usage Limits**: Clear communication when approaching limits
3. **Upgrade Prompts**: Non-intrusive but effective upgrade messaging
4. **Feature Discovery**: Help users discover premium features

## 🚀 Quick Start Testing Commands

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Test iOS subscriptions
npx expo start --ios

# Test Android subscriptions  
npx expo start --android

# View subscription test panel
# Navigate to Settings → Testing → Subscription Test Panel
```

## 📋 Testing Checklist

### Subscription Flow Testing
- [ ] Free user hits AI generation limit → upgrade prompt
- [ ] Pro user gets unlimited AI generations
- [ ] Elite user gets all premium features
- [ ] Purchase flow completes successfully
- [ ] Subscription restoration works
- [ ] Cancellation/refund handling
- [ ] Cross-platform subscription sync

### UI/UX Testing
- [ ] Subscription modal displays correctly
- [ ] Usage stats card shows progress bars
- [ ] Upgrade prompts are well-timed
- [ ] Premium features are clearly marked
- [ ] Subscription benefits are communicated

### Edge Case Testing
- [ ] Network errors during purchase
- [ ] App Store/Play Store connectivity issues
- [ ] Subscription expiry handling
- [ ] Family sharing edge cases
- [ ] Region-specific pricing display

## 🔧 Troubleshooting

### Common Issues
1. **Product IDs not found**: Ensure exact match between code and store config
2. **Sandbox purchases failing**: Verify sandbox accounts are properly configured
3. **Receipt validation errors**: Check shared secrets and API keys
4. **Subscription not restoring**: Verify user is signed in to same Apple ID/Google account

### Debug Commands
```bash
# View subscription logs
npx react-native log-ios | grep MONETIZATION
npx react-native log-android | grep MONETIZATION

# Test subscription service
# Use SubscriptionTestPanel component in app
```

---

**Next Steps**: 
1. Configure App Store Connect products using the exact SKUs above
2. Set up Google Play Console subscriptions with matching IDs
3. Test all flows using the SubscriptionTestPanel component
4. Coordinate with Senior Dev for production deployment

**Revenue Target**: $30K-$180K annually based on conversion rates and user growth.