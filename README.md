# StyleMuse 👗✨

StyleMuse is an AI-powered virtual closet app that helps you organize your wardrobe and generate stunning outfit combinations using GPT-4o Vision and DALL-E 3.

## Features 🚀

### 👔 **Wardrobe Management**
- **AI Clothing Analysis**: Automatically describes clothing items with detailed color, material, and style information
- **Bulk Upload**: Add multiple clothing items at once with progress tracking
- **Smart Organization**: Automatic categorization (tops, bottoms, shoes, jackets, hats, accessories)
- **Advanced Filtering**: Filter by category, laundry status, and sorting options
- **Item Detail Editing**: Inline editing of titles, colors, materials, styles, and tags
- **Professional Navigation**: Tab-based interface with seamless page transitions

### 🎨 **AI-Powered Outfit Generation**
- **Smart Outfit Generation**: AI creates photorealistic outfit combinations from your wardrobe
- **Style DNA System**: Personalized outfit generation based on your appearance and style preferences
- **Weather-Based Outfits**: GPS + weather integration for location-appropriate styling
- **Outfit Memory System**: Track which outfits you've worn and when
- **Smart Re-Suggestions**: AI recommends outfits based on wear frequency and timing
- **Outfit Analytics**: Comprehensive insights into your outfit wearing patterns

### 🧺 **Laundry Tracker System**
- **Complete Status Tracking**: Monitor items through 6 laundry states (clean, dirty, washing, drying, needs iron, stored)
- **Automatic Dirty Marking**: Items auto-mark as dirty when outfits are worn
- **Visual Status Indicators**: Color-coded badges show laundry status on all wardrobe items
- **Interactive Laundry Controls**: Easy-tap status changes with haptic feedback
- **Smart Wash Suggestions**: AI recommends optimal wash loads (regular vs delicate)
- **Laundry Analytics**: Rich insights with progress bars, status breakdowns, and contextual tips
- **Wash History Tracking**: Complete history of wash cycles and frequency patterns

### 📸 **In-App Camera System**
- **Professional Camera Interface**: Full-screen camera with advanced controls
- **Smart Photo Capture**: Optimized for clothing photography with grid guides
- **Photo Source Selection**: Choose between camera or photo library upload
- **Seamless Integration**: Camera photos flow directly into AI analysis
- **Haptic Feedback**: Tactile responses for all camera interactions
- **Permission Handling**: Graceful camera and storage permission management

### 📊 **Analytics & Insights**
- **Outfit Analytics**: Track outfit usage, favorites, and wearing patterns
- **Laundry Analytics**: Monitor wardrobe cleanliness and washing efficiency
- **Smart Suggestions**: AI-powered recommendations for outfits and laundry
- **Usage Statistics**: Detailed metrics on wardrobe utilization and patterns
- **Visual Progress Tracking**: Beautiful charts and progress indicators
- **Contextual Tips**: Personalized advice based on your usage patterns

### 🎯 **User Experience**
- **Professional Tab Navigation**: Seamless switching between wardrobe and analytics views
- **Interactive Gallery**: Swipeable wardrobe with selection modes and editing capabilities
- **Animated Loading States**: Beautiful progress indicators and spinning animations
- **Haptic Feedback**: Tactile responses for all interactions
- **Responsive Design**: Optimized for all screen sizes and orientations

## Tech Stack 💻

- **Frontend**: React Native with Expo
- **AI Integration**: OpenAI GPT-4o Vision & DALL-E 3
- **Weather Integration**: OpenWeatherMap API + GPS location
- **Image Processing**: Expo ImagePicker & FileSystem
- **Development**: TypeScript, Expo Go for testing
- **Build System**: EAS Build (cloud-based)
- **Distribution**: Apple TestFlight / Google Play Console

## Quick Start (Development) 🏃‍♂️

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- iOS/Android device with Expo Go app
- OpenAI API account
- OpenWeatherMap API account (free tier)

