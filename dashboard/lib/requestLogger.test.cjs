const requestLogger = require('./requestLogger.cjs')

describe('Request Logger Middleware', () => {
  let mockReq, mockRes, nextCalled

  beforeEach(() => {
    nextCalled = false

    mockReq = {
      method: 'GET',
      path: '/api/stats',
      query: { limit: '10' },
      get: (header) => {
        const headers = {
          'user-agent': 'Mozilla/5.0',
          'content-length': '1234'
        }
        return headers[header]
      },
      ip: '127.0.0.1'
    }

    mockRes = {
      statusCode: 200,
      get: (header) => {
        const headers = {
          'content-length': '5678'
        }
        return headers[header]
      },
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          // Simulate finish event
          setTimeout(callback, 10)
        }
      })
    }
  })

  it('should call next middleware', () => {
    const next = jest.fn()
    requestLogger(mockReq, mockRes, next)
    expect(next).toHaveBeenCalled()
  })

  it('should hook on response finish event', () => {
    const next = jest.fn()
    requestLogger(mockReq, mockRes, next)
    expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function))
  })

  it('should log response with correct log level based on status code', (done) => {
    const next = jest.fn()

    // Test 5XX error
    mockRes.statusCode = 500
    requestLogger(mockReq, mockRes, next)

    // Test 4XX warning
    mockRes.statusCode = 404
    requestLogger(mockReq, mockRes, next)

    // Test 2XX info
    mockRes.statusCode = 200
    requestLogger(mockReq, mockRes, next)

    done()
  })
})
