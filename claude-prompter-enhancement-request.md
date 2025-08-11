# 🚨 Claude-Prompter Enhancement Request: Safety Features

**Priority**: CRITICAL  
**Issue**: Tool currently enables dangerous changes without warnings  
**Request Date**: August 11, 2025

---

## Executive Summary

Claude-prompter needs "guardrails" to prevent it from suggesting changes that can break entire applications. Current version acts as an "eager enabler" when it should be a "cautious guardian."

---

## Minimal Viable Safety (Quick Wins)

### 1. Add These Warning Triggers (1 hour to implement)

```javascript
const DANGER_PATTERNS = [
  'babel.config',
  'metro.config',
  'webpack.config',
  'registerRootComponent',
  'AppRegistry',
  'index.js changes',
  'tsconfig.json'
];

// Before any suggestion
if (DANGER_PATTERNS.some(p => suggestion.includes(p))) {
  console.warn(`
    ⚠️ HIGH RISK OPERATION DETECTED
    This change could break your entire application.
    Create a git checkpoint first:
    git add -A && git commit -m "CHECKPOINT before risky change"
  `);
}
```

### 2. Add Failure Counter (30 minutes)

```javascript
// Track consecutive errors
let errorCount = 0;

// In error handler
errorCount++;
if (errorCount >= 3) {
  console.error(`
    🛑 STOP - Multiple failures detected
    
    Recommendation: ROLLBACK
    git reset --hard HEAD
    
    Then try a different approach.
  `);
}
```

### 3. Force Incremental Mode for Complex Tasks (2 hours)

```javascript
// When detecting multiple operations
if (detectedSteps.length > 3) {
  console.log(`
    📋 This requires ${detectedSteps.length} changes.
    
    INCREMENTAL MODE ACTIVATED:
    I'll guide you through ONE step at a time.
    Test after each step before proceeding.
    
    Step 1 of ${detectedSteps.length}: ${detectedSteps[0]}
    
    [Complete and test this before asking for Step 2]
  `);
}
```

---

## Full Feature Request

### 🎯 Feature 1: Risk Assessment Engine

```bash
claude-prompter risk "modify babel.config.js"

# Output:
┌────────────────────────────────┐
│ RISK ASSESSMENT                │
├────────────────────────────────┤
│ File: babel.config.js          │
│ Risk: 🔴 CRITICAL              │
│ Can Break: Entire build system │
│ Recovery Time: 15-45 minutes   │
│                                │
│ Safer Alternatives:            │
│ 1. Use Expo's built-in TS      │
│ 2. Configure via tsconfig only │
│                                │
│ Proceed? (y/N):                │
└────────────────────────────────┘
```

### 🎯 Feature 2: Checkpoint Enforcer

```javascript
// For any HIGH or CRITICAL risk operation
function enforceCheckpoint(riskLevel) {
  if (riskLevel >= HIGH) {
    const timestamp = Date.now();
    console.log(`
      📍 CHECKPOINT REQUIRED
      
      Run this command first:
      git tag SAFE-${timestamp} && git add -A && git commit -m "Checkpoint before ${operation}"
      
      Then you can proceed with the risky change.
    `);
    
    // Don't proceed until checkpoint confirmed
    waitForCheckpoint();
  }
}
```

### 🎯 Feature 3: Platform-Specific Guards

```javascript
// Detect Expo projects
class ExpoGuard {
  constructor() {
    this.rules = {
      'babel.config.js': 'BLOCK - Expo manages Babel automatically',
      'metro.config.js': 'WARN - Usually not needed with Expo',
      'registerRootComponent': 'BLOCK - Never modify in Expo apps',
      'index.js': 'WARN - Risky to modify entry point'
    };
  }
  
  check(operation) {
    for (const [file, rule] of Object.entries(this.rules)) {
      if (operation.includes(file)) {
        if (rule.startsWith('BLOCK')) {
          throw new Error(`❌ ${rule}`);
        } else if (rule.startsWith('WARN')) {
          console.warn(`⚠️ ${rule}`);
        }
      }
    }
  }
}
```

### 🎯 Feature 4: Rollback Advisor

```bash
claude-prompter status

# Output:
┌─────────────────────────────────┐
│ SESSION STATUS                  │
├─────────────────────────────────┤
│ Commands Run: 5                 │
│ Errors: 3                       │
│ Success Rate: 40%               │
│                                 │
│ ⚠️ RECOMMENDATION: ROLLBACK    │
│                                 │
│ You've encountered multiple     │
│ errors. Consider:               │
│                                 │
│ git reset --hard HEAD~3         │
│ npm install                     │
│ npx expo start --clear          │
└─────────────────────────────────┘
```

