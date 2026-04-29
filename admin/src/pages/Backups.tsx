import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Trash2, RefreshCw } from 'lucide-react'

export default function Backups() {
  const [backups, setBackups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadBackups() }, [])

  async function loadBackups() {
    try {
      const data = await api.get('/api/backups')
      setBackups(Array.isArray(data) ? data : [])
    } catch (err: any) { console.error('Failed to load backups', err) }
    finally { setLoading(false) }
  }

  async function createBackup() {
    setCreating(true)
    try {
      await api.post('/api/backups', { name: `backup_${Date.now()}.zip` })
      loadBackups()
    } catch (err: any) { alert(err.message) }
    finally { setCreating(false) }
  }

  async function deleteBackup(key: string) {
    if (!confirm('Delete this backup?')) return
    try { await api.delete(`/api/backups/${encodeURIComponent(key)}`); loadBackups() }
    catch (err: any) { alert(err.message) }
  }

  if (loading) return <div className="empty-state"><div className="spinner" /></div>

  return (
    <div>
      <div className="card-header">
        <h2>Backups</h2>
        <button className="btn btn-primary" onClick={createBackup} disabled={creating}>
          <RefreshCw size={15} /> {creating ? 'Creating...' : 'Create Backup'}
        </button>
      </div>

      {backups.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--text-muted)' }}>No backups yet.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Modified</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map(b => (
                  <tr key={b.key}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{b.key}</td>
                    <td>{(b.size / 1024 / 1024).toFixed(2)} MB</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(b.modified).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteBackup(b.key)}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
