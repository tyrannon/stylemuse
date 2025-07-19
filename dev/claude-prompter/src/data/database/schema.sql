-- Claude-Prompter Usage Tracking Schema
-- Created: 2025-07-19
-- Purpose: Track API usage, costs, and analytics

-- Main usage tracking table
CREATE TABLE IF NOT EXISTS usage_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    command TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'gpt-4o',
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
    input_cost REAL NOT NULL DEFAULT 0,
    output_cost REAL NOT NULL DEFAULT 0,
    total_cost REAL GENERATED ALWAYS AS (input_cost + output_cost) STORED,
    success BOOLEAN NOT NULL DEFAULT 1,
    error_message TEXT,
    duration_ms INTEGER,
    batch_id TEXT,
    session_id TEXT,
    metadata JSON
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_usage_command ON usage_records(command);
CREATE INDEX IF NOT EXISTS idx_usage_batch_id ON usage_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_usage_session_id ON usage_records(session_id);

-- Daily summary table for quick reporting
CREATE TABLE IF NOT EXISTS daily_summaries (
    date DATE PRIMARY KEY,
    total_requests INTEGER NOT NULL DEFAULT 0,
    successful_requests INTEGER NOT NULL DEFAULT 0,
    failed_requests INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    total_cost REAL NOT NULL DEFAULT 0,
    commands JSON, -- JSON object with command counts
    hourly_distribution JSON, -- Array of 24 hourly counts
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Budget and limits table
CREATE TABLE IF NOT EXISTS usage_limits (
    limit_type TEXT PRIMARY KEY, -- 'daily', 'monthly', etc.
    limit_amount REAL NOT NULL,
    current_usage REAL NOT NULL DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    alert_thresholds JSON, -- Array of percentage thresholds [50, 80, 95]
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Model pricing configuration
CREATE TABLE IF NOT EXISTS model_pricing (
    model TEXT PRIMARY KEY,
    input_rate REAL NOT NULL, -- Cost per token
    output_rate REAL NOT NULL, -- Cost per token
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT
);

-- Insert default pricing for GPT-4o
INSERT OR REPLACE INTO model_pricing (model, input_rate, output_rate, notes)
VALUES ('gpt-4o', 0.0000000025, 0.00000001, '$2.50 per 1M input, $10 per 1M output tokens');

-- Views for common queries

-- Today's usage
CREATE VIEW IF NOT EXISTS today_usage AS
SELECT 
    COUNT(*) as total_requests,
    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests,
    SUM(total_tokens) as total_tokens,
    SUM(total_cost) as total_cost,
    GROUP_CONCAT(DISTINCT command) as commands_used
FROM usage_records
WHERE DATE(timestamp) = DATE('now', 'localtime');

-- Current month usage
CREATE VIEW IF NOT EXISTS month_usage AS
SELECT 
    COUNT(*) as total_requests,
    SUM(total_tokens) as total_tokens,
    SUM(total_cost) as total_cost,
    AVG(total_cost) as avg_cost_per_request,
    command,
    COUNT(*) as command_count
FROM usage_records
WHERE DATE(timestamp) >= DATE('now', 'start of month')
GROUP BY command;

-- Hourly distribution for today
CREATE VIEW IF NOT EXISTS hourly_distribution AS
SELECT 
    strftime('%H', timestamp) as hour,
    COUNT(*) as request_count,
    SUM(total_tokens) as tokens_used,
    SUM(total_cost) as cost
FROM usage_records
WHERE DATE(timestamp) = DATE('now', 'localtime')
GROUP BY hour
ORDER BY hour;