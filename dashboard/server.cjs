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
const logger = require('./lib/logger.cjs')

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

// --- Load centralized configuration ---
const config = require('./config.cjs')

// --- Initialize logs directory ---
const logsDir = path.join(__dirname, 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Log initialization
logger.info('Server starting', {
  nodeEnv: config.nodeEnv,
  port: config.PORT
})

// --- Startup validation ---
function validateStartup() {
  const issues = []
  const warnings = []
  const info = []

  // Check required directories
  if (!fs.existsSync(config.DIST_PATH)) {
    issues.push('dist/ directory not found')
  } else {
    info.push('dist/ directory ready')
  }

  // Check TASKS.json
  if (!fs.existsSync(config.TASKS_JSON_PATH)) {
    issues.push('TASKS.json not found')
  } else {
    info.push('TASKS.json ready')
  }

  // Check HA connection if configured
  if (config.HA_URL) {
    info.push(`Home Assistant configured: ${config.HA_URL}`)
  } else {
    warnings.push('HA_URL not configured (optional)')
  }

  // Check Telegram if configured
  if (config.TELEGRAM_CHAT_ID) {
    info.push('Telegram notifications enabled')
  } else {
    warnings.push('Telegram notifications not configured (optional)')
  }

  // Environment mode
  info.push(`Environment: ${config.nodeEnv}`)
  info.push(`Server port: ${config.PORT}`)

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

const PORT = config.PORT
const DIST = config.DIST_PATH

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
  stats: new CircuitBreaker('stats-api', config.CIRCUIT_BREAKER_FAILURE_THRESHOLD, config.CIRCUIT_BREAKER_RESET_TIMEOUT),
  ha: new CircuitBreaker('ha-api', config.CIRCUIT_BREAKER_FAILURE_THRESHOLD, config.CIRCUIT_BREAKER_RESET_TIMEOUT),
}

// --- Rate Limiter (10 req/min per IP) ---
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = new Map()
  }

  isAllowed(ip) {
    const now = Date.now()
    if (!this.requests.has(ip)) {
      this.requests.set(ip, [])
    }

    const ips = this.requests.get(ip)
    const recentRequests = ips.filter(time => now - time < this.windowMs)

    if (recentRequests.length >= this.maxRequests) {
      return false
    }

    recentRequests.push(now)
    this.requests.set(ip, recentRequests)
    return true
  }

  getStatus(ip) {
    const now = Date.now()
    const ips = this.requests.get(ip) || []
    const recentRequests = ips.filter(time => now - time < this.windowMs)
    return {
      remaining: Math.max(0, this.maxRequests - recentRequests.length),
      resetTime: recentRequests.length > 0 ? Math.max(...recentRequests) + this.windowMs : now
    }
  }
}

const rateLimiter = new RateLimiter(config.RATE_LIMIT_REQUESTS, config.RATE_LIMIT_WINDOW)

// --- Request Logger ---
const requestLogs = []

function logRequest(ip, method, url, statusCode, responseTime) {
  const log = {
    timestamp: new Date().toISOString(),
    ip,
    method,
    url,
    statusCode,
    responseTime: `${responseTime.toFixed(2)}ms`
  }
  requestLogs.push(log)
  if (requestLogs.length > config.MAX_REQUEST_LOGS) {
    requestLogs.shift()
  }

  // Log to Winston with appropriate level
  const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
  logger.log(logLevel, 'HTTP Request', {
    method,
    path: url,
    status: statusCode,
    duration: `${responseTime.toFixed(2)}ms`,
    ip
  })
}

function getRequestLogs(limit = 100) {
  return requestLogs.slice(-limit)
}

// --- Slow Query Detection ---
const slowQueries = []

function logSlowQuery(url, method, responseTime) {
  if (responseTime > config.SLOW_QUERY_THRESHOLD) {
    slowQueries.push({
      timestamp: new Date().toISOString(),
      url,
      method,
      responseTime: `${responseTime.toFixed(2)}ms`
    })
    if (slowQueries.length > config.MAX_SLOW_QUERIES) {
      slowQueries.shift()
    }

    // Log slow query to Winston
    logger.warn('Slow Query Detected', {
      path: url,
      method,
      duration: `${responseTime.toFixed(2)}ms`,
      threshold: `${config.SLOW_QUERY_THRESHOLD}ms`
    })
  }
}

