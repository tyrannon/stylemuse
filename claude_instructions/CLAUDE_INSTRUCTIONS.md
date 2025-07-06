# Claude Instructions for StyleMuse 🎯

## 🚨 CRITICAL: App Status - STABLE & WORKING

**Current State**: All core features functional on `main-stable` branch
**StyleDNA**: ✅ Working  
**Laundry Analytics**: ✅ Working  
**Navigation**: ✅ Working  
**AI Features**: ✅ Working

## 🎯 Primary Directive

**PRESERVE FUNCTIONALITY ABOVE ALL ELSE**

This is a working, user-loved app. Your role is to enhance it incrementally while maintaining all existing functionality. When in doubt, choose stability over perfection.

## 📚 Required Reading Order

Before taking any action, review these docs:
1. `WORKING_ARCHITECTURE.md` - Understand the current system
2. `COMPLETE_PAGE_FLOW_ARCHITECTURE.md` - Page navigation & data flow
3. `COMPREHENSIVE_FEATURE_INVENTORY.md` - Complete feature map
4. `STYLEDNA_COMPLETE_GUIDE.md` - StyleDNA technical blueprint
5. `LESSONS_LEARNED.md` - Avoid past mistakes  
6. `DEBUG_GUIDE.md` - Fix issues quickly
7. `HANDOFF_GUIDE.md` - Development best practices

## 🤖 AI Task Assignment Strategy

### **Use Opus For** (Complex Analysis & Planning)
- ✅ Architecture analysis across multiple files
- ✅ Complex debugging involving multiple components
- ✅ Feature planning and integration analysis
- ✅ Cross-component dependency mapping
- ✅ AI prompt engineering and optimization
- ✅ Performance optimization analysis
- ✅ Comprehensive code reviews
- ✅ Documentation creation (like this)

### **Use Sonnet For** (Focused Implementation)
- ✅ Single file modifications
- ✅ Specific bug fixes in isolated components
- ✅ Individual function improvements
- ✅ Styling and UI updates
- ✅ Simple utility function additions
- ✅ Configuration file changes
- ✅ TypeScript type additions
- ✅ Individual component enhancements

### **Task Assignment Template**
```
**Task Recommendation**: This task is better for [Opus/Sonnet] because [reason]

Examples:
- "This architecture analysis is perfect for Opus - requires deep cross-file analysis"
- "This styling fix is ideal for Sonnet - focused single-file change"
```

## 🏗️ Architecture Guidelines

### Sacred Patterns (DO NOT CHANGE)
- **Single-Screen Container**: `WardrobeUploadScreen.tsx` manages all pages
- **Hook-Based Navigation**: Boolean states control page visibility
- **Shared State Context**: Hooks provide state across components
- **Storage Service Pattern**: Typed AsyncStorage wrappers
- **OpenAI Integration**: Existing AI service structure

### Safe Enhancement Areas
- Individual page components
- New utility functions
- Additional AI functions
- Styling improvements
- New feature hooks (without changing existing)

## 🔄 Development Workflow

### Before Any Changes
```bash
# 1. Verify current state
git status
git branch  # Should be on main-stable

# 2. Create backup
git checkout -b backup-before-[change-description]

# 3. Document intention
# Update relevant docs with planned changes
```

### Making Changes
1. **One Change At A Time**: Single feature/component per session
2. **Test Immediately**: Verify change works without breaking existing
3. **Document Changes**: Update architecture docs if patterns change
4. **Commit Frequently**: Small, descriptive commits

### Testing Requirements
- ✅ Test on actual device (not just simulator)
- ✅ Verify all existing features still work
- ✅ Check StyleDNA functionality in Profile
- ✅ Check Laundry Analytics in Wardrobe
- ✅ Test camera and AI analysis
- ✅ Test outfit generation

## 🚨 Emergency Procedures

### If Something Breaks
```bash
# Immediate reset to stable
git checkout main-stable-backup
npm install
expo start --clear
```

### If Unsure About Changes
```bash
# Check what changed
git status
git diff

# If looks risky, revert
git reset --hard HEAD~1
```

## 🎯 Feature Development Guidelines

### Adding New Features
```typescript
// Template for new features
const useNewFeature = () => {
  // New feature state management
  const [state, setState] = useState();
  
  // Keep isolated from existing features
  return { state, actions };
};

// Add to main container conditionally
{showNewFeature && <NewFeatureComponent />}
```

