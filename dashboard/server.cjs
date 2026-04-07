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

// --- Startup validation ---
function validateStartup() {
  const issues = []
  const warnings = []
  const info = []

  // Check required directories
  if (!fs.existsSync(DIST)) {
    issues.push('dist/ directory not found')
  } else {
    info.push('dist/ directory ready')
  }

  // Check TASKS.json
  const tasksPath = path.join(__dirname, '..', 'TASKS.json')
  if (!fs.existsSync(tasksPath)) {
    issues.push('TASKS.json not found')
  } else {
    info.push('TASKS.json ready')
  }

  // Check HA connection if configured
  if (process.env.HA_URL) {
    info.push(`Home Assistant configured: ${process.env.HA_URL}`)
  } else {
    warnings.push('HA_URL not configured (optional)')
  }

  // Check Telegram if configured
  if (process.env.TELEGRAM_CHAT_ID) {
    info.push('Telegram notifications enabled')
  } else {
    warnings.push('TELEGRAM_CHAT_ID not configured (optional)')
  }

  // Environment mode
  const nodeEnv = process.env.NODE_ENV || 'development'
  info.push(`Environment: ${nodeEnv}`)

  // Report startup status
  console.log('\n╔════════════════════════════════════════╗')
  console.log('║  Ataraxia Dashboard — Startup Check   ║')
  console.log('╚════════════════════════════════════════╝\n')

  if (info.length > 0) {
    console.log('✅ INFO:')
    info.forEach(i => console.log(`  • ${i}`))
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:')
    warnings.forEach(w => console.log(`  • ${w}`))
  }

  if (issues.length > 0) {
    console.log('\n❌ CRITICAL ISSUES:')
    issues.forEach(issue => console.log(`  • ${issue}`))
    return false
  }

  console.log('\n✅ Startup checks passed!\n')
  return true
}

const PORT = 4173
const DIST = path.join(__dirname, 'dist')

// --- Error Response Handler ---
function sendError(res, statusCode, errorMessage, details = {}) {
  const body = JSON.stringify({
    error: errorMessage,
    status: statusCode,
    timestamp: new Date().toISOString(),
    ...details
  })
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  })
  res.end(body)
}

function sendSuccess(res, data) {
  const body = JSON.stringify(data)
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  })
  res.end(body)
}

// --- Circuit Breaker Pattern ---
class CircuitBreaker {
  constructor(name, failureThreshold = 3, resetTimeout = 60000) {
    this.name = name
    this.failureThreshold = failureThreshold
    this.resetTimeout = resetTimeout
    this.state = 'CLOSED' // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0
    this.lastFailureTime = null
    this.nextAttemptTime = null
  }

  recordSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED'
      this.failureCount = 0
    }
  }

  recordFailure() {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN'
      this.nextAttemptTime = Date.now() + this.resetTimeout
    }
  }

  canAttempt() {
    if (this.state === 'CLOSED') return true
    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttemptTime) {
        this.state = 'HALF_OPEN'
        this.failureCount = 0
        return true
      }
      return false
    }
    return this.state === 'HALF_OPEN'
  }

  isOpen() {
    return this.state === 'OPEN'
  }

  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    }
  }
}

