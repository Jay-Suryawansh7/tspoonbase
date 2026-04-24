import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Settings() {
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const data = await api.get('/api/settings')
      setSettings(data)
    } catch (err: any) {
      console.error('Failed to load settings', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch('/api/settings', settings)
      alert('Settings saved')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="empty-state">Loading...</div>

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Settings</h2>
      <form onSubmit={saveSettings}>
        <div className="card">
          <h3>Application</h3>
          <div className="form-group">
            <label>App Name</label>
            <input value={settings.appName || ''} onChange={e => setSettings({ ...settings, appName: e.target.value })} />
          </div>
          <div className="form-group">
            <label>App URL</label>
            <input value={settings.appURL || ''} onChange={e => setSettings({ ...settings, appURL: e.target.value })} />
          </div>
        </div>

        <div className="card">
          <h3>SMTP</h3>
          <div className="form-group">
            <label>Host</label>
            <input value={settings.smtp?.host || ''} onChange={e => setSettings({ ...settings, smtp: { ...settings.smtp, host: e.target.value } })} />
          </div>
          <div className="form-group">
            <label>Port</label>
            <input type="number" value={settings.smtp?.port || ''} onChange={e => setSettings({ ...settings, smtp: { ...settings.smtp, port: parseInt(e.target.value) } })} />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input value={settings.smtp?.username || ''} onChange={e => setSettings({ ...settings, smtp: { ...settings.smtp, username: e.target.value } })} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={settings.smtp?.password || ''} onChange={e => setSettings({ ...settings, smtp: { ...settings.smtp, password: e.target.value } })} />
          </div>
        </div>

        <div className="card">
          <h3>S3 Storage</h3>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={settings.s3?.enabled || false} onChange={e => setSettings({ ...settings, s3: { ...settings.s3, enabled: e.target.checked } })} />
              Enabled
            </label>
          </div>
          <div className="form-group">
            <label>Bucket</label>
            <input value={settings.s3?.bucket || ''} onChange={e => setSettings({ ...settings, s3: { ...settings.s3, bucket: e.target.value } })} />
          </div>
          <div className="form-group">
            <label>Region</label>
            <input value={settings.s3?.region || ''} onChange={e => setSettings({ ...settings, s3: { ...settings.s3, region: e.target.value } })} />
          </div>
          <div className="form-group">
            <label>Endpoint</label>
            <input value={settings.s3?.endpoint || ''} onChange={e => setSettings({ ...settings, s3: { ...settings.s3, endpoint: e.target.value } })} placeholder="https://s3.amazonaws.com" />
          </div>
          <div className="form-group">
            <label>Access Key</label>
            <input value={settings.s3?.accessKey || ''} onChange={e => setSettings({ ...settings, s3: { ...settings.s3, accessKey: e.target.value } })} />
          </div>
          <div className="form-group">
            <label>Secret Key</label>
            <input type="password" value={settings.s3?.secret || ''} onChange={e => setSettings({ ...settings, s3: { ...settings.s3, secret: e.target.value } })} />
          </div>
        </div>

        <div className="card">
          <h3>AI</h3>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={settings.ai?.enabled || false} onChange={e => setSettings({ ...settings, ai: { ...settings.ai, enabled: e.target.checked } })} />
              Enabled
            </label>
          </div>
          <div className="form-group">
            <label>Provider</label>
            <select value={settings.ai?.provider || 'openai'} onChange={e => setSettings({ ...settings, ai: { ...settings.ai, provider: e.target.value } })}>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="ollama">Ollama</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="form-group">
            <label>API Key</label>
            <input type="password" value={settings.ai?.apiKey || ''} onChange={e => setSettings({ ...settings, ai: { ...settings.ai, apiKey: e.target.value } })} />
          </div>
          <div className="form-group">
            <label>Model</label>
            <input value={settings.ai?.model || ''} onChange={e => setSettings({ ...settings, ai: { ...settings.ai, model: e.target.value } })} placeholder="gpt-4o-mini" />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
