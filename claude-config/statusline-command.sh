#!/usr/bin/env bash
# ataraxia statusline — lightweight, RPi 400 uyumlu
input=$(cat)

# Model adı
model=$(echo "$input" | jq -r '.model.display_name // "unknown"')

# Çalışma dizini (home kısaltılmış)
cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // "?"')
cwd_short="${cwd/#$HOME/~}"

# Git branch (opsiyonel, hata yoksa)
branch=""
git_branch=$(GIT_OPTIONAL_LOCKS=0 git -C "$cwd" rev-parse --abbrev-ref HEAD 2>/dev/null)
[ -n "$git_branch" ] && branch=" [${git_branch}]"

# CPU% — /proc/stat üzerinden (lightweight, top gerektirmez)
cpu_line1=$(awk '/^cpu /{print}' /proc/stat)
sleep 0.3
cpu_line2=$(awk '/^cpu /{print}' /proc/stat)

idle1=$(echo "$cpu_line1" | awk '{print $5}')
total1=$(echo "$cpu_line1" | awk '{s=0; for(i=2;i<=NF;i++) s+=$i; print s}')
idle2=$(echo "$cpu_line2" | awk '{print $5}')
total2=$(echo "$cpu_line2" | awk '{s=0; for(i=2;i<=NF;i++) s+=$i; print s}')

delta_idle=$((idle2 - idle1))
delta_total=$((total2 - total1))
if [ "$delta_total" -gt 0 ]; then
  cpu_pct=$(( (delta_total - delta_idle) * 100 / delta_total ))
else
  cpu_pct=0
fi

# RAM% — /proc/meminfo
mem_total=$(awk '/^MemTotal:/{print $2}' /proc/meminfo)
mem_avail=$(awk '/^MemAvailable:/{print $2}' /proc/meminfo)
mem_used=$(( mem_total - mem_avail ))
ram_pct=$(( mem_used * 100 / mem_total ))

printf "%s%s | CPU:%d%% RAM:%d%% | %s" \
  "$cwd_short" "$branch" "$cpu_pct" "$ram_pct" "$model"