function getSlowQueries(limit = 50) {
  return slowQueries.slice(-limit)
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

function buildAlerts(stats = getStats()) {
  const alerts = []

  const metricRules = [
    { key: 'cpuPercent', label: 'CPU', warn: 80, critical: 90 },
    { key: 'memPercent', label: 'RAM', warn: 80, critical: 90 },
    { key: 'diskPercent', label: 'Disk', warn: 85, critical: 95 },
    { key: 'swapPercent', label: 'Swap', warn: 25, critical: 50 },
  ]

  for (const rule of metricRules) {
    const value = stats?.[rule.key]
    if (typeof value !== 'number') continue

    let severity = null
    if (value >= rule.critical) severity = 'critical'
    else if (value >= rule.warn) severity = 'warning'
    if (!severity) continue

    alerts.push({
      id: `${rule.key}-${severity}`,
      source: 'system',
      severity,
      metric: rule.key,
      title: `${rule.label} yüksek kullanım`,
      message: `${rule.label} kullanımı %${value}`,
      value,
      threshold: severity === 'critical' ? rule.critical : rule.warn,
      timestamp: stats.timestamp || new Date().toISOString(),
    })
  }

  const unhealthyNotifications = notifications
    .filter((notification) => ['cron_alert', 'system_warning'].includes(notification.type))
    .slice(0, 3)
    .map((notification) => ({
      id: `notification-${notification.id}`,
      source: 'notification',
      severity: notification.type === 'cron_alert' ? 'critical' : 'warning',
      title: notification.title,
      message: notification.message,
      timestamp: notification.timestamp,
    }))

  alerts.push(...unhealthyNotifications)

  if (circuitBreakers.stats.isOpen()) {
    alerts.push({
      id: 'stats-circuit-open',
      source: 'system',
      severity: 'critical',
      title: 'Stats servisi devre dışı',
      message: 'Circuit breaker açık. Dashboard fallback verisi kullanıyor.',
      timestamp: new Date().toISOString(),
      circuit_breaker: circuitBreakers.stats.getStatus(),
    })
  }

  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// --- Stats history (last 24h, sampled every 5 min = max 288 entries) ---
const STATS_HISTORY_FILE = path.join(__dirname, 'logs', 'stats-history.json')

function loadStatsHistory() {
  try {
    const raw = fs.readFileSync(STATS_HISTORY_FILE, 'utf8')
    const arr = JSON.parse(raw)
    if (Array.isArray(arr)) return arr.slice(-config.HISTORY_MAX_RECORDS)
  } catch {}
  return []
}

function saveStatsHistory() {
  try {
    fs.writeFileSync(STATS_HISTORY_FILE, JSON.stringify(statsHistory), 'utf8')
  } catch {}
}

const statsHistory = loadStatsHistory()

// --- Health / uptime tracking ---
const SERVER_START = Date.now()
let healthConsecutiveFails = 0

// --- Notifications history (in-memory, max 50) ---
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
  if (notifications.length > config.NOTIFICATIONS_MAX) {
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
  if (statsHistory.length > config.HISTORY_MAX_RECORDS) statsHistory.shift()
  saveStatsHistory()
}

// Record immediately on startup, then per configured interval
recordStats()
setInterval(recordStats, config.STATS_HISTORY_INTERVAL)

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
  console.warn(`[health] Check failed (${healthConsecutiveFails}/${config.HEALTH_CHECK_FAIL_THRESHOLD}): ${reason}`)
  if (healthConsecutiveFails >= config.HEALTH_CHECK_FAIL_THRESHOLD) {
    addNotification(
      'cron_alert',
      'Dashboard Erişim Uyarısı',
      `${config.HEALTH_CHECK_FAIL_THRESHOLD} ardışık health check başarısız: ${reason}`
    )
    sendTelegramNotification('HEALTH', 'Dashboard Health Alert', new Date().toISOString())
    healthConsecutiveFails = 0 // reset to avoid spam
  }
}

// Start health checks after server is up
setTimeout(() => {
  setInterval(runHealthCheck, config.STATS_HISTORY_INTERVAL)
}, 10000) // 10s after boot before first check

// --- Serve static file ---
function injectToken(html) {
  const token = config.DASHBOARD_TOKEN || ''
  if (!token) return html
  const script = `<script>window.__DASHBOARD_TOKEN='${token}';</script>`
  return html.toString().replace('</head>', `${script}</head>`)
}

function serveFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback: serve index.html
      fs.readFile(path.join(DIST, 'index.html'), (err2, html) => {
        res.writeHead(err2 ? 404 : 200, { 'Content-Type': 'text/html' })
        res.end(err2 ? 'Not Found' : injectToken(html))
      })
      return
    }
    const ext = path.extname(filePath)
    if (ext === '.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(injectToken(data))
      return
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    res.end(data)
  })
}

