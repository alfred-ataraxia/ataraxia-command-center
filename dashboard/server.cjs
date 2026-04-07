#!/usr/bin/env node
/**
 * Ataraxia Dashboard Server (pure Node.js, no Express)
 * Serves static dist/ + /api/stats on port 4173
 */

const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { execSync, spawn } = require('child_process')

// --- Load .env file ---
function loadEnv() {
  const envFile = path.join(__dirname, '.env')
  try {
    const lines = fs.readFileSync(envFile, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (key && !(key in process.env)) {
        process.env[key] = val
      }
    }
    // Map VITE_ prefixed vars for server-side use if not explicitly set
    const viteMap = {
      HA_URL: 'VITE_HA_URL',
      HA_TOKEN: 'VITE_HA_TOKEN',
    }
    for (const [serverKey, viteKey] of Object.entries(viteMap)) {
      if (!process.env[serverKey] && process.env[viteKey]) {
        process.env[serverKey] = process.env[viteKey]
      }
    }
  } catch (err) {
    console.warn('.env dosyası okunamadı:', err.message)
  }
}
loadEnv()

const PORT = 4173
const DIST = path.join(__dirname, 'dist')

// --- MIME types ---
const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

// --- CPU sampling ---
let prevCpuTimes = getCpuTimes()

function getCpuTimes() {
  const cpus = os.cpus()
  let user = 0, nice = 0, sys = 0, idle = 0, irq = 0
  for (const cpu of cpus) {
    user += cpu.times.user
    nice += cpu.times.nice
    sys += cpu.times.sys
    idle += cpu.times.idle
    irq += cpu.times.irq
  }
  return { user, nice, sys, idle, irq }
}

function getCpuPercent() {
  const cur = getCpuTimes()
  const prev = prevCpuTimes
  const totalDelta = (cur.user - prev.user) + (cur.nice - prev.nice) +
    (cur.sys - prev.sys) + (cur.idle - prev.idle) + (cur.irq - prev.irq)
  const idleDelta = cur.idle - prev.idle
  prevCpuTimes = cur
  if (totalDelta === 0) return 0
  return Math.round((1 - idleDelta / totalDelta) * 100)
}

function getDiskPercent() {
  try {
    const out = execSync("df / --output=pcent | tail -1", { encoding: 'utf8' }).trim()
    return parseInt(out.replace('%', ''), 10)
  } catch {
    return null
  }
}

function getSwapInfo() {
  try {
    const meminfo = fs.readFileSync('/proc/meminfo', 'utf8')
    const get = (key) => {
      const m = meminfo.match(new RegExp(`^${key}:\\s+(\\d+)`, 'm'))
      return m ? parseInt(m[1], 10) : 0
    }
    const swapTotalKB = get('SwapTotal')
    const swapFreeKB = get('SwapFree')
    const swapUsedKB = swapTotalKB - swapFreeKB
    return {
      swapTotalMB: Math.round(swapTotalKB / 1024),
      swapUsedMB: Math.round(swapUsedKB / 1024),
      swapPercent: swapTotalKB > 0 ? Math.round((swapUsedKB / swapTotalKB) * 100) : 0,
    }
  } catch {
    return { swapTotalMB: 0, swapUsedMB: 0, swapPercent: 0 }
  }
}

function getStats() {
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  const memPercent = Math.round((usedMem / totalMem) * 100)
  const uptimeSeconds = os.uptime()
  const hours = Math.floor(uptimeSeconds / 3600)
  const minutes = Math.floor((uptimeSeconds % 3600) / 60)

  const swap = getSwapInfo()
  return {
    cpuPercent: getCpuPercent(),
    memPercent,
    memUsedMB: Math.round(usedMem / 1024 / 1024),
    memTotalMB: Math.round(totalMem / 1024 / 1024),
    diskPercent: getDiskPercent(),
    ...swap,
    uptimeSeconds: Math.round(uptimeSeconds),
    uptimeHuman: `${hours}sa ${minutes}dk`,
    timestamp: new Date().toISOString(),
  }
}

// --- Stats history (last 24h, sampled every 5 min = max 288 entries) ---
const HISTORY_MAX = 288
const statsHistory = []

// --- Health / uptime tracking ---
const SERVER_START = Date.now()
let healthConsecutiveFails = 0
const HEALTH_FAIL_THRESHOLD = 3

