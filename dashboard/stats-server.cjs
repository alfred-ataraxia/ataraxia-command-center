#!/usr/bin/env node
/**
 * Lightweight system stats API for Ataraxia Dashboard
 * Serves: CPU, Memory, Disk, Uptime
 * Port: 4175
 */

const http = require('http')
const os = require('os')
const { execSync } = require('child_process')

const PORT = 4175

// Stats history: 24h window, 5min intervals = 288 records max
const HISTORY_INTERVAL = 5 * 60 * 1000 // 5 minutes
const MAX_HISTORY_RECORDS = 288 // 24 * 60 / 5
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
  if (statsHistory.length > MAX_HISTORY_RECORDS) {
    statsHistory.shift()
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')

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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Stats API running on http://0.0.0.0:${PORT}/api/stats`)

  // Start recording stats every 5 minutes
  recordStats() // Record initial sample
  setInterval(recordStats, HISTORY_INTERVAL)
  console.log(`Stats history recording started (5min intervals)`)
})
