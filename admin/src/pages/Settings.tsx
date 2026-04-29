import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Settings() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    try { setSettings(await api.get('/api/settings')) }
    catch (err: any) { console.error('Failed to load settings', err) }
    finally { setLoading(false) }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try { await api.patch('/api/settings', settings); alert('Settings saved') }
    catch (err: any) { alert(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="empty-state"><div className="spinner" /></div>

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Settings</h2>
      <form onSubmit={saveSettings}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>General</h3>
          <div className="form-group">
            <label>Site Name</label>
            <input value={settings?.meta?.appName || ''} onChange={e => setSettings({ ...settings, meta: { ...settings.meta, appName: e.target.value } })} />
          </div>
          <div className="form-group">
            <label>Site URL</label>
            <input value={settings?.meta?.appUrl || ''} onChange={e => setSettings({ ...settings, meta: { ...settings.meta, appUrl: e.target.value } })} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>SMTP</h3>
          <div className="form-group">
            <label>Host</label>
            <input value={settings?.smtp?.host || ''} onChange={e => setSettings({ ...settings, smtp: { ...settings.smtp, host: e.target.value } })} />
          </div>
          <div className="form-group">
            <label>Port</label>
            <input type="number" value={settings?.smtp?.port || ''} onChange={e => setSettings({ ...settings, smtp: { ...settings.smtp, port: parseInt(e.target.value) } })} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <><span className="spinner" /> Saving...</> : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
