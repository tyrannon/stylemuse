import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

export interface UsageRecord {
  id?: number;
  timestamp?: string;
  command: string;
  model?: string;
  inputTokens: number;
  outputTokens: number;
  inputCost?: number;
  outputCost?: number;
  success?: boolean;
  errorMessage?: string;
  durationMs?: number;
  batchId?: string;
  sessionId?: string;
  metadata?: any;
}

export interface UsageReport {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byCommand: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
  hourlyDistribution?: number[];
  successRate: number;
}

export class DatabaseManager {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    // Create data directory if it doesn't exist
    const dataDir = path.join(os.homedir(), '.claude-prompter', 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    
    // Initialize database
    this.dbPath = path.join(dataDir, 'usage.db');
    this.db = new Database(this.dbPath);
    
    // Enable foreign keys and WAL mode for better performance
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    
    // Initialize schema
    this.initializeSchema();
  }

  private initializeSchema() {
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    this.db.exec(schema);
  }

  // Record a new usage entry
  async recordUsage(record: UsageRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO usage_records (
        command, model, input_tokens, output_tokens,
        input_cost, output_cost, success, error_message,
        duration_ms, batch_id, session_id, metadata
      ) VALUES (
        @command, @model, @inputTokens, @outputTokens,
        @inputCost, @outputCost, @success, @errorMessage,
        @durationMs, @batchId, @sessionId, @metadata
      )
    `);

    // Calculate costs if not provided
    if (!record.inputCost || !record.outputCost) {
      const costs = this.calculateCosts(record.inputTokens, record.outputTokens, record.model);
      record.inputCost = costs.inputCost;
      record.outputCost = costs.outputCost;
    }

    stmt.run({
      command: record.command,
      model: record.model || 'gpt-4o',
      inputTokens: record.inputTokens,
      outputTokens: record.outputTokens,
      inputCost: record.inputCost,
      outputCost: record.outputCost,
      success: record.success !== false ? 1 : 0,
      errorMessage: record.errorMessage || null,
      durationMs: record.durationMs || null,
      batchId: record.batchId || null,
      sessionId: record.sessionId || null,
      metadata: record.metadata ? JSON.stringify(record.metadata) : null
    });

    // Update daily summary
    this.updateDailySummary();
  }

  // Calculate costs based on model pricing
  private calculateCosts(inputTokens: number, outputTokens: number, model = 'gpt-4o') {
    const pricing = this.db.prepare(
      'SELECT input_rate, output_rate FROM model_pricing WHERE model = ?'
    ).get(model) as any;

    if (!pricing) {
      // Default to GPT-4o pricing if model not found
      return {
        inputCost: inputTokens * 0.0000000025,
        outputCost: outputTokens * 0.00000001
      };
    }

    return {
      inputCost: inputTokens * pricing.input_rate,
      outputCost: outputTokens * pricing.output_rate
    };
  }

  // Get usage report for a specific period
  async getUsageReport(period: 'today' | 'month' | 'custom', startDate?: string, endDate?: string): Promise<UsageReport> {
    let query = '';
    let params: any = {};

    switch (period) {
      case 'today':
        query = `
          SELECT 
            COUNT(*) as totalRequests,
            SUM(total_tokens) as totalTokens,
            SUM(total_cost) as totalCost,
            SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successfulRequests,
            command
          FROM usage_records
          WHERE DATE(timestamp) = DATE('now', 'localtime')
          GROUP BY command
        `;
        break;
      
      case 'month':
        query = `
          SELECT 
            COUNT(*) as totalRequests,
            SUM(total_tokens) as totalTokens,
            SUM(total_cost) as totalCost,
            SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successfulRequests,
            command
          FROM usage_records
          WHERE DATE(timestamp) >= DATE('now', 'start of month')
          GROUP BY command
        `;
        break;
      
      case 'custom':
        query = `
          SELECT 
            COUNT(*) as totalRequests,
            SUM(total_tokens) as totalTokens,
            SUM(total_cost) as totalCost,
            SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successfulRequests,
            command
          FROM usage_records
          WHERE DATE(timestamp) BETWEEN @startDate AND @endDate
          GROUP BY command
        `;
        params = { startDate, endDate };
        break;
    }

    const rows = this.db.prepare(query).all(params) as any[];
    
    // Aggregate results
    const report: UsageReport = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      byCommand: {},
      successRate: 0
    };

    let successfulRequests = 0;

    for (const row of rows) {
      report.totalRequests += row.totalRequests || 0;
      report.totalTokens += row.totalTokens || 0;
      report.totalCost += row.totalCost || 0;
      successfulRequests += row.successfulRequests || 0;

      if (row.command) {
        report.byCommand[row.command] = {
          requests: row.totalRequests || 0,
          tokens: row.totalTokens || 0,
          cost: row.totalCost || 0
        };
      }
    }

    report.successRate = report.totalRequests > 0 
      ? (successfulRequests / report.totalRequests) * 100 
      : 100;

    // Get hourly distribution for today
    if (period === 'today') {
      const hourlyQuery = `
        SELECT 
          CAST(strftime('%H', timestamp) AS INTEGER) as hour,
          COUNT(*) as count
        FROM usage_records
        WHERE DATE(timestamp) = DATE('now', 'localtime')
        GROUP BY hour
        ORDER BY hour
      `;
      
      const hourlyRows = this.db.prepare(hourlyQuery).all() as any[];
      report.hourlyDistribution = Array(24).fill(0);
      
      for (const row of hourlyRows) {
        if (row.hour >= 0 && row.hour < 24) {
          report.hourlyDistribution[row.hour] = row.count;
        }
      }
    }

    return report;
  }

  // Update daily summary table
  private updateDailySummary() {
    const today = new Date().toISOString().split('T')[0];
    
    const summary = this.db.prepare(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_requests,
        SUM(total_tokens) as total_tokens,
        SUM(total_cost) as total_cost
      FROM usage_records
      WHERE DATE(timestamp) = DATE('now', 'localtime')
    `).get() as any;

