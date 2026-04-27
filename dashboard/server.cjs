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

// Load OpenClaw canonical env (best-effort, never override existing keys).
// This lets the dashboard call the local OpenClaw gateway without duplicating secrets.
function loadOpenclawEnv() {
  try {
    const openclawEnvFile = path.join(os.homedir(), '.openclaw', '.env')
    const lines = fs.readFileSync(openclawEnvFile, 'utf8').split('\n')
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
  } catch (err) {
    // ignore
  }
}

loadEnv()
loadOpenclawEnv()

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

function sendTelegramAssignNotification(taskId, agentId, taskTitle, assignTime) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.warn('TELEGRAM_BOT_TOKEN veya TELEGRAM_CHAT_ID ayarlanmamış')
    return
  }

  const message = `📋 *Görev Atandı*\n\n` +
    `🆔 ID: ${taskId}\n` +
    `👤 Ajan: ${agentId}\n` +
    `📝 Başlık: ${taskTitle}\n` +
    `⏰ Atama: ${new Date(assignTime).toLocaleString('tr-TR')}`

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
    '/api/sprint',
    '/api/daily-summary',
    '/api/alerts', '/api/notifications',
    '/api/orchestration/cost', '/api/orchestration/activity', '/api/orchestration/distribute',
    '/api/git/repos', '/api/ai-status',
    '/api/cron/count', '/api/system/crontab',
    '/api/feedback',
    '/api/approvals',
    '/api/capture',
    '/api/alfred/message',
    '/api/calendar',
  ]

  // Paths that start with these prefixes are also allowed without auth
  const skipAuthPrefixes = [
    '/api/tasks/', '/api/git/repos', '/api/ai-status', '/api/approvals/',
  ]
  const isDefiReadOnly = url.startsWith('/api/defi/') && (req.method === 'GET' || req.method === 'HEAD')
  const isSkipAuth = skipAuthPaths.includes(url) || skipAuthPrefixes.some(p => url.startsWith(p)) || isDefiReadOnly
  if (dashboardToken && isApiRoute && !isSkipAuth) {
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

  // API: active AI status — OpenClaw gateway health + active CLI agents
  if (url === '/api/ai-status') {
    try {
      // Check OpenClaw gateway
      let openclawStatus = 'down'
      try {
        const gwOut = execSync('curl -sf --max-time 2 http://localhost:18789/healthz 2>/dev/null || echo "fail"', { timeout: 3000 }).toString().trim()
        openclawStatus = gwOut.includes('fail') ? 'down' : 'up'
      } catch { openclawStatus = 'down' }

      // Check active CLI agents (interactive sessions)
      const activeAgents = []
      try {
        const claudeOut = execSync('pgrep -af "claude" 2>/dev/null', { timeout: 2000 }).toString().trim()
        if (claudeOut && !claudeOut.includes('server.cjs')) activeAgents.push('Claude Code')
      } catch {}
      try {
        const geminiOut = execSync('pgrep -af "gemini" 2>/dev/null', { timeout: 2000 }).toString().trim()
        if (geminiOut) activeAgents.push('Gemini CLI')
      } catch {}

      const active = openclawStatus === 'up'
        ? (activeAgents.length > 0 ? `OpenClaw + ${activeAgents.join(', ')}` : 'OpenClaw')
        : (activeAgents.length > 0 ? activeAgents.join(', ') : 'Yok')

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ active, openclawStatus, activeAgents }))
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ active: 'Bilinmiyor', error: err.message }))
    }
    return
  }

  // API: daily summary — morning-briefing log + market + sistem özeti
  if (url === '/api/daily-summary' && req.method === 'GET') {
    try {
      const logsDir = path.join(__dirname, '..', '..', 'logs')
      const result = { date: new Date().toISOString().slice(0, 10), generatedAt: new Date().toISOString() }
      const marketLiveEnabled = process.env.MARKET_LIVE === '1'

      // Market fiyatları — CoinGecko canlı, fallback: morning-briefing-market.json
      const fetchMarket = (cb) => {
        if (!marketLiveEnabled) return cb(new Error('disabled'))
        try {
          const https = require('https')
          const opts = {
            hostname: 'api.coingecko.com',
            path: '/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd',
            headers: { 'Accept': 'application/json', 'User-Agent': 'ataraxia-dashboard/1.0' },
            timeout: 4000
          }
          const mreq = https.get(opts, mres => {
            let body = ''
            mres.on('data', c => body += c)
            mres.on('end', () => {
              try {
                const d = JSON.parse(body)
                cb(null, {
                  BTC: String(d.bitcoin?.usd ?? ''),
                  ETH: String(d.ethereum?.usd ?? ''),
                  SOL: String(d.solana?.usd ?? ''),
                })
              } catch { cb(new Error('parse')) }
            })
          })
          mreq.on('error', cb)
          mreq.on('timeout', () => { mreq.destroy(); cb(new Error('timeout')) })
        } catch (e) { cb(e) }
      }

      // Morning briefing son çalışma zamanı
      try {
        const briefingLog = path.join(logsDir, 'morning-briefing.log')
        if (fs.existsSync(briefingLog)) {
          const lines = fs.readFileSync(briefingLog, 'utf8').trim().split('\n').filter(Boolean)
          const last = lines[lines.length - 1] || ''
          result.lastBriefing = last
        }
      } catch {}

      // TASKS.json özeti
      try {
        const tasksFile = path.join(__dirname, '..', 'TASKS.json')
        if (fs.existsSync(tasksFile)) {
          const db = JSON.parse(fs.readFileSync(tasksFile, 'utf8'))
          const tasks = db.tasks || []
          result.tasks = {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            inProgress: tasks.filter(t => t.status === 'in_progress').length,
            done: tasks.filter(t => t.status === 'done').length,
          }
        }
      } catch {}

      // Market + DeFi — callback zinciri (CJS: no top-level await)
      const fetchDefi = (cb) => {
        try {
          const req2 = http.get('http://127.0.0.1:4180/api/health', { timeout: 2000 }, res2 => {
            let body = ''
            res2.on('data', c => body += c)
            res2.on('end', () => {
              try { cb(null, JSON.parse(body)) } catch { cb(new Error('parse')) }
            })
          })
          req2.on('error', cb)
          req2.on('timeout', () => { req2.destroy(); cb(new Error('timeout')) })
        } catch (e) { cb(e) }
      }
      fetchMarket((merr, prices) => {
        if (!merr && prices && prices.BTC) {
          result.market = prices
          result.marketSource = 'live'
        } else {
          try {
            const marketFile = path.join(logsDir, 'morning-briefing-market.json')
            if (fs.existsSync(marketFile)) {
              result.market = JSON.parse(fs.readFileSync(marketFile, 'utf8'))
              result.marketSource = 'cached'
            }
          } catch {}
          if (!result.marketSource) result.marketSource = marketLiveEnabled ? 'error' : 'disabled'
        }
        fetchDefi((err, defiHealth) => {
          if (!err && defiHealth) {
            result.defi = { status: defiHealth.status, poolCount: defiHealth.poolCount, collectionMode: defiHealth.collectionMode }
          } else {
            result.defi = { status: 'unknown' }
          }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(result))
        })
      })
      return
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Daily summary hatası', detail: err.message }))
    }
    return
  }

  

  // API: calendar (gcalcli)
  // GET /api/calendar?days=2
  if (url.startsWith('/api/calendar') && req.method === 'GET') {
    try {
      const qs = (req.url.split('?')[1] || '')
      const params = new URLSearchParams(qs)
      const days = Math.min(7, Math.max(1, parseInt(params.get('days') || '2', 10) || 2))

      const cmd = `gcalcli agenda today +${days}d --nocolor --nodeclined --nostarted 2>/dev/null || true`
      const out = execSync(cmd, { timeout: 8000 }).toString()
      const rawLines = out.split('\n').map(l => l.replace(/\r$/, '')).filter(Boolean)

      // Best-effort parse: split by 2+ spaces.
      const items = []
      for (const ln of rawLines) {
        const clean = ln.trimEnd()
        if (!clean) continue
        if (/no events/i.test(clean)) continue
        const parts = clean.split(/\s{2,}/).filter(Boolean)
        if (parts.length < 2) continue
        const when = parts[0].slice(0, 24).trim()
        const title = parts[1].trim()
        const where = parts[2] ? parts[2].trim() : ''
        items.push({ when, title, where })
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, items }))
    } catch (err) {
      sendError(res, 500, 'Takvim okunamad? (gcalcli)', { details: err.message })
    }
    return
  }
