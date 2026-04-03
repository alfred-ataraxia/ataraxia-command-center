# COST-MANAGEMENT.md - API Usage Strategy

**Updated:** 2026-03-26 23:01
**Thresholds:** $5/day soft, $25/month preferred, $50/month hard stop

---

## Model Selection Strategy

### DEFAULT: Claude Sonnet
- Everyday tasks, balanced quality/cost
- Code reviews, implementation
- General analysis
- Most tasks default here

### UPGRADE TO OPUS
**Only when explicitly asked:**
- Deep strategic analysis
- Executive decision-making memos
- Complex architectural writing
- High-stakes recommendations
- "Think deeply about..." requests

### DOWNGRADE TO HAIKU
**For routine operations:**
- File management
- Formatting & cleanup
- Simple lookups
- Status checks
- Log reviews
- Configuration changes

### USE LOCAL MODEL
**For sensitive data:**
- Personal information processing
- SSH keys or credentials handling
- Email content analysis
- Calendar data manipulation
- Fallback: refuse + alert

---

## Cost Tracking System

**Location:** `~/openclaw-logs/costs-[YYYY-MM].csv`

**Columns:**
```
date,task_description,model_used,estimated_tokens,estimated_cost
2026-03-26,morning-briefing,haiku,1200,0.0015
2026-03-26,code-review,sonnet,3500,0.0052
2026-03-27,strategy-memo,opus,5000,0.0150
```

**Daily Tally:**
- Track in real-time
- Sum each day
- Alert if >$5

**Monthly Rollup:**
- Track cumulative
- Alert if >$25 (warning)
- Halt if >$50 (hard stop)

---

## Cost-Saving Tactics

### 1. Cache Web Research
- Store search results locally
- Check cache before new search
- Reuse: news, weather, market data
- Benefit: Avoid redundant API calls

### 2. Batch Similar Tasks
- Combine file operations into single command
- Group related analyses
- Queue tasks efficiently
- Benefit: Fewer model invocations

### 3. Minimal Context for Simple Tasks
- Don't send full MEMORY for file rename
- Use targeted, short prompts
- Load only relevant context
- Benefit: Fewer tokens

### 4. Token Optimization
- Prefer `.csv` over `.json` for data
- Use bullet lists instead of prose
- Strip unnecessary context before prompt
- Pre-filter large files

---

## Alerting Rules

✅ **GREEN** (<$3/day): All good, proceed normally
🟡 **YELLOW** ($3–$5/day): Approaching limit, use Haiku for simple tasks
🔴 **RED** (>$5/day): Alert sent, switch to Haiku + local models
🛑 **HARD STOP** ($50/month): Halt all API calls until reset

---

## Implementation

1. **Every task:** Log to costs-[month].csv before execution
2. **Every API call:** Estimate tokens + cost
3. **Daily:** Check daily tally at ~23:00
4. **Monthly:** Rollup and report via morning briefing

---

## Alias Reference

- `sonnet` = Default ($0.003/$0.015 per 1k)
- `opus` = Premium ($0.015/$0.06 per 1k)
- `haiku` = Budget ($0.0005/$0.0015 per 1k)

Master Sefa's budgets are optimized and tracked continuously.

---

## Prompt Caching (ENABLED)

**Configuration:**
- **Status:** ✅ ENABLED
- **Provider:** OpenRouter
- **TTL:** 3600 seconds (1 hour)
- **Strategy:** Aggressive (maximum reuse)

**How it saves:**
- System prompts (SOUL.md, USER.md, MEMORY.md) cached after first use
- Same context in repeated queries → 90% cost reduction
- Morning briefing, cron jobs, familiar tasks benefit most

**Example savings:**
- Without cache: 5,000 tokens per request = $0.015
- With cache: 500 new tokens = $0.0015 (90% savings)
- 10 requests/day × $0.0135 saved = $0.135/day savings

---

## Tool Output Filtering

**Before returning tool outputs to user:**

1. **Filter for relevance** — prune verbose sections
2. **Summarize large JSON** — 2000 lines → 50 line summary  
3. **Ask:** "Does user need all 500 lines?"

**Savings:** ~1,500 tokens per call (75% reduction)

Example:
- Raw API response: 2,000 tokens
- Filtered summary: 100 tokens
- Cost saved: $0.0045 per call

**Daily impact:** 10 calls × $0.0045 = $0.045/day savings
