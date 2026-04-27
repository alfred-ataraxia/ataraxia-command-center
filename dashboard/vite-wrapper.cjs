#!/usr/bin/env node
/**
 * Vite wrapper — gateway "vite preview" çağırdığında server.cjs'i başlatır.
 * Diğer komutlar (build, dev) gerçek vite'a yönlendirilir.
 */
const args = process.argv.slice(2)

if (args[0] === 'preview') {
  // "vite preview" → server.cjs (CJS, require ile yüklenebilir)
  require('./server.cjs')
} else {
  // build, dev vs. → gerçek vite'ı exec ile çalıştır (ESM uyumlu)
  const { execFileSync } = require('child_process')
  const path = require('path')
  const realVite = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js')
  try {
    execFileSync(process.execPath, [realVite, ...args], { stdio: 'inherit' })
  } catch (e) {
    process.exit(e.status || 1)
  }
}
