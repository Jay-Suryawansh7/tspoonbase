import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Database, HardDrive, Users, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState({ collections: 0, records: 0, users: 0 })
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const collections = await api.get('/api/collections')
        
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
        })

        if (collections.items?.length === 0) {
          setShowWelcome(true)
        }
      } catch (err: any) {
        console.error('Dashboard load failed', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) return <div className="empty-state">Loading...</div>

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Dashboard</h2>

      {showWelcome && (
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Zap size={40} />
            <div>
              <h3 style={{ color: 'white', marginBottom: 8 }}>Welcome to TspoonBase!</h3>
              <p style={{ opacity: 0.9, marginBottom: 16 }}>Get started by creating your first collection to store data.</p>
              <Link 
                to="/collections" 
                className="btn" 
                style={{ background: 'white', color: '#667eea', fontWeight: 600 }}
              >
                Create First Collection
              </Link>
            </div>
          </div>
        </div>
      )}

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

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <Link to="/collections" className="card" style={{ textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={20} color="#0066cc" />
            Manage Collections
          </h3>
          <p style={{ color: '#666', marginTop: 8 }}>Create and configure collections to organize your data.</p>
        </Link>
        <Link to="/settings" className="card" style={{ textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} color="#667eea" />
            Settings
          </h3>
          <p style={{ color: '#666', marginTop: 8 }}>Configure app settings, AI options, and more.</p>
        </Link>
      </div>
    </div>
  )
}