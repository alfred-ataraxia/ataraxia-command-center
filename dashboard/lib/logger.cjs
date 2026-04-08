const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')
const path = require('path')

const isDev = process.env.NODE_ENV !== 'production'
const logsDir = path.join(__dirname, '..', 'logs')

// Create logger instance
const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'dashboard' },
  transports: [
    // Console output (all levels)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          return `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`
        })
      )
    }),
    // Daily rotating file for all logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.json()
    }),
    // Daily rotating file for errors only
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: winston.format.json()
    })
  ]
})

module.exports = logger
