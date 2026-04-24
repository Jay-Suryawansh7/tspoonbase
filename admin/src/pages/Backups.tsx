import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Trash2, RefreshCw } from 'lucide-react'

export default function Backups() {
  const [backups, setBackups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBackups()
  }, [])

  async function loadBackups() {
    try {
      const data = await api.get('/api/backups')
      setBackups(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error('Failed to load backups', err)
    } finally {
      setLoading(false)
    }
  }

  async function createBackup() {
    try {
      await api.post('/api/backups', { name: `backup_${Date.now()}.zip` })
      loadBackups()
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function deleteBackup(key: string) {
    if (!confirm('Delete this backup?')) return
    try {
      await api.delete(`/api/backups/${key}`)
      loadBackups()
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) return <div className="empty-state">Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Backups</h2>
        <button className="btn btn-primary" onClick={createBackup}>
          <RefreshCw size={16} /> Create Backup
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Size</th>
              <th>Modified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {backups.map(b => (
              <tr key={b.key}>
                <td>{b.key}</td>
                <td>{(b.size / 1024 / 1024).toFixed(2)} MB</td>
                <td>{new Date(b.modified).toLocaleString()}</td>
                <td>
                  <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => deleteBackup(b.key)}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {backups.length === 0 && <div className="empty-state">No backups yet</div>}
      </div>
    </div>
  )
}
