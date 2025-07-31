# StyleMuse Development Guide
<!-- Last edited: 2025-07-26 by Claude Code -->
<!-- Change: Optimized documentation architecture with subagent system -->

This document contains essential development information. **For detailed feature documentation, see the complete documentation index below.**

## 🔄 Branch Strategy
**IMPORTANT**: All recent development has been happening on the `main-stable` branch, not `main`. 
- **Primary Branch**: `main-stable` (use for all commits and PRs)
- **Legacy Branch**: `main` (mostly inactive)
- **Reason**: Stable development workflow with recent feature additions

## 🧭 Quick Start
**New to the codebase?** Start with [`CONTEXT_GUIDE.md`](CONTEXT_GUIDE.md) for a complete navigation guide and documentation loading instructions.

## 📚 Complete Documentation Index

### 🏗️ Architecture
- [`docs/architecture/THEMING_SYSTEM.md`](docs/architecture/THEMING_SYSTEM.md) - Complete color scheme system with dark mode
- [`docs/architecture/LOADING_SYSTEM.md`](docs/architecture/LOADING_SYSTEM.md) - Unified loading architecture  
- [`docs/architecture/ONBOARDING_SYSTEM.md`](docs/architecture/ONBOARDING_SYSTEM.md) - User onboarding flow

### 🎯 Features  
- [`docs/features/TERMINATOR_CAMERA.md`](docs/features/TERMINATOR_CAMERA.md) - Real-time clothing detection camera
- [`docs/features/OUTFIT_FILTERING.md`](docs/features/OUTFIT_FILTERING.md) - Comprehensive filtering system
- [`docs/features/OUTFIT_METADATA.md`](docs/features/OUTFIT_METADATA.md) - Outfit metadata display system
- [`docs/features/AR_TRYON.md`](docs/features/AR_TRYON.md) - Virtual try-on analysis
- [`docs/features/SETTINGS_REDESIGN.md`](docs/features/SETTINGS_REDESIGN.md) - iOS-style settings

### ⚙️ Systems
- [`docs/systems/DEBUG_LOGGING.md`](docs/systems/DEBUG_LOGGING.md) - Comprehensive logging system
- [`docs/systems/PROMPT_TRUNCATION.md`](docs/systems/PROMPT_TRUNCATION.md) - AI prompt optimization
- [`docs/systems/ITEM_TRACKING.md`](docs/systems/ITEM_TRACKING.md) - Viewing and tracking systems
- [`docs/systems/USER_BEHAVIOR_RESEARCH.md`](docs/systems/USER_BEHAVIOR_RESEARCH.md) - Evidence-based user engagement insights

### 🛠️ Tools & Guides
- [`docs/tools/CLAUDE_PROMPTER.md`](docs/tools/CLAUDE_PROMPTER.md) - CLI tool integration
- [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) - Performance optimization techniques
- [`docs/ICON_SYSTEM.md`](docs/ICON_SYSTEM.md) - Custom PNG icon system
- [`docs/RANDOM_OUTFIT.md`](docs/RANDOM_OUTFIT.md) - Fast algorithmic outfit generation
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) - Complete development history

## Commands for Development

### Running Tests
```bash
npm test        # Run unit tests
npm run test:e2e # Run end-to-end tests (if available)
```

### Linting and Type Checking
```bash
npm run lint      # ESLint check
npm run typecheck # TypeScript check
```

**Important**: Always run lint and typecheck after making changes to ensure code quality.

### Building
```bash
npm run build     # Production build
npm run dev       # Development server
```

## Debug System Quick Reference

### Basic Usage
```typescript
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

// Basic logging
logger.info(LogCategories.USER_ACTION, 'Button clicked', { buttonId: 'generate-outfit' });

// Error logging
logger.error(LogCategories.API_CALLS, 'Request failed', error, { endpoint: '/api/outfit' });

// Performance tracking
const endTracking = logger.startPerformanceTracking('operation-name');
await doOperation();
endTracking(); // Automatically logs duration
```

