module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.cjs', '**/*.test.js'],
  collectCoverageFrom: ['server.cjs'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  verbose: true
}
