# SESSION-MANAGEMENT.md - Context & Cost Control

**Active:** Yes | **Updated:** 2026-03-26 23:24

---

## Session Lifecycle

### When to RESET

Use `/reset` when ANY of these occur:

1. **Context Window Overload**
   - After 15+ exchanges
   - Context > 50K tokens
   - Visible slowdown in responses

2. **Time-Based Threshold**
   - After 30+ minutes of continuous conversation
   - Natural break point for mental clarity
   - Prevents token drift

3. **Domain Switch**
   - Switching to completely different task
   - From "strategy" → "coding"
   - From "research" → "operations"
   - Prevents context contamination

4. **Memory Loss**
   - Early context is forgotten/inaccessible
   - You've asked the same thing twice
   - Context feels stale

---

## Best Practices

### At Reset

**Output 2-3 sentence summary** of what was learned:

Example:
```
Reset summary: We configured cost-optimized model routing (minimax primary, 11 aliases), 
established 3-tier memory system (SHORT/DAILY/LONG-TERM), and set up 4 cron jobs 
(morning briefing, wonderful builds, weekly backup, cost checks). Current spend: $0.0156/day.
```

**Why this works:**
- Preserves critical learnings
- Clears context weight
- Enables continuity across sessions
- Keeps knowledge accessible

---

## How It Works

### Before Reset
```
Session: 45+ exchanges
Context: 120K tokens (88% of 200K limit)
Model: Working but slower
Cost: Accumulating token overhead
```

### Reset Command
```bash
/reset
```

**System action:**
1. Save session transcript (if enabled)
2. Output summary
3. Clear context buffer
4. Fresh session starts (SOUL.md + USER.md loaded)
5. Memory tier system continues (LONG-TERM + TODAY preserved)

### After Reset
```
Session: 1 exchange (fresh)
Context: 15K tokens (7% of 200K limit)
Model: Fast + responsive
Cost: Reset overhead minimal
Memory: TIER 3 + today's notes preserved
```

---

## Cost Impact

**Without resets:**
- Context grows unbounded
- Token usage multiplies (repeated context in prompts)
- Model selection downgrades (too much context → cheap model)
- Daily cost creeps up

**With resets (recommended):**
- Context stays <50K tokens per session
- Minimal repeated context
- Model stays at optimal tier
- Predictable, controlled daily cost

---

## Session Boundaries

**Never across resets:**
- Personal preferences (go in MEMORY.md)
- Learned patterns (go in weekly-patterns.md)
- Key decisions (go in MEMORY.md)
- Configuration (stays in FILES: openclaw.json, SOUL.md, etc.)

**Always preserved across resets:**
- LONG-TERM MEMORY (MEMORY.md)
- System configuration (FILES)
- User profile (USER.md)
- Cron jobs + automations
- Workspace structure

---

## Summary

| When | Action | Why |
|------|--------|-----|
| >15 exchanges | `/reset` | Context bloat (>50K) |
| >30 minutes | `/reset` | Cognitive load |
| Task switch | `/reset` | Domain isolation |
| Context forgotten | `/reset` | Memory loss signal |
| Daily use | Output summary | Preserve learnings |

Master Sefa's sessions stay lean, fast, and cost-effective.

---

## Memory Flush Before Compaction (ENABLED)

**What it does:**
When context approaches 4000 tokens before compaction kicks in, the system:
1. **Synthesizes** critical info from the session
2. **Promotes** to appropriate memory tier (SHORT/DAILY/LONG)
3. **Clears** session context
4. **Never discards** TIER 3 (LONG-TERM memory)

**Example flow:**
```
Session context: 3800 tokens (approaching 4000 threshold)
↓
Flush triggered
↓
Extract: "Discussed GLM-5 model, optimized heartbeat to 60min, added session reset rules"
↓
Promote to: MEMORY.md (TIER 3 LONG-TERM) + weekly-patterns.md (TIER 2)
↓
Context cleared, session continues fresh
```

**Rule:** When in doubt, promote information UP, never down. Better to over-preserve than lose critical context.