// --- Request Handler ---
function handleRequest(req, res) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none'"
  )
  // CORS — sadece local erişim
  const origin = req.headers.origin || ''
  const allowed = ['http://localhost:4173', 'http://192.168.1.91:4173', 'http://127.0.0.1:4173']
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // No-cache for HTML files
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  const url = req.url.split('?')[0]

  // --- Bearer Token Authentication (sadece /api/* rotaları) ---
  const dashboardToken = config.DASHBOARD_TOKEN
  const isApiRoute = url.startsWith('/api/')
  const skipAuthPaths = [
    '/health', '/api/health',
    '/api/stats', '/api/stats/history',
    '/api/agents', '/api/services',
    '/api/activity', '/api/tasks',
    '/api/tokens', '/api/memory',
    '/api/automation',
    '/api/alerts', '/api/notifications',
  ]
  if (dashboardToken && isApiRoute && !skipAuthPaths.includes(url)) {
    // Bearer header veya ?token= query param
    const authHeader = req.headers.authorization || ''
    let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      const qs = req.url.split('?')[1] || ''
      token = new URLSearchParams(qs).get('token')
    }
    if (!token || token !== dashboardToken) {
      res.writeHead(401, {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="Ataraxia Dashboard"',
      })
      res.end(JSON.stringify({ error: 'Yetkisiz erişim', status: 401 }))
      return
    }
  }
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

    // 3. Cron logları (sistemd cron kayıtları)
    try {
      const cronLog = execSync(
        'journalctl -u ataraxia-dashboard --no-pager --since "24 hours ago" --grep "backup\\|cron\\|otomatik" -n 5 --output=short-iso 2>/dev/null',
        { encoding: 'utf8', timeout: 3000 }
      ).trim()
      for (const line of cronLog.split('\n').filter(Boolean)) {
        const m = line.match(/^(\S+)\s+\S+\s+\S+\[.*?\]:\s+(.+)$/)
        if (m) {
          activities.push({ type: 'info', agent: 'Cron', action: m[2].slice(0, 120), when: m[1] })
        }
      }
    } catch {}

    // 4. task-runner.log'dan DONE satırları
    try {
      const trLog = fs.readFileSync(path.join(os.homedir(), 'alfred-hub', 'logs', 'task-runner.log'), 'utf8')
      const lines = trLog.split('\n').filter(l => l.includes('] DONE:') || l.includes('] ERROR:'))
      for (const line of lines.slice(-8)) {
        const m = line.match(/^\[(.+?)\] (DONE|ERROR): (.+)$/)
        if (m) {
          activities.push({
            type: m[2] === 'DONE' ? 'success' : 'error',
            agent: 'TaskRunner',
            action: m[3].slice(0, 120),
            when: new Date(m[1]).toISOString(),
          })
        }
      }
    } catch {}

    // Zamana göre sırala, en yeni önce
    activities.sort((a, b) => new Date(b.when) - new Date(a.when))

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ activities: activities.slice(0, 12) }))
    return
  }

  // API: logs list
  if (url === '/api/logs') {
    const logs = []
    const logDirs = [
      path.join(os.homedir(), 'alfred-hub', 'logs'),
      path.join(os.homedir(), 'alfred-hub', 'command-center', 'dashboard', 'logs'),
    ]
    for (const logDir of logDirs) {
      try {
        const files = fs.readdirSync(logDir).filter(f => f.endsWith('.log') || f.endsWith('.pid')).sort().reverse()
        for (const f of files) {
          try {
            const stat = fs.statSync(path.join(logDir, f))
            logs.push({ name: f, size: stat.size, mtime: stat.mtime.toISOString(), dir: logDir })
          } catch {}
        }
      } catch {}
    }
    logs.sort((a, b) => new Date(b.mtime) - new Date(a.mtime))
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ logs }))
    return
  }

  // API: SSE live log stream (/api/logs/stream?file=filename.log)
  if (url.startsWith('/api/logs/stream')) {
    const qs = new URLSearchParams(req.url.split('?')[1] || '')
    const fileName = (qs.get('file') || '').replace(/[^a-zA-Z0-9._-]/g, '')
    const logDirs = [
      path.join(os.homedir(), 'alfred-hub', 'logs'),
      path.join(os.homedir(), 'alfred-hub', 'command-center', 'dashboard', 'logs'),
    ]
    const logDir = logDirs.find(d => fs.existsSync(path.join(d, fileName))) || logDirs[0]
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
      const memDir = path.join(os.homedir(), '.claude', 'projects', '-home-sefa', 'memory')
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
    // Alfred (Claude Code) oturum bilgisi — gerçek veri
    const memDir = path.join(os.homedir(), '.claude', 'projects', '-home-sefa', 'memory')
    let memoryFiles = []
    try {
      memoryFiles = fs.readdirSync(memDir).filter(f => f.endsWith('.md') && f !== 'MEMORY.md')
    } catch {}

    // Son log aktivitesi
    const logDir = path.join(os.homedir(), 'openclaw', 'logs')
    let lastActivity = null
    try {
      const logFile = path.join(logDir, 'telegram-bot.log')
      const stat = fs.statSync(logFile)
      lastActivity = stat.mtime.toISOString()
    } catch {}

    // Aktif görevler (TASKS.json'dan in_progress)
    let activeTasks = []
    try {
      const tasksRaw = fs.readFileSync(config.TASKS_JSON_PATH, 'utf8')
      const tasksData = JSON.parse(tasksRaw)
      activeTasks = (tasksData.tasks || []).filter(t => t.status === 'in_progress')
    } catch {}

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      alfred: {
        model: 'claude-sonnet-4-6',
        role: 'Orkestratör / İkinci Beyin',
        platform: 'Claude Code CLI',
        location: 'ataraxia (RPi 400)',
        owner: 'Master Sefa',
      },
      memory: {
        count: memoryFiles.length,
        files: memoryFiles,
        dir: memDir,
      },
      activeTasks,
      lastActivity,
      serverUptime: Math.floor((Date.now() - SERVER_START) / 1000),
    }))
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
    res.end(JSON.stringify({
      notifications,
      unread: notifications.filter((notification) => {
        const ageMs = Date.now() - new Date(notification.timestamp).getTime()
        return ageMs < 24 * 60 * 60 * 1000
      }).length,
      timestamp: new Date().toISOString(),
    }))
    return
  }

  // API: alerts (GET /api/alerts)
  if (url === '/api/alerts' && req.method === 'GET') {
    const alerts = buildAlerts()
    const summary = {
      total: alerts.length,
      critical: alerts.filter((alert) => alert.severity === 'critical').length,
      warning: alerts.filter((alert) => alert.severity === 'warning').length,
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ alerts, summary, timestamp: new Date().toISOString() }))
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

  // API: request logs
  if (url === '/api/request-logs') {
    const limit = parseInt(new URLSearchParams(req.url.split('?')[1] || '').get('limit') || '100', 10)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      logs: getRequestLogs(limit),
      total: requestLogs.length,
      timestamp: new Date().toISOString()
    }))
    return
  }

  // API: slow queries
  if (url === '/api/slow-queries') {
    const limit = parseInt(new URLSearchParams(req.url.split('?')[1] || '').get('limit') || '50', 10)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      slowQueries: getSlowQueries(limit),
      threshold: `${SLOW_QUERY_THRESHOLD}ms`,
      total: slowQueries.length,
      timestamp: new Date().toISOString()
    }))
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

                // in_progress'e alınınca task-runner'ı hemen tetikle
                if (updates.status === 'in_progress') {
                  const runner = spawn('bash', [
                    path.join(os.homedir(), 'alfred-hub', 'scripts', 'task-runner.sh')
                  ], { detached: true, stdio: 'ignore' })
                  runner.unref()
                  logger.info('Task runner tetiklendi', { taskId: task.id })
                }
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

              // Yeni görev in_progress olarak eklenirse hemen tetikle
              if (task.status === 'in_progress') {
                const runner = spawn('bash', [
                  path.join(os.homedir(), 'alfred-hub', 'scripts', 'task-runner.sh')
                ], { detached: true, stdio: 'ignore' })
                runner.unref()
                logger.info('Task runner tetiklendi (yeni görev)', { taskId: task.id })
              }

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

  // API: update task (PUT /api/tasks/T-001)
  const updateMatch = url.match(/^\/api\/tasks\/(T-\d+)$/)
  if (updateMatch && req.method === 'PUT') {
    const taskId = updateMatch[1]
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

        fs.readFile(tasksFile, 'utf8', (err, raw) => {
          try {
            if (err) {
              return sendError(res, 500, 'TASKS.json okunamadı', { code: err.code })
            }

            const db = JSON.parse(raw)
            const taskIdx = db.tasks.findIndex(t => t.id === taskId)
            if (taskIdx === -1) {
              return sendError(res, 404, `Görev ${taskId} bulunamadı`)
            }

            const task = db.tasks[taskIdx]
            const oldStatus = task.status

            // Validate and apply updates
            if (updates.status && ['pending', 'in_progress', 'done'].includes(updates.status)) {
              task.status = updates.status
            }
            if (updates.priority && ['low', 'medium', 'high'].includes(updates.priority)) {
              task.priority = updates.priority
            }
            if (updates.title && typeof updates.title === 'string' && updates.title.trim()) {
              task.title = updates.title.trim()
            }
            if (updates.description !== undefined) {
              task.description = (updates.description || '').toString().slice(0, 500)
            }
            if (updates.assignee !== undefined) {
              task.assignee = (updates.assignee || 'Alfred').toString().slice(0, 50)
            }
            if (updates.due !== undefined) {
              task.due = (updates.due || '').toString().slice(0, 20)
            }
            if (Array.isArray(updates.tags)) {
              task.tags = updates.tags.slice(0, 10)
            }
            if (updates.preferred_model !== undefined) {
              task.preferred_model = ['claude', 'gemini'].includes(updates.preferred_model)
                ? updates.preferred_model : 'claude'
            }
            if (updates.auto !== undefined) {
              task.auto = Boolean(updates.auto)
            }

            // Track status changes
            if (oldStatus !== task.status) {
              if (!task.status_history) task.status_history = []
              task.status_history.push({
                from: oldStatus,
                to: task.status,
                at: new Date().toISOString()
              })
            }

            db.updated_at = new Date().toISOString()

            fs.writeFile(tasksFile, JSON.stringify(db, null, 2) + '\n', (err2) => {
              if (err2) {
                return sendError(res, 500, 'Görev dosyasına yazılamadı', { code: err2.code })
              }

              // Commit to git
              if (oldStatus !== task.status) {
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

  // API: agents — Wayne Ağı (Alfred, Lucius, Netrunner, Robin)
  if (url === '/api/agents' && req.method === 'GET') {
    // Görev istatistiklerini TASKS.json'dan hesapla
    let tasksByAssignee = {}
    let lastActionByAssignee = {}
    let modelByAssignee = {}  // ajanın en son görevindeki preferred_model
    const today = new Date().toISOString().slice(0, 10)
    try {
      const db = JSON.parse(fs.readFileSync(tasksFile, 'utf8'))
      for (const t of db.tasks || []) {
        const assignee = t.assignee || 'Alfred'
        if (!tasksByAssignee[assignee]) tasksByAssignee[assignee] = { total: 0, done: 0, today: 0 }
        tasksByAssignee[assignee].total++
        if (t.status === 'done') {
          tasksByAssignee[assignee].done++
          if (t.completed_at && t.completed_at.startsWith(today)) tasksByAssignee[assignee].today++
        }
        if (t.status === 'in_progress') lastActionByAssignee[assignee] = `${t.id} — ${t.title}`
        // preferred_model: son güncellenen görevden al
        if (t.preferred_model) modelByAssignee[assignee] = t.preferred_model
      }
    } catch {}

    // Son git commit (Alfred'in son eylemi)
    let lastGitAction = '—'
    let lastGitTime = '—'
    try {
      const gitOut = execSync('git log --format="%s|%cr" -1', { encoding: 'utf8', cwd: path.join(__dirname, '..') }).trim()
      const [msg, when] = gitOut.split('|')
      lastGitAction = msg || '—'
      lastGitTime = when || '—'
    } catch {}

    // Dashboard uptime (Alfred'in vekil çalışma süresi)
    const uptimeSec = Math.floor((Date.now() - SERVER_START) / 1000)
    const uptimeH = Math.floor(uptimeSec / 3600)
    const uptimeM = Math.floor((uptimeSec % 3600) / 60)
    const alfredUptime = uptimeH > 0 ? `${uptimeH}sa ${uptimeM}dk` : `${uptimeM}dk`

    const WAYNE_AGI = [
      {
        id: 'alfred',
        name: 'Alfred',
        role: 'Orkestratör / İkinci Beyin',
        status: 'active',
        uptime: alfredUptime,
        description: 'Master Sefa\'nın stratejik koordinatörü. Tüm Wayne Ağı operasyonlarını yönetir.',
        tags: ['claude-code', 'orchestrator', 'primary'],
      },
      {
        id: 'lucius',
        name: 'Lucius',
        role: 'Teknoloji Entegrasyonu',
        status: 'idle',
        uptime: '—',
        description: 'Yeni araç/framework keşfi, kurulum ve entegrasyon görevleri.',
        tags: ['tech', 'integration'],
      },
      {
        id: 'netrunner',
        name: 'Netrunner',
        role: 'Güvenlik & Sistem Sağlığı',
        status: 'idle',
        uptime: '—',
        description: 'Sistem tarama, hardening, log analizi ve güvenlik denetimleri.',
        tags: ['security', 'sysadmin'],
      },
      {
        id: 'robin',
        name: 'Robin',
        role: 'Araştırma & Strateji',
        status: 'idle',
        uptime: '—',
        description: 'Araştırma, rapor yazımı, strateji belgesi ve içerik üretimi.',
        tags: ['research', 'report'],
      },
    ]

    const MODEL_LABELS = { claude: 'claude-sonnet-4-6', gemini: 'gemini-2.5-pro' }

    const agents = WAYNE_AGI.map(a => {
      const stats = tasksByAssignee[a.name] || { total: 0, done: 0, today: 0 }
      const rawModel = modelByAssignee[a.name] || 'claude'
      const model = MODEL_LABELS[rawModel] || rawModel
      const lastAction = a.id === 'alfred'
        ? (lastActionByAssignee['Alfred'] || lastGitAction)
        : (lastActionByAssignee[a.name] || 'Beklemede')
      const lastActionTime = a.id === 'alfred' ? lastGitTime : '—'
      return {
        ...a,
        model,
        tasksTotal: stats.total || 0,
        tasksDone: stats.done || 0,
        tasksToday: stats.today || 0,
        lastAction,
        lastActionTime,
      }
    })

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ agents, updatedAt: new Date().toISOString() }))
    return
  }

  // API: services — Docker containers + systemd (altyapı)
  if (url === '/api/services' && req.method === 'GET') {
    const services = []
    try {
      const raw = execSync(
        'docker ps --format "{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}" 2>/dev/null',
        { timeout: 4000 }
      ).toString().trim()
      if (raw) {
        for (const line of raw.split('\n')) {
          const [name, image, status, ports] = line.split('|')
          services.push({ id: `docker-${name}`, name, type: 'docker', image, status: status?.startsWith('Up') ? 'active' : 'error', uptime: status, ports: ports || null })
        }
      }
    } catch {}
    for (const unit of ['ataraxia-dashboard.service', 'pihole-FTL.service', 'unbound.service']) {
      let st = 'inactive'
      try { st = execSync(`systemctl is-active ${unit} 2>/dev/null`, { timeout: 2000 }).toString().trim() } catch {}
      services.push({ id: `systemd-${unit}`, name: unit, type: 'systemd', status: st === 'active' ? 'active' : 'idle', uptime: st })
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ services, updatedAt: new Date().toISOString() }))
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

  // API: automation center (GET /api/automation)
  if (url === '/api/automation' && req.method === 'GET') {
    try {
      // 1. Cron schedules from /etc/crontab
      const cronSchedules = []
      try {
        const crontabContent = fs.readFileSync('/etc/crontab', 'utf8')
        for (const line of crontabContent.split('\n')) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#')) continue
          const parts = trimmed.split(/\s+/)
          if (parts.length < 7) continue
          // crontab format: min hour dom month dow user command...
          const [min, hour, dom, month, dow, user, ...cmdParts] = parts
          // only show alfred-hub related crons
          const cmd = cmdParts.join(' ')
          if (!cmd.includes('alfred') && !cmd.includes('task-runner') && !cmd.includes('backup')) continue
          const schedule = `${min} ${hour} ${dom} ${month} ${dow}`
          cronSchedules.push({ schedule, user, command: cmd, raw: trimmed })
        }
      } catch {}

      // 2. Auto:true tasks from TASKS.json
      const autoTasks = []
      try {
        const tasksRaw = fs.readFileSync(path.join(__dirname, '..', 'TASKS.json'), 'utf8')
        const tasksData = JSON.parse(tasksRaw)
        const tasks = Array.isArray(tasksData) ? tasksData : (tasksData.tasks || [])
        for (const t of tasks) {
          if (t.auto === true) {
            autoTasks.push({
              id: t.id,
              title: t.title,
              status: t.status,
              assignee: t.assignee,
              points: t.points,
              priority: t.priority,
              updated_at: t.updated_at,
            })
          }
        }
      } catch {}

      // 3. Last 50 lines of task-runner.log
      const taskRunnerLogPath = path.join(os.homedir(), 'alfred-hub', 'logs', 'task-runner.log')
      let logLines = []
      try {
        const logContent = fs.readFileSync(taskRunnerLogPath, 'utf8')
        logLines = logContent.split('\n').filter(Boolean).slice(-50)
      } catch {}

      // 4. Next run times: task-runner runs at 09:00 and 21:00 daily
      const now = new Date()
      const nextRuns = []
      for (const hour of [9, 21]) {
        const next = new Date(now)
        next.setHours(hour, 0, 0, 0)
        if (next <= now) next.setDate(next.getDate() + 1)
        nextRuns.push({ label: `Task Runner ${hour === 9 ? '(sabah)' : '(gece'}`, time: next.toISOString(), hour })
      }
      nextRuns.sort((a, b) => new Date(a.time) - new Date(b.time))

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        cronSchedules,
        autoTasks,
        logLines,
        nextRuns,
        generatedAt: new Date().toISOString(),
      }))
    } catch (err) {
      sendError(res, 500, 'Otomasyon verisi alınamadı', { details: err.message })
    }
    return
  }

  // Static files (optimized serving)
  const filePath = path.join(DIST, url === '/' ? 'index.html' : url)
  serveFile(filePath, res)
}

