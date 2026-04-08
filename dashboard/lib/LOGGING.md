# Request/Response Logging Middleware

This documentation describes the logging setup for the Ataraxia Dashboard.

## Overview

The dashboard uses **Winston** logger with daily log rotation for production-grade request/response logging.

### Features

- **JSON Format**: All logs are in JSON format for easy parsing and aggregation
- **Log Rotation**: Automatic daily rotation with configurable retention
- **Environment-aware**: Different log levels for dev vs prod
- **Request/Response Logging**: Automatic HTTP request/response logging with metadata
- **Slow Query Detection**: Separate logging for slow queries
- **Console Output**: Color-coded console output for development
- **Multiple Transports**: Console, daily rotating files, and separate error logs

## Log Files

Logs are stored in the `logs/` directory:

```
logs/
├── application-2026-04-08.log    # All logs (daily rotation)
├── application-2026-04-07.log
├── error-2026-04-08.log          # Errors only (30-day retention)
├── error-2026-04-07.log
└── ...
```

## Configuration

### Environment Variables

```bash
NODE_ENV=development              # Options: development, production
LOG_LEVEL_DEV=debug              # Dev log level
LOG_LEVEL_PROD=info              # Prod log level
LOG_FILE_MAX_SIZE=20m            # Max file size before rotation
LOG_FILE_MAX_DAYS=14             # Retention period
```

### Default Behavior

- **Development**: Log level = `debug`, all output to console + files
- **Production**: Log level = `info`, output to files only

## Log Levels

From highest to lowest severity:

1. **error**: Error events (5XX responses, exceptions)
2. **warn**: Warning events (4XX responses, slow queries)
3. **info**: Informational (2XX-3XX responses, startup messages)
4. **debug**: Debug details (request metadata, parameters)

## Log Format

### Console Output (Dev)

```
2026-04-08 15:30:45 [info] HTTP Request {
  "method": "GET",
  "path": "/api/stats",
  "status": 200,
  "duration": "12.45ms",
  "ip": "127.0.0.1"
}
```

### File Output (JSON)

```json
{
  "level": "info",
  "message": "HTTP Request",
  "timestamp": "2026-04-08T15:30:45.123Z",
  "method": "GET",
  "path": "/api/stats",
  "status": 200,
  "duration": "12.45ms",
  "ip": "127.0.0.1",
  "service": "dashboard"
}
```

## Usage

### Basic Logging

```javascript
const logger = require('./lib/logger.cjs')

logger.info('User logged in', { userId: 123, email: 'user@example.com' })
logger.warn('High memory usage', { memPercent: 85 })
logger.error('Database connection failed', { error: err.message })
logger.debug('Processing request', { requestId: 'abc123' })
```

### Request/Response Logging

The logger is automatically integrated into both `server.cjs` and `stats-server.cjs`:

```javascript
// Automatically logs all HTTP requests with:
// - Method (GET, POST, etc)
// - Path (/api/stats, /api/health, etc)
// - Status Code (200, 404, 500, etc)
// - Response Duration
// - Client IP
// - Timestamp
```

### Slow Query Detection

Queries exceeding `SLOW_QUERY_THRESHOLD` (default: 500ms) are automatically logged as warnings:

```json
{
  "level": "warn",
  "message": "Slow Query Detected",
  "timestamp": "2026-04-08T15:30:45.123Z",
  "path": "/api/heavy-computation",
  "method": "POST",
  "duration": "2500.50ms",
  "threshold": "500ms"
}
```

## Retention Policy

- **Application Logs**: 14 days
- **Error Logs**: 30 days
- **Max File Size**: 20MB per file (rotates to new file when exceeded)

## Monitoring and Analysis

### View Recent Logs

```bash
# Tail all logs
tail -f logs/application-*.log

# Tail error logs only
tail -f logs/error-*.log

# Search for specific requests
grep "GET /api/stats" logs/application-*.log

# Count HTTP status codes
grep -o '"status":[0-9]*' logs/application-*.log | sort | uniq -c

# Find slow queries
grep "Slow Query" logs/application-*.log
```

### Parse JSON Logs

```bash
# Using jq to extract specific fields
cat logs/application-2026-04-08.log | jq '.status' | sort | uniq -c

# Filter by status code
cat logs/application-*.log | jq 'select(.status >= 500)'

# Get average response time
cat logs/application-*.log | jq '.duration' | awk '{sum += $1; count++} END {print sum/count}'
```

## Integration Points

### server.cjs

- Logs all HTTP requests with method, path, status, duration, and IP
- Logs slow queries exceeding threshold
- Logs startup and initialization messages

### stats-server.cjs

- Logs all stats API requests
- Logs HTTP requests similarly to main server

### lib/logger.cjs

- Central logger configuration
- Winston setup with daily rotation
- Environment-aware log levels

### lib/requestLogger.cjs

- Express middleware for request/response logging (for future use)
- Can be integrated with Express-based endpoints

## Troubleshooting

### No logs appearing

1. Check `logs/` directory exists: `mkdir -p logs/`
2. Check NODE_ENV is set correctly
3. Check file permissions: `ls -la logs/`
4. Verify Winston installed: `npm list winston`

### Logs not rotating

1. Check file size limit: `ls -lh logs/application-*.log`
2. Verify LOG_FILE_MAX_SIZE is set
3. Check disk space availability

### Performance Impact

The logger has minimal performance overhead:
- File writes are buffered
- JSON serialization is optimized
- Rotation happens asynchronously
- Console output is optional based on environment

## Migration from Old Logging

The new Winston-based logger is backward compatible with the existing in-memory logging:

- In-memory logs are still maintained for `/api/logs` endpoint
- Winston logs go to files for persistence
- Both systems work independently

To view in-memory logs: `/api/logs` (still returns array of recent requests)
To view persistent logs: Check `logs/` directory