### 1. Clone & Install
```bash
git clone https://github.com/tyrannon/stylemuse.git
cd stylemuse
npm install
npx expo install expo-location
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory:
```bash
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key_here
```

**Get your API keys:**
- **OpenAI**: https://platform.openai.com/api-keys
- **OpenWeatherMap**: https://openweathermap.org/api (free tier)

### 3. Start the Development Server
```bash
npx expo start
```

### 4. Run on Your Device
- Install [Expo Go](https://expo.dev/client) on your phone
- Scan the QR code from your terminal
- Start adding clothes and generating outfits! 🎉

## Production Builds & Deployment 🚀

### EAS Build Setup (Cloud Building)

StyleMuse uses Expo Application Services (EAS) for cloud-based building and deployment. This allows you to build iOS apps without owning a Mac and handles all certificates automatically.

#### Prerequisites for Production
- **Apple Developer Account** ($99/year) for iOS TestFlight
- **Google Play Console** ($25 one-time) for Android testing
- **Expo account** (free at expo.dev)

#### 1. Install EAS CLI
```bash
npm install -g @expo/eas-cli
# or use npx if installation fails:
npx @expo/eas-cli@latest --version
```

#### 2. Login and Configure
```bash
eas login
eas build:configure
```

#### 3. Set Up Environment Variables
⚠️ **Critical**: Environment variables must be configured in the Expo dashboard for production builds.

1. Go to https://expo.dev/accounts/[your-username]/projects/stylemuse/environment-variables
2. Add these variables with "Plain text" visibility:
   - `EXPO_PUBLIC_OPENAI_API_KEY`
   - `EXPO_PUBLIC_OPENWEATHER_API_KEY`

#### 4. Build for iOS/Android
```bash
# iOS build (requires Apple Developer account)
eas build --platform ios --profile preview

# Android build
eas build --platform android --profile preview

# Build both platforms
eas build --platform all --profile preview
```

#### 5. Submit to TestFlight/Play Console
```bash
# Submit to Apple TestFlight
eas submit --platform ios

# Submit to Google Play Console (internal testing)
eas submit --platform android
```

### Build Profiles Explained

- **development**: For debugging with dev tools
- **preview**: For TestFlight/Play Console internal testing
- **production**: For App Store/Play Store releases

### Common Issues & Solutions

#### White Screen in TestFlight
**Problem**: App works in Expo Go but shows white screen in TestFlight builds.

**Root Cause**: Environment variables not properly configured for production builds.

**Solution**:
1. Set environment variables in Expo dashboard as "Plain text" (not "Secret")
2. Ensure `EXPO_PUBLIC_` prefix is used for client-side variables
3. Check that variables are referenced in `eas.json` build profiles

#### Import Errors in Production
**Problem**: App crashes on startup due to import errors in production builds.

**Root Cause**: Error checking in utility files (like `openai.ts`) throwing exceptions before React loads.

**Solution**: Add defensive error handling in utility files:
```javascript
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// Instead of throwing immediately:
// if (!OPENAI_API_KEY) throw new Error('API key missing');

// Use defensive checking:
if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key not found');
  // Handle gracefully or show user-friendly error
}
```

#### EAS CLI Installation Issues
**Problem**: `npm install -g @expo/eas-cli` fails due to registry issues.

**Solutions**:
1. Use npx: `npx @expo/eas-cli@latest [command]`
2. Try different registry: `npm install --registry https://registry.yarnpkg.com -g @expo/eas-cli`
3. Use Expo web dashboard for builds instead of CLI

## Project Structure 📁

