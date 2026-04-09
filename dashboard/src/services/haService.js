import apiFetch from './apiFetch'

const BASE_URL = import.meta.env.VITE_HA_URL
const TOKEN = import.meta.env.VITE_HA_TOKEN
// Same origin — server.cjs serves both dashboard and /api/stats

const haHeaders = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
}

async function request(path) {
  const res = await fetch(`${BASE_URL}/api${path}`, { headers: haHeaders })
  if (!res.ok) throw new Error(`HA API ${res.status}: ${path}`)
  return res.json()
}

export async function getState(entityId) {
  return request(`/states/${entityId}`)
}

export async function getStates(entityIds) {
  const results = await Promise.allSettled(entityIds.map(id => getState(id)))
  return Object.fromEntries(
    entityIds.map((id, i) => [
      id,
      results[i].status === 'fulfilled' ? results[i].value : null,
    ])
  )
}

/** Numeric state value or null */
export function numericState(entity) {
  if (!entity) return null
  const n = parseFloat(entity.state)
  return isNaN(n) ? null : n
}

/**
 * Fetch recent activity from our own API (tasks, git, cron logs).
 */
export async function getActivity() {
  const res = await apiFetch('/api/activity')
  if (!res.ok) throw new Error(`Activity API ${res.status}`)
  const data = await res.json()
  return data.activities || []
}

/**
 * Fetch live system stats directly from the Pi stats API.
 * Returns { cpuPercent, memPercent, memUsedMB, memTotalMB, diskPercent, uptimeHuman }
 */
export async function getSystemStats() {
  const res = await apiFetch('/api/stats')
  if (!res.ok) throw new Error(`Stats API ${res.status}`)
  return res.json()
}

/**
 * Fetch tasks from TASKS.json via API.
 */
export async function getTasks() {
  const res = await apiFetch('/api/tasks')
  if (!res.ok) throw new Error(`Tasks API ${res.status}`)
  const data = await res.json()
  return data.tasks || []
}

/**
 * Add a new task via API. Returns the created task.
 */
export async function addTask(task) {
  const res = await apiFetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  })
  if (!res.ok) throw new Error(`Tasks API ${res.status}`)
  return res.json()
}

/**
 * Update a task's status (or other fields) via PUT API.
 */
export async function updateTask(taskId, updates) {
  const res = await apiFetch(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error(`Tasks API ${res.status}`)
  return res.json()
}

/**
 * Add a note to a task.
 */
export async function addTaskNote(taskId, text) {
  const res = await apiFetch(`/api/tasks/${taskId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(`Tasks API ${res.status}`)
  return res.json()
}

// Entity IDs for optional HA sensors (air quality, environment)
export const ENTITY_IDS = {
  co2:         'sensor.co2_concentration',
  temperature: 'sensor.indoor_temperature',
}
