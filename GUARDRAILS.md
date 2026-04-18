# GUARDRAILS.md - Budget & Rate Limit Policy

**Status:** ACTIVE | **Updated:** 2026-04-19 (Claude — budget policy kanonik kaynak olarak güncellendi, WP-3)

---

## API Call Limits

### Per-Message Constraint
- **Maximum:** 10 API calls per user message
- **Strategy:** Batch related queries into single tool call
- **Check:** "Is this call necessary?"
- **Fallback:** Use cached results when available

**Example:**
- ❌ WRONG: 5 separate web_search calls
- ✅ RIGHT: 1 web_search call with comma-separated queries

---

## Output Limits

### Token Budget
- **Daily max:** 100K tokens output
- **Warning:** Inform if approaching threshold
- **Hard stop:** No more output generation if exceeded

---

## Cost Guardrails

### Daily Budget
- **Soft limit:** $5.00/day
- **Warning threshold:** $3.75 (75%)
- **Action:** Warn Master Sefa, downgrade to cheaper model

### Monthly Budget
- **Target:** $100.00/month
- **Warning threshold:** $75.00 (75%)
- **Action:** Escalate warning, review spending pattern

### Per-Task Threshold
- **Threshold:** $1.00 per task
- **Action:** Estimate cost → ask approval → proceed only if approved
- **Report:** Show breakdown (model, tokens, cost)

**Example:**
```
Task: "Analyze 50-page document with Opus"
Estimated: 45K tokens × $0.015/1K = $0.675
Status: ✅ Approved (under $1.00)

Task: "Research + write 20-page strategy with Opus"
Estimated: 120K tokens × $0.015/1K = $1.80
Status: ❌ Requires approval ($1.80 > $1.00)
Prompt: "Estimated cost $1.80. Proceed? (Y/N)"
```

---

## Rate Limit Handling (429 Errors)

### Procedure

1. **Detect 429**
   - OpenRouter returns: "Too Many Requests"
   - Reason: Rate limit exceeded

2. **STOP Immediately**
   - Cancel pending API calls
   - Do NOT retry automatically
   - Inform Master Sefa: "Hit rate limit (429). Waiting 5 minutes..."

3. **Wait 5 Minutes**
   - Sleep: 300 seconds
   - No action during wait

4. **Retry Once**
   - Single retry attempt after 5 min
   - If succeeds: continue normally
   - If fails: inform Master Sefa, suggest waiting longer

5. **If Still Failing**
   ```
   "Rate limit persists after retry. Waiting 10 min before next attempt.
   Suggest: Reduce API call frequency or upgrade OpenRouter plan."
   ```

**Never:**
- ❌ Retry in loops
- ❌ Ignore rate limits
- ❌ Batch more calls to "catch up"

---

## Before Calling Tools

**Checklist (every API call):**

1. ☐ Is this call necessary?
2. ☐ Can I batch this with similar calls?
3. ☐ Is cached result available?
4. ☐ Will this exceed daily budget?
5. ☐ Is this a >$1 task (need approval)?

**If ANY fail:** Don't make the call.

---

## Daily Cost Tracking

**Location:** `~/openclaw-logs/costs-[YYYY-MM].csv`

**Columns:**
```
date,task,model,tokens_est,cost_est
2026-03-26,web-research,gemini-flash,3500,0.0045
2026-03-26,analysis-writing,sonnet,4200,0.0063
```

**Rollup (every day at 23:00):**
```
Daily: $0.0169 ← ✅ Green (under $3.75)
Weekly: $0.1183
Monthly YTD: $0.1183
```

---

## Approval Workflow

### For Tasks >$1.00

```
User: "Write comprehensive AI strategy for İş Bankası (30 pages, with Opus)"