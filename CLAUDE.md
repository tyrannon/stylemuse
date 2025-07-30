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

## Feature Priority Analysis (2025-07-26)

### 🎯 High Priority - Next Implementation
1. **Terminator Vision Camera** - ✅ **READY FOR PRODUCTION BUILD TESTING** (Feature flags enabled!)
2. **Social Sharing + Community** - High user engagement potential  
3. **Smart Wardrobe Optimization** - Leverage existing metadata system

### 🔄 Medium Priority - Future Releases  
4. **AR Try-On Experience** - Complex but high differentiator
5. **Style Analytics Dashboard** - Build on existing tracking systems

### ❌ Lower Priority - Postponed
- **Weather Integration** - Lower user value during testing
- **Calendar Integration** - Removed due to over-engineering

### 📋 Current Active Tasks
- ✅ **Complete** - All major plus ultra redesign tasks finished
- 🎯 **Ready for Testing** - Ultra Terminator Camera system with XState integration
- 🚀 **Next Phase** - User testing and performance optimization

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

## Next Session Notes 📝

### 🚀 REMINDER: Use claude-prompter for Plus Ultra Development!
```bash
# Global claude-prompter commands
~/.local/bin/claude-prompter-global suggest -t "Your next task" --claude-analysis

# Get GPT-4o insights
~/.local/bin/claude-prompter-global prompt -m "Show me advanced techniques for this" --send
```

### Today's Epic Achievements (2025-07-26):
- ✅ Implemented subagent documentation architecture
- ✅ Extracted major sections to focused files
- ✅ Created modular navigation system
- ✅ Optimized CLAUDE.md from 58.7k to core essentials

### Pro Tips for Next Time:
- Use subagent architecture for complex features
- Always commit save points before major changes
- Leverage claude-prompter for architectural decisions
- Test rollback procedures for complex implementations

---
> **Complete Documentation**: See the index above for detailed feature guides, architecture docs, and implementation details.