#!/usr/bin/env python3
"""
Alfred — Telegram Bot for Claude Code
Sefa ile Telegram'dan doğrudan konuşma
"""

import os
import subprocess
from datetime import datetime
import requests
import json
import time

BOT_TOKEN = "8709025802:AAGbGfHDbaottGGPpVhHW7DFTNHvVU0MSb0"
MASTER_ID = 963702150
API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"
LOGS_DIR = os.path.expanduser("~/openclaw/logs")
os.makedirs(LOGS_DIR, exist_ok=True)

# Konuşma geçmişi: chat_id -> [{"role": "user/assistant", "content": str}]
CONVERSATIONS = {}
MAX_HISTORY = 20  # Bellekte tutulacak max mesaj sayısı

def log_msg(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(f"{LOGS_DIR}/telegram-bot.log", "a") as f:
        f.write(f"[{timestamp}] {msg}\n")

def send_message(chat_id, text, parse_mode="Markdown"):
    """Send message to Telegram"""
    try:
        requests.post(f"{API_URL}/sendMessage", json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode
        }, timeout=10)
        return True
    except Exception as e:
        log_msg(f"SEND ERROR: {e}")
        return False

def call_claude(chat_id, prompt):
    """Call Claude Code CLI with conversation history (Haiku model)"""
    # Geçmişi güncelle
    if chat_id not in CONVERSATIONS:
        CONVERSATIONS[chat_id] = []
    CONVERSATIONS[chat_id].append({"role": "user", "content": prompt})

    # Son MAX_HISTORY mesajı al
    history = CONVERSATIONS[chat_id][-MAX_HISTORY:]

    # Context string oluştur
    if len(history) > 1:
        context = "Aşağıdaki konuşma geçmişini bağlam olarak kullan:\n\n"
        for msg in history[:-1]:
            role = "Kullanıcı" if msg["role"] == "user" else "Alfred"
            context += f"{role}: {msg['content']}\n\n"
        full_prompt = context + f"Kullanıcı: {prompt}"
    else:
        full_prompt = prompt

    try:
        result = subprocess.run(
            ["claude", "--model", "haiku", "-p", full_prompt],
            capture_output=True,
            text=True,
            timeout=60
        )
        output = result.stdout.strip()
        if result.returncode != 0:
            output = result.stderr.strip() or "Hata"
        output = output[:4000]

        # Yanıtı geçmişe ekle
        CONVERSATIONS[chat_id].append({"role": "assistant", "content": output})
        return output
    except subprocess.TimeoutExpired:
        return "⏱️ Timeout (60s). Daha sonra tekrar dene."
    except FileNotFoundError:
        return "❌ Claude Code CLI bulunamadı. `claude` komutunu kur."
    except Exception as e:
        return f"❌ Hata: {str(e)[:100]}"

def handle_message(chat_id, text):
    """Handle messages"""
    text = text.strip()
    log_msg(f"MSG: {text[:100]}")

    # Komut mı kontrol et
    if text.startswith("/"):
        handle_command(chat_id, text)
    else:
        # Doğal dil → Claude'a gönder
        send_message(chat_id, "⏳ İşleniyor...")
        response = call_claude(chat_id, text)
        send_message(chat_id, response, parse_mode="Markdown")
        log_msg(f"CLAUDE RESPONSE: {response[:50]}...")