// --- Notifications history (in-memory, max 50) ---
const NOTIFICATIONS_MAX = 50
const notifications = []

function addNotification(type, title, message, taskId = null) {
  const notification = {
    id: Date.now(),
    type, // 'task_complete', 'cron_alert', 'system_warning'
    title,
    message,
    taskId,
    timestamp: new Date().toISOString(),
  }
  notifications.unshift(notification) // newest first
  if (notifications.length > NOTIFICATIONS_MAX) {
    notifications.pop()
  }
}

// --- FreeRide skill state ---
const frState = { running: false, output: '', exitCode: null, lastRun: null, command: null }

// --- Home Assistant config ---
const HA_URL = process.env.HA_URL || 'http://localhost:8123'
const HA_TOKEN = process.env.HA_TOKEN || ''

// Telegram notification helper
function sendTelegramNotification(taskId, taskTitle, completionTime) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.warn('TELEGRAM_BOT_TOKEN veya TELEGRAM_CHAT_ID ayarlanmamış')
    return
  }

  const message = `✅ *Görev Tamamlandı*\n\n` +
    `🆔 ID: ${taskId}\n` +
    `📝 Başlık: ${taskTitle}\n` +
    `⏰ Tamamlanma: ${new Date(completionTime).toLocaleString('tr-TR')}`

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  const data = JSON.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown'
  })

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }

  const req = https.request(url, options, (res) => {
    let body = ''
    res.on('data', chunk => { body += chunk })
    res.on('end', () => {
      if (res.statusCode !== 200) {
        console.error('Telegram API hatası:', res.statusCode, body)
      }
    })
  })

  req.on('error', (err) => {
    console.error('Telegram gönderme hatası:', err.message)
  })

  req.write(data)
  req.end()
}

// Git commit helper (T-031 integration)
function commitTasksFile(taskId, taskTitle, newStatus) {
  try {
    const workspaceDir = path.join(__dirname, '..')
    const commitMsg = `tasks: [${taskId}] ${taskTitle} -> ${newStatus}`
    execSync(`git add TASKS.json && git commit -m "${commitMsg}"`, {
      cwd: workspaceDir,
      stdio: 'pipe'
    })
  } catch (err) {
    console.error(`Git commit hatası [${taskId}]:`, err.message)
  }
}

