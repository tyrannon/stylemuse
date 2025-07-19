# OpenAI API Usage Tracking & Cost Monitoring
<!-- Last edited: 2025-07-19 by Claude Code -->
<!-- Purpose: Design document for API usage tracking and batch processing -->

## Overview

This document outlines the implementation plan for comprehensive API usage tracking and cost monitoring in claude-prompter, with special consideration for batch processing operations.

## Architecture Components

### 1. Token Counting System

#### Implementation
```typescript
// src/utils/tokenCounter.ts
import { encoding_for_model } from '@dqbd/tiktoken';

export class TokenCounter {
  private encoder: any;
  
  constructor(model: string = 'gpt-4') {
    this.encoder = encoding_for_model(model);
  }
  
  countTokens(text: string): number {
    return this.encoder.encode(text).length;
  }
  
  estimateCost(inputTokens: number, outputTokens: number): {
    inputCost: number;
    outputCost: number;
    totalCost: number;
  } {
    const rates = {
      'gpt-4o': {
        input: 0.0025,  // $2.50 per 1M tokens
        output: 0.01    // $10 per 1M tokens
      }
    };
    
    const inputCost = (inputTokens / 1_000_000) * rates['gpt-4o'].input;
    const outputCost = (outputTokens / 1_000_000) * rates['gpt-4o'].output;
    
    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost
    };
  }
}
```

### 2. Usage Persistence

#### Storage Structure
```
~/.claude-prompter/
├── usage/
│   ├── daily/
│   │   ├── 2025-07-19.json
│   │   └── ...
│   ├── summary.json
│   └── current-month.json
```

#### Data Schema
```typescript
interface UsageRecord {
  id: string;
  timestamp: Date;
  command: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  success: boolean;
  error?: string;
  batchId?: string;  // For batch processing tracking
}

interface DailySummary {
  date: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byCommand: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
  errors: number;
}
```

### 3. Usage Manager

```typescript
// src/data/UsageManager.ts
export class UsageManager {
  private usageDir: string;
  
  async recordUsage(record: UsageRecord): Promise<void> {
    // Save to daily file
    const dailyFile = this.getDailyFile(record.timestamp);
    await this.appendToFile(dailyFile, record);
    
    // Update summary
    await this.updateSummary(record);
    
    // Check quotas
    await this.checkQuotas();
  }
  
  async getUsageReport(options: ReportOptions): Promise<UsageReport> {
    // Generate reports by date range, command, etc.
  }
  
  async getCurrentMonthUsage(): Promise<MonthlyUsage> {
    // Quick access to current month's usage
  }
}
```

### 4. Batch Processing Command

```typescript
// src/commands/batch.ts
export class BatchCommand {
  async execute(options: BatchOptions): Promise<void> {
    const prompts = await this.loadPrompts(options.file);
    const tokenCounter = new TokenCounter();
    const usageManager = new UsageManager();
    
    // Pre-flight checks
    const estimatedTokens = this.estimateTokens(prompts);
    const estimatedCost = this.estimateCost(estimatedTokens);
    
    if (estimatedCost > options.maxCost) {
      throw new Error(`Estimated cost $${estimatedCost} exceeds limit`);
    }
    
    // Process with rate limiting
    const results = await this.processWithRateLimit(prompts, {
      maxConcurrent: options.parallel ? 5 : 1,
      delayBetween: 100,
      onProgress: (completed, total) => {
        this.updateProgress(completed, total);
      }
    });
    
    // Save results
    await this.saveResults(results, options.output);
  }
}
```

### 5. Usage Command

```bash
# Check current usage
claude-prompter usage

# Get detailed report
claude-prompter usage --report --from 2025-07-01 --to 2025-07-19

# Set spending limits
claude-prompter usage --set-limit daily=10 monthly=300

# Export usage data
claude-prompter usage --export csv > usage.csv
```

## Batch Processing Features

### Input File Format
```json
// prompts.json
[
  {
    "id": "prompt-1",
    "message": "Explain quantum computing",
    "temperature": 0.7,
    "maxTokens": 150
  },
  {
    "id": "prompt-2",
    "message": "Write a haiku about AI",
    "temperature": 0.9,
    "maxTokens": 50
  }
]
```

### Safeguards

1. **Pre-flight Cost Estimation**
   - Calculate total tokens before processing
   - Show estimated cost and get confirmation
   - Respect user-defined spending limits

2. **Rate Limiting**
   - Configurable concurrent requests (default: 3)
   - Automatic retry with exponential backoff
   - Respect OpenAI rate limits

3. **Progress Tracking**
   - Real-time progress bar
   - Save partial results on failure
   - Resume capability for interrupted batches

4. **Error Handling**
   - Log all errors with context
   - Continue processing on individual failures
   - Summary report of successes/failures

## Usage Reporting UI

```
╭────────────────────── API Usage Report ──────────────────────╮
│                                                              │
│  Period: July 1-19, 2025                                     │
│                                                              │
│  Total Requests: 342                                         │
│  Total Tokens: 1,234,567                                     │
│  Total Cost: $3.21                                           │
│                                                              │
│  By Command:                                                 │
│  ┌─────────┬──────────┬───────────┬─────────┐              │
│  │ Command │ Requests │ Tokens    │ Cost    │              │
│  ├─────────┼──────────┼───────────┼─────────┤              │
│  │ prompt  │ 200      │ 500,000   │ $1.25   │              │
│  │ suggest │ 100      │ 400,000   │ $1.00   │              │
│  │ batch   │ 42       │ 334,567   │ $0.96   │              │
│  └─────────┴──────────┴───────────┴─────────┘              │
│                                                              │
│  Daily Average: $0.17                                        │
│  Projected Monthly: $5.10                                    │
│                                                              │
│  ⚠️ 64% of monthly limit used ($5.10 / $8.00)               │
│                                                              │
╰──────────────────────────────────────────────────────────────╯
```

## Implementation Priority

1. **Phase 1: Core Token Counting**
   - Integrate tiktoken for accurate counting
   - Add token counts to existing commands
   - Basic cost calculation

2. **Phase 2: Usage Persistence**
   - Create UsageManager class
   - Implement file-based storage
   - Add to all API calls

3. **Phase 3: Batch Processing**
   - Implement batch command
   - Add progress tracking
   - Include safeguards

4. **Phase 4: Reporting & Analytics**
   - Build usage command
   - Create report visualizations
   - Add export capabilities

5. **Phase 5: Advanced Features**
   - Budget alerts
   - Usage predictions
   - Cost optimization suggestions

## Configuration

```json
// ~/.claude-prompter/config.json
{
  "usage": {
    "tracking": true,
    "limits": {
      "daily": 10.00,
      "monthly": 300.00
    },
    "alerts": {
      "enabled": true,
      "thresholds": [50, 80, 95]
    },
    "models": {
      "gpt-4o": {
        "inputRate": 0.0025,
        "outputRate": 0.01
      }
    }
  }
}
```

## Testing Strategy

1. **Unit Tests**
   - Token counting accuracy
   - Cost calculations
   - File persistence

2. **Integration Tests**
   - Batch processing workflow
   - Rate limiting behavior
   - Error recovery

3. **Load Tests**
   - Large batch handling
   - Concurrent request limits
   - Storage performance

## Security Considerations

- No API keys in usage logs
- Sanitize prompts in reports (optional)
- Encrypted storage option for sensitive data
- Local-only storage (no cloud sync by default)

---

*This design ensures claude-prompter users can confidently use the tool without worrying about unexpected API costs, while enabling powerful batch processing capabilities.*