def handle_command(chat_id, text):
    """Handle slash commands"""
    cmd = text.split()[0].lower()

    if cmd == "/start":
        send_message(chat_id,
            "🦇 **Alfred aktif**\n\n"
            "Türkçe veya İngilizce yazabilirsin. Claude'a doğrudan gider.\n\n"
            "Komutlar:\n"
            "`/status` — Sistem\n"
            "`/sprint` — Sprint\n"
            "`/backlog` — Backlog\n"
            "`/shell <cmd>` — Bash\n"
            "`/backup` — GitHub'a yedekle\n"
            "`/clear` — Konuşma geçmişini sıfırla\n\n"
            "Örnek: 'Docker container'ları listele' veya '/shell docker ps'"
        )

    elif cmd == "/backup":
        send_message(chat_id, "⏳ GitHub'a yedekleniyor...")
        try:
            result = subprocess.run(
                ["bash", "/home/sefa/alfred-hub/alfred-backup.sh"],
                capture_output=True, text=True, timeout=60
            )
            output = (result.stdout + result.stderr)[-1500:]
            send_message(chat_id, f"```\n{output}\n```")
        except Exception as e:
            send_message(chat_id, f"❌ Yedekleme hatası: {e}")

    elif cmd == "/clear":
        CONVERSATIONS.pop(chat_id, None)
        send_message(chat_id, "🧹 Konuşma geçmişi temizlendi.")
        log_msg(f"CLEAR: chat_id={chat_id}")

    elif cmd == "/status":
        response = call_claude(chat_id, "Sistem durumu: RAM, disk, Docker container sayısı. Kısa, bullet format.")
        send_message(chat_id, response)

    elif cmd == "/sprint":
        try:
            with open(os.path.expanduser("~/scrum/sprints/sprint-01.md"), "r") as f:
                content = f.read()[:500]
            send_message(chat_id, f"📋 Sprint 1:\n```\n{content}\n```")
        except:
            send_message(chat_id, "Sprint dosyası bulunamadı")

    elif cmd == "/backlog":
        try:
            with open(os.path.expanduser("~/scrum/backlog.md"), "r") as f:
                content = f.read()[:800]
            send_message(chat_id, f"📦 Backlog:\n```\n{content}\n```")
        except:
            send_message(chat_id, "Backlog dosyası bulunamadı")

    elif cmd == "/shell":
        args = text[7:].strip()
        if not args:
            send_message(chat_id, "Kullanım: /shell <komut>")
            return

        # Güvenlik
        if any(x in args for x in ["rm -rf", "dd if=", "shutdown", "reboot"]):
            send_message(chat_id, "⚠️ Tehlikeli komut reddedildi")
            log_msg(f"BLOCKED: {args}")
            return

        try:
            result = subprocess.run(
                ["bash", "-c", args],
                capture_output=True, text=True, timeout=10
            )
            output = (result.stdout or result.stderr)[:2000]
            send_message(chat_id, f"```\n{output}\n```")
            log_msg(f"SHELL: {args}")
        except subprocess.TimeoutExpired:
            send_message(chat_id, "⏱️ Timeout")
        except Exception as e:
            send_message(chat_id, f"❌ {e}")

    else:
        send_message(chat_id, f"Bilinmeyen komut: {cmd}\n/start yazarak yardım al")

def poll_updates(offset=0):
    """Poll Telegram API"""
    while True:
        try:
            response = requests.get(
                f"{API_URL}/getUpdates",
                params={"offset": offset, "timeout": 30},
                timeout=35
            )
            updates = response.json().get("result", [])

            for update in updates:
                offset = update["update_id"] + 1

                if "message" not in update:
                    continue

                msg = update["message"]
                chat_id = msg.get("chat", {}).get("id")
                user_id = msg.get("from", {}).get("id")
                text = msg.get("text", "")

                # Only Master Sefa
                if user_id != MASTER_ID:
                    log_msg(f"UNAUTHORIZED: {user_id}")
                    continue

                if text:
                    handle_message(chat_id, text)

        except requests.exceptions.ConnectionError:
            log_msg("CONNECTION ERROR: Reconnecting...")
            time.sleep(5)
        except Exception as e:
            log_msg(f"POLL ERROR: {e}")
            time.sleep(5)

if __name__ == "__main__":
    log_msg("=== Bot başlatıldı ===")
    print("🦇 Alfred Telegram Bot — Claude Mode")
    print("@ataraxia_alfred_bot aktif")
    print("Ctrl+C ile durdur\n")

    try:
        poll_updates()
    except KeyboardInterrupt:
        log_msg("Bot kapatıldı")
        print("\n👋 Bot kapatıldı")
