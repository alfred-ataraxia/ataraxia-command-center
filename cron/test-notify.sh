#!/bin/bash
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "Test notification triggered at $TIMESTAMP" >> /home/sefa/.openclaw/workspace/cron/test-notify.log
openclaw notify "Test bildiriminiz başarıyla ulaştı, efendim. Cron bildirim sistemi aktif."
