# MODEL-ROUTING.md - Intelligent Model Selection

**Active:** Yes | **Updated:** 2026-03-26 22:42

## Routing Strategy

**Ultra-Cost-Optimized** — Primary: Minimax-2.5

### DEFAULT: Minimax-2.5
**Primary for ALL tasks** — Ultra-low cost, high quality
- Default routing for everything
- Falls back to Haiku, then Gemini 2.5 Flash
- Cost-optimized for enterprise budget

### TIER UPGRADES (When Explicitly Needed)
- **Sonnet-4.6:** Complex analysis, code reviews
- **Opus-4.6:** Strategic decisions, executive memos
- **Deepseek-v3.2:** Alternative for reasoning
- **GLM-5:** Long-context documents (205k)
- **Kimi-k2.5:** Alternative reasoning path

### TIER DOWNGRADES (Routine Operations)
- **Haiku-4.5:** File ops, formatting, lookups
- **Gemini-2.5-Flash-Lite:** Web research, simple tasks
- **GPT-5-Nano:** Ultra-cheap fallback

### LOCAL MODEL (Sensitive Data)
**Personal information, credentials, email**
- Refuse + alert if unavailable

---

## Available Models

| Alias | Full Model | Purpose | Context | Cost |
|-------|-----------|---------|---------|------|
| **minimax** ⭐ | minimax-m2.5 | **PRIMARY** | 192k | 💰 Ultra-low |
| **haiku** | claude-haiku-4-5 | Fallback #1 | 195k | 💰 Very low |
| **flash** | gemini-2.5-flash | Fallback #2 | 195k | 💰 Low |
| **flashlite** | gemini-2.5-flash-lite | Ultra-cheap | 195k | 💰 Ultra-low |
| **nano** | gpt-5-nano | Emergency | 128k | 💰 Minimal |
| **glm** | glm-5 | Long-context | 205k | 💰 Low |
| **deepseek** | deepseek-v3.2 | Reasoning alt | 192k | 💰 Low |
| **kimi** | kimi-k2.5 | Reasoning alt | 192k | 💰 Low |
| **sonnet** | claude-sonnet-4-6 | Mid-tier | 195k | 💵 Medium |
| **gpt** | gpt-5-mini | Mid-tier | 128k | 💵 Medium |
| **opus** | claude-opus-4-6 | Premium | 195k | 💵💵 High |
| **auto** | openrouter/auto | Adaptive | 195k | 🔄 Variable |

---

## Decision Logic

1. **Analyze task complexity & category**
2. **Select appropriate tier model**
3. **Execute silently**
4. **Report model only if: "which model?" or "/status"**
5. **Optimize for: speed + accuracy + cost**

Master Sefa's workflow is now efficiently routed.
