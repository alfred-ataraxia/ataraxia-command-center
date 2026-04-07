import { useState, useEffect, useRef } from 'react'
import { getActivity, getSystemStats } from '../services/haService'

const POLL_MS = 15_000

export function useHA() {
  const [state, setState] = useState({
    resources: null,
    systemStats: null,
    activity: null,
    loading: true,
    error: null,
    lastUpdated: null,
  })
  const timerRef = useRef(null)

  async function fetchData() {
    try {
      const [statsResult, activityResult] = await Promise.allSettled([
        getSystemStats(),
        getActivity(),
      ])

      const sysStats = statsResult.status === 'fulfilled' ? statsResult.value : null
      const activity = activityResult.status === 'fulfilled' ? activityResult.value : null

      const resources = sysStats
        ? [
            { label: 'İşlemci', key: 'cpu',  value: sysStats.cpuPercent,  color: 'bg-ax-accent' },
            { label: 'Bellek',  key: 'mem',  value: sysStats.memPercent,  color: 'bg-ax-cyan' },
            { label: 'Disk',    key: 'disk', value: sysStats.diskPercent, color: 'bg-ax-green' },
          ]
        : null

      setState({
        resources,
        systemStats: sysStats,
        activity,
        loading: false,
        error: statsResult.status === 'rejected' ? (statsResult.reason?.message || 'Stats API erişilemez') : null,
        lastUpdated: new Date(),
      })
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Bilinmeyen hata',
      }))
    }
  }

  useEffect(() => {
    fetchData()
    timerRef.current = setInterval(fetchData, POLL_MS)
    return () => clearInterval(timerRef.current)
  }, [])

  return state
}
