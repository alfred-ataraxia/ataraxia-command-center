# CRON.md - Scheduled Tasks

## Morning Briefing
- **Time:** 07:00 Istanbul (GMT+3)
- **Script:** `cron/morning-briefing.sh`
- **Delivery:** Telegram
- **Content:**
  1. Calendar events (today)
  2. Urgent unread messages
  3. Weather for Istanbul
  4. Top 3 priorities (from yesterday's notes)
- **Limit:** <200 words, skip empty sections
- **Status:** ✅ Active

## Weekly Backup
- **Time:** Sunday 02:00 Istanbul (GMT+3)
- **Script:** `cron/weekly-backup.sh`
- **Output:** `/home/sefa/.openclaw/backups/`
- **Retention:** Last 8 weeks
- **Status:** ✅ Active

## Build Me Something Wonderful
- **Time:** 23:00 Istanbul (GMT+3) — every night
- **Script:** `cron/wonderful.sh`
- **Output:** `~/wonderful/[date]-[name]`
- **Content:** Rotates through:
  - Research summaries
  - Automation scripts
  - Strategic frameworks
  - Curated resources
  - Creative solutions
- **Telegram Alert:** One-line teaser at 23:00+
- **Quality Rule:** No repetition, one excellent thing > five mediocre
- **Status:** ✅ Active