### Live Log Monitoring
```bash
# Watch all logs with colors
./scripts/watch-logs.sh

# Filter specific types
./scripts/watch-logs.sh errors      # Only errors and warnings
./scripts/watch-logs.sh outfit      # Only outfit generation logs
./scripts/watch-logs.sh performance # Only performance logs
./scripts/watch-logs.sh clean       # Remove debug spam
```

## Builder Page Location & Architecture

**IMPORTANT**: The builder functionality is NOT implemented in `/screens/BuilderPage.tsx`. Instead, it's implemented **inline within `/screens/WardrobeUploadScreen.tsx`**.

### Builder Implementation Details:
- **File**: `/screens/WardrobeUploadScreen.tsx` (lines ~2740-3000)
- **Section**: "Outfit Builder - Always Show" (`showOutfitBuilder` condition)
- **Components**: AI Outfit Assistant, Random Outfit Generator, Gear Slot Grid
- **State Management**: Uses `useOutfitGeneration` hook for gear slots and outfit state
- **Integration**: All builder features are inline, not separate components

### Key Builder Features:
- **AI Outfit Assistant**: Smart contextual outfit generation with Style DNA integration
- **Random Outfit Generator**: Fast algorithmic outfit creation (< 100ms vs 10+ seconds AI)
- **Gear Slot Grid**: Visual outfit builder with 6 slots (top, bottom, shoes, jacket, hat, accessories)
- **Style DNA Integration**: Personalized suggestions based on user profile analysis

### Random Outfit Generator Architecture:
- **UI Location**: Lines ~2829-2869 in WardrobeUploadScreen.tsx (purple section)
- **Styles**: In `/screens/styles/WardrobeUploadScreen.styles.ts` (lines 2261-2320)
- **Hook**: `useRandomOutfit` in `/hooks/useRandomOutfit.ts`
- **Core Algorithm**: `RandomOutfitGenerator` in `/utils/RandomOutfitGenerator.ts`
- **Style Rules**: `StyleCompatibility` in `/utils/StyleCompatibility.ts`

### Builder Navigation:
- Access via bottom navigation 🎮 tab or programmatic `navigateToBuilder()` calls
- Integrated with unified loading system and shared loading instances
- Uses `outfitGeneration.gearSlots` for state management

## Feature Priority Analysis (2025-07-30)
**Updated based on comprehensive user behavior research - see [`docs/systems/USER_BEHAVIOR_RESEARCH.md`](docs/systems/USER_BEHAVIOR_RESEARCH.md)**

### 🎯 High Priority - Evidence-Based User Needs
1. **Terminator Vision Camera** - ✅ **READY FOR PRODUCTION BUILD TESTING** (Feature flags enabled!)
2. **Weather Integration** - ✅ **REINSTATED** - 90% acceptance rate for weather-based suggestions among engaged users
3. **Automated Analytics Dashboard** - Show wardrobe utilization insights without manual logging

### 🔄 Medium Priority - Optimization Focus  
4. **Speed Dial UX Enhancement** - Morning/evening contextual suggestions based on peak usage times
5. **Local Analytics Implementation** - Track engagement patterns without cloud complexity

### ❌ Lower Priority - Research-Debunked Features
- **Social Sharing + Community** - ❌ **REMOVED** - Privacy concerns outweigh benefits for personal apps
- **Outfit History/Journal** - ❌ **REMOVED** - Only 2-5% of users maintain daily logging habits
- **AR Try-On Experience** - ❌ **POSTPONED** - Complex implementation, no evidence of user demand

### 📋 Current Active Tasks (2025-07-30)
**Phase 2: Evidence-Based User Engagement Features**