// Helper to make HA API calls
function haApiCall(method, path, data = null) {
  return new Promise((resolve, reject) => {
    if (!HA_TOKEN) {
      reject(new Error('HA_TOKEN not configured'))
      return
    }

    const url = new URL(HA_URL + path)
    const isHttps = url.protocol === 'https:'
    const client = isHttps ? https : http

    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${HA_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }

    const req = client.request(url, options, (res) => {
      let body = ''
      res.on('data', chunk => { body += chunk })
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HA API error: ${res.statusCode}`))
        } else {
          try {
            resolve(body ? JSON.parse(body) : null)
          } catch {
            resolve(body)
          }
        }
      })
    })

    req.on('error', reject)
    if (data) req.write(JSON.stringify(data))
    req.end()
  })
}

// Fetch and parse HA devices
async function getHADevices() {
  try {
    const states = await haApiCall('GET', '/api/states')
    const devices = []

    for (const state of states) {
      const entity_id = state.entity_id
      const [domain] = entity_id.split('.')

      if (domain === 'light' || domain === 'switch' || domain === 'sensor' || domain === 'binary_sensor') {
        const device = {
          id: entity_id,
          name: state.attributes?.friendly_name || entity_id,
          type: domain === 'switch' || domain === 'binary_sensor' ? 'switch' : domain,
          state: state.state,
          attributes: state.attributes || {},
        }

        if (domain === 'light' && state.attributes?.brightness !== undefined) {
          device.brightness = Math.round((state.attributes.brightness / 255) * 100)
        }

        if (domain === 'sensor') {
          device.value = state.state
          device.unit = state.attributes?.unit_of_measurement || ''
          if (state.attributes?.device_class === 'temperature') {
            device.temperature = parseFloat(state.state)
          } else if (state.attributes?.device_class === 'humidity') {
            device.humidity = parseFloat(state.state)
          }
        }

        devices.push(device)
      }
    }

    return { devices, connected: true }
  } catch (err) {
    console.error('HA API error:', err.message)
    return { devices: [], connected: false, error: err.message }
  }
}

function recordStats() {
  const s = getStats()
  statsHistory.push({ t: s.timestamp, cpu: s.cpuPercent, mem: s.memPercent, disk: s.diskPercent })
  if (statsHistory.length > HISTORY_MAX) statsHistory.shift()
}

// Record immediately on startup, then every 5 minutes
recordStats()
setInterval(recordStats, 5 * 60 * 1000)

// --- Dashboard availability self-check every 5 minutes ---
function runHealthCheck() {
  const req = http.get(`http://127.0.0.1:${PORT}/api/health`, (res) => {
    if (res.statusCode === 200) {
      if (healthConsecutiveFails > 0) {
        console.log(`[health] Dashboard recovered after ${healthConsecutiveFails} fail(s)`)
        addNotification('system_warning', 'Dashboard Recovered', `${healthConsecutiveFails} başarısız kontrol sonrası dashboard erişilebilir durumda`)
      }
      healthConsecutiveFails = 0
    } else {
      handleHealthFail(`HTTP ${res.statusCode}`)
    }
    res.resume()
  })
  req.on('error', (err) => handleHealthFail(err.message))
  req.setTimeout(5000, () => { req.destroy(); handleHealthFail('timeout') })
}

function handleHealthFail(reason) {
  healthConsecutiveFails++
  console.warn(`[health] Check failed (${healthConsecutiveFails}/${HEALTH_FAIL_THRESHOLD}): ${reason}`)
  if (healthConsecutiveFails >= HEALTH_FAIL_THRESHOLD) {
    addNotification(
      'cron_alert',
      'Dashboard Erişim Uyarısı',
      `${HEALTH_FAIL_THRESHOLD} ardışık health check başarısız: ${reason}`
    )
    sendTelegramNotification('HEALTH', 'Dashboard Health Alert', new Date().toISOString())
    healthConsecutiveFails = 0 // reset to avoid spam
  }
}

// Start health checks after server is up
setTimeout(() => {
  setInterval(runHealthCheck, 5 * 60 * 1000)
}, 10000) // 10s after boot before first check

// --- Serve static file ---
function serveFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback: serve index.html
      fs.readFile(path.join(DIST, 'index.html'), (err2, html) => {
        res.writeHead(err2 ? 404 : 200, { 'Content-Type': 'text/html' })
        res.end(err2 ? 'Not Found' : html)
      })
      return
    }
    const ext = path.extname(filePath)
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    res.end(data)
  })
}

