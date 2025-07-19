import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import { callOpenAI } from '../utils/openaiClient';
import { TokenCounter } from '../utils/tokenCounter';
import { DatabaseManager } from '../data/DatabaseManager';
import inquirer from 'inquirer';

interface BatchPrompt {
  id?: string;
  message: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

interface BatchResult {
  id?: string;
  prompt: string;
  response?: string;
  success: boolean;
  error?: string;
  tokens?: {
    input: number;
    output: number;
  };
  cost?: number;
}

export function createBatchCommand() {
  const batch = new Command('batch')
    .description('Process multiple prompts from a file')
    .option('-f, --file <file>', 'Input file with prompts (JSON or TXT)')
    .option('-o, --output <file>', 'Output file for results', 'batch-results.json')
    .option('--parallel <n>', 'Number of parallel requests (1-5)', '1')
    .option('--max-cost <amount>', 'Maximum cost limit in USD', '10')
    .option('--dry-run', 'Estimate cost without running')
    .option('--continue-on-error', 'Continue processing if individual prompts fail')
    .action(async (options) => {
      try {
        if (!options.file) {
          console.error(chalk.red('Error: Input file is required. Use -f or --file option.'));
          process.exit(1);
        }

        // Validate file exists
        if (!await fs.pathExists(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }

        // Load prompts
        const prompts = await loadPrompts(options.file);
        if (prompts.length === 0) {
          console.error(chalk.red('Error: No prompts found in file'));
          process.exit(1);
        }

        // Initialize services
        const tokenCounter = new TokenCounter();
        const dbManager = new DatabaseManager();

        // Estimate costs
        console.log(chalk.cyan('\n📊 Analyzing batch...'));
        const estimate = await estimateBatchCost(prompts, tokenCounter);
        
        // Display estimate
        console.log(chalk.yellow('\n╭──────────────────── Batch Processing Estimate ─────────────────────╮'));
        console.log(chalk.yellow('│                                                                    │'));
        console.log(chalk.yellow(`│  Input File: ${chalk.white(path.basename(options.file)).padEnd(50)}│`));
        console.log(chalk.yellow(`│  Total Prompts: ${chalk.white(prompts.length.toString()).padEnd(49)}│`));
        console.log(chalk.yellow('│                                                                    │'));
        console.log(chalk.yellow('│  Token Estimates:                                                  │'));
        console.log(chalk.yellow(`│  ├─ Average Input Tokens: ~${chalk.white(Math.round(estimate.avgInputTokens).toString()).padEnd(37)}│`));
        console.log(chalk.yellow(`│  ├─ Total Input Tokens: ~${chalk.white(estimate.totalInputTokens.toLocaleString()).padEnd(39)}│`));
        console.log(chalk.yellow(`│  ├─ Expected Output Tokens: ~${chalk.white(estimate.expectedOutputTokens.toLocaleString()).padEnd(35)}│`));
        console.log(chalk.yellow(`│  └─ Total Tokens: ~${chalk.white(estimate.totalTokens.toLocaleString()).padEnd(45)}│`));
        console.log(chalk.yellow('│                                                                    │'));
        console.log(chalk.yellow('│  Cost Estimate:                                                    │'));
        console.log(chalk.yellow(`│  ├─ Input Cost: ${chalk.green('$' + estimate.inputCost.toFixed(3)).padEnd(57)}│`));
        console.log(chalk.yellow(`│  ├─ Output Cost: ${chalk.green('$' + estimate.outputCost.toFixed(3)).padEnd(56)}│`));
        console.log(chalk.yellow(`│  └─ Total Cost: ~${chalk.green('$' + estimate.totalCost.toFixed(3)).padEnd(55)}│`));
        console.log(chalk.yellow('│                                                                    │'));
        
        // Check daily usage
        const todayUsage = await dbManager.getUsageReport('today');
        const dailyLimit = await dbManager.getLimit('daily') || 10;
        const remainingBudget = dailyLimit - todayUsage.totalCost;
        
        console.log(chalk.yellow(`│  ⚠️  Current Daily Usage: ${chalk.cyan('$' + todayUsage.totalCost.toFixed(2) + ' / $' + dailyLimit.toFixed(2)).padEnd(48)}│`));
        
        if (estimate.totalCost > remainingBudget) {
          console.log(chalk.red(`│  ❌ This batch would exceed daily limit!                           │`));
        } else {
          console.log(chalk.green(`│  ✅ This batch will use: ${chalk.white('$' + estimate.totalCost.toFixed(3)).padEnd(48)}│`));
        }
        
        console.log(chalk.yellow('│                                                                    │'));
        console.log(chalk.yellow('╰────────────────────────────────────────────────────────────────────╯'));

        if (options.dryRun) {
          console.log(chalk.gray('\nDry run complete. Use without --dry-run to process.'));
          process.exit(0);
        }

        // Check cost limit
        const maxCost = parseFloat(options.maxCost);
        if (estimate.totalCost > maxCost) {
          console.error(chalk.red(`\n❌ Estimated cost ($${estimate.totalCost.toFixed(2)}) exceeds limit ($${maxCost.toFixed(2)})`));
          console.log(chalk.gray('Tip: Increase limit with --max-cost or reduce number of prompts'));
          process.exit(1);
        }

        // Confirm processing
        const { proceed } = await inquirer.prompt([{
          type: 'confirm',
          name: 'proceed',
          message: `Proceed with batch processing? (Est. cost: $${estimate.totalCost.toFixed(3)})`,
          default: true
        }]);

        if (!proceed) {
          console.log(chalk.gray('Batch processing cancelled.'));
          process.exit(0);
        }

        // Process batch
        console.log(chalk.cyan('\n🚀 Starting batch processing...\n'));
        const results = await processBatch(prompts, {
          parallel: parseInt(options.parallel),
          continueOnError: options.continueOnError,
          outputFile: options.output
        });

        // Save results
        await fs.writeJson(options.output, results, { spaces: 2 });
        
        // Show summary
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);
        
        console.log(chalk.green(`\n✅ Batch processing complete!`));
        console.log(chalk.gray('─'.repeat(40)));
        console.log(`  Successful: ${chalk.green(successful.toString())}`);
        if (failed > 0) {
          console.log(`  Failed: ${chalk.red(failed.toString())}`);
        }
        console.log(`  Total Cost: ${chalk.cyan('$' + totalCost.toFixed(4))}`);
        console.log(`  Results saved to: ${chalk.blue(options.output)}`);

      } catch (error) {
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return batch;
}

async function loadPrompts(filePath: string): Promise<BatchPrompt[]> {
  const ext = path.extname(filePath).toLowerCase();
  const content = await fs.readFile(filePath, 'utf-8');

  if (ext === '.json') {
    // JSON format: array of objects or single object
    const data = JSON.parse(content);
    if (Array.isArray(data)) {
      return data;
    } else if (data.prompts && Array.isArray(data.prompts)) {
      return data.prompts;
    } else if (data.message) {
      return [data];
    }
  } else if (ext === '.txt') {
    // Text format: one prompt per line
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((message, index) => ({ id: `prompt-${index + 1}`, message }));
  }

  throw new Error(`Unsupported file format: ${ext}. Use .json or .txt`);
}

async function estimateBatchCost(prompts: BatchPrompt[], tokenCounter: TokenCounter) {
  let totalInputTokens = 0;
  
  for (const prompt of prompts) {
    const messages = [
      { role: 'system' as const, content: prompt.systemPrompt || 'You are a helpful assistant.' },
      { role: 'user' as const, content: prompt.message }
    ];
    totalInputTokens += tokenCounter.countChatTokens(messages);
  }

  const avgInputTokens = totalInputTokens / prompts.length;
  // Estimate output tokens based on typical response (1.5x input on average)
  const expectedOutputTokens = Math.round(totalInputTokens * 1.5);
  
  const costs = tokenCounter.estimateCost(totalInputTokens, expectedOutputTokens);
  
  return {
    avgInputTokens,
    totalInputTokens,
    expectedOutputTokens,
    totalTokens: totalInputTokens + expectedOutputTokens,
    inputCost: costs.inputCost,
    outputCost: costs.outputCost,
    totalCost: costs.totalCost
  };
}

async function processBatch(
  prompts: BatchPrompt[], 
  options: { parallel: number; continueOnError?: boolean; outputFile: string }
): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  const progressBar = new cliProgress.SingleBar({
    format: 'Progress |{bar}| {percentage}% | {value}/{total} prompts | ETA: {eta}s',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  }, cliProgress.Presets.shades_classic);

  progressBar.start(prompts.length, 0);

  // Generate batch ID for tracking
  const batchId = `batch-${Date.now()}`;
  
  // Process in chunks based on parallel setting
  const chunkSize = Math.min(options.parallel, 5); // Max 5 parallel
  
  for (let i = 0; i < prompts.length; i += chunkSize) {
    const chunk = prompts.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(async (prompt) => {
        try {
          const response = await callOpenAI(
            prompt.message,
            prompt.systemPrompt || 'You are a helpful assistant.',
            { command: 'batch', batchId }
          );
          
          return {
            id: prompt.id,
            prompt: prompt.message,
            response,
            success: true
          } as BatchResult;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          if (!options.continueOnError) {
            progressBar.stop();
            throw error;
          }
          
          return {
            id: prompt.id,
            prompt: prompt.message,
            success: false,
            error: errorMessage
          } as BatchResult;
        }
      })
    );
    
    results.push(...chunkResults);
    progressBar.update(Math.min(i + chunkSize, prompts.length));
    
    // Small delay between chunks to avoid rate limits
    if (i + chunkSize < prompts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  progressBar.stop();
  
  return results;
}