// API: sprint status — `../sprints/sprint-XX.md` parse eder
  if (url === '/api/sprint' && req.method === 'GET') {
    try {
      const sprintsDir = path.join(__dirname, '..', 'sprints')
      const files = (fs.existsSync(sprintsDir) ? fs.readdirSync(sprintsDir) : [])
        .filter(name => /^sprint-\d+\.md$/.test(name))
      const pickLatest = () => {
        let best = null
        let bestNum = -1
        for (const name of files) {
          const m = name.match(/^sprint-(\d+)\.md$/)
          if (!m) continue
          const n = Number(m[1])
          if (Number.isFinite(n) && n > bestNum) {
            bestNum = n
            best = name
          }
        }
        return best
      }

      const sprintFile = pickLatest()
      if (!sprintFile) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Sprint dosyası bulunamadı' }))
        return
      }

      const content = fs.readFileSync(path.join(sprintsDir, sprintFile), 'utf8')
      const lines = content.split('\n')

      const titleLine = lines.find(l => l.startsWith('# ')) || ''
      const sprintName = titleLine.replace(/^#\s+/, '').trim() || sprintFile.replace(/\.md$/, '')

      let startDate = null
      let endDate = null
      const dateLine = lines.find(l => l.includes('**Tarih:**')) || ''
      const dateMatch = dateLine.match(/\*\*Tarih:\*\*\s*(\d{4}-\d{2}-\d{2}).*?(?:→|->)\s*(\d{4}-\d{2}-\d{2})/)
      if (dateMatch) {
        startDate = dateMatch[1]
        endDate = dateMatch[2]
      }

      const items = []
      let inBacklog = false
      for (const line of lines) {
        if (line.startsWith('## Sprint Backlog')) { inBacklog = true; continue }
        if (inBacklog && line.startsWith('## ')) break
        if (!inBacklog) continue
        if (!line.startsWith('|')) continue
        if (line.includes('| # | Görev |')) continue
        if (line.match(/^\|\s*-+\s*\|/)) continue

        const cols = line.split('|').map(x => x.trim()).filter(Boolean)
        if (cols.length < 4) continue
        const [id, task, points, status] = cols
        if (!/^S\d+-\d+/.test(id)) continue

        let state = 'pending'
        if (status.includes('✅') || /done/i.test(status)) state = 'done'
        else if (status.includes('⏸') || /ertelendi/i.test(status)) state = 'deferred'
        else if (status.includes('⏳') || /bekliyor/i.test(status)) state = 'pending'

        items.push({ id, task, points, status, state })
      }

      const total = items.length
      const done = items.filter(i => i.state === 'done').length
      const deferred = items.filter(i => i.state === 'deferred').length
      const pending = items.filter(i => i.state === 'pending').length

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        sprintFile,
        sprintName,
        startDate,
        endDate,
        total,
        done,
        deferred,
        pending,
        items,
        updatedAt: new Date().toISOString(),
      }))
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Sprint parse hatası', detail: err.message }))
    }
    return
  }

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

      // Son tamamlanan görevler (max 5, completed_at'e göre sıralı)
      const doneRecent = db.tasks
        .filter(t => t.status === 'done')
        .sort((a, b) => new Date(b.completed_at || b.updated_at || 0) - new Date(a.completed_at || a.updated_at || 0))
        .slice(0, 5)
      for (const t of doneRecent) {
        activities.push({
          type: 'task_done', agent: t.assignee || 'Alfred',
          action: `${t.id} "${t.title}" tamamlandı`,
          when: t.completed_at || updatedAt,
          task_id: t.id,
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

  // API: logs list — sadece aktif/anlamlı loglar
  if (url === '/api/logs') {
    const EXCLUDE = /^(application-|error-|task-runner|task-watchdog|task-check|alfred-runner|heartbeat|alfred-work)/
    const logs = []

    // OpenClaw aktivite logu — en üstte göster
    const ocRunsPath = path.join(os.homedir(), '.openclaw', 'cron', 'runs', 'alfred-task-runner.jsonl')
    if (fs.existsSync(ocRunsPath)) {
      const stat = fs.statSync(ocRunsPath)
      logs.push({ name: 'openclaw-activity.log', size: stat.size, mtime: stat.mtime.toISOString(), dir: '__openclaw__', virtual: true })
    }

    const logDirs = [
      path.join(os.homedir(), 'alfred-hub', 'command-center', 'logs'),
      path.join(os.homedir(), 'alfred-hub', 'logs'),
      path.join(os.homedir(), 'alfred-hub', 'command-center', 'dashboard', 'logs'),
    ]
    for (const logDir of logDirs) {
      try {
        const files = fs.readdirSync(logDir)
          .filter(f => f.endsWith('.log') && !EXCLUDE.test(f))
        for (const f of files) {
          try {
            const stat = fs.statSync(path.join(logDir, f))
            if (stat.size === 0) continue
            logs.push({ name: f, size: stat.size, mtime: stat.mtime.toISOString(), dir: logDir })
          } catch {}
        }
      } catch {}
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ logs }))
    return
  }

  // API: SSE live log stream (/api/logs/stream?file=filename.log)
  if (url.startsWith('/api/logs/stream')) {
    const qs = new URLSearchParams(req.url.split('?')[1] || '')
    const fileName = (qs.get('file') || '').replace(/[^a-zA-Z0-9._-]/g, '')

    // Sanal OpenClaw aktivite logu
    if (fileName === 'openclaw-activity.log') {
      const ocRunsPath = path.join(os.homedir(), '.openclaw', 'cron', 'runs', 'alfred-task-runner.jsonl')
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      })
      const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)

      const readRuns = () => {
        try {
          const lines = fs.readFileSync(ocRunsPath, 'utf8').split('\n').filter(Boolean)
          const MAX = 200
          const slice = lines.length > MAX ? lines.slice(-MAX) : lines
          return slice.map(l => {
            try {
              const r = JSON.parse(l)
              const ts = new Date(r.ts).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', hour12: false })
              const icon = r.status === 'ok' ? '✅' : r.status === 'error' ? '❌' : '⏳'
              const summary = (r.summary || r.action || r.status || '').replace(/\n/g, ' ').slice(0, 120)
              return `[${ts}] ${icon} ${summary}`
            } catch { return l }
          }).join('\n')
        } catch { return '' }
      }

      sendEvent({ type: 'init', content: readRuns() })

      let lastSize = fs.existsSync(ocRunsPath) ? fs.statSync(ocRunsPath).size : 0
      const watcher = fs.watch(ocRunsPath, () => {
        try {
          const stat = fs.statSync(ocRunsPath)
          if (stat.size > lastSize) {
            lastSize = stat.size
            const lines = fs.readFileSync(ocRunsPath, 'utf8').split('\n').filter(Boolean)
            const last = lines[lines.length - 1]
            try {
              const r = JSON.parse(last)
              const ts = new Date(r.ts).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', hour12: false })
              const icon = r.status === 'ok' ? '✅' : r.status === 'error' ? '❌' : '⏳'
              const summary = (r.summary || r.action || r.status || '').replace(/\n/g, ' ').slice(0, 120)
              sendEvent({ type: 'append', content: `[${ts}] ${icon} ${summary}` })
            } catch {}
          }
        } catch {}
      })

      const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15000)
      req.on('close', () => { clearInterval(heartbeat); watcher.close() })
      return
    }

    const logDirs = [
      path.join(os.homedir(), 'alfred-hub', 'command-center', 'logs'),
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

    // Send existing content — büyük dosyalarda son 500 satır
    const MAX_LINES = 500
    const raw = fs.readFileSync(filePath, 'utf8')
    const lines = raw.split('\n').filter(Boolean)
    const content = (lines.length > MAX_LINES ? lines.slice(-MAX_LINES) : lines).join('\n')
    sendEvent({ type: 'init', content })

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

    // Son log aktivitesi — OpenClaw jobs.json son çalışma zamanı
    let lastActivity = null
    try {
      const jobsFile = path.join(os.homedir(), '.openclaw', 'cron', 'jobs.json')
      const jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8'))
      const lastMs = Math.max(...(jobs.jobs || []).map(j => j.state?.lastRunAtMs || 0).filter(Boolean))
      if (lastMs > 0) lastActivity = new Date(lastMs).toISOString()
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
        model: 'minimax-m2.7 (OpenClaw)',
        role: 'Orkestratör / İkinci Beyin',
        platform: 'OpenClaw Gateway',
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

  // API: cron job count
  if (url === '/api/cron/count') {
    const { execSync } = require('child_process')
    try {
      const output = execSync('crontab -l 2>/dev/null | grep -v "^#" | grep -v "^$" | wc -l', { encoding: 'utf8' })
      const count = parseInt(output.trim() || '0', 10)
      sendJson(res, 200, { count })
    } catch {
      sendJson(res, 200, { count: 0 })
    }
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

  // API: feedback — ajan çıktısı kalite puanı (👍/👎)
  if (url === '/api/feedback') {
    const feedbackFile = path.join(__dirname, '..', 'FEEDBACK.json')
    if (req.method === 'GET') {
      fs.readFile(feedbackFile, 'utf8', (err, data) => {
        const fb = err ? { entries: [] } : (JSON.parse(data) || { entries: [] })
        const week = new Date(); week.setDate(week.getDate() - 7)
        const recent = (fb.entries || []).filter(e => new Date(e.at) >= week)
        const pos = recent.filter(e => e.rating === 1).length
        const neg = recent.filter(e => e.rating === -1).length
        sendSuccess(res, { entries: (fb.entries || []).slice(-50), week: { pos, neg, total: recent.length } })
      })
      return
    }
    if (req.method === 'POST') {
      let body = ''
      req.on('data', c => { body += c })
      req.on('end', () => {
        try {
          const { label, rating, note } = JSON.parse(body)
          if (![1, -1].includes(rating)) return sendError(res, 400, 'rating must be 1 or -1')
          fs.readFile(feedbackFile, 'utf8', (err, data) => {
            const fb = err ? { entries: [] } : (JSON.parse(data) || { entries: [] })
            fb.entries = fb.entries || []
            fb.entries.push({ label: label || 'unknown', rating, note: (note || '').slice(0, 200), at: new Date().toISOString() })
            fb.entries = fb.entries.slice(-500)
            fs.writeFile(feedbackFile, JSON.stringify(fb, null, 2), () => sendSuccess(res, { ok: true }))
          })
        } catch { sendError(res, 400, 'Invalid JSON') }
      })
      return
    }
  }

  // API: approval queue — ajan onay mekanizması
  const approvalsFile = path.join(__dirname, '..', 'APPROVALS.json')
  const loadApprovals = (cb) => fs.readFile(approvalsFile, 'utf8', (e, d) => cb(e ? { items: [] } : (JSON.parse(d) || { items: [] })))
  const saveApprovals = (data, cb) => fs.writeFile(approvalsFile, JSON.stringify(data, null, 2), cb)

  if (url === '/api/approvals' && req.method === 'GET') {
    loadApprovals(data => {
      const pending = data.items.filter(i => i.status === 'pending')
      sendSuccess(res, { items: data.items.slice(-100), pending_count: pending.length })
    })
    return
  }

  if (url === '/api/approvals' && req.method === 'POST') {
    let body = ''
    req.on('data', c => { body += c })
    req.on('end', () => {
      try {
        const { agent, action, details, risk } = JSON.parse(body)
        if (!agent || !action) return sendError(res, 400, 'agent ve action zorunlu')
        const item = {
          id: `APR-${Date.now()}`,
          agent: agent.slice(0, 50),
          action: action.slice(0, 200),
          details: (details || '').slice(0, 500),
          risk: ['low', 'medium', 'high', 'critical'].includes(risk) ? risk : 'medium',
          status: 'pending',
          created_at: new Date().toISOString(),
          resolved_at: null,
          resolved_by: null,
          note: null
        }
        loadApprovals(data => {
          data.items.push(item)
          data.items = data.items.slice(-200)
          saveApprovals(data, () => {
            sendSuccess(res, { id: item.id, status: 'pending' })
            // Telegram bildirim
            const riskEmoji = { low: '🟡', medium: '🟠', high: '🔴', critical: '🚨' }[item.risk] || '🟠'
            const msg = `${riskEmoji} Onay Gerekli [${item.id}]\nAjan: ${item.agent}\nİşlem: ${item.action}${item.details ? `\nDetay: ${item.details}` : ''}\n\nDashboard → Onaylar sekmesi`
            const tok = process.env.OPENCLAW_TELEGRAM_BOT_TOKEN || ''
            if (tok) {
              const https = require('https')
              const params = new URLSearchParams({ chat_id: '963702150', text: msg })
              https.request(`https://api.telegram.org/bot${tok}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, () => {}).end(params.toString())
            }
          })
        })
      } catch { sendError(res, 400, 'Invalid JSON') }
    })
    return
  }

  const approvalItemMatch = url.match(/^\/api\/approvals\/(APR-\d+)$/)
  if (approvalItemMatch && req.method === 'PATCH') {
    let body = ''
    req.on('data', c => { body += c })
    req.on('end', () => {
      try {
        const { status, note } = JSON.parse(body)
        if (!['approved', 'rejected'].includes(status)) return sendError(res, 400, 'status: approved veya rejected')
        loadApprovals(data => {
          const item = data.items.find(i => i.id === approvalItemMatch[1])
          if (!item) return sendError(res, 404, 'Onay bulunamadı')
          if (item.status !== 'pending') return sendError(res, 409, 'Zaten çözümlendi')
          item.status = status
          item.resolved_at = new Date().toISOString()
          item.resolved_by = 'Sefa'
          item.note = (note || '').slice(0, 200)
          saveApprovals(data, () => sendSuccess(res, { id: item.id, status }))
        })
      } catch { sendError(res, 400, 'Invalid JSON') }
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

                if (updates.status === 'in_progress') {
                  logger.info('Task in_progress, OpenClaw sonraki 30dk rununda alacak', { taskId: task.id })
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

  // API: start task — /api/tasks/T-001/start
  const startMatch = url.match(/^\/api\/tasks\/(T-\d+)\/start$/)
  if (startMatch && req.method === 'POST') {
    const taskId = startMatch[1]
    
    fs.readFile(tasksFile, 'utf8', (err, raw) => {
      if (err) {
        const code = err.code === 'ENOENT' ? 404 : 500
        return sendError(res, code, err.code === 'ENOENT' ? 'TASKS.json bulunamadı' : 'TASKS.json okunamadı')
      }
      
      try {
        const db = JSON.parse(raw)
        const task = db.tasks.find(t => t.id === taskId)
        if (!task) return sendError(res, 404, `Görev ${taskId} bulunamadı`)
        
        const oldStatus = task.status
        const now = new Date().toISOString()
        
        // Update task
        task.status = 'in_progress'
        task.status_history = task.status_history || []
        task.status_history.push({ from: oldStatus, to: 'in_progress', at: now, note: 'Dashboard üzerinden başlatıldı' })
        if (oldStatus === 'pending') task.started_at = now
        db.updated_at = now
        
        // Write to shared-notes.md (Alfred'i haberdar et)
        const sharedNotesPath = path.join(os.homedir(), '.openclaw', 'workspace', 'memory', 'inbox', 'shared-notes.md')
        const noteEntry = `\n## ${now} | Alfred\n- Alan: task-started\n- Not: ${task.id} başlatıldı — ${task.title}\n`
        
        try {
          fs.appendFileSync(sharedNotesPath, noteEntry)
        } catch (noteErr) {
          logger.warn('shared-notes yazılamadı', { error: noteErr.message })
        }
        
        // Save TASKS.json
        fs.writeFile(tasksFile, JSON.stringify(db, null, 2) + '\n', (err2) => {
          if (err2) return sendError(res, 500, 'TASKS.json yazılamadı')
          
          // Send Telegram notification
          sendTelegramAssignNotification(task.id, 'Alfred', task.title, now)
          addNotification('task_started', `${task.id} Başlatıldı`, task.title, task.id)
          
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true, task, triggered: true }))
        })
      } catch (parseErr) {
        sendError(res, 500, 'JSON parse hatası', { details: parseErr.message })
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

            const maxNum = db.tasks.reduce((max, t) => {
              const m = t.id && t.id.match(/^T-(\d+)$/)
              return m ? Math.max(max, parseInt(m[1], 10)) : max
            }, 0)
            const nextId = 'T-' + String(maxNum + 1).padStart(3, '0')
            const task = {
              id: nextId,
              title: newTask.title.trim(),
              description: (newTask.description || '').toString().slice(0, 500),
              status: ['pending', 'in_progress', 'done'].includes(newTask.status) ? newTask.status : 'pending',
              priority: ['low', 'medium', 'high'].includes(newTask.priority) ? newTask.priority : 'medium',
              assignee: ['Alfred','Claude','Codex','Gemini','Master Sefa','MAIT','MERCER'].includes(newTask.assignee) ? newTask.assignee : 'Alfred',
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

              if (task.status === 'in_progress') {
                logger.info('Task in_progress, OpenClaw sonraki rununda alacak', { taskId: task.id })
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

  // API: quick capture (note or task)
  // - POST /api/capture { text: "..." }
  // - "#gorev <baslik>" or "#task <baslik>" => create TASKS.json item
  // - otherwise => append to Obsidian quick notes + OpenClaw shared-notes
  if (url === '/api/capture' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('error', () => sendError(res, 400, 'Request verileri alÄ±namadÄ±'))
    req.on('end', () => {
      try {
        if (!body) return sendError(res, 400, 'Request body boÅŸ')
        const payload = JSON.parse(body)
        const rawText = (payload?.text ?? '').toString()
        const text = rawText.trim()
        if (!text) return sendError(res, 400, 'text zorunlu')
        if (text.length > 5000) return sendError(res, 400, 'text cok uzun (max 5000)')

        const now = new Date()
        const nowIso = now.toISOString()
        const today = nowIso.slice(0, 10)

        const isTask = /^#(gorev|görev|task)\b/i.test(text)
        const taskTitle = text.replace(/^#(gorev|görev|task)\s*/i, '').trim()

        const inferArea = (t) => {
          const s = (t || '').toLowerCase()
          if (/(defi|btc|eth|borsa|yatirim|altin|dolar|faiz)/.test(s)) return 'finans-yatirim'
          if (/(docker|linux|windows|git|ssh|openclaw|dashboard|server|vpn|rclone|raspberry|\bpi\b)/.test(s)) return 'ev-lab-teknoloji'
          if (/(sprint|backlog|roadmap|plan|hedef|todo)/.test(s)) return 'hedefler-planlar'
          if (/(kariyer|musteri|maas|mulakat|cv|kontrat)/.test(s)) return 'is-kariyer'
          if (/(spor|kosu|fitness|gym|diyet|uyku|saglik|agri)/.test(s)) return 'saglik-spor'
          if (/(ogren|kurs|kitap|tutorial|ders|ingilizce)/.test(s)) return 'ogrenme-gelisim'
          return 'notlar'
        }

        const sharedNotesPath = path.join(os.homedir(), '.openclaw', 'workspace', 'memory', 'inbox', 'shared-notes.md')
        const area = inferArea(text)

        // Always append to shared-notes (canonical quicklog)
        try {
          const firstLine = text.split('\n')[0].slice(0, 300)
          const rest = text.split('\n').slice(1).map(l => `- ${l}`.slice(0, 500)).join('\n')
          const entry = `\n## ${nowIso} | Master Sefa\n- Alan: ${area}\n- Not: ${firstLine}\n${rest ? rest + '\n' : ''}`
          fs.appendFileSync(sharedNotesPath, entry)
        } catch (e) {
          logger.warn('shared-notes yazÄ±lamadÄ±', { error: e.message })
        }

        // Also append to Obsidian quick notes for immediate visibility
        try {
          const vaultQuick = '/home/sefa/ikinci-beyin/notlar/hizli-notlar.md'
          const vaultDir = path.dirname(vaultQuick)
          if (!fs.existsSync(vaultDir)) fs.mkdirSync(vaultDir, { recursive: true })
          if (!fs.existsSync(vaultQuick)) {
            fs.writeFileSync(vaultQuick, [
              '---',
              'type: quicklog',
              'tags: [hizli-not, yakalama]',
              '---',
              '',
              '# Hizli Notlar (Master Sefa)',
              '',
              ''
            ].join('\n'))
          }
          const time = nowIso.slice(11, 19)
          const one = text.replace(/\r?\n/g, ' ').slice(0, 500)
          fs.appendFileSync(vaultQuick, `\n## ${today}\n- ${time} | ${one}\n`)
        } catch (e) {
          logger.warn('vault quick-notes yazÄ±lamadÄ±', { error: e.message })
        }

        if (!isTask) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true, kind: 'note', area }))
          return
        }

        if (!taskTitle) return sendError(res, 400, 'Gorev basligi bos olamaz (#gorev <baslik>)')

        // Create task (same format as /api/tasks)
        fs.readFile(tasksFile, 'utf8', (err, raw) => {
          try {
            let db
            if (err && err.code === 'ENOENT') {
              db = { project: 'Ataraxia Command Center', tasks: [] }
            } else if (err) {
              return sendError(res, 500, 'TASKS.json okunamadÄ±', { code: err.code })
            } else {
              db = JSON.parse(raw)
            }
            if (!Array.isArray(db.tasks)) return sendError(res, 500, 'GeÃ§ersiz TASKS.json formatÄ±')

            const maxNum = db.tasks.reduce((max, t) => {
              const m = t.id && t.id.match(/^T-(\d+)$/)
              return m ? Math.max(max, parseInt(m[1], 10)) : max
            }, 0)
            const nextId = 'T-' + String(maxNum + 1).padStart(3, '0')
            const task = {
              id: nextId,
              title: taskTitle.slice(0, 160),
              description: '',
              status: 'pending',
              priority: 'medium',
              assignee: 'Master Sefa',
              tags: ['capture'],
              created_at: nowIso,
            }
            db.tasks.push(task)
            db.updated_at = nowIso

            addNotification('task_created', `${task.id} OluÅŸturuldu`, task.title, task.id)

            fs.writeFile(tasksFile, JSON.stringify(db, null, 2) + '\n', (err2) => {
              if (err2) return sendError(res, 500, 'GÃ¶rev dosyasÄ±na yazÄ±lamadÄ±', { code: err2.code })
              commitTasksFile(task.id, task.title, task.status)
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ ok: true, kind: 'task', taskId: task.id, area }))
            })
          } catch (parseErr) {
            sendError(res, 500, 'TASKS.json iÅŸleme hatasÄ±', { details: parseErr.message })
          }
        })
      } catch (jsonErr) {
        sendError(res, 400, 'GeÃ§ersiz JSON formatÄ±', { details: jsonErr.message })
      }
    })
    return
  }

  // API: send a message to Alfred (Telegram DM to your own chat)
  if (url === '/api/alfred/message' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('error', () => sendError(res, 400, 'Request verileri alÄ±namadÄ±'))
    req.on('end', () => {
      try {
        if (!body) return sendError(res, 400, 'Request body boÅŸ')
        const payload = JSON.parse(body)
        const text = (payload?.text ?? '').toString().trim()
        if (!text) return sendError(res, 400, 'text zorunlu')
        if (text.length > 2000) return sendError(res, 400, 'text cok uzun (max 2000)')

        const inferTopic = (t) => {
          const s = (t || '').toLowerCase()
          if (/(defi|btc|eth|borsa|yatirim|altin|dolar|faiz)/.test(s)) return 'finans-yatirim'
          if (/(docker|linux|windows|git|ssh|openclaw|dashboard|server|vpn|rclone|raspberry|\\bpi\\b)/.test(s)) return 'ev-lab-teknoloji'
          if (/(sprint|backlog|roadmap|plan|hedef|todo)/.test(s)) return 'hedefler-planlar'
          if (/(kariyer|musteri|maas|mulakat|cv|kontrat)/.test(s)) return 'is-kariyer'
          if (/(spor|kosu|fitness|gym|diyet|uyku|saglik|agri)/.test(s)) return 'saglik-spor'
          if (/(ogren|kurs|kitap|tutorial|ders|ingilizce)/.test(s)) return 'ogrenme-gelisim'
          return 'notlar'
        }
        const topic = inferTopic(text)

        // Canonical log
        try {
          const sharedNotesPath = path.join(os.homedir(), '.openclaw', 'workspace', 'memory', 'inbox', 'shared-notes.md')
          const nowIso = new Date().toISOString()
          const firstLine = text.split('\n')[0].slice(0, 300)
          const entry = `\n## ${nowIso} | Master Sefa\n- Alan: alfred-chat\n- Konu: ${topic}\n- Not: ${firstLine}\n`
          fs.appendFileSync(sharedNotesPath, entry)
        } catch (e) {
          logger.warn('shared-notes yazÄ±lamadÄ± (alfred-chat)', { error: e.message })
        }

        // Also append to Obsidian quick notes for immediate visibility
        try {
          const nowIso = new Date().toISOString()
          const today = nowIso.slice(0, 10)
          const time = nowIso.slice(11, 19)
          const vaultQuick = '/home/sefa/ikinci-beyin/notlar/hizli-notlar.md'
          const vaultDir = path.dirname(vaultQuick)
          if (!fs.existsSync(vaultDir)) fs.mkdirSync(vaultDir, { recursive: true })
          if (!fs.existsSync(vaultQuick)) {
            fs.writeFileSync(vaultQuick, [
              '---',
              'type: quicklog',
              'tags: [hizli-not, yakalama]',
              '---',
              '',
              '# Hizli Notlar (Master Sefa)',
              '',
              ''
            ].join('\n'))
          }
          const one = text.replace(/\\r?\\n/g, ' ').slice(0, 500)
          fs.appendFileSync(vaultQuick, `\n## ${today}\n- ${time} | [alfred] ${one}\n`)
        } catch (e) {
          logger.warn('vault quick-notes write failed (alfred-chat)', { error: e.message })
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN
        const chatId = process.env.TELEGRAM_CHAT_ID
        if (!botToken || !chatId) {
          return sendError(res, 500, 'Telegram ayarlanmamÄ±ÅŸ (env eksik)')
        }

        // Respond immediately (UX). Telegram send is best-effort in background.
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, queued: true }))

        const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
        const msg = `Dashboard -> Alfred:\n\n${text}`
        const data = JSON.stringify({ chat_id: chatId, text: msg, disable_web_page_preview: true })
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
          }
        }

        const treq = https.request(tgUrl, options, (tres) => {
          // Consume response so socket can close cleanly.
          tres.on('data', () => {})
          tres.on('end', () => {
            if (tres.statusCode !== 200) {
              logger.warn('Telegram API hatasÄ±', { statusCode: tres.statusCode })
            }
          })
        })
        treq.setTimeout(2500, () => {
          treq.destroy(new Error('telegram timeout'))
        })
        treq.on('error', (err) => {
          logger.warn('Telegram gonderme hatasÄ±', { error: err.message })
        })
        treq.write(data)
        treq.end()

        // Best-effort: generate a short Alfred reply via local OpenClaw gateway and send to Telegram.
        try {
          const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN
          if (gatewayToken) {
            const ctx = (text.split('\n')[0] || '').replace(/\r?\n/g, ' ').slice(0, 140)
            const sys = [
              "Sen Alfred'sin. Kisa ve operasyonel yaz.",
              "1) Mesaji anla/ack (1 cumle).",
              "2) Gerekliyse 1 next-step oner.",
              "3) Kayit alindigini soyle.",
              "Cevap 6 satiri gecmesin."
            ].join('\n')

            const payload2 = JSON.stringify({
              model: 'openai-codex/gpt-5.4-mini',
              temperature: 0.2,
              messages: [
                { role: 'system', content: sys },
                { role: 'user', content: text + `\n\n(Bu mesaj kaydedildi: shared-notes + Obsidian hizli-notlar. Konu: ${topic}.)` },
              ],
            })

            const req2 = http.request({
              hostname: '127.0.0.1',
              port: 18789,
              path: '/v1/chat/completions',
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${gatewayToken}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload2),
              },
            }, (res2) => {
              let raw = ''
              res2.on('data', (c) => { raw += c })
              res2.on('end', () => {
                try {
                  const j = JSON.parse(raw || '{}')
                  const out = j?.choices?.[0]?.message?.content
                  if (!out || typeof out !== 'string') return
                  const reply = out.trim().slice(0, 3500)

                  const msg2 = `Alfred (cevap) — \"${ctx}\"\n\n${reply}`
                  const data2 = JSON.stringify({ chat_id: chatId, text: msg2, disable_web_page_preview: true })
                  const treq2 = https.request(tgUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Content-Length': Buffer.byteLength(data2)
                    }
                  }, (tres2) => {
                    tres2.on('data', () => {})
                    tres2.on('end', () => {
                      if (tres2.statusCode !== 200) {
                        logger.warn('Telegram API error (reply)', { statusCode: tres2.statusCode })
                      }
                    })
                  })
                  treq2.setTimeout(2500, () => treq2.destroy(new Error('telegram timeout')))
                  treq2.on('error', (err) => logger.warn('Telegram send error (reply)', { error: err.message }))
                  treq2.write(data2)
                  treq2.end()
                } catch (e) {
                  // ignore
                }
              })
            })
            req2.setTimeout(5500, () => req2.destroy(new Error('gateway timeout')))
            req2.on('error', () => {})
            req2.write(payload2)
            req2.end()
          }
        } catch (e) {
          // ignore
        }
      } catch (jsonErr) {
        sendError(res, 400, 'GeÃ§ersiz JSON formatÄ±', { details: jsonErr.message })
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
            if (updates.status && ['pending', 'in_progress', 'done', 'deleted'].includes(updates.status)) {
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
              const VALID_ASSIGNEES = ['Alfred', 'Claude', 'Codex', 'Gemini', 'Master Sefa', 'MAIT', 'MERCER']
              const proposed = (updates.assignee || 'Alfred').toString().slice(0, 50)
              task.assignee = VALID_ASSIGNEES.includes(proposed) ? proposed : 'Alfred'
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
            if (updates.context !== undefined) {
              task.context = (updates.context || '').toString().slice(0, 1000)
            }
            if (updates.retry_count !== undefined) {
              task.retry_count = Math.max(0, parseInt(updates.retry_count) || 0)
            }
            if (updates.last_run_at !== undefined) {
              task.last_run_at = updates.last_run_at || null
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

              // Trigger Alfred when task starts (PUT triggers same as PATCH for in_progress)
              if (oldStatus !== 'in_progress' && task.status === 'in_progress') {
                // Write to shared-notes.md (Alfred'i haberdar et)
                const sharedNotesPath = path.join(os.homedir(), '.openclaw', 'workspace', 'memory', 'inbox', 'shared-notes.md')
                const now = new Date().toISOString()
                const noteEntry = `\n## ${now} | Alfred\n- Alan: task-started\n- Not: ${task.id} başlatıldı — ${task.title}\n`
                try { fs.appendFileSync(sharedNotesPath, noteEntry) } catch (e) {}
                
                // Telegram bildirimi
                sendTelegramAssignNotification(task.id, 'Alfred', task.title, now)
                addNotification('task_started', `${task.id} Başlatıldı`, task.title, task.id)
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

  // API: orchestration — cost & budget tracking
  if (url === '/api/orchestration/cost' && req.method === 'GET') {
    // Budget limits from config
    const DAILY_LIMIT = 5.00
    const MONTHLY_LIMIT = 100.00
    const DAILY_SOFT = 3.75
    const MONTHLY_SOFT = 75.00
    
    // Calculate approximate token usage from TASKS.json activity
    let todayTokens = 0
    let monthTokens = 0
    const today = new Date().toISOString().slice(0, 10)
    const thisMonth = today.slice(0, 7)
    
    try {
      const db = JSON.parse(fs.readFileSync(tasksFile, 'utf8'))
      for (const t of db.tasks || []) {
        if (t.completed_at) {
          const ct = t.completed_at.slice(0, 10)
          const mt = t.completed_at.slice(0, 7)
          const pts = t.points || 1
          if (ct === today) todayTokens += pts * 100
          if (mt === thisMonth) monthTokens += pts * 100
        }
      }
    } catch {}
    
    // Estimate cost (approx $0.001 per 100 tokens)
    const todayCost = todayTokens * 0.001
    const monthCost = monthTokens * 0.001
    
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      daily: {
        used: todayCost,
        limit: DAILY_LIMIT,
        soft: DAILY_SOFT,
        percent: Math.round((todayCost / DAILY_LIMIT) * 100),
        warning: todayCost >= DAILY_SOFT,
      },
      monthly: {
        used: monthCost,
        limit: MONTHLY_LIMIT,
        soft: MONTHLY_SOFT,
        percent: Math.round((monthCost / MONTHLY_LIMIT) * 100),
        warning: monthCost >= MONTHLY_SOFT,
      },
      tokens: { today: todayTokens, month: monthTokens },
      updatedAt: new Date().toISOString(),
    }))
    return
  }

  // API: orchestration — distribute task to agent
  if (url === '/api/orchestration/distribute' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const { taskId, agentId, command } = JSON.parse(body)
        
        if (!taskId || !agentId) {
          return sendError(res, 400, 'taskId ve agentId zorunludur')
        }
        
        // Read TASKS.json and update assignee
        const db = JSON.parse(fs.readFileSync(tasksFile, 'utf8'))
        const task = db.tasks.find(t => t.id === taskId)
        if (!task) {
          return sendError(res, 404, `Görev ${taskId} bulunamadı`)
        }
        
        const oldAssignee = task.assignee
        const oldStatus = task.status
        task.assignee = agentId
        task.status = 'in_progress'
        task.status_history = task.status_history || []
        task.status_history.push({
          from: oldStatus,
          to: 'in_progress',
          at: new Date().toISOString(),
          note: `${agentId}'a yönlendirildi${command ? `: ${command}` : ''}`
        })
        db.updated_at = new Date().toISOString()
        
        fs.writeFileSync(tasksFile, JSON.stringify(db, null, 2) + '\n')
        
        // Notify via Telegram
        const assignTime = new Date().toISOString()
        sendTelegramAssignNotification(task.id, agentId, task.title, assignTime)
        addNotification('task_assigned', `${task.id} → ${agentId}`, task.title, task.id)
        
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          ok: true,
          taskId,
          agentId,
          previousAssignee: oldAssignee,
          message: `${taskId} başarıyla ${agentId}'a yönlendirildi`
        }))
      } catch (err) {
        sendError(res, 500, 'Görev dağıtım hatası', { details: err.message })
      }
    })
    return
  }

  // API: orchestration — activity from shared-notes
  if (url === '/api/orchestration/activity' && req.method === 'GET') {
    const sharedNotesPath = path.join(os.homedir(), '.openclaw', 'workspace', 'memory', 'inbox', 'shared-notes.md')
    let activities = []
    
    try {
      const content = fs.readFileSync(sharedNotesPath, 'utf8')
      const blocks = content.split(/\n## /)
      
      for (const block of blocks) {
        if (!block.trim() || block.startsWith('# Shared Notes')) continue
        const lines = block.split('\n')
        const headerMatch = lines[0].match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^|]*)\s*\|\s*(\w+)/)
        if (headerMatch) {
          const rawTime = headerMatch[1].trim()
          const agent = headerMatch[2]
          const noteLines = lines.slice(1)
          
          // Extract Alan and Not fields
          const alanLine = noteLines.find(l => l.includes('- Alan:'))
          const notLine = noteLines.find(l => l.includes('- Not:'))
          
          const field = alanLine ? alanLine.replace(/^\s*- Alan:\s*/, '').trim() : ''
          // Get note text, handling both simple and multi-line formats
          let note = notLine ? notLine.replace(/^\s*- Not:\s*/, '').trim() : ''
          if (!note && noteLines.length > 1) {
            // Multi-line: collect non-empty, non-tag lines
            note = noteLines.filter(l => l.trim() && !l.includes('- Alan:') && !l.includes('- **')).map(l => l.replace(/^\s*/, '').replace(/^- /, '')).join(' ').trim()
          }
          
          // Parse timestamp safely - some entries have invalid dates
          let ts = rawTime
          try {
            const d = new Date(rawTime)
            if (isNaN(d.getTime())) throw new Error('Invalid date')
            ts = d.toISOString()
          } catch { ts = rawTime }
          
          activities.push({
            id: rawTime,
            agent,
            field,
            note,
            time: rawTime,
            timestamp: ts,
          })
        }
      }
    } catch (err) {
      console.error('Activity parse error:', err.message)
    }
    
    // Sort by time desc (string sort works for ISO-like timestamps)
    activities.sort((a, b) => b.time.localeCompare(a.time))
    
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ activities: activities.slice(0, 20), updatedAt: new Date().toISOString() }))
    return
  }

  // API: git repos and recent commits
  if (url === '/api/git/repos' && req.method === 'GET') {
    const repoCandidates = [
      { path: path.join(os.homedir(), '.openclaw', 'workspace', 'memory'), name: 'openclaw-memory' },
      { path: path.join(os.homedir(), 'alfred-hub'), name: 'alfred-hub' },
      { path: path.join(os.homedir(), 'scrum'), name: 'scrum' },
    ]
    const repos = repoCandidates.filter(r => fs.existsSync(path.join(r.path, '.git')))
    const result = []
    for (const repo of repos) {
      try {
        const commits = execSync('git log --format="%s|%cr|%ci" -5', { encoding: 'utf8', cwd: repo.path }).trim().split('\n')
        const branch = execSync('git branch --show-current', { encoding: 'utf8', cwd: repo.path }).trim() || 'main'
        const commitsData = commits.filter(c => c).map(c => {
          const [msg, rel, date] = c.split('|')
          return { message: msg, relative: rel, date }
        })
        result.push({ name: repo.name, branch, commits: commitsData, path: repo.path })
      } catch {
        result.push({ name: repo.name, branch: '—', commits: [], path: repo.path, error: true })
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ repos: result, updatedAt: new Date().toISOString() }))
    return
  }

  // API: agents — Wayne Ağı
  if (url === '/api/agents' && req.method === 'GET') {
    const HOME = os.homedir()
    const ACTIVE_MS = 30 * 60 * 1000 // 30 dakika

    // --- Yardımcı: session dosyası mtime'dan aktiflik tespiti ---
    // Dizin değil dosya mtime'ı kontrol et — dizin mtime güvenilmez
    function newestSessionMtime(globCmd) {
      try {
        const out = execSync(globCmd, { encoding: 'utf8', timeout: 3000 }).trim()
        if (!out) return 0
        return Math.max(...out.split('\n').map(ts => parseInt(ts, 10) || 0))
      } catch { return 0 }
    }

    // Her ajan için hangi dosyalar session'ı temsil ediyor
    const SESSION_FIND = {
      Claude: `find ${HOME}/.claude/projects/ -name "*.jsonl" -printf "%T@\\n" 2>/dev/null`,
      Gemini: `stat -c "%Y" ${HOME}/.gemini/state.json ${HOME}/.gemini/projects.json 2>/dev/null`,
      Codex:  `find ${HOME}/.codex/sessions/ -type f -printf "%T@\\n" 2>/dev/null`,
    }

    function detectStatus(agentId) {
      if (agentId === 'Alfred') return 'active'
      const cmd = SESSION_FIND[agentId]
      if (!cmd) return 'idle'
      const mtime = newestSessionMtime(cmd) * 1000
      return (Date.now() - mtime) < ACTIVE_MS ? 'active' : 'idle'
    }

    function lastSeenAgo(agentId) {
      if (agentId === 'Alfred') return null
      const cmd = SESSION_FIND[agentId]
      if (!cmd) return null
      const mtime = newestSessionMtime(cmd) * 1000
      if (!mtime) return null
      const diff = Date.now() - mtime
      const m = Math.floor(diff / 60000)
      const h = Math.floor(diff / 3600000)
      const d = Math.floor(diff / 86400000)
      if (m < 1) return 'az önce'
      if (m < 60) return `${m}dk önce`
      if (h < 24) return `${h}sa önce`
      return `${d}g önce`
    }

    // --- Yardımcı: shared-notes.md'den ajan başına son eylem ---
    function parseSharedNotes(agentId) {
      const ALIASES = {
        Alfred: ['alfred', 'Alfred'],
        Claude:  ['claude', 'Claude'],
        Gemini:  ['gemini', 'Gemini'],
        Codex:   ['codex',  'Codex'],
      }
      const notesPath = path.join(HOME, '.openclaw/workspace/memory/inbox/shared-notes.md')
      try {
        const lines = fs.readFileSync(notesPath, 'utf8').split('\n')
        const aliases = ALIASES[agentId] || [agentId]
        const sections = []
        let cur = null

        for (const raw of lines) {
          const line = raw.replace(/\r/g, '').trim()
          const m = line.match(/^## (.+?) \| (.+)$/)
          if (m) {
            if (cur) sections.push(cur)
            cur = { ts: m[1].trim(), agent: m[2].trim(), notes: [] }
          } else if (cur && line.startsWith('- Not:')) {
            cur.notes.push(line.replace('- Not:', '').trim())
          } else if (cur && line.startsWith('- Alan:')) {
            cur.alan = line.replace('- Alan:', '').trim()
          }
        }
        if (cur) sections.push(cur)

        const mine = sections
          .filter(s => aliases.includes(s.agent))
          .sort((a, b) => new Date(b.ts) - new Date(a.ts))

        if (!mine.length) return { lastAction: null, lastActionTime: null }

        const latest = mine[0]
        const action = latest.notes[0] || (latest.alan ? `Alan: ${latest.alan}` : null)
        const diff = Date.now() - new Date(latest.ts).getTime()
        const m2 = Math.floor(diff / 60000)
        const h2 = Math.floor(diff / 3600000)
        const d2 = Math.floor(diff / 86400000)
        const relTime = m2 < 1 ? 'az önce' : m2 < 60 ? `${m2}dk önce` : h2 < 24 ? `${h2}sa önce` : `${d2}g önce`

        return { lastAction: action, lastActionTime: relTime }
      } catch {
        return { lastAction: null, lastActionTime: null }
      }
    }

    // --- Görev istatistikleri (TASKS.json) ---
    const tasksByAssignee = {}
    const today = new Date().toISOString().slice(0, 10)
    try {
      const db = JSON.parse(fs.readFileSync(tasksFile, 'utf8'))
      for (const t of db.tasks || []) {
        const a = t.assignee || 'Alfred'
        if (!tasksByAssignee[a]) tasksByAssignee[a] = { total: 0, done: 0, today: 0 }
        tasksByAssignee[a].total++
        if (t.status === 'done') {
          tasksByAssignee[a].done++
          if (t.completed_at?.startsWith(today)) tasksByAssignee[a].today++
        }
      }
    } catch {}

    // --- Alfred: git log ---
    let alfredGitAction = '—', alfredGitTime = '—'
    try {
      const out = execSync('git log --format="%s|%cr" -1', { encoding: 'utf8', cwd: path.join(__dirname, '..') }).trim()
      const [msg, when] = out.split('|')
      alfredGitAction = msg || '—'
      alfredGitTime = when || '—'
    } catch {}

    // --- Alfred uptime ---
    const uptimeSec = Math.floor((Date.now() - SERVER_START) / 1000)
    const uptimeH = Math.floor(uptimeSec / 3600)
    const uptimeM = Math.floor((uptimeSec % 3600) / 60)
    const alfredUptime = uptimeH > 0 ? `${uptimeH}sa ${uptimeM}dk` : `${uptimeM}dk`

    // --- Ajan tanımları ---
    const WAYNE_AGI = [
      { id: 'Alfred', name: 'Alfred', role: 'Orkestratör & Koordinasyon', tags: ['orchestrator', 'primary'] },
      { id: 'Claude', name: 'Claude', role: 'Geliştirme & Analiz',        tags: ['coding', 'analysis']     },
      { id: 'Gemini', name: 'Gemini', role: 'Araştırma & Geliştirme',     tags: ['research', 'coding']     },
      { id: 'Codex',  name: 'Codex',  role: 'Kod Üretimi & Otomasyon',    tags: ['coding', 'automation']   },
    ]

    const MODEL_MAP = {
      Alfred: 'minimax-m2.7 (OpenClaw)',
      Claude: 'claude-sonnet-4-6',
      Gemini: 'gemini-2.5-pro',
      Codex:  'openai/codex-cli',
    }

    const agents = WAYNE_AGI.map(a => {
      const status   = detectStatus(a.id)
      const lastSeen = lastSeenAgo(a.id)
      const notes    = parseSharedNotes(a.id)
      const stats    = tasksByAssignee[a.name] || { total: 0, done: 0, today: 0 }

      let lastAction, lastActionTime
      if (a.id === 'Alfred') {
        lastAction     = alfredGitAction
        lastActionTime = alfredGitTime
      } else {
        lastAction     = notes.lastAction     || 'Henüz kayıt yok'
        lastActionTime = notes.lastActionTime || lastSeen || '—'
      }

      return {
        ...a,
        status,
        uptime: a.id === 'Alfred' ? alfredUptime : (lastSeen || notes.lastActionTime || '—'),
        model:  MODEL_MAP[a.id] || '—',
        tasksTotal:  stats.total,
        tasksDone:   stats.done,
        tasksToday:  stats.today,
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

  // API: service restart
  if (url === '/api/services/restart' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const { serviceId } = JSON.parse(body)
        if (!serviceId) return sendError(res, 400, 'serviceId zorunlu')
        
        let result = {}
        if (serviceId.startsWith('docker-')) {
          const container = serviceId.replace('docker-', '')
          try {
            execSync(`docker restart ${container}`, { timeout: 30000 })
            result = { ok: true, message: `${container} yeniden başlatıldı` }
          } catch (e) {
            result = { ok: false, message: `Docker hatası: ${e.message}` }
          }
        } else if (serviceId.startsWith('systemd-')) {
          const unit = serviceId.replace('systemd-', '')
          try {
            execSync(`systemctl restart ${unit}`, { timeout: 30000 })
            result = { ok: true, message: `${unit} yeniden başlatıldı` }
          } catch (e) {
            result = { ok: false, message: `Systemd hatası: ${e.message}` }
          }
        } else {
          return sendError(res, 400, 'Geçersiz serviceId formatı')
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
      } catch (err) {
        sendError(res, 500, 'Servis yeniden başlatma hatası', { details: err.message })
      }
    })
    return
  }

  // API: health (detailed)
  if (url === '/api/health') {
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
      // 1. OpenClaw cron jobs from ~/.openclaw/cron/jobs.json
      const openclawJobsPath = path.join(os.homedir(), '.openclaw', 'cron', 'jobs.json')
      let openclawJobs = []
      try {
        const raw = fs.readFileSync(openclawJobsPath, 'utf8')
        const parsed = JSON.parse(raw)
        openclawJobs = (parsed.jobs || []).map(job => ({
          id: job.id,
          name: job.name,
          description: job.description || '',
          enabled: job.enabled,
          schedule: job.schedule?.expr || '?',
          tz: job.schedule?.tz || 'UTC',
          agentId: job.agentId,
          lastRunAtMs: job.state?.lastRunAtMs || null,
          nextRunAtMs: job.state?.nextRunAtMs || null,
          lastRunStatus: job.state?.lastRunStatus || null,
          lastDurationMs: job.state?.lastDurationMs || null,
          lastDelivered: job.state?.lastDelivered || false,
          consecutiveErrors: job.state?.consecutiveErrors || 0,
        }))
      } catch {}

      // 2. System cron jobs (alfred-hub related only) from user crontab
      const cronSchedules = []
      try {
        const userCrontab = execSync('crontab -l 2>/dev/null', { timeout: 2000 }).toString()
        for (const line of userCrontab.split('\n')) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#')) continue
          const parts = trimmed.split(/\s+/)
          if (parts.length < 6) continue
          const [min, hour, dom, month, dow, ...cmdParts] = parts
          const cmd = cmdParts.join(' ')
          if (!cmd.includes('alfred') && !cmd.includes('backup') && !cmd.includes('briefing') && !cmd.includes('report')) continue
          cronSchedules.push({ schedule: `${min} ${hour} ${dom} ${month} ${dow}`, command: cmd })
        }
      } catch {}


      // 4. Last 50 lines of alfred backup log
      const backupLogPath = path.join(os.homedir(), 'alfred-hub', 'command-center', 'logs', 'alfred-backup.log')
      let logLines = []
      try {
        const logContent = fs.readFileSync(backupLogPath, 'utf8')
        logLines = logContent.split('\n').filter(Boolean).slice(-50)
      } catch {}

      // 5. Next run times derived from OpenClaw jobs state
      const nextRuns = openclawJobs
        .filter(j => j.enabled && j.nextRunAtMs)
        .map(j => ({ label: j.name, jobId: j.id, time: new Date(j.nextRunAtMs).toISOString() }))
        .sort((a, b) => new Date(a.time) - new Date(b.time))

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        openclawJobs,
        cronSchedules,

        logLines,
        nextRuns,
        generatedAt: new Date().toISOString(),
      }))
    } catch (err) {
      sendError(res, 500, 'Otomasyon verisi alınamadı', { details: err.message })
    }
    return
  }

  // --- DeFi APM Proxy (/api/defi/*) ---
  if (url.startsWith('/api/defi/')) {
    const upstreamPath = url.replace('/api/defi/', '/api/')
    const upstreamUrl = `http://127.0.0.1:4180${upstreamPath}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`
    const upstreamReq = http.request(upstreamUrl, { method: req.method, headers: { ...req.headers, host: '127.0.0.1:4180' } }, (upstreamRes) => {
      let body = ''
      upstreamRes.on('data', chunk => { body += chunk })
      upstreamRes.on('end', () => {
        res.writeHead(upstreamRes.statusCode || 502, { 'Content-Type': upstreamRes.headers['content-type'] || 'application/json' })
        res.end(body)
      })
    })
    upstreamReq.on('error', () => {
      res.writeHead(503, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'DeFi APM servisi erişilemiyor', port: 4180 }))
    })
    req.pipe(upstreamReq)
    return
  }

  // Static files (optimized serving)
  const safeUrl = url === '/' ? '/index.html' : url
  const filePath = path.join(config.DIST_PATH, safeUrl.startsWith('/') ? safeUrl.slice(1) : safeUrl)
  
  if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
    serveFile(filePath, res)
  } else {
    // SPA fallback: index.html for all non-file routes
    serveFile(path.join(config.DIST_PATH, 'index.html'), res)
  }
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