    // Get command breakdown
    const commandBreakdown = this.db.prepare(`
      SELECT command, COUNT(*) as count
      FROM usage_records
      WHERE DATE(timestamp) = DATE('now', 'localtime')
      GROUP BY command
    `).all() as any[];

    const commands: Record<string, number> = {};
    for (const row of commandBreakdown) {
      commands[row.command] = row.count;
    }

    // Update or insert summary
    this.db.prepare(`
      INSERT OR REPLACE INTO daily_summaries (
        date, total_requests, successful_requests, failed_requests,
        total_tokens, total_cost, commands, updated_at
      ) VALUES (
        @date, @totalRequests, @successfulRequests, @failedRequests,
        @totalTokens, @totalCost, @commands, CURRENT_TIMESTAMP
      )
    `).run({
      date: today,
      totalRequests: summary.total_requests || 0,
      successfulRequests: summary.successful_requests || 0,
      failedRequests: summary.failed_requests || 0,
      totalTokens: summary.total_tokens || 0,
      totalCost: summary.total_cost || 0,
      commands: JSON.stringify(commands)
    });
  }

  // Get or set usage limits
  async getLimit(limitType: 'daily' | 'monthly'): Promise<number | null> {
    const limit = this.db.prepare(
      'SELECT limit_amount FROM usage_limits WHERE limit_type = ?'
    ).get(limitType) as any;
    
    return limit ? limit.limit_amount : null;
  }

  async setLimit(limitType: 'daily' | 'monthly', amount: number): Promise<void> {
    const periodStart = new Date();
    const periodEnd = new Date();
    
    if (limitType === 'daily') {
      periodEnd.setDate(periodEnd.getDate() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    this.db.prepare(`
      INSERT OR REPLACE INTO usage_limits (
        limit_type, limit_amount, period_start, period_end
      ) VALUES (?, ?, ?, ?)
    `).run(
      limitType,
      amount,
      periodStart.toISOString(),
      periodEnd.toISOString()
    );
  }

  // Check if current usage exceeds limits
  async checkLimits(): Promise<{ daily?: boolean; monthly?: boolean }> {
    const exceeded: { daily?: boolean; monthly?: boolean } = {};
    
    // Check daily limit
    const dailyLimit = await this.getLimit('daily');
    if (dailyLimit) {
      const todayUsage = await this.getUsageReport('today');
      if (todayUsage.totalCost > dailyLimit) {
        exceeded.daily = true;
      }
    }

    // Check monthly limit
    const monthlyLimit = await this.getLimit('monthly');
    if (monthlyLimit) {
      const monthUsage = await this.getUsageReport('month');
      if (monthUsage.totalCost > monthlyLimit) {
        exceeded.monthly = true;
      }
    }

    return exceeded;
  }

  // Close database connection
  close() {
    this.db.close();
  }
}