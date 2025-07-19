# Claude-Prompter Usage Report Examples
<!-- Last edited: 2025-07-19 by Claude Code -->

## Daily Usage Report

```
$ claude-prompter usage --today

╭────────────────────── 📊 Daily Usage Report ─────────────────────╮
│                                                                  │
│  Date: July 19, 2025                                            │
│                                                                  │
│  Summary:                                                        │
│  ├─ Total Requests: 47                                          │
│  ├─ Total Tokens: 23,456 (↑12% from yesterday)                  │
│  ├─ Total Cost: $0.24                                           │
│  └─ Remaining Daily Budget: $9.76 / $10.00                      │
│                                                                  │
│  By Command:                                                     │
│  ┌─────────────┬──────────┬──────────┬──────────┐             │
│  │ Command     │ Requests │ Tokens   │ Cost     │             │
│  ├─────────────┼──────────┼──────────┼──────────┤             │
│  │ prompt      │ 25       │ 10,234   │ $0.10    │             │
│  │ suggest     │ 15       │ 8,456    │ $0.08    │             │
│  │ batch       │ 5        │ 4,321    │ $0.05    │             │
│  │ chat        │ 2        │ 445      │ $0.01    │             │
│  └─────────────┴──────────┴──────────┴──────────┘             │
│                                                                  │
│  Hourly Activity:                                               │
│  08:00 ████████░░░░░░░░ 8 requests                             │
│  09:00 ████████████░░░░ 12 requests                            │
│  10:00 ██████░░░░░░░░░░ 6 requests                             │
│  11:00 ████████████████ 15 requests (peak)                     │
│  12:00 ██████░░░░░░░░░░ 6 requests                             │
│                                                                  │
╰──────────────────────────────────────────────────────────────────╯
```

## Monthly Usage Report

```
$ claude-prompter usage --month

╭───────────────────── 📈 Monthly Usage Report ────────────────────╮
│                                                                  │
│  Period: July 1-19, 2025                                        │
│                                                                  │
│  Overview:                                                       │
│  ├─ Total Requests: 892                                         │
│  ├─ Total Tokens: 456,789                                       │
│  ├─ Total Cost: $4.87                                           │
│  └─ Daily Average: $0.26                                        │
│                                                                  │
│  Cost Breakdown:                                                 │
│  ├─ Input Tokens: 234,567 × $0.0000025 = $0.59                 │
│  └─ Output Tokens: 222,222 × $0.00001 = $2.22                  │
│                                                                  │
│  Top Commands:                                                   │
│  1. prompt (450 requests) ████████████████ $2.34               │
│  2. suggest (320 requests) ███████████░░░░ $1.87               │
│  3. batch (89 requests) ███░░░░░░░░░░░░ $0.56                  │
│  4. template (33 requests) █░░░░░░░░░░░░░░ $0.10               │
│                                                                  │
│  Budget Status:                                                  │
│  Monthly Limit: $50.00                                          │
│  Used: $4.87 (9.7%)                                             │
│  Remaining: $45.13                                              │
│  Projected Total: $7.71                                         │
│                                                                  │
│  💡 Tip: Your usage is well within budget!                      │
│                                                                  │
╰──────────────────────────────────────────────────────────────────╯
```

## Batch Processing Pre-flight Check

