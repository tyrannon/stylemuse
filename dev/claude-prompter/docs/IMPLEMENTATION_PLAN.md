# Implementation Plan: Batch Processing with API Usage Tracking
<!-- Last edited: 2025-07-19 by Claude Code -->
<!-- Purpose: Step-by-step implementation guide -->

## Quick Start Implementation

### Step 1: Install Dependencies
```bash
npm install @dqbd/tiktoken cli-progress
```

### Step 2: Create Token Counter Utility
```typescript
// src/utils/tokenCounter.ts
import { encoding_for_model, TiktokenModel } from '@dqbd/tiktoken';

export class TokenCounter {
  private encoder: any;
  private model: TiktokenModel = 'gpt-4';
  
  constructor() {
    this.encoder = encoding_for_model(this.model);
  }
  
  count(text: string): number {
    try {
      return this.encoder.encode(text).length;
    } catch (error) {
      // Fallback: rough estimate (1 token ≈ 4 chars)
      return Math.ceil(text.length / 4);
    }
  }
}
```

### Step 3: Add Usage Tracking to Existing OpenAI Client
```typescript
// src/utils/openaiClient.ts - UPDATE EXISTING
import { TokenCounter } from './tokenCounter';
import { UsageManager } from '../data/UsageManager';

export class OpenAIClient {
  private tokenCounter = new TokenCounter();
  private usageManager = new UsageManager();
  
  async sendPrompt(message: string, options: PromptOptions = {}) {
    const inputTokens = this.tokenCounter.count(message);
    const startTime = Date.now();
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: message }],
        ...options
      });
      
      const outputTokens = this.tokenCounter.count(
        response.choices[0]?.message?.content || ''
      );
      
      // Record usage
      await this.usageManager.record({
        command: 'prompt',
        inputTokens,
        outputTokens,
        model: 'gpt-4o',
        success: true,
        duration: Date.now() - startTime
      });
      
      return response;
    } catch (error) {
      await this.usageManager.record({
        command: 'prompt',
        inputTokens,
        outputTokens: 0,
        model: 'gpt-4o',
        success: false,
        error: error.message
      });
      throw error;
    }
  }
}
```

### Step 4: Create Simple Usage Manager
```typescript
// src/data/UsageManager.ts
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export class UsageManager {
  private usageDir: string;
  
  constructor() {
    this.usageDir = path.join(os.homedir(), '.claude-prompter', 'usage');
    fs.ensureDirSync(this.usageDir);
  }
  
  async record(usage: UsageRecord): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const file = path.join(this.usageDir, `${today}.json`);
    
    // Read existing or create new
    let records = [];
    if (await fs.pathExists(file)) {
      records = await fs.readJson(file);
    }
    
    // Calculate costs
    const costs = this.calculateCosts(usage.inputTokens, usage.outputTokens);
    
    // Add record
    records.push({
      ...usage,
      timestamp: new Date().toISOString(),
      ...costs
    });
    
    // Save
    await fs.writeJson(file, records, { spaces: 2 });
  }
  
  private calculateCosts(inputTokens: number, outputTokens: number) {
    const rates = {
      input: 0.0025 / 1_000_000,   // $2.50 per 1M
      output: 0.01 / 1_000_000     // $10 per 1M
    };
    
    return {
      inputCost: inputTokens * rates.input,
      outputCost: outputTokens * rates.output,
      totalCost: (inputTokens * rates.input) + (outputTokens * rates.output)
    };
  }
}
```