🎯 **HIGH PRIORITY EXECUTION:**
1. **Weather Integration Revival** - Reinstating with OpenWeather API (90% user acceptance rate)
2. **Automated Analytics Dashboard** - Local-first wardrobe insights without manual logging
3. **Speed Dial UX Enhancement** - Contextual suggestions for morning/evening peak usage

🔧 **IMPLEMENTATION STRATEGY:**
- **Subagent Coordination**: Use specialized subagents for complex multi-step tasks
- **Claude-Prompter Integration**: Leverage architectural insights and grumpy senior dev reviews
- **Evidence-Based Development**: All features backed by user behavior research

✅ **COMPLETED PHASES:**
- Phase 1: Plus Ultra Terminator Camera system - PRODUCTION READY
- User Behavior Research - Comprehensive analysis completed
- **Phase 2: Evidence-Based User Engagement Features - COMPLETE (2025-07-31)**

### Recent Completions (2025-07-26)
- ✅ **Plus Ultra Terminator Camera Redesign** - Complete system overhaul with XState + Skia + Reanimated 3
- ✅ **Subagent Architecture Implementation** - Modular documentation system with focused files
- ✅ **XState Dependency Resolution** - Fixed bundling errors with proper React integration
- ✅ **Advanced State Management** - Bulletproof state machine with error handling and recovery

### Known Issues
- ✅ **CLAUDE.md Size Warning** - Fixed with subagent architecture (reduced to core essentials)
- ✅ **XState React Dependency** - Fixed with @xstate/react@6.0.0 installation
- ✅ **Hermes Engine Crashes** - FIXED with CrashPreventionWrapper and emergency feature flags
- ✅ **Infinite Animation Memory Leaks** - FIXED by replacing withRepeat(-1) with finite sequences
- ✅ **Terminator Camera Stability** - PRODUCTION READY with comprehensive crash prevention
- **"Text strings must be rendered within a <Text> component" warning** - Expo Go only, non-critical

## Recent Updates & Current Status

- ✅ **Subagent Documentation Architecture** (2025-07-26) - Modular documentation system
- ✅ **Fixed Speed Dial Icon Flickering & Performance** (2025-07-13) - See [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md)
- ✅ **Complete Outfit Builder Icon System & UI Polish** (2025-07-13) - See [`docs/ICON_SYSTEM.md`](docs/ICON_SYSTEM.md)
- ✅ **Fast Algorithmic Random Outfit System** (2025-07-13) - Lightning-fast outfit generation
- ❌ **REMOVED Calendar Integration Feature** (2025-07-13) - Over-engineered with performance issues

**See full changelog**: [`docs/CHANGELOG.md`](docs/CHANGELOG.md)

## 🎉 Phase 2 COMPLETED! (2025-07-31)

### **✅ DELIVERED FEATURES**

**🌤️ Weather-Aware Speed Dial System**
- Real-time weather data integration with OpenWeather API
- Temperature-based outfit intelligence (cold/cool/hot adjustments)
- Condition-aware suggestions (rain → jackets, snow → winter gear)
- Weather context UI in outfit builder

**⏰ Time-Contextual Suggestions**
- Morning/afternoon/evening/night period detection
- Time-based outfit probability adjustments
- Enhanced user experience with contextually appropriate recommendations

**📊 Comprehensive Analytics Dashboard**  
- **Wardrobe Utilization Analytics**: Track which items are used most/least in outfits
- **Cost-Per-Wear Analysis**: Calculate value from purchase price and usage frequency
- **Generation Pattern Insights**: Weekly/monthly trends, active hours, outfit composition
- **Local-First Privacy**: All analytics stored locally, no cloud tracking or compliance overhead

### **🔧 Technical Achievements**
- **989 lines of code added** across 6 files
- **AnalyticsService**: Complete local-first analytics infrastructure
- **WardrobeAnalyticsDashboard**: Comprehensive 3-tab analytics UI
- **Enhanced RandomOutfitGenerator**: Weather and time-aware generation logic
- **Extended WardrobeItem interface**: Cost tracking and usage analytics fields

