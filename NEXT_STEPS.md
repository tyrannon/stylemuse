# Next Steps for StyleMuse & claude-prompter (2025-07-19)

## 🔥 Immediate Fixes Required

### 1. ✅ Start Fresh Fix (COMPLETED)
- Added missing AsyncStorage keys to DataResetService.ts:
  - `backup_index`
  - `last_auto_backup`
  - `forceAppRestart`

### 2. 🔍 Onboarding Page 3 Debug (STARTED)
- Added debug logging to StyleQuizScreen.tsx
- **Next steps**:
  - Check console logs when navigating to page 3
  - Look for null/undefined route params
  - Consider adding try-catch around question rendering
  - Test on different devices/simulators

### 3. 🐛 Inquirer Interactive Mode Fix
**Problem**: Terminal input conflict in claude-prompter
**Solution Options**:
1. Downgrade to inquirer v8 (temporary fix)
2. Use `--no-interactive` flag by default
3. Implement proper stdin handling:
```javascript
// In template.ts, before inquirer prompt:
process.stdin.removeAllListeners('data');
process.stdin.pause();
```

## 📱 StyleMuse Implementation Priority

### iOS Settings Redesign
1. Create new `SettingsScreen.tsx` component
2. Use `SectionList` from React Native
3. Structure:
```javascript
const sections = [
  { title: 'Appearance', data: [...] },
  { title: 'Privacy & Security', data: [...] },
  { title: 'Account', data: [...] }
];
```

### Payment Gateway Test
1. Install Stripe SDK: `npm install @stripe/stripe-react-native`
2. Create `PaymentService.ts`
3. Test card: 4242 4242 4242 4242

## 🚀 claude-prompter Enhancements

### Quick Fixes:
1. **Session persistence test**:
   ```bash
   node dist/cli.js session start -p "test"
   node dist/cli.js prompt -m "Hello" --use-session <id>
   node dist/cli.js history show
   ```

2. **Template creation**:
   ```bash
   node dist/cli.js template create
   ```

### Planning Command (Future):
```typescript
// src/commands/plan.ts
export function createPlanCommand() {
  // Break down complex tasks
  // Generate implementation steps
  // Export to todo format
}
```

## 🎯 Testing Checklist

- [ ] Start Fresh clears ALL data
- [ ] Onboarding page 3 displays correctly
- [ ] claude-prompter sessions persist between runs
- [ ] Templates work without interactive mode
- [ ] History shows conversation data

## 💡 Pro Tips

1. **Use claude-prompter for everything**:
   - Document decisions: `session decision -s <id>`
   - Track issues: `session context -s <id> -t "Bug: XYZ"`
   - Generate prompts: `template use builtin-feature-planning`

2. **Debug with logs**:
   - StyleMuse: Check `utils/DebugLogger.ts` output
   - claude-prompter: Add console.log in problem areas

3. **Quick wins**:
   - Fix text-only bugs first
   - Test on simulator before device
   - Commit small, working changes

## 🔗 Resources

- StyleMuse CLAUDE.md: Full documentation
- claude-prompter CLAUDE.md: Tool documentation
- GitHub: https://github.com/tyrannon/stylemuse

## 📞 Contact

Questions? Create GitHub issue or use claude-prompter to generate detailed problem descriptions!

---
Last updated: 2025-07-19 by Claude & Kaiya
Next session: Continue with iOS settings implementation