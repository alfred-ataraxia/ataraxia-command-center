const path = require('path')

const nodeEnv = process.env.NODE_ENV || 'development'
const isDev = nodeEnv === 'development'
const isProd = nodeEnv === 'production'

const PORT = parseInt(process.env.PORT || '4173', 10)
const STATS_PORT = parseInt(process.env.STATS_PORT || '4175', 10)

const CIRCUIT_BREAKER_FAILURE_THRESHOLD = parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || '3', 10)
const CIRCUIT_BREAKER_RESET_TIMEOUT = parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || '60000', 10)

const RATE_LIMIT_REQUESTS = parseInt(process.env.RATE_LIMIT_REQUESTS || '10', 10)
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10)

const MAX_REQUEST_LOGS = parseInt(process.env.MAX_REQUEST_LOGS || '1000', 10)
const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD || '500', 10)
const MAX_SLOW_QUERIES = parseInt(process.env.MAX_SLOW_QUERIES || '100', 10)

const HISTORY_MAX_RECORDS = parseInt(process.env.HISTORY_MAX_RECORDS || '288', 10)
const HEALTH_CHECK_FAIL_THRESHOLD = parseInt(process.env.HEALTH_CHECK_FAIL_THRESHOLD || '3', 10)
const NOTIFICATIONS_MAX = parseInt(process.env.NOTIFICATIONS_MAX || '50', 10)

const STATS_HISTORY_INTERVAL = parseInt(process.env.STATS_HISTORY_INTERVAL || '300000', 10)
const MAX_STATS_HISTORY_RECORDS = parseInt(process.env.MAX_STATS_HISTORY_RECORDS || '288', 10)

const HA_URL = process.env.HA_URL || process.env.VITE_HA_URL || null
const HA_TOKEN = process.env.HA_TOKEN || process.env.VITE_HA_TOKEN || null
const STATS_URL = process.env.STATS_URL || process.env.VITE_STATS_URL || `http://localhost:${STATS_PORT}`

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || null
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || null

const DASHBOARD_TOKEN = process.env.DASHBOARD_TOKEN || null

const DIST_PATH = path.join(__dirname, 'dist')
const TASKS_JSON_PATH = path.join(__dirname, '..', 'TASKS.json')

function validateConfig() {
  const warnings = []
  if (!HA_URL) {
    warnings.push('HA_URL not configured (Home Assistant integration disabled)')
  }
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    warnings.push('Telegram notifications not configured (optional)')
  }
  if (PORT < 1024 && process.getuid?.() !== 0) {
    warnings.push(`Port ${PORT} requires root privileges`)
  }
  if (isProd && !HA_URL) {
    warnings.push('Production mode: HA_URL should be configured')
  }
  return warnings
}

module.exports = {
  nodeEnv,
  isDev,
  isProd,
  PORT,
  STATS_PORT,
  DIST_PATH,
  TASKS_JSON_PATH,
  CIRCUIT_BREAKER_FAILURE_THRESHOLD,
  CIRCUIT_BREAKER_RESET_TIMEOUT,
  RATE_LIMIT_REQUESTS,
  RATE_LIMIT_WINDOW,
  MAX_REQUEST_LOGS,
  SLOW_QUERY_THRESHOLD,
  MAX_SLOW_QUERIES,
  HISTORY_MAX_RECORDS,
  HEALTH_CHECK_FAIL_THRESHOLD,
  NOTIFICATIONS_MAX,
  STATS_HISTORY_INTERVAL,
  MAX_STATS_HISTORY_RECORDS,
  HA_URL,
  HA_TOKEN,
  STATS_URL,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  DASHBOARD_TOKEN,
  validateConfig,
}