// --- Server ---
const server = http.createServer((req, res) => {
  // No-cache for HTML files
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  const url = req.url.split('?')[0]
  const tasksFile = path.join(__dirname, '..', 'TASKS.json')

  // API: recent activity (görev değişiklikleri, git commits, cron logları)
  if (url === '/api/activity') {
    const activities = []

    // 1. TASKS.json'dan aktif görevler + son güncelleme
    try {
      const raw = fs.readFileSync(tasksFile, 'utf8')
      const db = JSON.parse(raw)
      const updatedAt = db.updated_at || new Date().toISOString()

      // Aktif görevler
      const inProgress = db.tasks.filter(t => t.status === 'in_progress')
      for (const t of inProgress) {
        activities.push({
          type: 'info', agent: t.assignee || 'Alfred',
          action: `${t.id} "${t.title}" üzerinde çalışılıyor`,
          when: updatedAt,
        })
      }

      // Bekleyen görev sayısı
      const pendingCount = db.tasks.filter(t => t.status === 'pending').length
      if (pendingCount > 0) {
        activities.push({
          type: 'warning', agent: 'Kuyruk',
          action: `${pendingCount} görev sırada bekliyor`,
          when: updatedAt,
        })
      }

      // Son tamamlanan görevler (max 3)
      const doneRecent = db.tasks.filter(t => t.status === 'done').slice(-3)
      for (const t of doneRecent) {
        activities.push({
          type: 'success', agent: t.assignee || 'Alfred',
          action: `${t.id} "${t.title}" tamamlandı`,
          when: updatedAt,
        })
      }
    } catch {}

    // 2. Son git commits (max 5)
    try {
      const gitLog = execSync(
        'git log --format="COMMIT_SEP%n%s%n%ci" -5',
        { encoding: 'utf8', cwd: path.join(__dirname, '..') }
      ).trim()
      const commits = gitLog.split('COMMIT_SEP').filter(Boolean)
      for (const block of commits) {
        const lines = block.trim().split('\n')
        if (lines.length >= 2) {
          activities.push({
            type: 'info', agent: 'Git',
            action: lines[0],
            when: lines[1],
          })
        }
      }
    } catch {}

    // 3. Cron logları (son task-worker logları)
    try {
      const logDir = path.join(os.homedir(), 'openclaw', 'logs')
      const files = fs.readdirSync(logDir)
        .filter(f => f.startsWith('task-worker-'))
        .sort()
        .slice(-3)
      for (const f of files) {
        const content = fs.readFileSync(path.join(logDir, f), 'utf8')
        const match = content.match(/Working on: (T-\d+) — (.+)/)
        if (match) {
          const dateMatch = f.match(/(\d{8})-(\d{4})/)
          const when = dateMatch
            ? `${dateMatch[1].slice(0,4)}-${dateMatch[1].slice(4,6)}-${dateMatch[1].slice(6,8)}T${dateMatch[2].slice(0,2)}:${dateMatch[2].slice(2,4)}:00`
            : new Date().toISOString()
          activities.push({
            type: 'warning', agent: 'Task Worker',
            action: `${match[1]} "${match[2]}" işlendi`,
            when,
          })
        }
      }
    } catch {}

    // Zamana göre sırala, en yeni önce
    activities.sort((a, b) => new Date(b.when) - new Date(a.when))

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ activities: activities.slice(0, 15) }))
    return
  }

  // API: logs list
  if (url === '/api/logs') {
    const logs = []
    try {
      const logDir = path.join(os.homedir(), 'openclaw', 'logs')
      const files = fs.readdirSync(logDir).sort().reverse().slice(0, 20)
      for (const f of files) {
        try {
          const stat = fs.statSync(path.join(logDir, f))
          logs.push({ name: f, size: stat.size, mtime: stat.mtime.toISOString() })
        } catch {}
      }
    } catch {}
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ logs }))
    return
  }

  // API: SSE live log stream (/api/logs/stream?file=filename.log)
  if (url.startsWith('/api/logs/stream')) {
    const qs = new URLSearchParams(req.url.split('?')[1] || '')
    const fileName = (qs.get('file') || '').replace(/[^a-zA-Z0-9._-]/g, '')
    const logDir = path.join(os.homedir(), 'openclaw', 'logs')
    const filePath = path.join(logDir, fileName)

    if (!fileName || !fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Dosya bulunamadı' }))
      return
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })

    const sendEvent = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    // Send existing content in chunks
    const existing = fs.readFileSync(filePath, 'utf8')
    sendEvent({ type: 'init', content: existing })

    // Watch for new content
    let lastSize = fs.statSync(filePath).size
    const watcher = fs.watch(filePath, () => {
      try {
        const stat = fs.statSync(filePath)
        if (stat.size > lastSize) {
          const fd = fs.openSync(filePath, 'r')
          const buf = Buffer.alloc(stat.size - lastSize)
          fs.readSync(fd, buf, 0, buf.length, lastSize)
          fs.closeSync(fd)
          lastSize = stat.size
          sendEvent({ type: 'append', content: buf.toString('utf8') })
        }
      } catch {}
    })

    // Heartbeat every 15s to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n')
    }, 15000)

    req.on('close', () => {
      clearInterval(heartbeat)
      watcher.close()
    })
    return
  }

  // API: memory files
  if (url === '/api/memory') {
    const files = []
    try {
      const memDir = path.join(__dirname, '..', 'memory')
      const entries = fs.readdirSync(memDir).filter(f => f.endsWith('.md')).sort()
      for (const f of entries) {
        try {
          const raw = fs.readFileSync(path.join(memDir, f), 'utf8')
          const frontmatter = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
          if (frontmatter) {
            const meta = {}
            for (const line of frontmatter[1].split('\n')) {
              const [k, ...v] = line.split(':')
              if (k && v.length) meta[k.trim()] = v.join(':').trim()
            }
            files.push({
              name: meta.name || f,
              type: meta.type || '',
              description: meta.description || '',
              content: frontmatter[2].trim().slice(0, 500),
            })
          } else {
            files.push({ name: f, type: '', description: '', content: raw.slice(0, 500) })
          }
        } catch {}
      }
    } catch {}
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ files }))
    return
  }

  // --- FreeRide Skill ---
  if (url === '/api/skills/freeride/status' && req.method === 'GET') {
    const ocConf = path.join(os.homedir(), '.openclaw', 'openclaw.json')
    const cacheFile = path.join(os.homedir(), '.openclaw', '.freeride-cache.json')
    let currentModel = null, fallbacks = [], cacheInfo = null
    try {
      const cfg = JSON.parse(fs.readFileSync(ocConf, 'utf8'))
      currentModel = cfg?.agents?.defaults?.model?.primary || null
      fallbacks = cfg?.agents?.defaults?.model?.fallbacks || []
    } catch {}
    try {
      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
      const cachedAt = new Date(cache.cached_at)
      const ageMs = Date.now() - cachedAt.getTime()
      const ageMin = Math.round(ageMs / 60000)
      cacheInfo = { count: (cache.models || []).length, cachedAt: cache.cached_at, ageMin }
    } catch {}
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ currentModel, fallbacks, cacheInfo, run: frState }))
    return
  }

  if (url === '/api/skills/freeride/run' && req.method === 'POST') {
    if (frState.running) {
      res.writeHead(409, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Zaten çalışıyor' }))
      return
    }
    let body = ''
    req.on('data', c => { body += c })
    req.on('end', () => {
      let cmd = 'status'
      try { cmd = JSON.parse(body).command || 'status' } catch {}
      const allowed = ['status', 'list', 'auto', 'refresh', 'fallbacks']
      if (!allowed.includes(cmd)) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Geçersiz komut' }))
        return
      }
      frState.running = true
      frState.output = ''
      frState.exitCode = null
      frState.command = cmd
      frState.lastRun = new Date().toISOString()
      const child = spawn('freeride', [cmd], {
        env: { ...process.env, PATH: `/home/sefa/.local/bin:${process.env.PATH}` }
      })
      child.stdout.on('data', d => { frState.output += d.toString() })
      child.stderr.on('data', d => { frState.output += d.toString() })
      child.on('close', code => {
        frState.running = false
        frState.exitCode = code
      })
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, command: cmd }))
    })
    return
  }

  if (url === '/api/skills/freeride/output' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(frState))
    return
  }

  // API: actions (tools page)
  if (url === '/api/actions/build' && req.method === 'POST') {
    try {
      execSync('npm run build', { cwd: __dirname, encoding: 'utf8', timeout: 30000 })
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, action: 'build' }))
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: e.message }))
    }
    return
  }

  if (url === '/api/actions/cache' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Clear-Site-Data': '"cache"' })
    res.end(JSON.stringify({ ok: true, action: 'cache' }))
    return
  }

  // API: notifications (GET /api/notifications)
  if (url === '/api/notifications' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ notifications }))
    return
  }

  // API: stats history (last 24h samples) - must come before /api/stats
  if (url === '/api/stats/history') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(statsHistory))
    return
  }

  // API: system stats
  if (url === '/api/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(getStats()))
    return
  }

  // API: token usage
  if (url === '/api/tokens') {
    const tokenAuditFile = path.join(__dirname, '..', 'TOKEN_AUDIT.json')
    fs.readFile(tokenAuditFile, 'utf8', (err, data) => {
      if (err) {
        // Return default (no audit data yet)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          estimated_tokens: 0,
          tasks_by_model: { haiku: 0, sonnet: 0, opus: 0 },
          budget_per_week: 35000,
          usage_percent: 0,
          week_of: new Date().toISOString().split('T')[0],
        }))
        return
      }
      try {
        const auditData = JSON.parse(data)
        // Return latest week's data
        const latestWeek = auditData.weeks && auditData.weeks.length > 0
          ? auditData.weeks[auditData.weeks.length - 1]
          : { tasks_by_model: { haiku: 0, sonnet: 0, opus: 0 }, estimated_tokens: 0, usage_percent: 0 }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          estimated_tokens: latestWeek.estimated_tokens || 0,
          tasks_by_model: latestWeek.tasks_by_model || { haiku: 0, sonnet: 0, opus: 0 },
          budget_per_week: auditData.budget_per_week || 35000,
          usage_percent: latestWeek.usage_percent || 0,
          week_of: latestWeek.week_of || new Date().toISOString().split('T')[0],
        }))
      } catch {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Token veri işleme hatası' }))
      }
    })
    return
  }

  // API: tasks
  if (url === '/api/tasks' && req.method === 'GET') {
    fs.readFile(tasksFile, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'TASKS.json okunamadı' }))
        return
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(data)
    })
    return
  }

  // API: update task status (PATCH /api/tasks/T-001)
  const taskMatch = url.match(/^\/api\/tasks\/(T-\d+)$/)
  if (taskMatch && req.method === 'PATCH') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const updates = JSON.parse(body)
        fs.readFile(tasksFile, 'utf8', (err, raw) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'TASKS.json okunamadı' }))
            return
          }
          const db = JSON.parse(raw)
          const task = db.tasks.find(t => t.id === taskMatch[1])
          if (!task) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Görev bulunamadı' }))
            return
          }
          let statusChanged = false
          if (updates.status && updates.status !== task.status) {
            task.status_history = task.status_history || []
            const completionTime = new Date().toISOString()
            task.status_history.push({ from: task.status, to: updates.status, at: completionTime })
            task.status = updates.status
            statusChanged = true

            // Görev 'done' statüsüne geçtiğinde Telegram bildirimi gönder
            if (updates.status === 'done') {
              sendTelegramNotification(task.id, task.title, completionTime)
              addNotification('task_complete', `${task.id} Tamamlandı`, task.title, task.id)
            }
          }
          if (updates.priority) task.priority = updates.priority
          if (updates.title) task.title = updates.title
          db.updated_at = new Date().toISOString()
          fs.writeFile(tasksFile, JSON.stringify(db, null, 2) + '\n', (err2) => {
            if (err2) {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Yazma hatası' }))
              return
            }
            // Git commit (T-031 integration) - only if status changed
            if (statusChanged) {
              commitTasksFile(task.id, task.title, task.status)
            }
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(task))
          })
        })
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Geçersiz JSON' }))
      }
    })
    return
  }

  if (url === '/api/tasks' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const newTask = JSON.parse(body)
        fs.readFile(tasksFile, 'utf8', (err, raw) => {
          const db = err ? { project: 'Ataraxia Command Center', tasks: [] } : JSON.parse(raw)
          const nextId = 'T-' + String(db.tasks.length + 1).padStart(3, '0')
          const task = {
            id: nextId,
            title: newTask.title || 'Başlıksız görev',
            description: newTask.description || '',
            status: newTask.status || 'pending',
            priority: newTask.priority || 'medium',
            assignee: newTask.assignee || 'Alfred',
            tags: newTask.tags || [],
            due: newTask.due || '',
            created_at: new Date().toISOString(),
          }
          db.tasks.push(task)
          db.updated_at = new Date().toISOString()
          addNotification('task_created', `${task.id} Oluşturuldu`, task.title, task.id)
          fs.writeFile(tasksFile, JSON.stringify(db, null, 2) + '\n', (err2) => {
            if (err2) {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Yazma hatası' }))
              return
            }
            // Git commit (T-031 integration)
            commitTasksFile(task.id, task.title, task.status)
            res.writeHead(201, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(task))
          })
        })
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Geçersiz JSON' }))
      }
    })
    return
  }

  // API: add note to task (POST /api/tasks/T-001/notes)
  const notesMatch = url.match(/^\/api\/tasks\/(T-\d+)\/notes$/)
  if (notesMatch && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const { text } = JSON.parse(body)
        if (!text || !text.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Not metni boş olamaz' }))
          return
        }
        fs.readFile(tasksFile, 'utf8', (err, raw) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'TASKS.json okunamadı' }))
            return
          }
          const db = JSON.parse(raw)
          const task = db.tasks.find(t => t.id === notesMatch[1])
          if (!task) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Görev bulunamadı' }))
            return
          }
          task.notes = task.notes || []
          const note = { id: Date.now(), text: text.trim(), at: new Date().toISOString() }
          task.notes.push(note)
          db.updated_at = new Date().toISOString()
          fs.writeFile(tasksFile, JSON.stringify(db, null, 2) + '\n', (err2) => {
            if (err2) {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Yazma hatası' }))
              return
            }
            res.writeHead(201, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(note))
          })
        })
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Geçersiz JSON' }))
      }
    })
    return
  }

  // API: Home Assistant devices list (GET /api/ha/devices)
  if (url === '/api/ha/devices' && req.method === 'GET') {
    getHADevices().then(result => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result))
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message, devices: [], connected: false }))
    })
    return
  }

  // API: Home Assistant device toggle (POST /api/ha/devices/{entity_id}/toggle)
  const haToggleMatch = url.match(/^\/api\/ha\/devices\/(.+)\/toggle$/)
  if (haToggleMatch && req.method === 'POST') {
    const entity_id = decodeURIComponent(haToggleMatch[1])
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const action = JSON.parse(body).action
        if (!action) throw new Error('No action specified')

        const domain = entity_id.split('.')[0]
        const service = domain === 'light' ? 'light' : 'switch'
        const service_data = { entity_id }

        haApiCall('POST', `/api/services/${service}/${action}`, service_data).then(result => {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true, action, entity_id }))
        }).catch(err => {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: err.message }))
        })
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid request body' }))
      }
    })
    return
  }

  // API: process lifecycle info (GET /api/process)
  if (url === '/api/process' && req.method === 'GET') {
    const uptimeMs = Date.now() - SERVER_START
    const memUsage = process.memoryUsage()
    let systemdStatus = null
    try {
      systemdStatus = execSync('systemctl is-active ataraxia-dashboard.service 2>/dev/null', { timeout: 2000 }).toString().trim()
    } catch { systemdStatus = 'inactive' }
    let cgroupInfo = null
    try {
      const cgroupPath = fs.readFileSync('/proc/self/cgroup', 'utf8').trim().split('\n')[0]
      cgroupInfo = cgroupPath.replace(/^.*::/, '').trim() || null
    } catch {}
    let memLimit = null
    try {
      const limitFile = '/sys/fs/cgroup/memory.max'
      const raw = fs.readFileSync(limitFile, 'utf8').trim()
      memLimit = raw === 'max' ? null : parseInt(raw, 10)
    } catch {}
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      pid: process.pid,
      ppid: process.ppid,
      uptime: { ms: uptimeMs, sec: Math.floor(uptimeMs / 1000) },
      memory: {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        limitBytes: memLimit,
      },
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      systemd: { status: systemdStatus },
      cgroup: cgroupInfo,
      env: process.env.NODE_ENV || 'development',
    }))
    return
  }

  // API: health (detailed)
  if (url === '/api/health' || url === '/health') {
    const uptimeMs = Date.now() - SERVER_START
    const uptimeSec = Math.floor(uptimeMs / 1000)
    const uptimeHours = Math.floor(uptimeSec / 3600)
    const uptimeMins = Math.floor((uptimeSec % 3600) / 60)
    const uptimeSecs = uptimeSec % 60
    const stats = getStats()
    const payload = {
      ok: true,
      status: 'healthy',
      server: {
        uptimeMs,
        uptimeHuman: `${uptimeHours}sa ${uptimeMins}dk ${uptimeSecs}sn`,
        startedAt: new Date(SERVER_START).toISOString(),
      },
      system: {
        cpuPercent: stats.cpuPercent,
        memPercent: stats.memPercent,
        diskPercent: stats.diskPercent,
        osUptimeHuman: stats.uptimeHuman,
      },
      checks: {
        tasksFile: fs.existsSync(path.join(__dirname, '..', 'TASKS.json')),
        distDir: fs.existsSync(path.join(__dirname, 'dist')),
      },
      timestamp: new Date().toISOString(),
    }
    payload.status = (payload.checks.tasksFile && payload.checks.distDir) ? 'healthy' : 'degraded'
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(payload))
    return
  }

  // Static files
  const filePath = path.join(DIST, url === '/' ? 'index.html' : url)
  serveFile(filePath, res)
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Ataraxia Dashboard: http://0.0.0.0:${PORT}`)
  console.log(`Stats API: http://0.0.0.0:${PORT}/api/stats`)
})

// --- Graceful shutdown ---
let shutdownInProgress = false

function gracefulShutdown(signal) {
  if (shutdownInProgress) return
  shutdownInProgress = true
  console.log(`[shutdown] ${signal} alındı — graceful shutdown başlıyor...`)
  const timeout = setTimeout(() => {
    console.error('[shutdown] Timeout — zorla çıkılıyor')
    process.exit(1)
  }, 10000)
  server.close((err) => {
    clearTimeout(timeout)
    if (err) {
      console.error('[shutdown] Server kapanırken hata:', err.message)
      process.exit(1)
    }
    console.log('[shutdown] Server kapatıldı')
    process.exit(0)
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT',  () => gracefulShutdown('SIGINT'))
process.on('uncaughtException', (err) => {
  console.error('[crash] Yakalanmamış istisna:', err)
  gracefulShutdown('uncaughtException')
})
process.on('unhandledRejection', (reason) => {
  console.error('[crash] İşlenmeyen promise reddi:', reason)
})