```
stylemuse/
├── App.js                                    # Main app entry point
├── screens/
│   ├── WardrobeUploadScreen.tsx             # Main application container
│   ├── WardrobePage.tsx                     # Wardrobe management interface
│   ├── OutfitsPage.tsx                      # Outfit management interface
│   ├── BuilderPage.tsx                      # Outfit builder interface
│   ├── ProfilePage.tsx                      # User profile interface
│   ├── CameraScreen.tsx                     # Professional camera interface
│   ├── PhotoEditingScreen.tsx               # Photo editing with advanced tools
│   ├── components/
│   │   ├── shared/
│   │   │   └── BottomNavigation.tsx         # Navigation component
│   │   ├── LaundryAnalytics.tsx             # Laundry insights dashboard
│   │   ├── OutfitAnalytics.tsx              # Outfit insights dashboard
│   │   ├── ItemDetailView.tsx               # Item detail interface
│   │   ├── OutfitDetailView.tsx             # Outfit detail interface
│   │   ├── CategoryDropdown.tsx             # Category selection
│   │   ├── MarkAsWornModal.tsx              # Outfit wear tracking
│   │   └── SmartOutfitSuggestions.tsx       # AI outfit recommendations
│   └── styles/
│       └── WardrobeUploadScreen.styles.ts   # Modular style definitions
├── hooks/
│   ├── useWardrobeData.ts                   # Wardrobe & laundry state management
│   ├── useNavigationState.ts               # Navigation state management
│   ├── useCameraControls.ts                # Camera state and controls
│   ├── usePhotoEditor.ts                    # Photo editing state management
│   └── useCameraIntegration.ts              # Camera-wardrobe integration
├── utils/
│   ├── openai.ts                            # AI integration (GPT-4o & DALL-E)
│   └── SafeImage.tsx                        # Optimized image component
├── assets/                                  # Images and icons
├── eas.json                                 # EAS Build configuration
├── app.json                                 # Expo app configuration
├── .env                                     # Environment variables (not tracked)
├── .gitignore                               # Git ignore rules
└── README.md                                # This file
```

## Key Components 🧩

### Core Application Components

**WardrobeUploadScreen.tsx** - Main application container
- Navigation state management and routing
- Bottom navigation with 5 pages (Builder, Wardrobe, Outfits, Profile, Settings)
- Global state coordination and data flow
- Modal management and overlays

**WardrobePage.tsx** - Wardrobe management interface
- Tab navigation between wardrobe view and laundry analytics
- Advanced filtering by category and laundry status
- Grid display with laundry status indicators
- Integration with item detail views and analytics

**OutfitsPage.tsx** - Outfit management interface
- Tab navigation between outfit gallery and outfit analytics
- Smart outfit suggestions and re-recommendations
- Outfit wear tracking and history management
- Love/favorite system with analytics

### Specialized Components

**LaundryAnalytics.tsx** - Comprehensive laundry insights
- Wardrobe cleanliness progress tracking
- Smart wash suggestions (regular vs delicate loads)
- Status breakdown with visual charts
- Most washed items showcase and dirty items preview
- Contextual tips based on usage patterns

**OutfitAnalytics.tsx** - Outfit usage insights
- Outfit utilization rate and wear frequency analysis
- Most worn outfit showcase and favorites ranking
- Re-suggestion readiness tracking
- Comprehensive outfit statistics and trends

### Data Management Hooks

**useWardrobeData.ts** - Complete wardrobe and laundry state
- Wardrobe item CRUD operations with persistent storage
- Comprehensive laundry status tracking (6 states)
- Automatic dirty marking when outfits are worn
- Smart wash suggestions and laundry analytics
- Outfit memory system with wear frequency tracking

**useNavigationState.ts** - Navigation and UI state
- Page navigation and modal management
- Item detail view state coordination
- Editing state management for inline editing
- Tab switching and view transitions

### AI Integration

**utils/openai.ts**
AI integration module with key functions:

**`analyzePersonalStyle(base64Image)`**
- Analyzes user's appearance for Style DNA
- Returns styling recommendations while maintaining privacy

**`describeClothingItem(base64Image)`**
- Analyzes clothing photos using GPT-4o Vision
- Returns detailed JSON with title, description, tags, color, material, style, fit
- Enhanced prompts for accurate color and style detection

**`generatePersonalizedOutfitImage(clothingItems, styleDNA)`**
- Creates photorealistic outfit combinations using DALL-E 3
- Personalized to user's Style DNA
- Takes array of clothing item objects
- Returns URL of generated outfit photo

**`generateWeatherBasedOutfit(location, weatherData, wardrobe, styleDNA)`**
- Combines weather data with Style DNA for smart outfit suggestions
- Auto-selects weather-appropriate items from wardrobe
- Ensures complete outfits (not just single weather-appropriate items)

## API Costs 💰

- **GPT-4o Vision**: ~$0.01 per clothing item analysis
- **DALL-E 3**: ~$0.04 per outfit generation  
- **OpenWeatherMap**: Free tier (1000 calls/month)

Budget accordingly for testing and usage.

## Development Workflow 🔄

