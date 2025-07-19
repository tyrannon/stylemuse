# StyleMuse Context Guide
<!-- Last edited: 2025-07-19 by Claude Code -->
<!-- Purpose: Help future contributors understand the codebase structure and documentation system -->

## 🗺️ Documentation Map

This guide helps you navigate the StyleMuse codebase and understand where to find specific information. It also provides instructions for dynamically loading documentation into Claude Code sessions.

## 📁 Project Structure Overview

```
stylemuse/
├── screens/                    # Main app screens
│   ├── WardrobeUploadScreen.tsx  # Main hub (includes Builder inline!)
│   ├── WardrobePage.tsx         # Wardrobe item management
│   ├── OutfitsPage.tsx          # Generated outfit gallery
│   └── ProfilePage.tsx          # User settings & profile
├── components/                  # Reusable UI components
│   ├── AIOutfitAssistant.tsx    # AI outfit generation UI
│   ├── RandomOutfitButton.tsx   # Fast outfit generation buttons
│   └── ItemDetailView.tsx       # Item detail modal
├── utils/                       # Core utilities
│   ├── openAIService.ts         # OpenAI/DALL-E integration
│   ├── PromptTruncator.ts       # Smart prompt truncation
│   ├── RandomOutfitGenerator.ts # Algorithmic outfit generation
│   └── DebugLogger.ts           # Comprehensive logging system
├── hooks/                       # Custom React hooks
│   ├── useUnifiedLoading.ts     # Centralized loading states
│   ├── useOutfitGeneration.ts   # Outfit generation logic
│   └── useWardrobeData.ts       # Wardrobe state management
├── contexts/                    # React contexts
│   └── ThemeContext.tsx         # Theme system (light/dark/tokyo)
├── docs/                        # Extended documentation
│   ├── PERFORMANCE.md           # Performance optimization guide
│   ├── ICON_SYSTEM.md          # Icon implementation details
│   ├── RANDOM_OUTFIT.md        # Random outfit system docs
│   └── CHANGELOG.md            # Development history
└── CLAUDE.md                    # Main developer guide (<40k chars)
```

## 🔍 Where to Find What

### Core Features
| Feature | Primary Location | Supporting Files | Documentation |
|---------|-----------------|------------------|---------------|
| **Outfit Builder** | `WardrobeUploadScreen.tsx` (inline, ~line 2740) | `useOutfitGeneration.ts` | CLAUDE.md → "Builder Page Location" |
| **AI Outfit Generation** | `AIOutfitAssistant.tsx` | `openAIService.ts`, `generateIntelligentOutfitSelection()` | CLAUDE.md → "AI Outfit Assistant" |
| **Random Outfits** | `RandomOutfitButton.tsx` | `RandomOutfitGenerator.ts`, `useRandomOutfit.ts` | `docs/RANDOM_OUTFIT.md` |
| **Theme System** | `ThemeContext.tsx` | All components use `useTheme()` | CLAUDE.md → "Color Scheming System" |
| **Item Tracking** | `WardrobeUploadScreen.tsx` | `markWardrobeItemAsViewed()`, `markOutfitAsViewed()` | CLAUDE.md → "Item Tracking Systems" |
| **Loading System** | `useUnifiedLoading.ts` | Header loading animation in main screen | CLAUDE.md → "Unified Loading System" |
| **Debug Logging** | `DebugLogger.ts` | `LogCategories.ts`, `watch-logs.sh` | CLAUDE.md → "Debug System" |

### Key Functions & Their Locations
```typescript
// AI Outfit Generation
openAIService.ts → generateIntelligentOutfitSelection()
openAIService.ts → generatePersonalizedOutfitImage()

// Wardrobe Management  
WardrobeUploadScreen.tsx → handleAutoDescribeAndSave()
WardrobeUploadScreen.tsx → saveBulkWardrobeItems()
useWardrobeData.ts → markAllWardrobeItemsAsViewed()

// Theme System
ThemeContext.tsx → useTheme()
ThemeContext.tsx → useThemeColors()

// Performance Optimizations
WardrobeUploadScreen.tsx → display-based navigation
RandomOutfitButton.tsx → React.memo() optimization
```

## 🤖 Dynamic Documentation Loading with Claude-Prompter

### Setup Instructions

1. **Install claude-prompter** (if not already installed):
```bash
npm install -g claude-prompter
```

