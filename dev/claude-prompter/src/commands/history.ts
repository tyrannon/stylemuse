import { Command } from 'commander';
import { SessionManager } from '../data/SessionManager';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import * as fs from 'fs';

export function createHistoryCommand(): Command {
  const history = new Command('history');
  history.description('View and analyze conversation history');

  const sessionManager = new SessionManager();

  // Show recent history
  history
    .command('show')
    .description('Show conversation history')
    .option('-s, --session <id>', 'Filter by session ID')
    .option('-l, --limit <n>', 'Limit number of entries', '20')
    .option('-f, --from <date>', 'From date (YYYY-MM-DD)')
    .option('-t, --to <date>', 'To date (YYYY-MM-DD)')
    .option('--sender <type>', 'Filter by sender (claude|gpt-4o|user)')
    .option('--format <format>', 'Output format (table|json|markdown)', 'table')
    .action(async (options) => {
      const spinner = ora('Loading history...').start();
      
      try {
        let entries: any[] = [];
        
        if (options.session) {
          // Load specific session
          const session = await sessionManager.loadSession(options.session);
          if (!session) {
            spinner.fail(chalk.red(`Session ${options.session} not found`));
            process.exit(1);
          }
          entries = session.history;
        } else {
          // Load all sessions and aggregate history
          const sessions = await sessionManager.listSessions();
          for (const summary of sessions) {
            const session = await sessionManager.loadSession(summary.sessionId);
            if (session) {
              entries.push(...session.history.map(h => ({
                ...h,
                sessionId: summary.sessionId,
                projectName: summary.projectName
              })));
            }
          }
        }
        
        // Apply filters
        if (options.from) {
          const fromDate = new Date(options.from);
          entries = entries.filter(e => new Date(e.timestamp) >= fromDate);
        }
        
        if (options.to) {
          const toDate = new Date(options.to);
          toDate.setHours(23, 59, 59, 999);
          entries = entries.filter(e => new Date(e.timestamp) <= toDate);
        }
        
        if (options.sender) {
          entries = entries.filter(e => e.source === options.sender);
        }
        
        // Sort by timestamp
        entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        // Apply limit
        entries = entries.slice(0, parseInt(options.limit));
        
        spinner.stop();
        
        // Display based on format
        switch (options.format) {
          case 'table':
            displayHistoryTable(entries);
            break;
          case 'json':
            console.log(JSON.stringify(entries, null, 2));
            break;
          case 'markdown':
            displayHistoryMarkdown(entries);
            break;
        }
        
        console.log(chalk.gray(`\nShowing ${entries.length} entries`));
      } catch (error) {
        spinner.fail(chalk.red('Failed to load history'));
        console.error(error);
        process.exit(1);
      }
    });

  // Search history
  history
    .command('search <query>')
    .description('Search through conversation history')
    .option('-s, --session <id>', 'Search within specific session')
    .option('-c, --case-sensitive', 'Case-sensitive search')
    .action(async (query, options) => {
      const spinner = ora('Searching history...').start();
      
      try {
        let results: any[] = [];
        const searchQuery = options.caseSensitive ? query : query.toLowerCase();
        
        if (options.session) {
          const session = await sessionManager.loadSession(options.session);
          if (session) {
            results = searchInSession(session, searchQuery, options.caseSensitive);
          }
        } else {
          // Search all sessions
          const sessions = await sessionManager.listSessions();
          for (const summary of sessions) {
            const session = await sessionManager.loadSession(summary.sessionId);
            if (session) {
              const sessionResults = searchInSession(session, searchQuery, options.caseSensitive);
              results.push(...sessionResults.map(r => ({
                ...r,
                sessionId: summary.sessionId,
                projectName: summary.projectName
              })));
            }
          }
        }
        
        spinner.stop();
        
        if (results.length === 0) {
          console.log(chalk.yellow(`No results found for "${query}"`));
          return;
        }
        
        console.log(chalk.green(`Found ${results.length} results:\n`));
        
        results.forEach((result, index) => {
          console.log(chalk.bold(`${index + 1}. ${result.projectName || 'Unknown'} - ${new Date(result.timestamp).toLocaleString()}`));
          console.log(chalk.cyan(`   Session: ${result.sessionId}`));
          console.log(chalk.gray(`   ${result.source}: ${highlightMatch(result.prompt, query, options.caseSensitive)}`));
          if (result.response) {
            console.log(chalk.gray(`   Response: ${highlightMatch(result.response.substring(0, 100) + '...', query, options.caseSensitive)}`));
          }
          console.log('');
        });
      } catch (error) {
        spinner.fail(chalk.red('Search failed'));
        console.error(error);
        process.exit(1);
      }
    });

  // Analyze patterns
  history
    .command('analyze')
    .description('Analyze conversation patterns and insights')
    .option('-s, --session <id>', 'Analyze specific session')
    .option('-d, --days <n>', 'Analyze last N days', '30')
    .action(async (options) => {
      const spinner = ora('Analyzing history...').start();
      
      try {
          const insights = await analyzeHistory(sessionManager, options);
        
        spinner.stop();
        
        console.log(chalk.bold('\n📊 Conversation Analytics\n'));
        
        // Basic stats
        console.log(chalk.cyan('Overview:'));
        console.log(`  Total Sessions: ${insights.totalSessions}`);
        console.log(`  Total Conversations: ${insights.totalConversations}`);
        console.log(`  Date Range: ${insights.dateRange.from.toLocaleDateString()} - ${insights.dateRange.to.toLocaleDateString()}`);
        
        // Sender breakdown
        console.log(chalk.cyan('\nMessage Distribution:'));
        Object.entries(insights.senderBreakdown).forEach(([sender, count]) => {
          const percentage = ((count as number) / insights.totalConversations * 100).toFixed(1);
          console.log(`  ${sender}: ${count} (${percentage}%)`);
        });
        
        // Top topics
        if (insights.topTopics.length > 0) {
          console.log(chalk.cyan('\nTop Topics:'));
          insights.topTopics.forEach((topic: any, i: number) => {
            console.log(`  ${i + 1}. ${topic.topic} (${topic.count} mentions)`);
          });
        }
        
        // Common patterns
        if (insights.commonPatterns.length > 0) {
          console.log(chalk.cyan('\nCommon Patterns:'));
          insights.commonPatterns.forEach((pattern: any, i: number) => {
            console.log(`  ${i + 1}. ${pattern.pattern} (${pattern.frequency} times)`);
          });
        }
        
        // Time patterns
        console.log(chalk.cyan('\nActivity by Hour:'));
        const hourChart = createHourChart(insights.hourlyActivity);
        console.log(hourChart);
        
        // Recommendations
        console.log(chalk.cyan('\n💡 Recommendations:'));
        insights.recommendations.forEach((rec: any) => {
          console.log(`  - ${rec}`);
        });
        
      } catch (error) {
        spinner.fail(chalk.red('Analysis failed'));
        console.error(error);
        process.exit(1);
      }
    });

  // Export history
  history
    .command('export')
    .description('Export conversation history')
    .option('-s, --session <id>', 'Export specific session')
    .option('-f, --format <format>', 'Export format (json|csv|markdown)', 'json')
    .option('-o, --output <file>', 'Output file')
    .action(async (options) => {
      const spinner = ora('Exporting history...').start();
      
      try {
        let data: any;
        
        if (options.session) {
          const session = await sessionManager.loadSession(options.session);
          if (!session) {
            spinner.fail(chalk.red(`Session ${options.session} not found`));
            process.exit(1);
          }
          data = await sessionManager.exportSession(options.session, options.format);
        } else {
          // Export all sessions
          const sessions = await sessionManager.listSessions();
          const allData: any[] = [];
          
          for (const summary of sessions) {
            const session = await sessionManager.loadSession(summary.sessionId);
            if (session) {
              allData.push({
                sessionId: summary.sessionId,
                projectName: summary.projectName,
                history: session.history
              });
            }
          }
          
          if (options.format === 'json') {
            data = JSON.stringify(allData, null, 2);
          } else if (options.format === 'csv') {
            data = convertToCSV(allData);
          } else {
            data = convertToMarkdown(allData);
          }
        }
        
        spinner.stop();
        
        if (options.output) {
          fs.writeFileSync(options.output, data);
          console.log(chalk.green(`✓ Exported to ${options.output}`));
        } else {
          console.log(data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Export failed'));
        console.error(error);
        process.exit(1);
      }
    });

  return history;
}

// Helper functions
function displayHistoryTable(entries: any[]): void {
  if (entries.length === 0) {
    console.log(chalk.yellow('No history entries found'));
    return;
  }
  
  const table = new Table({
    head: ['Time', 'Session', 'Sender', 'Message Preview'],
    style: { head: ['cyan'] },
    colWidths: [20, 15, 10, 50]
  });
  
  entries.forEach(entry => {
    const preview = entry.prompt.substring(0, 47) + (entry.prompt.length > 47 ? '...' : '');
    table.push([
      new Date(entry.timestamp).toLocaleString(),
      (entry.sessionId || '').substring(0, 13) + '...',
      entry.source || 'unknown',
      preview
    ]);
  });
  
  console.log(table.toString());
}

function displayHistoryMarkdown(entries: any[]): void {
  console.log('# Conversation History\n');
  
  entries.forEach(entry => {
    console.log(`## ${new Date(entry.timestamp).toLocaleString()} - ${entry.source}`);
    if (entry.sessionId) {
      console.log(`*Session: ${entry.sessionId}*\n`);
    }
    console.log(`**Prompt:** ${entry.prompt}\n`);
    if (entry.response) {
      console.log(`**Response:** ${entry.response}\n`);
    }
    console.log('---\n');
  });
}

function searchInSession(session: any, query: string, caseSensitive: boolean): any[] {
  return session.history.filter((entry: any) => {
    const prompt = caseSensitive ? entry.prompt : entry.prompt.toLowerCase();
    const response = caseSensitive ? entry.response : entry.response.toLowerCase();
    return prompt.includes(query) || response.includes(query);
  });
}

function highlightMatch(text: string, query: string, caseSensitive: boolean): string {
  const regex = new RegExp(`(${query})`, caseSensitive ? 'g' : 'gi');
  return text.replace(regex, chalk.yellow('$1'));
}

async function analyzeHistory(sessionManager: SessionManager, options: any): Promise<any> {
  const sessions = await sessionManager.listSessions();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (parseInt(options.days) || 30));
  
  let allEntries: any[] = [];
  const insights: any = {
    totalSessions: 0,
    totalConversations: 0,
    dateRange: { from: new Date(), to: new Date(0) },
    senderBreakdown: {},
    topTopics: [],
    commonPatterns: [],
    hourlyActivity: new Array(24).fill(0),
    recommendations: []
  };
  
  // Collect all entries
  for (const summary of sessions) {
    if (options.session && summary.sessionId !== options.session) continue;
    
    const session = await sessionManager.loadSession(summary.sessionId);
    if (!session) continue;
    
    insights.totalSessions++;
    
    session.history.forEach((entry: any) => {
      const entryDate = new Date(entry.timestamp);
      if (entryDate >= cutoffDate) {
        allEntries.push(entry);
        insights.totalConversations++;
        
        // Update date range
        if (entryDate < insights.dateRange.from) insights.dateRange.from = entryDate;
        if (entryDate > insights.dateRange.to) insights.dateRange.to = entryDate;
        
        // Sender breakdown
        insights.senderBreakdown[entry.source] = (insights.senderBreakdown[entry.source] || 0) + 1;
        
        // Hourly activity
        insights.hourlyActivity[entryDate.getHours()]++;
      }
    });
  }
  
  // Analyze patterns (simplified)
  const wordFrequency: Record<string, number> = {};
  allEntries.forEach(entry => {
    const words = entry.prompt.toLowerCase().split(/\s+/);
    words.forEach((word: string) => {
      if (word.length > 4) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    });
  });
  
  // Top topics (most frequent words)
  insights.topTopics = Object.entries(wordFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word, count]) => ({ topic: word, count }));
  
  // Generate recommendations
  if (insights.totalConversations < 10) {
    insights.recommendations.push('Consider using claude-prompter more to build a richer history');
  }
  
  const peakHour = insights.hourlyActivity.indexOf(Math.max(...insights.hourlyActivity));
  insights.recommendations.push(`Your most active hour is ${peakHour}:00 - consider scheduling complex tasks then`);
  
  return insights;
}

