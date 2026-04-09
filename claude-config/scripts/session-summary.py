#!/usr/bin/env python3
"""
Alfred Session Summary — önceki Claude Code sessionlarını özetle
Kullanım: python3 session-summary.py [saat=12]
"""

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

SESSION_DIR = Path.home() / ".claude" / "projects" / "-home-sefa"
MAX_AGE_HOURS = int(sys.argv[1]) if len(sys.argv) > 1 else 12
CUTOFF = datetime.now() - timedelta(hours=MAX_AGE_HOURS)


def extract_user_messages(filepath):
    messages = []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    obj = json.loads(line)
                    if obj.get("type") == "user":
                        content = obj.get("message", {}).get("content", [])
                        if isinstance(content, list):
                            for item in content:
                                if isinstance(item, dict) and item.get("type") == "text":
                                    text = item["text"].strip()
                                    # skip command messages and system injections
                                    if not text.startswith("<") and len(text) > 3:
                                        messages.append(text[:120])
                        elif isinstance(content, str) and len(content) > 3:
                            if not content.startswith("<"):
                                messages.append(content[:120])
                except Exception:
                    continue
    except Exception:
        pass
    return messages


def extract_files_modified(filepath):
    files = set()
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    obj = json.loads(line)
                    if obj.get("type") == "assistant":
                        content = obj.get("message", {}).get("content", [])
                        if isinstance(content, list):
                            for item in content:
                                if isinstance(item, dict) and item.get("type") == "tool_use":
                                    inp = item.get("input", {})
                                    fp = inp.get("file_path", "")
                                    if fp:
                                        files.add(os.path.basename(fp))
                except Exception:
                    continue
    except Exception:
        pass
    return list(files)[:8]


def main():
    if not SESSION_DIR.exists():
        print(f"Session dizini bulunamadı: {SESSION_DIR}")
        return

    sessions = []
    for f in SESSION_DIR.glob("*.jsonl"):
        mtime = datetime.fromtimestamp(f.stat().st_mtime)
        if mtime >= CUTOFF:
            sessions.append((mtime, f))

    sessions.sort(reverse=True)

    if not sessions:
        print(f"Son {MAX_AGE_HOURS} saatte session bulunamadı.")
        print(f"Genişletmek için: python3 session-summary.py 48")
        return

    print(f"Son {MAX_AGE_HOURS} saatteki sessionlar ({len(sessions)} adet):\n")

    for i, (mtime, filepath) in enumerate(sessions[:8], 1):
        size_kb = filepath.stat().st_size // 1024
        user_msgs = extract_user_messages(filepath)
        files = extract_files_modified(filepath)

        print(f"{i}. {filepath.name[:36]}")
        print(f"   {mtime.strftime('%d %b %H:%M')} | {size_kb}KB")

        if user_msgs:
            preview = " → ".join(user_msgs[:3])
            print(f"   Kullanici: {preview[:120]}")

        if files:
            print(f"   Dosyalar: {', '.join(files[:5])}")

        print()

    print("Bir session restore etmek icin Alfred'e 'X. session'u yukle' deyin.")


if __name__ == "__main__":
    main()
