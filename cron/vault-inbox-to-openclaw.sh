#!/usr/bin/env bash
# vault-inbox-to-openclaw.sh — Obsidian vault "quick capture" notlarini OpenClaw shared-notes'a aktarir.
#
# Kullanım:
#   bash /home/sefa/alfred-hub/command-center/cron/vault-inbox-to-openclaw.sh
#
# Konsept:
# - Obsidian: /home/sefa/ikinci-beyin/alfred/inbox/pending/*.md  (kullanici notlari)
# - OpenClaw: /home/sefa/.openclaw/workspace/memory/inbox/shared-notes.md
# - Islem: pending'deki her md dosyasini 1 entry olarak shared-notes'a append eder, sonra processed'a tasir.
#
# Not: Icerik loglanmaz (secret riski).
set -euo pipefail

VAULT="/home/sefa/ikinci-beyin"
PENDING="$VAULT/alfred/inbox/pending"
PROCESSED="$VAULT/alfred/inbox/processed"
SHARED="/home/sefa/.openclaw/workspace/memory/inbox/shared-notes.md"

mkdir -p "$PENDING" "$PROCESSED"

if [ ! -f "$SHARED" ]; then
  echo "Missing: $SHARED" >&2
  exit 1
fi

shopt -s nullglob
files=( "$PENDING"/*.md )
shopt -u nullglob

if [ ${#files[@]} -eq 0 ]; then
  exit 0
fi

for f in "${files[@]}"; do
  ts="$(date --iso-8601=seconds)"
  base="$(basename "$f")"

  # Extract or infer "area":
  # 1) YAML frontmatter: area: xyz
  # 2) First matching line: Alan: xyz
  # 3) Fallback: keyword-based inference from content (simple, deterministic)
  area="$(
    python3 - "$f" <<'PY' 2>/dev/null || true
import re, sys
path = sys.argv[1]
try:
  raw = open(path, "r", encoding="utf-8", errors="replace").read().splitlines()
except Exception:
  sys.exit(0)

area = ""

# YAML frontmatter
if raw[:1] == ["---"]:
  for ln in raw[1:80]:
    if ln.strip() == "---":
      break
    m = re.match(r"^\s*area\s*:\s*(.+?)\s*$", ln, flags=re.I)
    if m:
      area = m.group(1).strip().strip('"').strip("'")
      break

if not area:
  for ln in raw[:40]:
    m = re.match(r"^\s*Alan\s*:\s*(.+?)\s*$", ln, flags=re.I)
    if m:
      area = m.group(1).strip()
      break

def infer(txt: str) -> str:
  t = txt.lower()
  # broad buckets that match vault top-level structure
  if any(k in t for k in ("defi", "btc", "eth", "borsa", "yatirim", "altin", "dolar", "faiz")):
    return "finans-yatirim"
  if any(k in t for k in ("docker", "linux", "windows", "git", "ssh", "openclaw", "dashboard", "server", "vpn", "rclone", "raspberry", "pi")):
    return "ev-lab-teknoloji"
  if any(k in t for k in ("sprint", "backlog", "roadmap", "plan", "hedef", "todo")):
    return "hedefler-planlar"
  if any(k in t for k in ("kariyer", "musteri", "maas", "mulakat", "cv", "kontrat")):
    return "is-kariyer"
  if any(k in t for k in ("spor", "kosu", "fitness", "gym", "diyet", "uyku", "saglik", "agri")):
    return "saglik-spor"
  if any(k in t for k in ("ogren", "kurs", "kitap", "tutorial", "ders", "ingilizce", "hobi")):
    return "ogrenme-gelisim"
  return "notlar"

if not area:
  area = infer("\\n".join(raw))

print(area)
PY
  )"
  area="${area:-notlar}"
  if [ -z "$area" ]; then area="notlar"; fi

  # Read content (do not echo to stdout)
  content="$(
    python3 - "$f" <<'PY' 2>/dev/null || true
import sys
path = sys.argv[1]
try:
  txt = open(path, "r", encoding="utf-8", errors="replace").read().strip()
except Exception:
  txt = ""
print(txt)
PY
  )"

  # Minimal formatting into shared-notes blocks.
  # Keep it bullet-friendly so downstream ingest can parse.
  {
    echo ""
    echo "## ${ts} | Master Sefa"
    echo "- Alan: ${area}"
    if [ -n "$content" ]; then
      # First line goes into "- Not:", rest becomes "- ..." bullets
      first="$(printf '%s\n' "$content" | head -n 1 | tr -d '\r')"
      echo "- Not: ${first}"
      printf '%s\n' "$content" | tail -n +2 | sed 's/\r$//' | sed 's/^/- /'
    else
      echo "- Not: (bos)"
    fi
  } >> "$SHARED"

  safe_ts="${ts//:/-}"
  mv "$f" "$PROCESSED/${safe_ts}--${base}"
done
