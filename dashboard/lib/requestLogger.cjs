const logger = require('./logger.cjs')

/**
 * Express middleware for HTTP request/response logging
 * Logs request details, response time, and status codes in JSON format
 */
function requestLoggerMiddleware(req, res, next) {
  const startTime = Date.now()
  const startHrTime = process.hrtime()

  // Capture original res.send/json methods
  const originalSend = res.send
  const originalJson = res.json

  res.send = function (data) {
    res.send = originalSend
    return res.send(data)
  }

  res.json = function (data) {
    res.json = originalJson
    return res.json(data)
  }

  // Hook on response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const [seconds, nanoseconds] = process.hrtime(startHrTime)
    const hrDuration = (seconds * 1000 + nanoseconds / 1000000).toFixed(3)

    const logData = {
      method: req.method,
      path: req.path,
      query: Object.keys(req.query).length ? req.query : undefined,
      status: res.statusCode,
      duration: `${duration}ms`,
      hrDuration: `${hrDuration}ms`,
      contentLength: res.get('content-length'),
      userAgent: req.get('user-agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    }

    // Log level based on status code
    if (res.statusCode >= 500) {
      logger.error('HTTP Request', logData)
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData)
    } else {
      logger.info('HTTP Request', logData)
    }
  })

  next()
}

module.exports = requestLoggerMiddleware