### **Subagent Coordination Protocol**
1. **Analyze** - Each subagent uses claude-prompter for architectural insights
2. **Design** - Subagents collaborate on implementation strategy
3. **Review** - Grumpy senior dev evaluates all proposals via claude-prompter
4. **Execute** - Implement with continuous senior dev oversight
5. **Test** - Local analytics validation and user experience testing

### **Claude-Prompter Integration Commands**
```bash
# Architectural insights for each feature
~/.local/bin/claude-prompter-global suggest -t "Weather integration for React Native fashion app" --claude-analysis

# Senior dev reality checks
~/.local/bin/claude-prompter-global prompt -m "Grumpy senior dev: Review this weather API integration approach" --send

# Cross-feature coordination
~/.local/bin/claude-prompter-global prompt -m "How do these 3 features work together for daily user engagement?" --send
```

## 📋 Next Session Plan (Testing & Phase 3 Strategy)

### 🧪 **IMMEDIATE TESTING PRIORITIES**
1. **Test Weather Integration**
   - Verify weather API key is working (OpenWeather)
   - Test Speed Dial with weather context in different conditions
   - Check weather banner display in outfit builder

2. **Test Analytics Dashboard**
   - Generate some outfits to populate analytics data
   - Navigate to Analytics tab in Outfits page
   - Verify all 3 tabs work: Utilization, Cost Analysis, Patterns
   - Test cost-per-wear by adding purchase prices to items

3. **Test Time-Contextual Suggestions**
   - Test Speed Dial at different times of day
   - Verify morning/evening probability adjustments
   - Check console logs for contextual debugging info

### 🚀 **PHASE 3 STRATEGY DISCUSSION**
Based on claude-prompter insights, **potential Phase 3 priorities:**

**Option A: Social & Community Features**
- Outfit sharing capabilities
- Community insights and trends
- Social engagement features

**Option B: AI-Powered Personalization**
- Machine learning style recommendations
- Trend forecasting and style evolution
- Advanced personalization algorithms

**Option C: Commerce & Sustainability**
- In-app purchase integration with retailers
- Sustainability metrics and eco-conscious features
- Virtual fitting room with AR

**Option D: Global Expansion**
- Localization for different markets
- Region-specific weather and fashion trends
- Multi-language support

### 🔧 **TECHNICAL DEBT & OPTIMIZATIONS**
- Address TypeScript errors in backup files
- Performance optimization of analytics queries
- UI/UX polish based on testing feedback

### 💡 **Testing Commands**
```bash
# Start development server
npx expo start --clear

# Test analytics in browser/device
# Navigate: Speed Dial → Generate outfits → Analytics tab

# Monitor weather integration
# Check console for weather context logs
```

## Next Session Notes 📝

### 🚀 REMINDER: Use claude-prompter for Plus Ultra Development!
```bash
# Phase 3 strategic guidance
~/.local/bin/claude-prompter-global prompt -m "StyleMuse Phase 3 strategy: Which feature set would have highest user engagement impact?" --send

# Technical insights
~/.local/bin/claude-prompter-global suggest -t "Advanced fashion app features" --claude-analysis
```

### Today's Epic Achievements (2025-07-31):
- ✅ **PHASE 2 COMPLETE**: Weather-aware Speed Dial + Analytics Dashboard
- ✅ 989 lines of evidence-based features implemented
- ✅ Local-first analytics infrastructure built
- ✅ Comprehensive user behavior research applied

### Pro Tips for Next Time:
- Test all features thoroughly before Phase 3 planning
- Use analytics data to validate user engagement hypotheses
- Consider Phase 3 based on testing results and user feedback
- Leverage claude-prompter for strategic Phase 3 decisions

---
> **Complete Documentation**: See the index above for detailed feature guides, architecture docs, and implementation details.