2. **Create Documentation Loading Script**:
```bash
# Create a script to auto-inject docs into Claude sessions
cat > load-stylemuse-docs.sh << 'EOF'
#!/bin/bash
# StyleMuse Documentation Loader
# Last edited: 2025-07-19 by Kaiya

echo "🎨 Loading StyleMuse documentation context..."

# Load main documentation
claude-prompter context add CLAUDE.md

# Load specific docs based on task
if [[ "$1" == "performance" ]]; then
    claude-prompter context add docs/PERFORMANCE.md
elif [[ "$1" == "icons" ]]; then
    claude-prompter context add docs/ICON_SYSTEM.md
elif [[ "$1" == "outfits" ]]; then
    claude-prompter context add docs/RANDOM_OUTFIT.md
elif [[ "$1" == "all" ]]; then
    claude-prompter context add docs/*.md
fi

echo "✅ Documentation loaded into Claude context!"
EOF

chmod +x load-stylemuse-docs.sh
```

3. **Usage Examples**:
```bash
# Load base documentation
./load-stylemuse-docs.sh

# Load performance-specific docs
./load-stylemuse-docs.sh performance

# Load all documentation
./load-stylemuse-docs.sh all
```

### Claude-Prompter Configuration

Create `.claude-prompter.json` in project root:
```json
{
  "project": "StyleMuse",
  "version": "2.0",
  "context": {
    "autoLoad": ["CLAUDE.md", "CONTEXT_GUIDE.md"],
    "maxSize": 100000,
    "compression": true
  },
  "shortcuts": {
    "outfit": "Load outfit generation documentation",
    "theme": "Load theme system documentation",
    "debug": "Load debug system documentation"
  }
}
```

## 📝 Change Tracking Guidelines

### Comment Format
Always add change tracking comments when editing documentation:
```markdown
<!-- Last edited: YYYY-MM-DD by Your Name -->
<!-- Change: Brief description of what was changed -->
```

### Example:
```markdown
<!-- Last edited: 2025-07-19 by Kaiya -->
<!-- Change: Added new wardrobe filtering options -->
```

### Where to Add Change Comments
1. **Top of file**: Overall last edit date
2. **Major sections**: When adding/modifying significant sections
3. **Code examples**: When updating code snippets
4. **External references**: When adding new links or dependencies

## 🔄 Documentation Update Workflow

1. **Before Making Changes**:
   - Check CONTEXT_GUIDE.md for file locations
   - Load relevant docs with claude-prompter
   - Review recent changes in CHANGELOG.md

2. **While Making Changes**:
   - Add change tracking comments
   - Update relevant documentation
   - Keep CLAUDE.md under 40k chars

3. **After Making Changes**:
   - Update CHANGELOG.md with your changes
   - Verify documentation links still work
   - Run character count check on CLAUDE.md

## 🎯 Quick Reference Cheat Sheet

### Most Edited Files
1. `WardrobeUploadScreen.tsx` - Main hub, contains Builder
2. `openAIService.ts` - AI integration changes
3. `CLAUDE.md` - Primary documentation
4. `ThemeContext.tsx` - Theme/color changes

### Common Tasks & Where to Look
| Task | Files to Check |
|------|----------------|
| Add new color theme | `ThemeContext.tsx`, update color values |
| Modify outfit generation | `AIOutfitAssistant.tsx`, `openAIService.ts` |
| Change loading behavior | `useUnifiedLoading.ts`, header in main screen |
| Add new wardrobe feature | `WardrobeUploadScreen.tsx`, `useWardrobeData.ts` |
| Debug an issue | Enable logging in `DebugLogger.ts`, use `watch-logs.sh` |

## 🚀 Getting Started for New Contributors

1. **Read Core Documentation**:
   - Start with CLAUDE.md (main guide)
   - Review this CONTEXT_GUIDE.md
   - Check CHANGELOG.md for recent changes

2. **Set Up Development Environment**:
   - Install dependencies: `npm install`
   - Set up claude-prompter for doc loading
   - Configure your IDE with TypeScript support

3. **Understand Key Patterns**:
   - Theme system usage (`useTheme()` hook)
   - Unified loading pattern (shared instances)
   - Display-based navigation (no unmounting)
   - AsyncStorage for persistence

4. **Development Workflow**:
   - Use debug logging extensively
   - Test in both light/dark modes
   - Check performance with many items
   - Verify AsyncStorage persistence

## 📊 Performance Considerations

- **CLAUDE.md size limit**: Keep under 40k characters
- **Image optimization**: PNG icons preloaded on mount
- **State management**: Minimize re-renders with React.memo
- **AsyncStorage**: Batch operations when possible

## 🔗 External Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [AsyncStorage Guide](https://react-native-async-storage.github.io/async-storage/)

---

<!-- Last edited: 2025-07-19 by Claude Code -->
<!-- Remember: Always update change tracking comments when editing! -->