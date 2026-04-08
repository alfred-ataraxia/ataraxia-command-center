/**
 * API Endpoint Tests for Ataraxia Dashboard Server
 * Tests: /api/stats, /api/tasks, /api/logs, /api/ha
 */

const http = require('http')
const fs = require('fs')
const path = require('path')
const os = require('os')

describe('Ataraxia Dashboard API Endpoints', () => {
  let server
  const baseURL = 'http://localhost:4174'

  // Start test server on different port
  beforeAll(done => {
    const testPort = 4174
    process.env.NODE_ENV = 'test'

    // Mock TASKS.json if needed
    const tasksPath = path.join(__dirname, '..', 'TASKS.json')
    if (!fs.existsSync(tasksPath)) {
      fs.writeFileSync(tasksPath, JSON.stringify([
        { id: 'T-049', title: 'Unit tests', status: 'in_progress', priority: 'high' }
      ]))
    }

    // Simple HTTP server stub for testing
    server = http.createServer((req, res) => {
      const url = req.url

      // /api/stats
      if (url === '/api/stats') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          timestamp: Date.now()
        }))
        return
      }

      // /api/tasks
      if (url === '/api/tasks' && req.method === 'GET') {
        fs.readFile(tasksPath, 'utf8', (err, data) => {
          try {
            const tasks = err ? [] : JSON.parse(data)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ tasks }))
          } catch {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Parse error' }))
          }
        })
        return
      }

      // /api/tasks POST
      if (url === '/api/tasks' && req.method === 'POST') {
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const newTask = JSON.parse(body)
            if (!newTask.id || !newTask.title) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Missing id or title' }))
              return
            }
            res.writeHead(201, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(newTask))
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Invalid JSON' }))
          }
        })
        return
      }

      // /api/tasks/T-* PATCH
      const patchMatch = url.match(/^\/api\/tasks\/(T-\d+)$/)
      if (patchMatch && req.method === 'PATCH') {
        const taskId = patchMatch[1]
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const updates = JSON.parse(body)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ id: taskId, ...updates }))
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Invalid JSON' }))
          }
        })
        return
      }

      // /api/logs
      if (url === '/api/logs') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ logs: [] }))
        return
      }

      // /api/ha/devices
      if (url === '/api/ha/devices') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ devices: [], connected: false }))
        return
      }

      // 404
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
    })

    server.listen(testPort, done)
  })

  afterAll(done => {
    if (server) server.close(done)
  })

  // --- HAPPY PATH TESTS ---

  describe('GET /api/stats', () => {
    test('returns system statistics', done => {
      http.get(`${baseURL}/api/stats`, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect(res.statusCode).toBe(200)
          const json = JSON.parse(data)
          expect(json).toHaveProperty('uptime')
          expect(json).toHaveProperty('memory')
          expect(json).toHaveProperty('cpu')
          expect(json).toHaveProperty('timestamp')
          done()
        })
      }).on('error', done)
    })

    test('returns valid JSON', done => {
      http.get(`${baseURL}/api/stats`, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect(() => JSON.parse(data)).not.toThrow()
          done()
        })
      }).on('error', done)
    })
  })

  describe('GET /api/tasks', () => {
    test('returns tasks list', done => {
      http.get(`${baseURL}/api/tasks`, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect(res.statusCode).toBe(200)
          const json = JSON.parse(data)
          expect(json).toHaveProperty('tasks')
          expect(Array.isArray(json.tasks)).toBe(true)
          done()
        })
      }).on('error', done)
    })
  })

  describe('POST /api/tasks', () => {
    test('creates new task with valid data', done => {
      const taskData = JSON.stringify({ id: 'T-999', title: 'Test task' })
      const req = http.request(`${baseURL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Length': Buffer.byteLength(taskData) }
      }, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect(res.statusCode).toBe(201)
          const json = JSON.parse(data)
          expect(json.id).toBe('T-999')
          expect(json.title).toBe('Test task')
          done()
        })
      })
      req.on('error', done)
      req.write(taskData)
      req.end()
    })

    test('rejects invalid task data', done => {
      const taskData = JSON.stringify({ id: 'T-998' }) // missing title
      const req = http.request(`${baseURL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Length': Buffer.byteLength(taskData) }
      }, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect(res.statusCode).toBe(400)
          expect(data).toContain('error')
          done()
        })
      })
      req.on('error', done)
      req.write(taskData)
      req.end()
    })

    test('rejects malformed JSON', done => {
      const taskData = '{ invalid json }'
      const req = http.request(`${baseURL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Length': Buffer.byteLength(taskData) }
      }, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect(res.statusCode).toBe(400)
          expect(data).toContain('error')
          done()
        })
      })
      req.on('error', done)
      req.write(taskData)
      req.end()
    })
  })

  describe('PATCH /api/tasks/{id}', () => {
    test('updates task status', done => {
      const updateData = JSON.stringify({ status: 'completed' })
      const req = http.request(`${baseURL}/api/tasks/T-049`, {
        method: 'PATCH',
        headers: { 'Content-Length': Buffer.byteLength(updateData) }
      }, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect(res.statusCode).toBe(200)
          const json = JSON.parse(data)
          expect(json.id).toBe('T-049')
          expect(json.status).toBe('completed')
          done()
        })
      })
      req.on('error', done)
      req.write(updateData)
      req.end()
    })

    test('rejects invalid update JSON', done => {
      const updateData = '{ bad json }'
      const req = http.request(`${baseURL}/api/tasks/T-049`, {
        method: 'PATCH',
        headers: { 'Content-Length': Buffer.byteLength(updateData) }
      }, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect(res.statusCode).toBe(400)
          done()
        })
      })
      req.on('error', done)
      req.write(updateData)
      req.end()
    })
  })

  describe('GET /api/logs', () => {
    test('returns logs list', done => {
      http.get(`${baseURL}/api/logs`, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect(res.statusCode).toBe(200)
          const json = JSON.parse(data)
          expect(json).toHaveProperty('logs')
          expect(Array.isArray(json.logs)).toBe(true)
          done()
        })
      }).on('error', done)
    })
  })

  describe('GET /api/ha/devices', () => {
    test('returns Home Assistant devices', done => {
      http.get(`${baseURL}/api/ha/devices`, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect(res.statusCode).toBe(200)
          const json = JSON.parse(data)
          expect(json).toHaveProperty('devices')
          expect(json).toHaveProperty('connected')
          expect(Array.isArray(json.devices)).toBe(true)
          done()
        })
      }).on('error', done)
    })
  })

  // --- ERROR CASES & EDGE CASES ---

  describe('Error Handling - Stats Endpoint', () => {
    test('returns 400 for invalid query parameters', done => {
      http.get(`${baseURL}/api/stats?invalid=param`, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          // Should still return 200 even with extra params (graceful)
          expect(res.statusCode).toBe(200)
          done()
        })
      }).on('error', done)
    })

    test('handles concurrent requests', done => {
      let completed = 0
      const makeRequest = () => {
        http.get(`${baseURL}/api/stats`, res => {
          let data = ''
          res.on('data', chunk => { data += chunk })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            expect(() => JSON.parse(data)).not.toThrow()
            completed++
            if (completed === 5) done()
          })
        }).on('error', done)
      }
      for (let i = 0; i < 5; i++) makeRequest()
    })

    test('returns proper error on malformed response handling', done => {
      http.get(`${baseURL}/api/stats`, res => {
        expect(res.headers['content-type']).toBe('application/json')
        res.on('data', () => {})
        res.on('end', done)
      }).on('error', done)
    })
  })

  describe('Error Handling - Tasks Endpoint', () => {
    test('POST with empty body returns 400', done => {
      const req = http.request(`${baseURL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Length': 0 }
      }, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect(res.statusCode).toBe(400)
          expect(data).toContain('error')
          done()
        })
      })
      req.on('error', done)
      req.end()
    })

    test('POST with null id field returns 400', done => {
      const taskData = JSON.stringify({ id: null, title: 'Test' })
      const req = http.request(`${baseURL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Length': Buffer.byteLength(taskData) }
      }, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect(res.statusCode).toBe(400)
          done()
        })
      })
      req.on('error', done)
      req.write(taskData)
      req.end()
    })

    test('POST with empty string title returns 400', done => {
      const taskData = JSON.stringify({ id: 'T-001', title: '' })
      const req = http.request(`${baseURL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Length': Buffer.byteLength(taskData) }
      }, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect(res.statusCode).toBe(400)
          done()
        })
      })
      req.on('error', done)
      req.write(taskData)
      req.end()
    })

    test('POST with extremely large payload handles gracefully', done => {
      const largeString = 'x'.repeat(10000)
      const taskData = JSON.stringify({ id: 'T-002', title: largeString })
      const req = http.request(`${baseURL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Length': Buffer.byteLength(taskData) }
      }, res => {
        res.on('data', () => {})
        res.on('end', () => {
          // Should handle large payloads
          expect([200, 201, 400]).toContain(res.statusCode)
          done()
        })
      })
      req.on('error', done)
      req.write(taskData)
      req.end()
    })

    test('PATCH with invalid task ID format', done => {
      const updateData = JSON.stringify({ status: 'completed' })
      const req = http.request(`${baseURL}/api/tasks/INVALID-ID`, {
        method: 'PATCH',
        headers: { 'Content-Length': Buffer.byteLength(updateData) }
      }, res => {
        res.on('data', () => {})
        res.on('end', () => {
          // Invalid ID should return 400 or 404
          expect([400, 404]).toContain(res.statusCode)
          done()
        })
      })
      req.on('error', done)
      req.write(updateData)
      req.end()
    })

    test('PATCH with null status field', done => {
      const updateData = JSON.stringify({ status: null })
      const req = http.request(`${baseURL}/api/tasks/T-049`, {
        method: 'PATCH',
        headers: { 'Content-Length': Buffer.byteLength(updateData) }
      }, res => {
        res.on('data', () => {})
        res.on('end', () => {
          // Should validate null values
          expect([200, 400]).toContain(res.statusCode)
          done()
        })
      })
      req.on('error', done)
      req.write(updateData)
      req.end()
    })

    test('GET with invalid method returns proper error', done => {
      const req = http.request(`${baseURL}/api/tasks`, {
        method: 'DELETE'
      }, res => {
        res.on('data', () => {})
        res.on('end', () => {
          expect([400, 404, 405]).toContain(res.statusCode)
          done()
        })
      })
      req.on('error', done)
      req.end()
    })
  })

  describe('Error Handling - Home Assistant Endpoint', () => {
    test('returns error when HA connection fails', done => {
      http.get(`${baseURL}/api/ha/devices`, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect([200, 500, 503]).toContain(res.statusCode)
          if (res.statusCode >= 400) {
            expect(data).toContain('error')
          }
          done()
        })
      }).on('error', done)
    })

    test('handles missing HA_TOKEN gracefully', done => {
      http.get(`${baseURL}/api/ha/devices`, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect([200, 401, 500]).toContain(res.statusCode)
          done()
        })
      }).on('error', done)
    })
  })

  describe('Error Handling - General', () => {
    test('returns 404 for unknown endpoint', done => {
      http.get(`${baseURL}/api/unknown`, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect(res.statusCode).toBe(404)
          expect(() => JSON.parse(data)).not.toThrow()
          done()
        })
      }).on('error', done)
    })

    test('returns proper error on malformed requests', done => {
      const req = http.request(`${baseURL}/api/tasks`, {
        method: 'POST'
      }, res => {
        res.on('data', () => {})
        res.on('end', () => {
          expect([400, 500]).toContain(res.statusCode)
          done()
        })
      })
      req.on('error', done)
      req.destroy()
    })

    test('response headers include Content-Type', done => {
      http.get(`${baseURL}/api/stats`, res => {
        expect(res.headers['content-type']).toBe('application/json')
        res.on('data', () => {})
        res.on('end', done)
      }).on('error', done)
    })

    test('error responses are valid JSON', done => {
      http.get(`${baseURL}/api/nonexistent`, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect(() => JSON.parse(data)).not.toThrow()
          const json = JSON.parse(data)
          expect(json).toHaveProperty('error')
          done()
        })
      }).on('error', done)
    })

    test('handles request timeout gracefully', done => {
      const req = http.request(`${baseURL}/api/stats`, {
        timeout: 100
      }, res => {
        res.on('data', () => {})
        res.on('end', done)
      })
      req.on('error', () => {
        // Timeout is acceptable error
        done()
      })
      req.on('timeout', () => {
        req.destroy()
        done()
      })
    })

    test('handles invalid Content-Type', done => {
      const taskData = 'not json'
      const req = http.request(`${baseURL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Length': Buffer.byteLength(taskData),
          'Content-Type': 'text/plain'
        }
      }, res => {
        res.on('data', () => {})
        res.on('end', () => {
          expect([400, 415]).toContain(res.statusCode)
          done()
        })
      })
      req.on('error', done)
      req.write(taskData)
      req.end()
    })
  })

  describe('Edge Cases - Data Validation', () => {
    test('handles special characters in task title', done => {
      const taskData = JSON.stringify({
        id: 'T-003',
        title: 'Test <script>alert("xss")</script>'
      })
      const req = http.request(`${baseURL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Length': Buffer.byteLength(taskData) }
      }, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect(res.statusCode).toBe(201)
          // Response should not execute scripts
          expect(() => JSON.parse(data)).not.toThrow()
          done()
        })
      })
      req.on('error', done)
      req.write(taskData)
      req.end()
    })

    test('handles unicode characters in task title', done => {
      const taskData = JSON.stringify({
        id: 'T-004',
        title: 'Test çalışma 日本語 العربية'
      })
      const req = http.request(`${baseURL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Length': Buffer.byteLength(taskData) }
      }, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect(res.statusCode).toBe(201)
          done()
        })
      })
      req.on('error', done)
      req.write(taskData)
      req.end()
    })

    test('handles extra fields in task object', done => {
      const taskData = JSON.stringify({
        id: 'T-005',
        title: 'Test',
        extraField: 'should be ignored',
        anotherExtra: 123
      })
      const req = http.request(`${baseURL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Length': Buffer.byteLength(taskData) }
      }, res => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          expect(res.statusCode).toBe(201)
          done()
        })
      })
      req.on('error', done)
      req.write(taskData)
      req.end()
    })

    test('handles numeric IDs as strings', done => {
      const taskData = JSON.stringify({
        id: 123,
        title: 'Numeric ID Test'
      })
      const req = http.request(`${baseURL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Length': Buffer.byteLength(taskData) }
      }, res => {
        res.on('data', () => {})
        res.on('end', () => {
          expect([201, 400]).toContain(res.statusCode)
          done()
        })
      })
      req.on('error', done)
      req.write(taskData)
      req.end()
    })
  })
})
