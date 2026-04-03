#!/bin/bash
# "Build Me Something Wonderful" - Nightly Creative Task
# Runs every night at 23:00 Istanbul time

WORKSPACE="/home/sefa/.openclaw/workspace"
WONDERFUL_DIR="/home/sefa/wonderful"
LOG="${WONDERFUL_DIR}/build.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
OPENCLAW=~/.npm-global/bin/openclaw

mkdir -p "$WONDERFUL_DIR"

echo "[${TIMESTAMP}] Starting: Build Me Something Wonderful..." >> "$LOG"

BUILD_TYPE=$(($(date +%d) % 5))

case $BUILD_TYPE in
  0) TITLE="research-summary-$(date +%Y-%m-%d)"
     cat > "$WONDERFUL_DIR/${TITLE}.md" << 'EOF'
# Research Summary — AI Strategy for Enterprise Architecture
- Latest patterns in AI integration for banking
- Risk mitigation frameworks
- Implementation roadmaps
EOF
     ;;
  1) TITLE="automation-$(date +%Y-%m-%d)"
     printf '#!/bin/bash\n# Auto-generated productivity script\necho "Daily Standup Report - $(date +%%Y-%%m-%%d)"\n' > "$WONDERFUL_DIR/${TITLE}.sh"
     chmod +x "$WONDERFUL_DIR/${TITLE}.sh"
     ;;
  2) TITLE="strategy-framework-$(date +%Y-%m-%d)"
     cat > "$WONDERFUL_DIR/${TITLE}.md" << 'EOF'
# Strategic Framework: AI Team Architecture
Decision matrix for AI implementation at İş Bankası — cost, integration, security.
EOF
     ;;
  3) TITLE="resources-$(date +%Y-%m-%d)"
     echo '{"title":"Curated Resources for Enterprise AI","categories":["architecture","implementation","leadership"]}' > "$WONDERFUL_DIR/${TITLE}.json"
     ;;
  4) TITLE="solution-$(date +%Y-%m-%d)"
     cat > "$WONDERFUL_DIR/${TITLE}.md" << 'EOF'
# Creative Solution: SoftTech Performance Optimization
Phased approach: high-impact first, track ROI, build internal expertise.
EOF
     ;;
esac

echo "[${TIMESTAMP}] Built: ${TITLE}" >> "$LOG"

$OPENCLAW agent \
  --channel telegram \
  --reply-to "telegram:963702150" \
  --deliver \
  --message "🌙 Gecelik build hazır → ~/wonderful/${TITLE}" >> "$LOG" 2>&1