### 🎯 Feature 5: Confidence Indicators

```javascript
// Add to all suggestions
class Suggestion {
  constructor(text, confidence) {
    this.text = text;
    this.confidence = confidence; // 0-100
  }
  
  display() {
    let indicator = '';
    if (this.confidence >= 80) {
      indicator = '✅ High Confidence';
    } else if (this.confidence >= 50) {
      indicator = '⚠️ Medium Confidence';
    } else {
      indicator = '🔴 Low Confidence - Proceed Carefully';
    }
    
    return `
      ${indicator} (${this.confidence}%)
      
      ${this.text}
      
      ${this.confidence < 50 ? 'Consider alternatives or rollback if this fails.' : ''}
    `;
  }
}
```

---

## Implementation Priority

### Phase 1: Immediate (This Week)
1. ✅ Warning triggers for dangerous files
2. ✅ Basic failure counter
3. ✅ Checkpoint suggestions

### Phase 2: Short Term (Next 2 Weeks)
1. 📊 Risk assessment command
2. 🔄 Rollback advisor
3. 📈 Confidence indicators

### Phase 3: Long Term (Next Month)
1. 🛡️ Full platform-specific guards
2. 🎯 ML-based risk prediction
3. 📚 Learning from incidents

---

## Success Metrics

After implementation, we should see:
- 80% reduction in cascade failures
- 90% of risky operations have checkpoints
- 50% reduction in time to recover from errors
- 0 babel.config related incidents in Expo apps

---

## Test Cases

```javascript
// Test 1: Should block babel.config changes in Expo
test('blocks babel config in expo', () => {
  const result = claudePrompter.suggest('add typescript plugin to babel');
  expect(result).toContain('BLOCKED');
});

// Test 2: Should suggest rollback after 3 failures
test('suggests rollback after failures', () => {
  simulateErrors(3);
  const result = claudePrompter.getStatus();
  expect(result).toContain('ROLLBACK');
});

// Test 3: Should force incremental for complex tasks
test('forces incremental mode', () => {
  const result = claudePrompter.plan('add subscription with payment');
  expect(result.steps.length).toBeGreaterThan(1);
  expect(result.mode).toBe('incremental');
});
```

---

## Code Examples for Implementation

### Example 1: Safety Wrapper

```javascript
class SafeClaudePrompter {
  constructor(originalPrompter) {
    this.prompter = originalPrompter;
    this.errorCount = 0;
    this.checkpoints = [];
  }
  
  async suggest(query) {
    // Check risk level
    const risk = this.assessRisk(query);
    
    if (risk === 'CRITICAL') {
      await this.enforceCheckpoint();
    }
    
    // Get original suggestion
    const suggestion = await this.prompter.suggest(query);
    
    // Add safety warnings
    return this.addSafetyWarnings(suggestion, risk);
  }
  
  assessRisk(query) {
    const critical = ['babel', 'metro', 'webpack', 'registerRoot'];
    const high = ['package.json', 'tsconfig', 'index.js'];
    
    if (critical.some(c => query.includes(c))) return 'CRITICAL';
    if (high.some(h => query.includes(h))) return 'HIGH';
    return 'LOW';
  }
}
```

### Example 2: Incremental Enforcer

```javascript
class IncrementalEnforcer {
  breakDownTask(task) {
    const steps = this.identifySteps(task);
    
    if (steps.length > 3) {
      return {
        mode: 'incremental',
        currentStep: 1,
        totalSteps: steps.length,
        steps: steps.map((s, i) => ({
          number: i + 1,
          description: s,
          checkpoint: `CHECKPOINT-${i+1}`,
          test: `Test for 2 minutes after step ${i+1}`
        }))
      };
    }
    
    return { mode: 'standard', steps };
  }
}
```

---

## Summary

Claude-prompter is a powerful tool that needs safety features to prevent it from enabling catastrophic changes. These enhancements would transform it from an "eager assistant" to a "wise guardian" that protects developers from themselves.

**The goal**: Make it impossible for claude-prompter to contribute to app-breaking incidents.

---

*Submitted by*: StyleMuse Development Team  
*Incident Reference*: August 11, 2025 Babel Config Cascade Failure  
*Priority*: CRITICAL - Prevent future incidents