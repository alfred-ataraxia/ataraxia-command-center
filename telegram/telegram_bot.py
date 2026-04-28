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
import re
from aiohttp import web

SOCKET_PATH = "/tmp/lattice.sock"
PID_FILE = os.path.expanduser("~/openclaw/logs/telegram-bot.pid")
CALLBACK_HOST = os.environ.get("OPENCLAW_TELEGRAM_CALLBACK_HOST", "127.0.0.1")
CALLBACK_PORT = int(os.environ.get("OPENCLAW_TELEGRAM_CALLBACK_PORT", "8001"))
LEGACY_BOT_MODE = os.environ.get("ALFRED_LEGACY_TELEGRAM_BOT_MODE", "auto").lower()

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

def openclaw_telegram_channel_enabled():
    """OpenClaw native Telegram channel is the canonical Telegram brain."""
    try:
        config_path = os.path.expanduser("~/.openclaw/openclaw.json")
        with open(config_path, "r") as f:
            config = json.load(f)
        telegram_config = config.get("channels", {}).get("telegram", {})
        return bool(telegram_config.get("enabled"))
    except Exception as e:
        log_msg(f"OPENCLAW CONFIG CHECK ERROR: {e}")
        return False

def should_disable_legacy_polling():
    """Prevent two Telegram pollers from consuming the same Bot API update stream."""
    if LEGACY_BOT_MODE in ("active", "enabled", "on"):
        return False
    if LEGACY_BOT_MODE in ("disabled", "off"):
        return True
    return openclaw_telegram_channel_enabled()

def sanitize_assistant_reply(reply):
    """Remove model/tool-call leakage before a Telegram response is sent."""
    if not reply:
        return ""
    reply = re.sub(r'<minimax:tool_call>.*?</minimax:tool_call>', '', reply, flags=re.DOTALL | re.IGNORECASE)
    reply = re.sub(r'<minimax:tool_call>.*', '', reply, flags=re.DOTALL | re.IGNORECASE)
    reply = re.sub(r'<invoke\b[^>]*>.*?</invoke>', '', reply, flags=re.DOTALL | re.IGNORECASE)
    reply = re.sub(r'<invoke\b[^>]*>.*', '', reply, flags=re.DOTALL | re.IGNORECASE)
    reply = re.sub(r'<[a-z_]+:[a-z_]+>.*?</[a-z_]+:[a-z_]+>', '', reply, flags=re.DOTALL | re.IGNORECASE)
    reply = re.sub(r'(?im)^\s*(Shell|Bash|Read|Write|Edit|Glob|Grep)\s*$', '', reply)
    return reply.strip()

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

def load_minimax_config():
    """MINIMAX_API_KEY env değişkenini ve sabit endpoint'i döndürür."""
    api_key = os.environ.get('MINIMAX_API_KEY', '')
    if not api_key:
        # ~/.openclaw/.env'den oku (servis ortamında env yüklenmemiş olabilir)
        try:
            env_path = os.path.expanduser('~/.openclaw/.env')
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('MINIMAX_API_KEY='):
                        api_key = line.split('=', 1)[1]
                        break
        except Exception:
            pass
    return api_key, 'https://api.minimax.io/anthropic', 'MiniMax-M2.7'

def call_claude(chat_id, prompt):
    """MiniMax API (Anthropic-compat) üzerinden Alfred'e sorar."""
    if chat_id not in CONVERSATIONS:
        CONVERSATIONS[chat_id] = []
    CONVERSATIONS[chat_id].append({"role": "user", "content": prompt})

    api_key, base_url, model_id = load_minimax_config()
    if not api_key:
        return "❌ MiniMax API key bulunamadı. openclaw agents/alfred/agent/models.json kontrol edin."

    import datetime
    import locale
    import subprocess
    import os
    
    try: locale.setlocale(locale.LC_TIME, 'tr_TR.UTF-8')
    except: pass
    now = datetime.datetime.now()
    date_str = now.strftime("%d %B %Y %A, %H:%M")
    
    memory_context = ""
    try:
        mem1 = subprocess.check_output(["bash", os.path.expanduser("~/.openclaw/workspace/memory/scripts/read-master-memory.sh"), "30"], text=True)
        mem2 = subprocess.check_output(["bash", os.path.expanduser("~/.openclaw/workspace/memory/scripts/read-recent-shared-notes.sh"), "20"], text=True)
        memory_context = f"\n\nKANONİK HAFIZA (Özet):\n{mem1}\n\nSON NOTLAR:\n{mem2}"
    except Exception as e:
        memory_context = f"\n\n(Hafıza okunamadı: {e})"
    
    system_prompt = (
        f"Sen Alfred'sin — Master Sefa'nın kişisel asistanı. "
        f"Sade, kısa ve net Türkçe yanıt ver. "
        f"ASLA XML, JSON, tool_call, invoke, Shell, Bash veya kod bloğu kullanma. "
        f"Sadece düz metin yaz. Tek görevin konuşmak.\n\n"
        f"Zaman: {date_str}{memory_context}"
    )

    # Son MAX_HISTORY kadar konuşmayı gönder
    messages = CONVERSATIONS[chat_id][-(MAX_HISTORY * 2):]

    try:
        url = base_url.rstrip('/') + '/v1/messages'
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
            'anthropic-version': '2023-06-01',
        }
        payload = {
            'model': model_id,
            'max_tokens': 1024,
            'system': system_prompt,
            'messages': messages,
        }
        resp = requests.post(url, headers=headers, json=payload, timeout=60)
        if not resp.ok:
            log_msg(f"MiniMax API hata {resp.status_code}: {resp.text[:200]}")
            return f"❌ Alfred yanıt veremedi (HTTP {resp.status_code})."

        data = resp.json()
        text_block = next((b for b in data.get('content', []) if b.get('type') == 'text'), None)
        reply = (text_block or {}).get('text', '') or data.get('error', {}).get('message', '')
        if not reply.strip():
            return "⚠️ Alfred boş yanıt döndürdü."

        reply = sanitize_assistant_reply(reply)
        if not reply:
            return "⚠️ Alfred araç çağrısı üretmeye çalıştı; Telegram'da çalıştırmadım."

        CONVERSATIONS[chat_id].append({"role": "assistant", "content": reply})
        return reply[:4000]
    except requests.Timeout:
        return "⏱️ İstek zaman aşımına uğradı (60 sn)."
    except Exception as e:
        log_msg(f"MiniMax API ERROR: {e}")
        return f"❌ Alfred hatası: {e}"

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

    elif cmd in ("/model", "/models", "/fast", "/slow", "/agent", "/agents"):
        send_message(chat_id,
            "Bu OpenClaw native Telegram komutu. Legacy Python bot bu komutu işlememeli.\n"
            "OpenClaw Telegram kanalı aktifken `telegram_bot.py` polling kapalı tutulur."
        )

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
    if should_disable_legacy_polling():
        log_msg("Legacy Telegram polling disabled; OpenClaw native Telegram channel is authoritative.")
        while True:
            await asyncio.sleep(3600)

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
