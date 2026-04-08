#!/usr/bin/env node
/**
 * Lightweight system stats API for Ataraxia Dashboard
 * Serves: CPU, Memory, Disk, Uptime
 * Configured via config.js
 */

const http = require('http')
const os = require('os')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const logger = require('./lib/logger.cjs')

// Load .env file (same as server.cjs)
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
  } catch (err) {
    console.warn('.env file could not be read:', err.message)
  }
}
loadEnv()

const config = require('./config.cjs')

// Initialize logs directory
const logsDir = path.join(__dirname, 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

logger.info('Stats server starting', { port: config.STATS_PORT })

// Stats history: 24h window, 5min intervals = 288 records max
let statsHistory = []

// CPU usage sampling
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

function getStats() {
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  const memPercent = Math.round((usedMem / totalMem) * 100)
  const uptimeSeconds = os.uptime()
  const hours = Math.floor(uptimeSeconds / 3600)
  const minutes = Math.floor((uptimeSeconds % 3600) / 60)

  return {
    cpuPercent: getCpuPercent(),
    memPercent,
    memUsedMB: Math.round(usedMem / 1024 / 1024),
    memTotalMB: Math.round(totalMem / 1024 / 1024),
    diskPercent: getDiskPercent(),
    uptimeSeconds: Math.round(uptimeSeconds),
    uptimeHuman: `${hours}sa ${minutes}dk`,
    timestamp: new Date().toISOString(),
  }
}

function recordStats() {
  const stats = getStats()
  statsHistory.push(stats)
  // Keep only last 24h of records (288 = 24*60/5)
  if (statsHistory.length > config.MAX_STATS_HISTORY_RECORDS) {
    statsHistory.shift()
  }
}

const server = http.createServer((req, res) => {
  const startTime = Date.now()
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown'

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')

  // Wrap response end to log
  const originalEnd = res.end
  res.end = function(...args) {
    const duration = Date.now() - startTime
    const statusCode = res.statusCode || 200
    logger.info('HTTP Request', {
      method: req.method,
      path: req.url,
      status: statusCode,
      duration: `${duration.toFixed(2)}ms`,
      ip
    })
    originalEnd.apply(res, args)
  }

  if (req.url === '/api/stats' && req.method === 'GET') {
    res.writeHead(200)
    res.end(JSON.stringify(getStats()))
  } else if (req.url === '/api/stats/history' && req.method === 'GET') {
    res.writeHead(200)
    res.end(JSON.stringify(statsHistory))
  } else if (req.url === '/health') {
    res.writeHead(200)
    res.end(JSON.stringify({ ok: true }))
  } else {
    res.writeHead(404)
    res.end(JSON.stringify({ error: 'not found' }))
  }
})

server.listen(config.STATS_PORT, '0.0.0.0', () => {
  console.log(`Stats API running on http://0.0.0.0:${config.STATS_PORT}/api/stats`)

  // Start recording stats every configured interval
  recordStats() // Record initial sample
  setInterval(recordStats, config.STATS_HISTORY_INTERVAL)
  console.log(`Stats history recording started (interval: ${config.STATS_HISTORY_INTERVAL / 1000 / 60} minutes)`)
})
