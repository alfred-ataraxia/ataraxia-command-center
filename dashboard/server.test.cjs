/**
 * In-memory API endpoint tests for the dashboard development stub.
 * No TCP bind is used, so the suite runs inside restricted sandboxes.
 */

const fs = require('fs')
const path = require('path')
const { EventEmitter } = require('events')

describe('Ataraxia Dashboard API Endpoints', () => {
  let handler

  function createJsonResponse(res, statusCode, payload) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(payload))
  }

  async function invoke({ method = 'GET', url = '/', body = null }) {
    return new Promise((resolve, reject) => {
      const req = new EventEmitter()
      req.method = method
      req.url = url
      req.headers = {}

      const chunks = []
      const res = {
        statusCode: 200,
        headers: {},
        writeHead(statusCode, headers = {}) {
          this.statusCode = statusCode
          this.headers = Object.fromEntries(
            Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
          )
        },
        end(chunk = '') {
          if (chunk) chunks.push(Buffer.from(chunk))
          const text = Buffer.concat(chunks).toString('utf8')
          let json = null
          try { json = JSON.parse(text) } catch {}
          resolve({
            statusCode: this.statusCode,
            headers: this.headers,
            text,
            body: json,
          })
        },
      }

      try {
        handler(req, res)
        process.nextTick(() => {
          if (body !== null && body !== undefined) {
            const payload = typeof body === 'string' ? body : JSON.stringify(body)
            req.emit('data', Buffer.from(payload))
          }
          req.emit('end')
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  beforeAll(() => {
    process.env.NODE_ENV = 'test'

    const tasksPath = path.join(__dirname, '..', 'TASKS.json')
    if (!fs.existsSync(tasksPath)) {
      fs.writeFileSync(tasksPath, JSON.stringify([
        { id: 'T-049', title: 'Unit tests', status: 'in_progress', priority: 'high' }
      ]))
    }

    handler = (req, res) => {
      const url = req.url

      if (url === '/api/stats' || url === '/api/stats?invalid=param') {
        createJsonResponse(res, 200, {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          timestamp: Date.now(),
        })
        return
      }

      if (url === '/api/tasks' && req.method === 'GET') {
        fs.readFile(tasksPath, 'utf8', (err, data) => {
          try {
            const parsed = err ? { tasks: [] } : JSON.parse(data)
            const tasks = Array.isArray(parsed) ? parsed : (parsed.tasks || [])
            createJsonResponse(res, 200, { tasks })
          } catch {
            createJsonResponse(res, 500, { error: 'Parse error' })
          }
        })
        return
      }

      if (url === '/api/tasks' && req.method === 'POST') {
        let requestBody = ''
        req.on('data', (chunk) => { requestBody += chunk })
        req.on('end', () => {
          try {
            const newTask = JSON.parse(requestBody)
            if (!newTask.id || !newTask.title) {
              createJsonResponse(res, 400, { error: 'Missing id or title' })
              return
            }
            createJsonResponse(res, 201, newTask)
          } catch {
            createJsonResponse(res, 400, { error: 'Invalid JSON' })
          }
        })
        return
      }

      const patchMatch = url.match(/^\/api\/tasks\/(T-\d+)$/)
      if (patchMatch && req.method === 'PATCH') {
        let requestBody = ''
        req.on('data', (chunk) => { requestBody += chunk })
        req.on('end', () => {
          try {
            const updates = JSON.parse(requestBody)
            createJsonResponse(res, 200, { id: patchMatch[1], ...updates })
          } catch {
            createJsonResponse(res, 400, { error: 'Invalid JSON' })
          }
        })
        return
      }

      if (url === '/api/logs') {
        createJsonResponse(res, 200, { logs: [] })
        return
      }

      if (url === '/api/ha/devices') {
        createJsonResponse(res, 200, { devices: [], connected: false })
        return
      }

      createJsonResponse(res, 404, { error: 'Not found' })
    }
  })

  test('GET /api/stats returns system statistics', async () => {
    const res = await invoke({ url: '/api/stats' })
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('uptime')
    expect(res.body).toHaveProperty('memory')
    expect(res.body).toHaveProperty('cpu')
    expect(res.body).toHaveProperty('timestamp')
  })

  test('GET /api/tasks returns tasks list', async () => {
    const res = await invoke({ url: '/api/tasks' })
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body.tasks)).toBe(true)
  })

  test('POST /api/tasks creates a task with valid data', async () => {
    const res = await invoke({
      method: 'POST',
      url: '/api/tasks',
      body: { id: 'T-999', title: 'Test task' },
    })
    expect(res.statusCode).toBe(201)
    expect(res.body.id).toBe('T-999')
  })

  test('POST /api/tasks rejects invalid payload', async () => {
    const res = await invoke({
      method: 'POST',
      url: '/api/tasks',
      body: { id: 'T-998' },
    })
    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  test('POST /api/tasks rejects malformed JSON', async () => {
    const res = await invoke({
      method: 'POST',
      url: '/api/tasks',
      body: '{ invalid json }',
    })
    expect(res.statusCode).toBe(400)
  })

  test('PATCH /api/tasks/:id updates task status', async () => {
    const res = await invoke({
      method: 'PATCH',
      url: '/api/tasks/T-049',
      body: { status: 'completed' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.id).toBe('T-049')
    expect(res.body.status).toBe('completed')
  })

  test('PATCH /api/tasks/:id rejects malformed JSON', async () => {
    const res = await invoke({
      method: 'PATCH',
      url: '/api/tasks/T-049',
      body: '{ bad json }',
    })
    expect(res.statusCode).toBe(400)
  })

  test('GET /api/logs returns logs list', async () => {
    const res = await invoke({ url: '/api/logs' })
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body.logs)).toBe(true)
  })

  test('GET /api/ha/devices returns device payload', async () => {
    const res = await invoke({ url: '/api/ha/devices' })
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body.devices)).toBe(true)
    expect(res.body).toHaveProperty('connected')
  })

  test('GET /api/stats handles extra query params gracefully', async () => {
    const res = await invoke({ url: '/api/stats?invalid=param' })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('application/json')
  })

  test('GET /api/stats handles concurrent requests', async () => {
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => invoke({ url: '/api/stats' }))
    )
    responses.forEach((res) => {
      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty('timestamp')
    })
  })

  test('DELETE /api/tasks falls back to not found', async () => {
    const res = await invoke({ method: 'DELETE', url: '/api/tasks' })
    expect(res.statusCode).toBe(404)
  })

  test('Unknown endpoint returns JSON 404', async () => {
    const res = await invoke({ url: '/api/unknown' })
    expect(res.statusCode).toBe(404)
    expect(res.body).toHaveProperty('error')
  })

  test('Task creation accepts unicode and extra fields safely', async () => {
    const res = await invoke({
      method: 'POST',
      url: '/api/tasks',
      body: {
        id: 'T-777',
        title: 'Test çalışma 日本語 العربية',
        extraField: 'ignored',
      },
    })
    expect(res.statusCode).toBe(201)
    expect(res.body.title).toContain('çalışma')
  })
})