### Step 5: Implement Batch Command
```typescript
// src/commands/batch.ts
import { Command } from 'commander';
import fs from 'fs-extra';
import cliProgress from 'cli-progress';
import { OpenAIClient } from '../utils/openaiClient';
import { TokenCounter } from '../utils/tokenCounter';

export function createBatchCommand() {
  const batch = new Command('batch')
    .description('Process multiple prompts from a file')
    .option('-f, --file <file>', 'Input file with prompts (JSON or TXT)')
    .option('-o, --output <file>', 'Output file for results', 'results.json')
    .option('--parallel <n>', 'Number of parallel requests', '1')
    .option('--max-cost <amount>', 'Maximum cost limit', '10')
    .option('--dry-run', 'Estimate cost without running')
    .action(async (options) => {
      const client = new OpenAIClient();
      const tokenCounter = new TokenCounter();
      
      // Load prompts
      const prompts = await loadPrompts(options.file);
      
      // Estimate cost
      const estimate = estimateCost(prompts, tokenCounter);
      
      console.log(chalk.yellow(`\n📊 Batch Processing Estimate:`));
      console.log(`   Prompts: ${prompts.length}`);
      console.log(`   Est. Tokens: ~${estimate.tokens}`);
      console.log(`   Est. Cost: ~$${estimate.cost.toFixed(2)}`);
      
      if (options.dryRun) {
        return;
      }
      
      if (estimate.cost > parseFloat(options.maxCost)) {
        console.log(chalk.red(`\n❌ Estimated cost exceeds limit ($${options.maxCost})`));
        return;
      }
      
      // Confirm
      const proceed = await confirm('Proceed with batch processing?');
      if (!proceed) return;
      
      // Process with progress bar
      const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
      progressBar.start(prompts.length, 0);
      
      const results = [];
      const parallel = parseInt(options.parallel);
      
      for (let i = 0; i < prompts.length; i += parallel) {
        const batch = prompts.slice(i, i + parallel);
        const batchResults = await Promise.all(
          batch.map(p => processPrompt(client, p))
        );
        results.push(...batchResults);
        progressBar.update(i + batch.length);
      }
      
      progressBar.stop();
      
      // Save results
      await fs.writeJson(options.output, results, { spaces: 2 });
      
      // Show summary
      const successful = results.filter(r => r.success).length;
      console.log(chalk.green(`\n✅ Batch complete: ${successful}/${prompts.length} successful`));
      
      // Show usage report
      await showBatchUsageReport();
    });
    
  return batch;
}
```

### Step 6: Add Usage Command
```typescript
// src/commands/usage.ts
export function createUsageCommand() {
  const usage = new Command('usage')
    .description('View API usage and costs')
    .option('--today', 'Show today\'s usage')
    .option('--month', 'Show current month usage')
    .option('--limit <amount>', 'Set daily spending limit')
    .action(async (options) => {
      const usageManager = new UsageManager();
      
      if (options.limit) {
        await usageManager.setLimit('daily', parseFloat(options.limit));
        console.log(chalk.green(`✅ Daily limit set to $${options.limit}`));
        return;
      }
      
      const report = await usageManager.getReport(
        options.today ? 'today' : 'month'
      );
      
      // Display beautiful report
      displayUsageReport(report);
    });
    
  return usage;
}
```

### Step 7: Quick Test Script
```bash
# Create test prompts file
cat > test-prompts.json << EOF
[
  {"message": "What is 2+2?"},
  {"message": "Tell me a joke"},
  {"message": "Explain photosynthesis briefly"}
]
EOF

# Test batch processing
claude-prompter batch -f test-prompts.json --dry-run
claude-prompter batch -f test-prompts.json --parallel 2

# Check usage
claude-prompter usage --today
```

## MVP Features (Day 1)
1. ✅ Basic token counting
2. ✅ Cost calculation
3. ✅ Usage persistence to JSON files
4. ✅ Batch processing from JSON file
5. ✅ Simple usage report

## Enhanced Features (Day 2-3)
1. 📊 Progress bars and better UI
2. 🔄 Resume interrupted batches
3. 📈 Detailed analytics
4. 🚨 Cost alerts and limits
5. 📁 Multiple input formats (CSV, TXT)
6. 🔍 Usage search and filtering

## Testing Checklist
- [ ] Token counting accuracy
- [ ] Cost calculations match OpenAI pricing
- [ ] Batch processing handles errors gracefully
- [ ] Usage persists across sessions
- [ ] Rate limiting prevents API errors
- [ ] Large batches don't run out of memory

---

*This implementation provides immediate value while laying groundwork for advanced features.*