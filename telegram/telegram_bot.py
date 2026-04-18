#!/usr/bin/env python3
"""
Alfred — Telegram Bot for Claude Code
Sefa ile Telegram'dan doğrudan konuşma
"""

import os
import subprocess
import socket
import json
import asyncio
import atexit
from datetime import datetime
import requests
import time
import glob
from aiohttp import web

SOCKET_PATH = "/tmp/lattice.sock"
PID_FILE = os.path.expanduser("~/openclaw/logs/telegram-bot.pid")
CALLBACK_HOST = os.environ.get("OPENCLAW_TELEGRAM_CALLBACK_HOST", "127.0.0.1")
CALLBACK_PORT = int(os.environ.get("OPENCLAW_TELEGRAM_CALLBACK_PORT", "8001"))

def send_to_lattice(action, agent="claude", command="", chat_id=None):
    """Orchestrator'a görev gönderir (chat_id ile birlikte)"""
    try:
        payload = {
            "action": action,
            "agent": agent,
            "command": command,
            "chat_id": chat_id,
            "timestamp": datetime.now().isoformat()
        }
        client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        client.settimeout(2)
        client.connect(SOCKET_PATH)
        client.send(json.dumps(payload).encode())
        client.close()
        return True
    except Exception as e:
        log_msg(f"LATTICE IPC ERROR: {e}")
        return False

def load_env():
    env_path = "/home/sefa/alfred-hub/command-center/dashboard/.env"
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, val = line.strip().split('=', 1)
                    os.environ[key] = val

load_env()

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
if not BOT_TOKEN:
    print("TELEGRAM_BOT_TOKEN bulunamadi!")
    exit(1)
MASTER_ID = 963702150
API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"
LOGS_DIR = os.path.expanduser("~/openclaw/logs")
os.makedirs(LOGS_DIR, exist_ok=True)

# Konuşma geçmişi: chat_id -> [{"role": "user/assistant", "content": str}]
CONVERSATIONS = {}
MAX_HISTORY = 5  # Hafızayı yormamak için azaltıldı

def log_msg(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        with open(f"{LOGS_DIR}/telegram-bot.log", "a") as f:
            f.write(f"[{timestamp}] {msg}\n")
    except:
        pass

def _write_pid_file():
    try:
        with open(PID_FILE, "w") as f:
            f.write(str(os.getpid()))
    except Exception as e:
        log_msg(f"PID WRITE ERROR: {e}")

def _cleanup_pid_file():
    try:
        if os.path.exists(PID_FILE):
            with open(PID_FILE, "r") as f:
                existing = (f.read() or "").strip()
            if existing == str(os.getpid()):
                os.remove(PID_FILE)
    except Exception as e:
        log_msg(f"PID CLEANUP ERROR: {e}")

def send_message(chat_id, text, parse_mode="Markdown"):
    """Send message to Telegram"""
    try:
        resp = requests.post(f"{API_URL}/sendMessage", json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode
        }, timeout=10)
        if not resp.ok:
            log_msg(f"SEND ERROR HTTP {resp.status_code}: {resp.text[:200]}")
            # Fallback: Telegram can reject Markdown formatting; retry without parse_mode.
            if parse_mode:
                resp2 = requests.post(f"{API_URL}/sendMessage", json={
                    "chat_id": chat_id,
                    "text": text
                }, timeout=10)
                if not resp2.ok:
                    log_msg(f"SEND ERROR (fallback) HTTP {resp2.status_code}: {resp2.text[:200]}")
                    return False
        return True
    except Exception as e:
        log_msg(f"SEND ERROR: {e}")
        return False

def call_claude(chat_id, prompt):
    """OpenClaw (MiniMax) CLI komutunu doğrudan çalıştırır"""
    if chat_id not in CONVERSATIONS:
        CONVERSATIONS[chat_id] = []
    CONVERSATIONS[chat_id].append({"role": "user", "content": prompt})

    try:
        # OpenClaw kullanımı (Tamamen etkileşimsiz mod)
        # --accept-risk: Onay bekleyen aşamaları otomatik geçer
        result = subprocess.run(
            ["openclaw", "-p", prompt, "--non-interactive", "--accept-risk"],
            capture_output=True, text=True, timeout=180
        )
        stdout = result.stdout or ""
        stderr = result.stderr or ""
        response = stdout + "\n" + stderr
        
        if not response.strip():
            response = "⚠️ OpenClaw boş yanıt döndürdü. Yapılandırmayı kontrol edin."
        
        # ANSI temizliği
        import re
        ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
        response = ansi_escape.sub('', response)
        
        return response[:4000]
    except subprocess.TimeoutExpired:
        return "⏱️ İşlem zaman aşımına uğradı (120 sn)."
    except Exception as e:
        log_msg(f"OPENCLAW ERROR: {e}")
        return f"❌ OpenClaw hatası: {e}"

