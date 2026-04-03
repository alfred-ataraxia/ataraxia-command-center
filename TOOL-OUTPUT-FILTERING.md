# TOOL-OUTPUT-FILTERING.md - Lean Response Policy

**Status:** ACTIVE | **Updated:** 2026-03-26 23:33

---

## Overview

Before returning tool output to user, filter for relevance. This saves ~1,500 tokens per call (75% reduction).

---

## Filtering Rules

### 1. Identify Relevant Data
**Question:** "What does the user actually need?"

- ✅ Error messages (actionable)
- ✅ Key fields (status, ID, count)
- ✅ Summary statistics
- ❌ Full response headers
- ❌ Metadata timestamps
- ❌ Stack traces (unless error-relevant)
- ❌ Verbose pagination info

### 2. Prune Aggressively
**Remove these sections:**
- API response headers/metadata
- Repeated field definitions
- Empty nested objects
- Deprecated fields
- Wrapper tags

### 3. Summarize Large Responses
**If response >1000 tokens:**
- Extract key findings
- Group similar items
- Use bullet format
- Link to full output if needed

---

## Examples

### Example 1: API Error Response

**Raw (2,000 tokens):**
```json
{
  "meta": {
    "timestamp": "2026-03-26T23:33:00Z",
    "request_id": "req_12345",
    "version": "v2.1"
  },
  "error": {
    "code": 404,
    "message": "Not Found",
    "details": {
      "resource": "user",
      "id": "123"
    }
  },
  "headers": {
    "content-type": "application/json",
    "retry-after": "60"
  },
  [... 1900 more lines of metadata ...]
}
```

**Filtered (100 tokens):**
```
API returned 404: User #123 not found.
Likely causes: User deleted, ID incorrect, permissions issue.
Suggestion: Check audit logs or verify user ID.
```

**Savings:** 1,900 tokens (95%)

---

### Example 2: Web Search Results

**Raw (3,000 tokens):**
```
Search returned 10 results [full HTML, ads, tracking pixels, featured snippets metadata, ...]
```

**Filtered (150 tokens):**
```
Top 3 results:
1. Enterprise AI Architecture (2024) — McKinsey
2. SoftTech Performance Optimization — IEEE
3. Banking AI Strategy Case Study — Gartner

All results are 2024-2026 (current). Next: analyzing...
```

**Savings:** 2,850 tokens (95%)

---

### Example 3: Database Query Results

**Raw (5,000 tokens):**
```
Full result set: 50,000 rows with all columns, header info, query plan, execution stats...
```

**Filtered (200 tokens):**
```
Query returned 50,000 rows.
Summary: 15% growth vs last month, 5 anomalies detected.
Top anomaly: User #9234 accessed 100x normal traffic (bot detected).
```

**Savings:** 4,800 tokens (96%)

---

## Checklist: Before Returning Output

☐ Is this the minimal useful response?
☐ Did I remove headers/metadata?
☐ Did I extract key findings?
☐ Can I summarize in <200 tokens?
☐ Would user need the full response?
☐ Have I provided actionable summary?

**If ANY fail:** Filter more aggressively.

---

## When NOT to Filter

**Keep full output if:**
- User explicitly asked for full response
- Output is already <500 tokens
- Filtering would lose critical context
- User is debugging (needs all details)

**Ask first:**
"The full response is 2,000 tokens. Want full output, or just the summary?"

---

## Cost Impact

**Per-call savings:**
- Average tool output: 2,000 tokens
- After filtering: 500 tokens
- Savings: 1,500 tokens per call
- Cost: $0.0045 saved per call (at $0.003/1K input tokens)

**Daily impact (10 calls/day):**
- Cost without filtering: $0.045
- Cost with filtering: $0.015
- Daily savings: $0.030
- Monthly savings: $0.90

---

## Integration with Guardrails

**Tool output filtering reduces:**
- API call token count ✓
- Output token budget ✓
- Daily cost trajectory ✓
- Rate limit pressure ✓

**Result:** Lean outputs = more room in daily budget for actual analysis.

Master Sefa sees only what matters. 🦞