### Enhancing Existing Features
```typescript
// ✅ Safe: Add without changing interface
const enhanceExistingComponent = (existingProps) => {
  // Add new functionality
  // Keep all existing props and behavior
  return <EnhancedVersion {...existingProps} />;
};

// ❌ Dangerous: Changing signatures
const changingExistingHook = (newRequiredParam) => {
  // This breaks all existing usage!
};
```

## 🤖 AI Integration Guidelines

### Working with OpenAI Features
- All AI functions live in `/utils/openai.ts`
- Always provide fallback responses
- Include comprehensive error handling
- Test with various input types
- Monitor API costs and usage

### Adding New AI Functions
```typescript
export async function newAIFunction(input: any): Promise<any> {
  // Always check API key
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key missing for newAIFunction');
    return fallbackResponse;
  }
  
  try {
    // AI implementation
    return processedResult;
  } catch (error) {
    console.error('newAIFunction failed:', error);
    return fallbackResponse;
  }
}
```

## 📊 Code Quality Standards

### TypeScript Usage
- Maintain existing type definitions
- Add new types in `/types/` directory
- Use strict typing for new functions
- Don't weaken existing type safety

### Error Handling
- All async functions need try/catch
- Provide user-friendly error messages
- Log errors for debugging
- Always have fallback behavior

### Performance Considerations
- Keep single-screen pattern for performance
- Lazy load components when possible
- Optimize image handling
- Monitor hook re-renders

## 🔍 Common Debugging Approach

### When Features Stop Working
1. Check console for errors
2. Verify file integrity (imports, exports)
3. Check hook dependencies
4. Verify storage/persistence
5. Test AI API connectivity
6. Check navigation state

### Debug Logging Strategy
```typescript
// Use consistent debug logging
console.log('🔍 Debug [Component/Hook/Service]:', data);
console.log('🚨 Error [Location]:', error);
console.log('✅ Success [Operation]:', result);
```

## 📋 Success Criteria

### Development Success
- ✅ All existing features continue working
- ✅ New features enhance user experience
- ✅ No functionality regression
- ✅ Code quality improves incrementally
- ✅ Documentation stays current

### User Success
- ✅ StyleDNA analysis works perfectly
- ✅ Laundry tracking provides value
- ✅ Outfit generation is helpful
- ✅ Camera integration is smooth
- ✅ App feels fast and responsive

## 🚀 Communication Guidelines

### When Reporting Progress
- Always mention if existing features still work
- Include specific testing performed
- Note any new patterns introduced
- Highlight any risks or concerns

### When Asking for Help
- Specify the exact feature/component affected
- Include what you've already tried
- Note what's working vs. what's broken
- Provide specific error messages or behaviors

## 📈 Continuous Improvement Strategy

### Weekly Goals
- One small improvement per week
- Document each change
- Test thoroughly
- Gather user feedback

### Monthly Reviews
- Review architecture documentation
- Update lessons learned
- Plan next incremental improvements
- Assess overall app health

---

**Remember**: This is a working app that users love. Your job is to make it even better while keeping everything that works. When choosing between a risky improvement and stable functionality, always choose stability.

**Emergency Reset**: `git checkout main-stable-backup`
**Documentation**: Always current with actual implementation
**Last Updated**: After successful recovery to stable state

## 🎯 Quick Reference

### Branches
- **Stable Branch**: `main-stable`
- **Emergency Branch**: `main-stable-backup`
- **Refactor Archive**: `refactor-save-attempt`

### Core Documentation
- **Architecture**: `WORKING_ARCHITECTURE.md`
- **Page Flow**: `COMPLETE_PAGE_FLOW_ARCHITECTURE.md`
- **Features**: `COMPREHENSIVE_FEATURE_INVENTORY.md`
- **StyleDNA**: `STYLEDNA_COMPLETE_GUIDE.md`
- **Debug Help**: `DEBUG_GUIDE.md`
- **Handoff Info**: `HANDOFF_GUIDE.md`
- **Lessons**: `LESSONS_LEARNED.md`
- **Verification**: `FEATURE_VERIFICATION_CHECKLIST.md`

### Key Features Status
- ✅ StyleDNA: Fully working in ProfilePage.tsx
- ✅ Laundry Analytics: Fully working in WardrobePage.tsx
- ✅ Navigation: Properly centered bottom navigation
- ✅ AI Features: Complete OpenAI integration in /utils/openai.ts
- ✅ Camera: Full camera and photo editing system
- ✅ Data Persistence: Complete backup/restore system