def handle_message(chat_id, text):
    """Handle messages"""
    text = text.strip()
    log_msg(f"MSG: {text[:100]}")

    if text.startswith("/"):
        handle_command(chat_id, text)
    else:
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
            "Komutlar:\n"
            "`/status` — Sistem\n"
            "`/sprint` — En son Sprint\n"
            "`/backlog` — Backlog\n"
            "`/shell <cmd>` — İzinli Bash Komutları\n"
            "`/backup` — GitHub'a yedekle\n"
            "`/clear` — Konuşma geçmişini sıfırla"
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

    elif cmd == "/stop":
        success = send_to_lattice("KILL_CURRENT")
        if success:
            send_to_lattice("KILL_CURRENT") # Double check
            send_message(chat_id, "🛑 Aktif tüm süreçler durduruldu.")
        else:
            send_message(chat_id, "❌ Durdurma komutu gönderilemedi.")

    elif cmd == "/status":
        response = call_claude(chat_id, "Sistem durumu: RAM, disk, Docker container sayısı. Kısa, bullet format.")
        send_message(chat_id, response)

    elif cmd == "/sprint":
        try:
            sprints = sorted(glob.glob(os.path.expanduser("~/scrum/sprints/sprint-*.md")))
            if not sprints:
                send_message(chat_id, "Sprint dosyası bulunamadı")
                return
            latest_sprint = sprints[-1]
            with open(latest_sprint, "r") as f:
                content = f.read()[:500]
            send_message(chat_id, f"📋 {os.path.basename(latest_sprint)}:\n```\n{content}\n```")
        except:
            send_message(chat_id, "Sprint dosyası okunamadı")

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
            send_message(chat_id, "Kullanım: /shell <komut>\nİzin verilenler: docker ps, uptime, df, free, systemctl status")
            return

        # Güvenlik - Strict Allowlist
        allowed_cmds = ["docker ps", "uptime", "df", "free", "systemctl status"]
        is_allowed = False
        for allowed in allowed_cmds:
            if args.startswith(allowed):
                is_allowed = True
                break

        if not is_allowed or ";" in args or "&" in args or "|" in args or "$" in args or ">" in args or "<" in args:
            send_message(chat_id, "⚠️ Bu komuta izin verilmiyor veya geçersiz karakterler içeriyor.")
            log_msg(f"BLOCKED SHELL: {args}")
            return

        try:
            # List execution for safety
            cmd_list = args.split()
            result = subprocess.run(
                cmd_list,
                capture_output=True, text=True, timeout=10
            )
            output = (result.stdout or result.stderr)[:2000]
            if not output:
                output = "Çıktı boş."
            send_message(chat_id, f"```\n{output}\n```")
            log_msg(f"SHELL: {args}")
        except subprocess.TimeoutExpired:
            send_message(chat_id, "⏱️ Timeout")
        except Exception as e:
            send_message(chat_id, f"❌ Hata: {e}")

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

# --- Webhook ve Async Başlatıcı ---
async def handle_callback(request):
    try:
        data = await request.json()
        chat_id = data.get("chat_id")
        message = data.get("message", "")
        status = data.get("status", "info")
        prefix = "✅" if status == "success" else "ℹ️"
        requests.post(f"{API_URL}/sendMessage", json={
            "chat_id": chat_id,
            "text": f"{prefix} **Lattice Yanıtı:**\n\n{message}"[:4096],
            "parse_mode": "Markdown"
        })
        return web.Response(text="OK")
    except:
        return web.Response(text="Error", status=500)

async def main_loop():
    # Webhook sunucusunu baslat (opsiyonel). Port zaten doluysa bot yine de polling ile calissin.
    try:
        app = web.Application()
        app.router.add_post('/callback', handle_callback)
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, CALLBACK_HOST, CALLBACK_PORT)
        await site.start()
        log_msg(f"Callback server listening on {CALLBACK_HOST}:{CALLBACK_PORT}")
    except OSError as e:
        log_msg(f"Callback server disabled (bind failed): {e}")
    
    # Mevcut polling döngüsünü asenkron çalıştır
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, poll_updates)

if __name__ == "__main__":
    _write_pid_file()
    atexit.register(_cleanup_pid_file)
    log_msg("=== Bot başlatıldı (Webhook Aktif) ===")
    asyncio.run(main_loop())