```
$ claude-prompter batch -f prompts.json --dry-run

╭─────────────────── 🚀 Batch Processing Estimate ─────────────────╮
│                                                                  │
│  Input File: prompts.json                                        │
│  Total Prompts: 25                                               │
│                                                                  │
│  Token Estimates:                                                │
│  ├─ Average Input Tokens: ~85 per prompt                        │
│  ├─ Total Input Tokens: ~2,125                                  │
│  ├─ Expected Output Tokens: ~3,750 (based on history)           │
│  └─ Total Tokens: ~5,875                                        │
│                                                                  │
│  Cost Estimate:                                                  │
│  ├─ Input Cost: $0.005                                          │
│  ├─ Output Cost: $0.038                                         │
│  └─ Total Cost: ~$0.043                                         │
│                                                                  │
│  Rate Limiting:                                                  │
│  ├─ Parallel Requests: 3                                        │
│  ├─ Estimated Time: ~2 minutes                                  │
│  └─ API Rate: 15 requests/minute (within limits)               │
│                                                                  │
│  ⚠️ Current Daily Usage: $0.24 / $10.00                         │
│  ✅ This batch will use: $0.043 (well within budget)           │
│                                                                  │
│  Run without --dry-run to process                               │
│                                                                  │
╰──────────────────────────────────────────────────────────────────╯
```

## Batch Processing Progress

```
$ claude-prompter batch -f prompts.json -o results.json --parallel 3

╭──────────────────── 🔄 Batch Processing ─────────────────────╮
│                                                               │
│  Processing 25 prompts...                                     │
│                                                               │
│  Progress:                                                    │
│  ████████████████████░░░░░░░░░ 21/25 (84%)                  │
│                                                               │
│  Stats:                                                       │
│  ├─ Successful: 20                                           │
│  ├─ Failed: 1 (rate limit)                                   │
│  ├─ Tokens Used: 4,234                                       │
│  └─ Cost So Far: $0.037                                      │
│                                                               │
│  Current: Processing prompts 22-24...                         │
│  ETA: 23 seconds                                              │
│                                                               │
╰───────────────────────────────────────────────────────────────╯
```

## Cost Alert Example

```
$ claude-prompter prompt -m "Generate a 1000 word essay on..."

⚠️  Cost Warning
────────────────
This request is estimated to use ~1,250 tokens
Estimated cost: ~$0.15

Current daily usage: $9.92 / $10.00
This would exceed your daily limit!

Options:
1. Reduce the request size
2. Increase daily limit (claude-prompter usage --limit 15)
3. Proceed anyway (use --force)

What would you like to do? [1/2/3]: _
```

## Usage Analytics

```
$ claude-prompter usage analyze --last 7d

╭─────────────────── 📊 Usage Analytics ──────────────────────╮
│                                                              │
│  7-Day Analysis (July 13-19, 2025)                         │
│                                                              │
│  Trends:                                                     │
│  ├─ Average Daily Cost: $0.31 (↓15% from last week)        │
│  ├─ Most Active Day: Thursday (89 requests)                 │
│  ├─ Peak Hour: 11:00-12:00 (avg 12 requests)               │
│  └─ Weekend Usage: 65% lower than weekdays                  │
│                                                              │
│  Efficiency Metrics:                                         │
│  ├─ Avg Tokens/Request: 234 (optimal: 200-300)             │
│  ├─ Template Usage: 23% (↑8% from last week)               │
│  ├─ Batch vs Single: 15% batch (saves ~$0.12/day)          │
│  └─ Error Rate: 2.3% (mostly rate limits)                  │
│                                                              │
│  Cost Optimization Suggestions:                              │
│  1. Use templates more: Could save ~$0.08/day               │
│  2. Batch similar requests: Potential 20% cost reduction    │
│  3. Reduce max_tokens on short queries: Save ~$0.05/day     │
│                                                              │
│  Projected Monthly Cost: $9.30 (19% of $50 budget)          │
│                                                              │
╰──────────────────────────────────────────────────────────────╯
```

## Export Format Example

```
$ claude-prompter usage export --format csv --last 30d > usage.csv

Exported 892 records to usage.csv

Sample:
timestamp,command,model,input_tokens,output_tokens,cost,success
2025-07-19T10:23:45Z,prompt,gpt-4o,234,456,0.012,true
2025-07-19T10:24:12Z,suggest,gpt-4o,189,234,0.008,true
2025-07-19T10:25:03Z,batch,gpt-4o,1234,2456,0.045,true
...
```