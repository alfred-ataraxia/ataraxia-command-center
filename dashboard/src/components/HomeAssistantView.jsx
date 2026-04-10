import { useState, useEffect } from 'react'
import { Lightbulb, Zap, Thermometer, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import apiFetch from '../services/apiFetch'

export default function HomeAssistantView() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connected, setConnected] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    fetchDevices()
  }, [refresh])

  async function fetchDevices() {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/ha/devices')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setDevices(data.devices || [])
      setConnected(data.connected !== false)
    } catch (err) {
      setError(err.message)
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }

  async function toggleDevice(device) {
    if (device.type !== 'light' && device.type !== 'switch') return

    const oldState = [...devices]
    setDevices(dev =>
      dev.map(d => d.id === device.id ? { ...d, state: d.state === 'on' ? 'off' : 'on' } : d)
    )

    try {
      const res = await apiFetch(`/api/ha/devices/${device.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: device.state === 'on' ? 'turn_off' : 'turn_on' }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      setError(err.message)
      setDevices(oldState)
    }
  }

  const groups = {
    lights: devices.filter(d => d.type === 'light'),
    switches: devices.filter(d => d.type === 'switch'),
    sensors: devices.filter(d => d.type === 'sensor'),
  }

  const DeviceCard = ({ device }) => {
    const isLight = device.type === 'light'
    const isSwitch = device.type === 'switch'
    const isSensor = device.type === 'sensor'
    const isOn = device.state === 'on'

    return (
      <div className="bg-ax-panel border border-ax-border rounded-lg p-4 hover:border-ax-accent/50 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 flex-1">
            {isLight && <Lightbulb size={18} className={isOn ? 'text-ax-green' : 'text-ax-dim'} />}
            {isSwitch && <Zap size={18} className={isOn ? 'text-ax-green' : 'text-ax-dim'} />}
            {isSensor && <Thermometer size={18} className="text-ax-blue" />}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-ax-heading truncate">{device.name}</p>
              <p className="text-xs text-ax-dim">{device.id}</p>
            </div>
          </div>
          {(isLight || isSwitch) && (
            <button
              onClick={() => toggleDevice(device)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                isOn
                  ? 'bg-ax-green/20 text-ax-green'
                  : 'bg-ax-muted text-ax-dim hover:text-ax-text'
              }`}
            >
              {isOn ? 'On' : 'Off'}
            </button>
          )}
        </div>

        {(device.brightness !== undefined || device.temperature !== undefined || device.humidity !== undefined || device.value !== undefined) && (
          <div className="space-y-1">
            {device.brightness !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-ax-dim">Parlaklık</span>
                <span className="text-ax-text font-medium">{device.brightness}%</span>
              </div>
            )}
            {device.temperature !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-ax-dim">Sıcaklık</span>
                <span className="text-ax-text font-medium">{device.temperature}°C</span>
              </div>
            )}
            {device.humidity !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-ax-dim">Nem</span>
                <span className="text-ax-text font-medium">{device.humidity}%</span>
              </div>
            )}
            {device.value !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-ax-dim">Değer</span>
                <span className="text-ax-text font-medium">{device.value} {device.unit || ''}</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ax-bg p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-ax-accent/20 border border-ax-accent/30">
              <Zap size={20} className="text-ax-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ax-heading">Home Assistant</h1>
              <p className="text-sm text-ax-dim">Otomasyon Kontrol Paneli</p>
            </div>
          </div>
          <button
            onClick={() => setRefresh(r => r + 1)}
            className={`p-2.5 rounded-lg border border-ax-border bg-ax-panel hover:bg-ax-muted transition-all ${
              loading ? 'animate-spin' : ''
            }`}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2 mt-4">
          {connected ? (
            <>
              <Wifi size={14} className="text-ax-green" />
              <span className="text-sm text-ax-green">Bağlı</span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-ax-red" />
              <span className="text-sm text-ax-red">Bağlantı Yok</span>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-ax-red/10 border border-ax-red/30 flex items-center gap-3">
          <AlertCircle size={16} className="text-ax-red flex-shrink-0" />
          <span className="text-sm text-ax-red">{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border-2 border-ax-border border-t-ax-accent animate-spin mx-auto mb-3" />
            <p className="text-sm text-ax-dim">Cihazlar yükleniyor...</p>
          </div>
        </div>
      )}

      {/* Devices */}
      {!loading && devices.length > 0 && (
        <>
          {/* Lights */}
          {groups.lights.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-ax-heading mb-4 flex items-center gap-2">
                <Lightbulb size={18} />
                Işıklar ({groups.lights.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.lights.map(device => (
                  <DeviceCard key={device.id} device={device} />
                ))}
              </div>
            </div>
          )}

          {/* Switches */}
          {groups.switches.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-ax-heading mb-4 flex items-center gap-2">
                <Zap size={18} />
                Anahtarlar ({groups.switches.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.switches.map(device => (
                  <DeviceCard key={device.id} device={device} />
                ))}
              </div>
            </div>
          )}

          {/* Sensors */}
          {groups.sensors.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-ax-heading mb-4 flex items-center gap-2">
                <Thermometer size={18} />
                Sensörler ({groups.sensors.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.sensors.map(device => (
                  <DeviceCard key={device.id} device={device} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && devices.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16">
          <Zap size={32} className="text-ax-dim/50 mb-3" />
          <p className="text-ax-dim mb-1">Cihaz bulunamadı</p>
          <p className="text-xs text-ax-subtle">Home Assistant bağlantısını kontrol edin</p>
        </div>
      )}
    </div>
  )
}
