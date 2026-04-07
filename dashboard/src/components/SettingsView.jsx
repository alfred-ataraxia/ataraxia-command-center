import { useState, useEffect } from 'react'
import { Cog, Monitor, Clock, Database, Bell, Wifi, Save, RotateCcw, Sun, Moon } from 'lucide-react'

export default function SettingsView() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ax-theme')
    return saved ? saved === 'dark' : true
  })

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('ax-notifications')
    return saved ? JSON.parse(saved) : {
      taskCompletion: true,
      cronAlerts: true,
      systemAlerts: true,
      haUpdates: true,
    }
  })

  const [cronSettings, setCronSettings] = useState(() => {
    const saved = localStorage.getItem('ax-cron-settings')
    return saved ? JSON.parse(saved) : {
      hourlyReportEnabled: true,
      taskWorkerInterval: '15',
      weeklyBackupDay: 'sunday',
    }
  })

  const [haSettings, setHaSettings] = useState(() => {
    const saved = localStorage.getItem('ax-ha-settings')
    return saved ? JSON.parse(saved) : {
      enabled: true,
      host: 'localhost',
      port: '8123',
      updateInterval: '30',
    }
  })

  const [saved, setSaved] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme ? 'dark' : 'light')
    localStorage.setItem('ax-theme', theme ? 'dark' : 'light')
  }, [theme])

  const handleSaveSettings = () => {
    localStorage.setItem('ax-notifications', JSON.stringify(notifications))
    localStorage.setItem('ax-cron-settings', JSON.stringify(cronSettings))
    localStorage.setItem('ax-ha-settings', JSON.stringify(haSettings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    if (window.confirm('Tüm ayarlar varsayılana döndürülecek. Emin misiniz?')) {
      localStorage.removeItem('ax-notifications')
      localStorage.removeItem('ax-cron-settings')
      localStorage.removeItem('ax-ha-settings')
      setNotifications({
        taskCompletion: true,
        cronAlerts: true,
        systemAlerts: true,
        haUpdates: true,
      })
      setCronSettings({
        hourlyReportEnabled: true,
        taskWorkerInterval: '15',
        weeklyBackupDay: 'sunday',
      })
      setHaSettings({
        enabled: true,
        host: 'localhost',
        port: '8123',
        updateInterval: '30',
      })
    }
  }

  const ToggleSwitch = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-ax-muted/30 border border-ax-border/50">
      <span className="text-xs text-ax-text">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={[
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          value ? 'bg-ax-green/20 border border-ax-green/30' : 'bg-ax-muted border border-ax-border',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block h-5 w-5 transform rounded-full bg-ax-text/20 transition-transform',
            value ? 'translate-x-5' : 'translate-x-0.5',
          ].join(' ')}
        />
      </button>
    </div>
  )

  const InputField = ({ label, value, onChange, type = 'text' }) => (
    <div className="space-y-1">
      <label className="text-xs text-ax-dim">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-ax-muted/50 border border-ax-border text-xs text-ax-text placeholder-ax-dim focus:outline-none focus:border-ax-accent/50"
      />
    </div>
  )

  const SelectField = ({ label, value, onChange, options }) => (
    <div className="space-y-1">
      <label className="text-xs text-ax-dim">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-ax-muted/50 border border-ax-border text-xs text-ax-text focus:outline-none focus:border-ax-accent/50"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cog size={18} className="text-ax-dim" />
          <h1 className="text-ax-heading text-xl font-bold">Ayarlar</h1>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-ax-green">✓ Kaydedildi</span>}
          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ax-accent/20 border border-ax-accent/30 text-ax-accent text-xs hover:bg-ax-accent/30 transition-colors"
          >
            <Save size={12} />
            Kaydet
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ax-muted/50 border border-ax-border text-ax-dim text-xs hover:text-ax-text transition-colors"
          >
            <RotateCcw size={12} />
            Sıfırla
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Theme Settings */}
        <div className="p-4 rounded-xl bg-ax-panel border border-ax-border space-y-3">
          <div className="flex items-center gap-2">
            {theme ? <Sun size={14} className="text-ax-amber" /> : <Moon size={14} className="text-ax-accent" />}
            <h2 className="text-ax-heading text-sm font-semibold">Tema</h2>
          </div>
          <button
            onClick={() => setTheme(t => !t)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-ax-muted/30 border border-ax-border/50 hover:border-ax-accent/30 transition-colors"
          >
            <span className="text-xs text-ax-text">{theme ? 'Koyu Tema' : 'Açık Tema'}</span>
            <span className="text-xs text-ax-accent">{theme ? 'Aktif' : 'Pasif'}</span>
          </button>
        </div>

        {/* Notification Preferences */}
        <div className="p-4 rounded-xl bg-ax-panel border border-ax-border space-y-3">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-ax-amber" />
            <h2 className="text-ax-heading text-sm font-semibold">Bildirim Tercihleri</h2>
          </div>
          <div className="space-y-2">
            <ToggleSwitch
              label="Görev Tamamlama Bildirimleri"
              value={notifications.taskCompletion}
              onChange={(v) => setNotifications({...notifications, taskCompletion: v})}
            />
            <ToggleSwitch
              label="Cron İş Uyarıları"
              value={notifications.cronAlerts}
              onChange={(v) => setNotifications({...notifications, cronAlerts: v})}
            />
            <ToggleSwitch
              label="Sistem Uyarıları"
              value={notifications.systemAlerts}
              onChange={(v) => setNotifications({...notifications, systemAlerts: v})}
            />
            <ToggleSwitch
              label="Home Assistant Güncellemeleri"
              value={notifications.haUpdates}
              onChange={(v) => setNotifications({...notifications, haUpdates: v})}
            />
          </div>
        </div>

        {/* Cron Settings */}
        <div className="p-4 rounded-xl bg-ax-panel border border-ax-border space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-ax-cyan" />
            <h2 className="text-ax-heading text-sm font-semibold">Cron Zamanlamaları</h2>
          </div>
          <div className="space-y-3">
            <ToggleSwitch
              label="Saatlik Rapor Etkinleştir"
              value={cronSettings.hourlyReportEnabled}
              onChange={(v) => setCronSettings({...cronSettings, hourlyReportEnabled: v})}
            />
            <InputField
              label="Task Worker Aralığı (dakika)"
              value={cronSettings.taskWorkerInterval}
              onChange={(v) => setCronSettings({...cronSettings, taskWorkerInterval: v})}
              type="number"
            />
            <SelectField
              label="Haftalık Yedekleme Günü"
              value={cronSettings.weeklyBackupDay}
              onChange={(v) => setCronSettings({...cronSettings, weeklyBackupDay: v})}
              options={[
                { value: 'sunday', label: 'Pazar' },
                { value: 'monday', label: 'Pazartesi' },
                { value: 'tuesday', label: 'Salı' },
                { value: 'wednesday', label: 'Çarşamba' },
                { value: 'thursday', label: 'Perşembe' },
                { value: 'friday', label: 'Cuma' },
                { value: 'saturday', label: 'Cumartesi' },
              ]}
            />
          </div>
        </div>

        {/* Home Assistant Settings */}
        <div className="p-4 rounded-xl bg-ax-panel border border-ax-border space-y-3">
          <div className="flex items-center gap-2">
            <Wifi size={14} className="text-ax-green" />
            <h2 className="text-ax-heading text-sm font-semibold">Home Assistant Bağlantısı</h2>
          </div>
          <div className="space-y-3">
            <ToggleSwitch
              label="Home Assistant Etkinleştir"
              value={haSettings.enabled}
              onChange={(v) => setHaSettings({...haSettings, enabled: v})}
            />
            {haSettings.enabled && (
              <>
                <InputField
                  label="Host"
                  value={haSettings.host}
                  onChange={(v) => setHaSettings({...haSettings, host: v})}
                />
                <InputField
                  label="Port"
                  value={haSettings.port}
                  onChange={(v) => setHaSettings({...haSettings, port: v})}
                  type="number"
                />
                <InputField
                  label="Güncelleme Aralığı (saniye)"
                  value={haSettings.updateInterval}
                  onChange={(v) => setHaSettings({...haSettings, updateInterval: v})}
                  type="number"
                />
              </>
            )}
          </div>
        </div>

        {/* System Info */}
        <div className="p-4 rounded-xl bg-ax-panel border border-ax-border space-y-3">
          <div className="flex items-center gap-2">
            <Monitor size={14} className="text-ax-accent" />
            <h2 className="text-ax-heading text-sm font-semibold">Sistem Bilgisi</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-ax-dim">Platform:</span> <span className="text-ax-text">Raspberry Pi 4</span></div>
            <div><span className="text-ax-dim">RAM:</span> <span className="text-ax-text">4GB + 4GB Swap</span></div>
            <div><span className="text-ax-dim">Dashboard Port:</span> <span className="text-ax-text">4173</span></div>
            <div><span className="text-ax-dim">Gateway Port:</span> <span className="text-ax-text">18789</span></div>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="p-4 rounded-xl bg-ax-panel border border-ax-border space-y-3">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-ax-green" />
            <h2 className="text-ax-heading text-sm font-semibold">Veri Kaynakları</h2>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-ax-dim">Stats API</span><span className="text-ax-green font-mono">/api/stats</span></div>
            <div className="flex justify-between"><span className="text-ax-dim">Tasks API</span><span className="text-ax-green font-mono">/api/tasks</span></div>
            <div className="flex justify-between"><span className="text-ax-dim">Activity API</span><span className="text-ax-green font-mono">/api/activity</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
