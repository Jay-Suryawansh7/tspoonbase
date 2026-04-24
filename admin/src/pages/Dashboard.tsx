import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Database, Users, FileText, HardDrive } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({ collections: 0, records: 0, users: 0, logs: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [collections, logs] = await Promise.all([
          api.get('/api/collections'),
          api.get('/api/logs?page=1&perPage=1'),
        ])

        let totalRecords = 0
        let totalUsers = 0

        for (const c of collections.items || []) {
          try {
            const recs = await api.get(`/api/collections/${c.id}/records?page=1&perPage=1&skipTotal=false`)
            totalRecords += recs.totalItems || 0
            if (c.type === 'auth') {
              totalUsers += recs.totalItems || 0
            }
          } catch {
            // ignore
          }
        }

        setStats({
          collections: collections.items?.length || 0,
          records: totalRecords,
          users: totalUsers,
          logs: logs.totalItems || 0,
        })
      } catch (err: any) {
        console.error('Dashboard load failed', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) return <div className="empty-state">Loading dashboard...</div>

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Dashboard</h2>
      <div className="grid-3">
        <div className="stat-card">
          <Database size={24} color="#0066cc" />
          <div className="value">{stats.collections}</div>
          <div className="label">Collections</div>
        </div>
        <div className="stat-card">
          <HardDrive size={24} color="#2e7d32" />
          <div className="value">{stats.records}</div>
          <div className="label">Total Records</div>
        </div>
        <div className="stat-card">
          <Users size={24} color="#e65100" />
          <div className="value">{stats.users}</div>
          <div className="label">Auth Users</div>
        </div>
      </div>
    </div>
  )
}