// --- Server with Error Handling, Rate Limiting, and Logging ---
const server = http.createServer((req, res) => {
  const startTime = Date.now()
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown'

  // Check rate limit
  if (!rateLimiter.isAllowed(ip)) {
    const status = rateLimiter.getStatus(ip)
    const responseTime = Date.now() - startTime
    logRequest(ip, req.method, req.url, 429, responseTime)
    res.writeHead(429, {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': new Date(status.resetTime).toISOString()
    })
    res.end(JSON.stringify({
      error: 'Çok fazla istek - 10 req/min sınırı aşıldı',
      status: 429,
      retryAfter: Math.ceil((status.resetTime - Date.now()) / 1000)
    }))
    return
  }

  try {
    // Wrap response.end to log timing and slow queries
    const originalEnd = res.end
    res.end = function(...args) {
      const responseTime = Date.now() - startTime
      logRequest(ip, req.method, req.url, res.statusCode || 200, responseTime)
      logSlowQuery(req.url, req.method, responseTime)
      originalEnd.apply(res, args)
    }

    handleRequest(req, res)
  } catch (err) {
    const responseTime = Date.now() - startTime
    logRequest(ip, req.method, req.url, 500, responseTime)
    sendError(res, 500, 'Sunucu hatası', { details: err.message })
  }
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
