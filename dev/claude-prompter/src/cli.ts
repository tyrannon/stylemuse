#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';
import dotenv from 'dotenv';
import { callOpenAI, OpenAIError } from './utils/openaiClient';
import { generateClaudePrompt } from './utils/promptGenerator';
import { 
  generatePromptSuggestions, 
  generateClaudePromptSuggestions,
  formatSuggestionsForCLI,
  ConversationContext 
} from './utils/promptSuggestions';
import { createSessionCommand } from './commands/session';
import { createTemplateCommand } from './commands/template';
import { createHistoryCommand } from './commands/history';
import { createBatchCommand } from './commands/batch';
import { createUsageCommand } from './commands/usage';
import { SessionManager } from './data/SessionManager';
import { TemplateManager } from './data/TemplateManager';
import { CommunicationBridge } from './data/CommunicationBridge';

// Load environment variables
dotenv.config();

const program = new Command();
const sessionManager = new SessionManager();
const templateManager = new TemplateManager();
const bridge = new CommunicationBridge(sessionManager, templateManager);

// Global option for session usage
program
  .name('claude-prompter')
  .description('CLI tool for enhanced AI prompt management and communication')
  .version('2.0.0')
  .option('--use-session <id>', 'Use a specific session for context');

// Format response in a nice box
function formatResponse(response: string, title: string = 'Response'): string {
  return boxen(response, {
    title: title,
    titleAlignment: 'center',
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    backgroundColor: '#1e1e1e',
  });
}

// Format error in a red box
function formatError(error: string): string {
  return boxen(error, {
    title: '⚠️  Error',
    titleAlignment: 'center',
    padding: 1,
    margin: 1,
    borderStyle: 'double',
    borderColor: 'red',
  });
}

// Generate or send prompt
async function handlePrompt(options: any) {
  try {
    // Check for session usage
    let currentSession = null;
    if (program.opts().useSession) {
      currentSession = await sessionManager.loadSession(program.opts().useSession);
      if (currentSession) {
        await bridge.initializeSession(program.opts().useSession);
      }
    }
    
    // Generate the prompt based on user input
    const prompt = await generateClaudePrompt(options);
    
    if (options.send) {
      // Send to OpenAI
      const spinner = ora({
        text: 'Calling GPT-4o...',
        spinner: 'dots12',
        color: 'cyan',
      }).start();
      
      try {
        const response = await callOpenAI(
          prompt, 
          options.system || 'You are Claude, a helpful AI assistant.',
          { command: 'prompt' }
        );
        spinner.succeed(chalk.green('Response received!'));
        
        // Display the response
        console.log(formatResponse(response, '🤖 GPT-4o Response'));
        
        if (options.showPrompt) {
          console.log(formatResponse(prompt, '📝 Prompt Sent'));
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to get response'));
        
        if (error instanceof OpenAIError) {
          console.error(formatError(`${error.message}\n\nDetails: ${JSON.stringify(error.details, null, 2)}`));
        } else {
          console.error(formatError(error instanceof Error ? error.message : 'Unknown error'));
        }
        process.exit(1);
      }
    } else {
      // Just print the prompt
      console.log(formatResponse(prompt, '📝 Generated Prompt'));
      console.log(chalk.gray('\nTip: Use --send flag to send this prompt to GPT-4o'));
    }
  } catch (error) {
    console.error(formatError(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

// Main CLI program
program
  .name('claude-prompter')
  .description('CLI tool for generating and sending prompts to GPT-4o')
  .version('1.0.0');

program
  .command('prompt')
  .description('Generate or send a prompt')
  .option('-m, --message <message>', 'The main message or question')
  .option('-c, --context <context>', 'Additional context for the prompt')
  .option('-s, --system <system>', 'System prompt (default: "You are Claude, a helpful AI assistant.")')
  .option('--send', 'Send the prompt to GPT-4o instead of just printing it')
  .option('--show-prompt', 'Show the prompt that was sent (when using --send)')
  .option('-t, --temperature <temp>', 'Temperature for GPT-4o (0-2)', '0.7')
  .option('--max-tokens <tokens>', 'Max tokens for response', '4000')
  .action(handlePrompt);

program
  .command('suggest')
  .description('Generate prompt suggestions based on a topic or Claude output')
  .option('-t, --topic <topic>', 'The topic or task you\'re working on')
  .option('-c, --code', 'Generate suggestions for code-related tasks')
  .option('-l, --language <language>', 'Programming language (if code-related)')
  .option('--complexity <level>', 'Task complexity: simple, moderate, or complex')
  .option('--task-type <type>', 'Type of task: api-integration, ui-component, cli-tool, etc.')
  .option('--claude-analysis', 'Generate suggestions as if Claude analyzed the output')
  .action(async (options) => {
    if (!options.topic) {
      console.error(formatError('Topic is required. Use -t or --topic to specify.'));
      process.exit(1);
    }
    
    try {
      let suggestions;
      
      if (options.claudeAnalysis) {
        // Generate as if Claude analyzed the output
        suggestions = generateClaudePromptSuggestions(options.topic, {
          codeGenerated: options.code,
          language: options.language,
          complexity: options.complexity,
          taskType: options.taskType,
          features: []
        });
      } else {
        // Generate general suggestions
        const context: ConversationContext = {
          topic: options.topic,
          techStack: options.language ? [options.language] : undefined,
          currentTask: options.topic
        };
        suggestions = generatePromptSuggestions(context);
      }
      
      const formatted = formatSuggestionsForCLI(suggestions);
      console.log(formatResponse(formatted, '💡 Prompt Suggestions'));
      
      console.log(chalk.cyan('\n✨ To use a suggestion:'));
      console.log(chalk.gray('Copy the prompt and use: claude-prompter prompt -m "prompt" --send\n'));
    } catch (error) {
      console.error(formatError(error instanceof Error ? error.message : 'Failed to generate suggestions'));
      process.exit(1);
    }
  });

// Add new commands
program.addCommand(createSessionCommand());
program.addCommand(createTemplateCommand());
program.addCommand(createHistoryCommand());
program.addCommand(createBatchCommand());
program.addCommand(createUsageCommand());

program
  .command('chat')
  .description('Start an interactive chat session with GPT-4o')
  .option('-s, --system <system>', 'System prompt for the chat session')
  .action(async (_options) => {
    console.log(chalk.cyan('🚧 Interactive chat mode coming soon!'));
    console.log(chalk.gray('For now, use: claude-prompter prompt -m "your message" --send'));
  });

program
  .command('config')
  .description('Check configuration and API key status')
  .action(() => {
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    
    console.log(boxen(
      `API Key Status: ${hasApiKey ? chalk.green('✓ Found') : chalk.red('✗ Missing')}\n` +
      `Model: ${chalk.cyan('gpt-4o')}\n` +
      `Endpoint: ${chalk.gray('https://api.openai.com/v1/chat/completions')}\n\n` +
      chalk.bold('Features:\n') +
      `  Sessions: ${chalk.green('✓ Enabled')}\n` +
      `  Templates: ${chalk.green('✓ Enabled')}\n` +
      `  History: ${chalk.green('✓ Enabled')}\n` +
      `  Learning: ${chalk.green('✓ Enabled')}`,
      {
        title: '⚙️  Configuration',
        titleAlignment: 'center',
        padding: 1,
        borderStyle: 'round',
        borderColor: 'yellow',
      }
    ));
    
    if (!hasApiKey) {
      console.log(chalk.yellow('\nPlease add OPENAI_API_KEY to your .env file'));
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}