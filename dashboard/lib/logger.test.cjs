const logger = require('./logger.cjs')

describe('Logger', () => {
  it('should log info messages', (done) => {
    logger.info('Test info message', { test: true })
    setTimeout(() => {
      done()
    }, 100)
  })

  it('should log error messages', (done) => {
    logger.error('Test error message', { error: 'test' })
    setTimeout(() => {
      done()
    }, 100)
  })

  it('should log warn messages', (done) => {
    logger.warn('Test warning message', { warning: 'test' })
    setTimeout(() => {
      done()
    }, 100)
  })

  it('should log debug messages', (done) => {
    logger.debug('Test debug message', { debug: 'test' })
    setTimeout(() => {
      done()
    }, 100)
  })
})