function createHourChart(hourlyActivity: number[]): string {
  const maxActivity = Math.max(...hourlyActivity);
  const scale = maxActivity > 0 ? 10 / maxActivity : 1;
  
  let chart = '';
  for (let hour = 0; hour < 24; hour++) {
    const barLength = Math.round(hourlyActivity[hour] * scale);
    const bar = '█'.repeat(barLength);
    chart += `  ${hour.toString().padStart(2, '0')}:00 ${bar} ${hourlyActivity[hour]}\n`;
  }
  
  return chart;
}

function convertToCSV(data: any[]): string {
  const headers = 'Session ID,Project,Timestamp,Sender,Prompt,Response\n';
  const rows = data.flatMap(session => 
    session.history.map((entry: any) => 
      `"${session.sessionId}","${session.projectName}","${entry.timestamp}","${entry.source}","${entry.prompt.replace(/"/g, '""')}","${(entry.response || '').replace(/"/g, '""')}"`
    )
  );
  
  return headers + rows.join('\n');
}

function convertToMarkdown(data: any[]): string {
  let markdown = '# Conversation History Export\n\n';
  
  data.forEach(session => {
    markdown += `## ${session.projectName} (${session.sessionId})\n\n`;
    session.history.forEach((entry: any) => {
      markdown += `### ${new Date(entry.timestamp).toLocaleString()} - ${entry.source}\n`;
      markdown += `**Prompt:** ${entry.prompt}\n\n`;
      if (entry.response) {
        markdown += `**Response:** ${entry.response}\n\n`;
      }
      markdown += '---\n\n';
    });
  });
  
  return markdown;
}