### Adding New Features
1. Create feature branch: `git checkout -b feature/your-feature`
2. Test in Expo Go during development
3. Test production build: `eas build --platform ios --profile preview`
4. Submit to TestFlight for beta testing
5. Commit changes: `git commit -m "feat: your feature description"`
6. Push and create PR: `git push origin feature/your-feature`

### Testing Strategy
- **Development**: Use Expo Go for rapid iteration
- **Pre-release**: Use EAS preview builds for TestFlight testing
- **Production**: Use EAS production builds for App Store releases

### Debugging Production Issues
Since TestFlight builds don't connect to Metro bundler:
1. Add UI-based debugging (display status in app interface)
2. Use Expo's remote logging
3. Check iOS crash logs in Settings > Privacy & Security > Analytics

## Environment Setup Details 🔧

### Required Environment Variables
```bash
# .env file (development only)
EXPO_PUBLIC_OPENAI_API_KEY=sk-...your-key-here
EXPO_PUBLIC_OPENWEATHER_API_KEY=your-weather-key-here
```

### Production Environment Variables
Set these in the Expo dashboard with "Plain text" visibility:
- `EXPO_PUBLIC_OPENAI_API_KEY`
- `EXPO_PUBLIC_OPENWEATHER_API_KEY`

**Important Notes:**
- The `EXPO_PUBLIC_` prefix is required for client-side access
- Never commit your `.env` file to git
- Regenerate your API key if it's ever exposed
- Production builds only use Expo dashboard variables, not local `.env` files

## Troubleshooting 🛠️

### "API Key not found"
- Ensure `.env` file exists in root directory (development)
- Check Expo dashboard environment variables (production)
- Verify variable names use `EXPO_PUBLIC_` prefix
- Restart Expo server after adding environment variables

### "Failed to analyze image"
- Check internet connection
- Verify OpenAI API key is valid and has credits
- Image may be too large (Expo compresses automatically)

### Build Failures
- Check build logs in EAS dashboard
- Ensure all required assets exist in `./assets/` folder
- Verify bundle identifier is unique
- Check for dependency conflicts in `package.json`

### "Upload functionality coming soon"
- This button is a placeholder for future cloud storage integration
- Currently all data is stored locally on device

## Roadmap 🗺️

### ✅ **Recently Completed**
- [x] **Comprehensive Laundry Tracker System** - Full status tracking with analytics
- [x] **Advanced Analytics Dashboard** - Rich insights for both outfits and laundry
- [x] **Modular Component Architecture** - Improved maintainability and scalability
- [x] **Professional Tab Navigation** - Seamless UX matching iOS design standards
- [x] **Smart Outfit Memory System** - Wear tracking with intelligent re-suggestions
- [x] **Advanced Filtering System** - Multi-criteria filtering with visual indicators

### 🚧 **Next Priority Features**
- [ ] **Cloud Storage Integration** - Sync wardrobe across devices with user accounts
- [ ] **Enhanced Analytics** - Trend analysis and seasonal insights
- [ ] **Smart Notifications** - Laundry reminders and outfit suggestions
- [ ] **Outfit Planning** - Calendar integration for occasion-based outfits
- [ ] **Style Trends Integration** - Real-time fashion trend analysis

### 🔮 **Future Vision**
- [ ] **Social Features** - Outfit sharing and community voting
- [ ] **Clothing Brand Recognition** - Automatic brand and price detection
- [ ] **Sustainability Tracking** - Carbon footprint and wear-per-cost metrics
- [ ] **Personal Stylist AI** - Advanced style coaching and recommendations
- [ ] **Web App Version** - Cross-platform accessibility
- [ ] **AR Try-On Features** - Virtual fitting room capabilities
- [ ] **Shopping Integration** - Smart purchase recommendations
- [ ] **Wardrobe Optimization** - AI-driven wardrobe curation advice

---

**Built with ❤️ and AI**

*StyleMuse helps you discover your perfect style through the power of artificial intelligence.*

## Contributing

1. Fork the repository
2. Create your feature branch
3. Test thoroughly in both Expo Go and production builds
4. Submit a pull request

---

*For deployment questions or issues, check the troubleshooting section above or create an issue in the repository.*
