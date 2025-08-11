# 🚦 StyleMuse Incremental Update Policy
**Effective Date**: August 11, 2025  
**Status**: MANDATORY  
**Applies To**: All developers working on StyleMuse

---

## 🎯 The Prime Directive

> **"Never break a working system while trying to improve it"**

---

## ✅ The SAFE Method™

### S - Small Changes
### A - Always Test  
### F - Frequent Commits
### E - Emergency Plan

---

## 📋 Pre-Change Checklist (MANDATORY)

```bash
# BEFORE starting any work:
□ git status (ensure clean working directory)
□ npm start (verify app currently works)
□ git checkout -b feature/[descriptive-name]
□ git tag SAFE-POINT-$(date +%Y%m%d-%H%M%S)
```

---

## 🔴 RED FLAGS - STOP if you're about to:

### Level 1: CAUTION (Test after each change)
- [ ] Add a new npm package
- [ ] Modify navigation structure  
- [ ] Change state management
- [ ] Update styling system

### Level 2: DANGER (Create checkpoint first)
- [ ] Update React Native version
- [ ] Update Expo SDK version
- [ ] Modify tsconfig.json
- [ ] Change build scripts

### Level 3: CRITICAL (Requires team review)
- [ ] Modify babel.config.js
- [ ] Modify metro.config.js
- [ ] Change index.js or App.js
- [ ] Alter registerRootComponent

---

## 🏗️ The Incremental Workflow

### Step 1: Plan Your Changes
```markdown
Feature: [Name]
Changes needed:
1. ___________ (UI component)
2. ___________ (Business logic)
3. ___________ (API integration)
4. ___________ (State management)
5. ___________ (Testing)
```

### Step 2: Execute ONE Change
```bash
# Make exactly ONE change from your list
# Then immediately:
npx expo start --clear

# Wait 2 minutes and test:
- [ ] App loads without errors
- [ ] Existing features still work
- [ ] New change works as expected
```

### Step 3: Commit Immediately
```bash
# If it works:
git add -A
git commit -m "feat: [specific change description]"

# If it breaks:
git reset --hard HEAD
# Try a different approach
```

### Step 4: Repeat
Go back to Step 2 for the next change

---

## 🚫 The "Never Do This" List

### NEVER do multiple things at once:
```javascript
// ❌ WRONG - Too many changes
- Add subscription package
- Add babel plugin  
- Modify entry point
- Update dependencies
- All in one commit = 💥 BOOM
```

### ALWAYS do one thing at a time:
```javascript
// ✅ CORRECT - Incremental
Commit 1: Add subscription package
Test ✓
Commit 2: Create subscription UI component  
Test ✓
Commit 3: Add subscription service
Test ✓
Commit 4: Connect UI to service
Test ✓
```

---

## 📊 Change Risk Matrix

| Change Type | Risk | Test Time | Rollback Time |
|------------|------|-----------|---------------|
| UI Component | Low | 2 min | 30 sec |
| New Package | Medium | 5 min | 2 min |
| Navigation | Medium | 5 min | 2 min |
| State Mgmt | High | 10 min | 5 min |
| Build Config | CRITICAL | 15 min | 10 min |
| Entry Point | CRITICAL | 15 min | 15 min |

---

## 🛟 Emergency Procedures

### If the app won't start:
```bash
# Step 1: Don't panic
# Step 2: Check what changed
git status
git diff

# Step 3: Rollback immediately
git reset --hard HEAD

# Step 4: If still broken
./EMERGENCY_RESTORE.sh
```

### If you're lost:
```bash
# Return to last known good state
git checkout WORKING-SAVEPOINT-2025-08-11
npm install
npx expo start --clear
```

---

## 📈 Success Metrics

Track these to ensure policy compliance:

1. **Commits per feature**: Should be 5-10 small commits, not 1 huge one
2. **Time to rollback**: Should be < 2 minutes
3. **Breaking changes**: Should be 0
4. **Test frequency**: After EVERY change

---

## 🎮 Gamification (Make it Fun!)

### Achievement Levels:
- 🥉 **Bronze**: 10 incremental commits without breaking
- 🥈 **Silver**: 25 incremental commits without breaking  
- 🥇 **Gold**: 50 incremental commits without breaking
- 💎 **Diamond**: 100 incremental commits without breaking

### Penalties:
- 💥 Break the app = Reset to 0
- 🔄 Have to rollback = -5 points
- ⏰ Skip testing = -10 points

---

## 📝 Commit Message Template

```
type: brief description (max 50 chars)

- What: [what changed]
- Why: [why needed]
- Test: [how tested]
- Risk: [Low/Medium/High]

Closes #[issue]
```

Example:
```
feat: add subscription purchase button

- What: Added purchase button to settings
- Why: Users need way to upgrade
- Test: Clicked button, verified navigation
- Risk: Low

Closes #123
```

---

## 🤝 The Developer's Pledge

```
I promise to:
- Make small, incremental changes
- Test after every change  
- Commit working code frequently
- Never modify core configs without review
- Always have a rollback plan
- Help teammates follow this policy
```

---

## 📚 Required Reading

Before making changes, read:
1. `WORKING_STATE_SAVEPOINT.md` - What currently works
2. `INCIDENT_REPORT_2025_08_11.md` - What went wrong
3. This document - How to do it right

---

## ⚡ Quick Reference Card

```bash
# Before work:
git checkout -b feature/name
git tag SAFE-$(date +%s)

# After each change:
npx expo start --clear
# Test for 2 minutes

# If it works:
git add -A && git commit -m "feat: description"

# If it breaks:
git reset --hard HEAD

# Emergency:
./EMERGENCY_RESTORE.sh
```

---

**Remember**: Going slow is faster than breaking everything and spending hours fixing it.

**This policy is not a suggestion. It's how we work now.**

---

*Policy Author*: Senior Development Team  
*Approved By*: CEO (after the incident)  
*Last Updated*: August 11, 2025