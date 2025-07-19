import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';
import { DatabaseManager, UsageReport } from '../data/DatabaseManager';

export function createUsageCommand() {
  const usage = new Command('usage')
    .description('View API usage and costs')
    .option('--today', 'Show today\'s usage (default)')
    .option('--month', 'Show current month usage')
    .option('--set-limit <type:amount>', 'Set spending limit (e.g., daily:10 or monthly:300)')
    .option('--export <format>', 'Export usage data (csv or json)')
    .option('--analyze', 'Show usage analytics and trends')
    .action(async (options) => {
      try {
        const dbManager = new DatabaseManager();

        // Handle limit setting
        if (options.setLimit) {
          const [type, amount] = options.setLimit.split(':');
          if (!['daily', 'monthly'].includes(type) || !amount || isNaN(parseFloat(amount))) {
            console.error(chalk.red('Error: Invalid limit format. Use daily:10 or monthly:300'));
            process.exit(1);
          }
          
          await dbManager.setLimit(type as 'daily' | 'monthly', parseFloat(amount));
          console.log(chalk.green(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} limit set to $${amount}`));
          process.exit(0);
        }

        // Determine report period
        const period = options.month ? 'month' : 'today';
        const report = await dbManager.getUsageReport(period);
        
        if (options.export) {
          await exportUsageData(report, options.export, period);
          process.exit(0);
        }

        if (options.analyze) {
          await showAnalytics(dbManager);
          process.exit(0);
        }

        // Display usage report
        if (period === 'today') {
          await displayDailyReport(report, dbManager);
        } else {
          await displayMonthlyReport(report, dbManager);
        }

        dbManager.close();
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return usage;
}

async function displayDailyReport(report: UsageReport, dbManager: DatabaseManager) {
  const dailyLimit = await dbManager.getLimit('daily') || 10;
  const remaining = Math.max(0, dailyLimit - report.totalCost);
  const percentUsed = (report.totalCost / dailyLimit) * 100;
  
  // Create hourly activity chart
  let hourlyChart = '';
  if (report.hourlyDistribution) {
    const maxRequests = Math.max(...report.hourlyDistribution);
    const hours = ['12am', '6am', '12pm', '6pm'];
    
    for (let i = 0; i < 24; i++) {
      if (i % 6 === 0) {
        const count = report.hourlyDistribution[i] || 0;
        const barLength = maxRequests > 0 ? Math.round((count / maxRequests) * 16) : 0;
        const bar = '█'.repeat(barLength) + '░'.repeat(16 - barLength);
        hourlyChart += `  ${hours[i / 6].padEnd(5)} ${bar} ${count} requests\n`;
      }
    }
  }

  // Create command breakdown table
  const commandTable = new Table({
    head: ['Command', 'Requests', 'Tokens', 'Cost'],
    style: { head: ['cyan'] },
    colWidths: [15, 12, 12, 12]
  });

  for (const [command, stats] of Object.entries(report.byCommand)) {
    commandTable.push([
      command,
      stats.requests.toString(),
      stats.tokens.toLocaleString(),
      '$' + stats.cost.toFixed(3)
    ]);
  }

  const content = `
${chalk.bold('Date:')} ${new Date().toLocaleDateString()}

${chalk.bold('Summary:')}
├─ Total Requests: ${chalk.cyan(report.totalRequests)}
├─ Total Tokens: ${chalk.cyan(report.totalTokens.toLocaleString())} ${report.totalRequests > 0 ? chalk.gray(`(avg ${Math.round(report.totalTokens / report.totalRequests)}/req)`) : ''}
├─ Total Cost: ${chalk.green('$' + report.totalCost.toFixed(3))}
└─ Remaining Daily Budget: ${chalk[remaining < 1 ? 'red' : 'green']('$' + remaining.toFixed(2) + ' / $' + dailyLimit.toFixed(2))}

${chalk.bold('By Command:')}
${commandTable.toString()}

${hourlyChart ? chalk.bold('Hourly Activity:') + '\n' + hourlyChart : ''}
${percentUsed > 80 ? chalk.yellow('⚠️  ' + Math.round(percentUsed) + '% of daily budget used') : ''}
`;

  const box = boxen(content.trim(), {
    title: '📊 Daily Usage Report',
    titleAlignment: 'center',
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan'
  });

  console.log(box);
}

async function displayMonthlyReport(report: UsageReport, dbManager: DatabaseManager) {
  const monthlyLimit = await dbManager.getLimit('monthly') || 300;
  const remaining = Math.max(0, monthlyLimit - report.totalCost);
  const percentUsed = (report.totalCost / monthlyLimit) * 100;
  
  // Calculate daily average
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysPassed = today.getDate();
  const dailyAverage = report.totalCost / daysPassed;
  const projectedTotal = dailyAverage * daysInMonth;

  // Create command chart
  let commandChart = '';
  const sortedCommands = Object.entries(report.byCommand)
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 4);
  
  for (const [command, stats] of sortedCommands) {
    const percentage = (stats.cost / report.totalCost) * 100;
    const barLength = Math.round(percentage / 100 * 16);
    const bar = '█'.repeat(barLength) + '░'.repeat(16 - barLength);
    commandChart += `  ${(command + ' (' + stats.requests + ' requests)').padEnd(25)} ${bar} $${stats.cost.toFixed(2)}\n`;
  }

  const content = `
${chalk.bold('Period:')} ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} (Day ${daysPassed}/${daysInMonth})

${chalk.bold('Overview:')}
├─ Total Requests: ${chalk.cyan(report.totalRequests)}
├─ Total Tokens: ${chalk.cyan(report.totalTokens.toLocaleString())}
├─ Total Cost: ${chalk.green('$' + report.totalCost.toFixed(2))}
└─ Daily Average: ${chalk.cyan('$' + dailyAverage.toFixed(2))}

${chalk.bold('Cost Breakdown:')}
├─ Input Tokens: ${Math.round(report.totalTokens * 0.4).toLocaleString()} × $0.0000025 = $${(report.totalCost * 0.3).toFixed(2)}
└─ Output Tokens: ${Math.round(report.totalTokens * 0.6).toLocaleString()} × $0.00001 = $${(report.totalCost * 0.7).toFixed(2)}

${chalk.bold('Top Commands:')}
${commandChart}
${chalk.bold('Budget Status:')}
Monthly Limit: ${chalk.cyan('$' + monthlyLimit.toFixed(2))}
Used: ${chalk[percentUsed > 80 ? 'yellow' : 'green']('$' + report.totalCost.toFixed(2) + ' (' + Math.round(percentUsed) + '%)')}
Remaining: ${chalk[remaining < 50 ? 'yellow' : 'green']('$' + remaining.toFixed(2))}
Projected Total: ${chalk[projectedTotal > monthlyLimit ? 'red' : 'cyan']('$' + projectedTotal.toFixed(2))}

${projectedTotal > monthlyLimit ? chalk.red('⚠️  Projected to exceed monthly budget!') : chalk.green('💡 Usage is within budget')}
`;

  const box = boxen(content.trim(), {
    title: '📈 Monthly Usage Report',
    titleAlignment: 'center',
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan'
  });

  console.log(box);
}

async function showAnalytics(dbManager: DatabaseManager) {
  // Get 7-day data for analysis
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const weekReport = await dbManager.getUsageReport('custom', startDate, endDate);
  const todayReport = await dbManager.getUsageReport('today');
  const monthReport = await dbManager.getUsageReport('month');

  // Calculate trends
  const avgDailyCost = weekReport.totalCost / 7;
  const todayVsAvg = ((todayReport.totalCost - avgDailyCost) / avgDailyCost) * 100;
  
  // Calculate efficiency metrics
  const avgTokensPerRequest = weekReport.totalTokens / Math.max(1, weekReport.totalRequests);
  const errorRate = ((weekReport.totalRequests - (weekReport.totalRequests * weekReport.successRate / 100)) / weekReport.totalRequests) * 100;

  const content = `
${chalk.bold('7-Day Analysis')} (${startDate} to ${endDate})

${chalk.bold('Trends:')}
├─ Average Daily Cost: ${chalk.cyan('$' + avgDailyCost.toFixed(2))} ${todayVsAvg > 0 ? chalk.red('↑' + Math.abs(todayVsAvg).toFixed(0) + '% today') : chalk.green('↓' + Math.abs(todayVsAvg).toFixed(0) + '% today')}
├─ Total Requests: ${chalk.cyan(weekReport.totalRequests)} (${Math.round(weekReport.totalRequests / 7)}/day avg)
├─ Success Rate: ${chalk[weekReport.successRate > 95 ? 'green' : 'yellow'](weekReport.successRate.toFixed(1) + '%')}
└─ Error Rate: ${chalk[errorRate > 5 ? 'red' : 'green'](errorRate.toFixed(1) + '%')}

${chalk.bold('Efficiency Metrics:')}
├─ Avg Tokens/Request: ${chalk.cyan(Math.round(avgTokensPerRequest))} ${avgTokensPerRequest > 300 ? chalk.gray('(consider reducing)') : chalk.gray('(optimal)')}
├─ Cost per Request: ${chalk.cyan('$' + (weekReport.totalCost / Math.max(1, weekReport.totalRequests)).toFixed(4))}
└─ Most Used Command: ${chalk.cyan(Object.entries(weekReport.byCommand).sort((a, b) => b[1].requests - a[1].requests)[0]?.[0] || 'N/A')}

${chalk.bold('Cost Optimization Suggestions:')}
${avgTokensPerRequest > 300 ? '1. Reduce max_tokens on queries averaging <100 token responses\n' : ''}
${Object.keys(weekReport.byCommand).length > 1 ? '2. Use templates for repetitive prompts to reduce input tokens\n' : ''}
${errorRate > 5 ? '3. High error rate detected - check for rate limiting issues\n' : ''}
${weekReport.totalRequests > 100 ? '4. Consider batch processing for similar requests\n' : ''}

${chalk.bold('Projected Monthly Cost:')} ${chalk[monthReport.totalCost > 50 ? 'yellow' : 'green']('$' + (avgDailyCost * 30).toFixed(2))}
`;

  const box = boxen(content.trim(), {
    title: '📊 Usage Analytics',
    titleAlignment: 'center',
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'magenta'
  });

  console.log(box);
}

async function exportUsageData(report: UsageReport, format: string, period: string) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `usage-report-${period}-${timestamp}.${format}`;
  
  if (format === 'csv') {
    let csv = 'Command,Requests,Tokens,Cost\n';
    for (const [command, stats] of Object.entries(report.byCommand)) {
      csv += `${command},${stats.requests},${stats.tokens},${stats.cost.toFixed(4)}\n`;
    }
    csv += `\nTotal,${report.totalRequests},${report.totalTokens},${report.totalCost.toFixed(4)}\n`;
    
    await fs.writeFile(filename, csv);
  } else {
    await fs.writeJson(filename, report, { spaces: 2 });
  }
  
  console.log(chalk.green(`✅ Usage data exported to ${filename}`));
}

// Import fs at the top of the file
import fs from 'fs-extra';