const circuitBreakers = {
  stats: new CircuitBreaker('stats-api', 3, 60000),
  ha: new CircuitBreaker('ha-api', 3, 60000),
}

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

  // API: system stats (with circuit breaker)
  if (url === '/api/stats') {
    try {
      const cb = circuitBreakers.stats

      if (!cb.canAttempt()) {
        // Circuit is OPEN - return fallback
        const fallback = {
          cpuPercent: null,
          memPercent: null,
          diskPercent: null,
          uptimeHuman: 'N/A',
          circuit_breaker: {
            state: 'OPEN',
            message: 'Stats service unavailable - circuit breaker activated',
            nextAttemptTime: new Date(cb.nextAttemptTime).toISOString(),
          }
        }
        return sendSuccess(res, fallback)
      }

      try {
        const stats = getStats()
        if (!stats) {
          throw new Error('Stats null')
        }
        cb.recordSuccess()
        sendSuccess(res, stats)
      } catch (statsErr) {
        cb.recordFailure()
        if (cb.isOpen()) {
          const fallback = {
            cpuPercent: null,
            memPercent: null,
            diskPercent: null,
            circuit_breaker: {
              state: 'OPEN',
              message: 'Stats service unavailable',
              nextAttemptTime: new Date(cb.nextAttemptTime).toISOString(),
            }
          }
          return sendSuccess(res, fallback)
        }
        throw statsErr
      }
    } catch (err) {
      sendError(res, 500, 'Sistem istatistikleri hatası', { details: err.message })
    }
    return
  }

  // API: token usage
  if (url === '/api/tokens') {
    const tokenAuditFile = path.join(__dirname, '..', 'TOKEN_AUDIT.json')
    fs.readFile(tokenAuditFile, 'utf8', (err, data) => {
      try {
        if (err && err.code !== 'ENOENT') {
          return sendError(res, 500, 'Token dosyası okunamadı', { code: err.code })
        }

        let auditData = null
        if (!err) {
          auditData = JSON.parse(data)
        }

        const defaultResponse = {
          estimated_tokens: 0,
          tasks_by_model: { haiku: 0, sonnet: 0, opus: 0 },
          budget_per_week: 35000,
          usage_percent: 0,
          week_of: new Date().toISOString().split('T')[0],
        }

        if (!auditData || !auditData.weeks || auditData.weeks.length === 0) {
          return sendSuccess(res, defaultResponse)
        }

        const latestWeek = auditData.weeks[auditData.weeks.length - 1]
        sendSuccess(res, {
          estimated_tokens: latestWeek.estimated_tokens || 0,
          tasks_by_model: latestWeek.tasks_by_model || { haiku: 0, sonnet: 0, opus: 0 },
          budget_per_week: auditData.budget_per_week || 35000,
          usage_percent: latestWeek.usage_percent || 0,
          week_of: latestWeek.week_of || new Date().toISOString().split('T')[0],
        })
      } catch (parseErr) {
        sendError(res, 500, 'Token veri işleme hatası', { details: parseErr.message })
      }
    })
    return
  }

  // API: tasks
  if (url === '/api/tasks' && req.method === 'GET') {
    fs.readFile(tasksFile, 'utf8', (err, data) => {
      try {
        if (err) {
          if (err.code === 'ENOENT') {
            return sendError(res, 404, 'TASKS.json bulunamadı')
          }
          return sendError(res, 500, 'TASKS.json okunamadı', { code: err.code })
        }

        // Validate JSON
        const tasks = JSON.parse(data)
        if (!tasks.tasks || !Array.isArray(tasks.tasks)) {
          return sendError(res, 500, 'Geçersiz TASKS.json formatı')
        }

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(data)
      } catch (parseErr) {
        sendError(res, 500, 'TASKS.json parse hatası', { details: parseErr.message })
      }
    })
    return
  }

  // API: update task status (PATCH /api/tasks/T-001)
  const taskMatch = url.match(/^\/api\/tasks\/(T-\d+)$/)
  if (taskMatch && req.method === 'PATCH') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('error', () => {
      sendError(res, 400, 'Request verileri alınamadı')
    })
    req.on('end', () => {
      try {
        if (!body) {
          return sendError(res, 400, 'Request body boş')
        }

        const updates = JSON.parse(body)
        const taskId = taskMatch[1]

        // Validate update fields
        if (updates.status && !['pending', 'in_progress', 'done'].includes(updates.status)) {
          return sendError(res, 400, `Geçersiz status: ${updates.status}`)
        }
        if (updates.priority && !['low', 'medium', 'high'].includes(updates.priority)) {
          return sendError(res, 400, `Geçersiz priority: ${updates.priority}`)
        }
        if (updates.title && (typeof updates.title !== 'string' || !updates.title.trim())) {
          return sendError(res, 400, 'Başlık geçersiz')
        }

        fs.readFile(tasksFile, 'utf8', (err, raw) => {
          try {
            if (err) {
              if (err.code === 'ENOENT') {
                return sendError(res, 404, 'TASKS.json bulunamadı')
              }
              return sendError(res, 500, 'TASKS.json okunamadı', { code: err.code })
            }

            const db = JSON.parse(raw)
            if (!Array.isArray(db.tasks)) {
              return sendError(res, 500, 'Geçersiz TASKS.json formatı')
            }

            const task = db.tasks.find(t => t.id === taskId)
            if (!task) {
              return sendError(res, 404, `Görev ${taskId} bulunamadı`)
            }

            let statusChanged = false
            if (updates.status && updates.status !== task.status) {
              task.status_history = task.status_history || []
              const completionTime = new Date().toISOString()
              task.status_history.push({ from: task.status, to: updates.status, at: completionTime })
              task.status = updates.status
              statusChanged = true

              if (updates.status === 'done') {
                task.completed_at = completionTime
                sendTelegramNotification(task.id, task.title, completionTime)
                addNotification('task_complete', `${task.id} Tamamlandı`, task.title, task.id)
              }
            }

            if (updates.priority) task.priority = updates.priority
            if (updates.title) task.title = updates.title.trim()

            db.updated_at = new Date().toISOString()

            fs.writeFile(tasksFile, JSON.stringify(db, null, 2) + '\n', (err2) => {
              if (err2) {
                return sendError(res, 500, 'Görev dosyasına yazılamadı', { code: err2.code })
              }

              if (statusChanged) {
                commitTasksFile(task.id, task.title, task.status)
              }

              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify(task))
            })
          } catch (parseErr) {
            sendError(res, 500, 'TASKS.json işleme hatası', { details: parseErr.message })
          }
        })
      } catch (jsonErr) {
        sendError(res, 400, 'Geçersiz JSON formatı', { details: jsonErr.message })
      }
    })
    return
  }

  if (url === '/api/tasks' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('error', () => {
      sendError(res, 400, 'Request verileri alınamadı')
    })
    req.on('end', () => {
      try {
        if (!body) {
          return sendError(res, 400, 'Request body boş')
        }

        const newTask = JSON.parse(body)
        if (!newTask.title || typeof newTask.title !== 'string' || !newTask.title.trim()) {
          return sendError(res, 400, 'Görev başlığı zorunludur ve string olmalıdır')
        }

        fs.readFile(tasksFile, 'utf8', (err, raw) => {
          try {
            let db
            if (err && err.code === 'ENOENT') {
              db = { project: 'Ataraxia Command Center', tasks: [] }
            } else if (err) {
              return sendError(res, 500, 'TASKS.json okunamadı', { code: err.code })
            } else {
              db = JSON.parse(raw)
            }

            if (!Array.isArray(db.tasks)) {
              return sendError(res, 500, 'Geçersiz TASKS.json formatı')
            }

            const nextId = 'T-' + String(db.tasks.length + 1).padStart(3, '0')
            const task = {
              id: nextId,
              title: newTask.title.trim(),
              description: (newTask.description || '').toString().slice(0, 500),
              status: ['pending', 'in_progress', 'done'].includes(newTask.status) ? newTask.status : 'pending',
              priority: ['low', 'medium', 'high'].includes(newTask.priority) ? newTask.priority : 'medium',
              assignee: (newTask.assignee || 'Alfred').toString().slice(0, 50),
              tags: Array.isArray(newTask.tags) ? newTask.tags.slice(0, 10) : [],
              due: (newTask.due || '').toString().slice(0, 20),
              created_at: new Date().toISOString(),
            }

            db.tasks.push(task)
            db.updated_at = new Date().toISOString()
            addNotification('task_created', `${task.id} Oluşturuldu`, task.title, task.id)

            fs.writeFile(tasksFile, JSON.stringify(db, null, 2) + '\n', (err2) => {
              if (err2) {
                return sendError(res, 500, 'Görev dosyasına yazılamadı', { code: err2.code })
              }

              commitTasksFile(task.id, task.title, task.status)
              res.writeHead(201, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify(task))
            })
          } catch (parseErr) {
            sendError(res, 500, 'TASKS.json işleme hatası', { details: parseErr.message })
          }
        })
      } catch (jsonErr) {
        sendError(res, 400, 'Geçersiz JSON formatı', { details: jsonErr.message })
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
    try {
      const uptimeMs = Date.now() - SERVER_START
      const uptimeSec = Math.floor(uptimeMs / 1000)
      const uptimeHours = Math.floor(uptimeSec / 3600)
      const uptimeMins = Math.floor((uptimeSec % 3600) / 60)
      const uptimeSecs = uptimeSec % 60

      let stats = null
      try {
        stats = getStats()
      } catch (statsErr) {
        console.error('Stats collection failed:', statsErr.message)
      }

      const tasksFileExists = fs.existsSync(path.join(__dirname, '..', 'TASKS.json'))
      const distDirExists = fs.existsSync(path.join(__dirname, 'dist'))

      const payload = {
        ok: true,
        status: 'healthy',
        server: {
          uptimeMs,
          uptimeHuman: `${uptimeHours}sa ${uptimeMins}dk ${uptimeSecs}sn`,
          startedAt: new Date(SERVER_START).toISOString(),
        },
        system: stats ? {
          cpuPercent: stats.cpuPercent || null,
          memPercent: stats.memPercent || null,
          diskPercent: stats.diskPercent || null,
          osUptimeHuman: stats.uptimeHuman || null,
        } : {
          cpuPercent: null,
          memPercent: null,
          diskPercent: null,
          osUptimeHuman: null,
        },
        checks: {
          tasksFile: tasksFileExists,
          distDir: distDirExists,
          statsCollection: stats !== null,
        },
        circuitBreakers: {
          stats: circuitBreakers.stats.getStatus(),
          ha: circuitBreakers.ha.getStatus(),
        },
        timestamp: new Date().toISOString(),
      }

      // Determine status based on checks
      if (!tasksFileExists || !distDirExists) {
        payload.status = 'degraded'
      } else if (!stats) {
        payload.status = 'degraded'
      } else if (stats.memPercent >= 90) {
        payload.status = 'warning'
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(payload))
    } catch (err) {
      sendError(res, 500, 'Health check hatası', { details: err.message })
    }
    return
  }

  // Static files are now served by Nginx reverse proxy
  // This API-only mode reduces Node.js memory footprint significantly
  sendError(res, 404, 'Statik dosyalar Nginx tarafından sunuluyor', {
    info: 'Bu sunucu sadece /api endpoint\'leri sağlar',
    accessDashboard: 'http://ataraxia.local'
  })
})

server.listen(PORT, '0.0.0.0', () => {
  // Run startup validation
  const validationOk = validateStartup()

  if (!validationOk) {
    console.error('Startup validation failed. Server may not operate correctly.')
    process.exit(1)
  }

  console.log(`🚀 Ataraxia Dashboard: http://0.0.0.0:${PORT}`)
  console.log(`📊 Stats API: http://0.0.0.0:${PORT}/api/stats`)
  console.log(`❤️  Health: http://0.0.0.0:${PORT}/api/health\n`)
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
