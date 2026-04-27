import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Plus, Eye, Edit, Trash2, Layers } from 'lucide-react'

interface Collection {
  id: string
  name: string
  type: string
  system: boolean
  listRule: string | null
}

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('base')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadCollections()
  }, [])

  async function loadCollections() {
    try {
      const data = await api.get('/api/collections')
      setCollections(data.items || [])
    } catch (err: any) {
      console.error('Failed to load collections', err)
    } finally {
      setLoading(false)
    }
  }

  async function createCollection(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    
    try {
      await api.post('/api/collections', {
        name: newName.trim(),
        type: newType,
        fields: [],
        indexes: [],
      })
      setShowModal(false)
      setNewName('')
      loadCollections()
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function deleteCollection(id: string) {
    if (!confirm('Delete this collection and all its records?')) return
    setDeleting(id)
    try {
      await api.delete(`/api/collections/${id}`)
      loadCollections()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return <div className="empty-state">Loading...</div>

  const isEmpty = collections.length === 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Collections</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Collection
        </button>
      </div>

      {isEmpty ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <Layers size={48} color="#ccc" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: 8 }}>No Collections Yet</h3>
          <p style={{ color: '#666', marginBottom: 20 }}>Create your first collection to start storing data.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create Collection
          </button>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>System</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections.map(c => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/collections/${c.id}`} style={{ color: '#0066cc', textDecoration: 'none', fontWeight: 500 }}>
                      {c.name}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge badge-${c.type === 'auth' ? 'orange' : c.type === 'view' ? 'blue' : 'green'}`}>
                      {c.type}
                    </span>
                  </td>
                  <td>{c.system ? 'Yes' : 'No'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Link to={`/records/${c.id}`} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                        <Eye size={14} /> Records
                      </Link>
                      <Link to={`/collections/${c.id}`} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                        <Edit size={14} />
                      </Link>
                      {!c.system && (
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '4px 8px' }} 
                          onClick={() => deleteCollection(c.id)}
                          disabled={deleting === c.id}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Collection</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={createCollection}>
              <div className="form-group">
                <label>Collection Name</label>
                <input 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  placeholder="e.g. posts, users, products" 
                  required 
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={newType} onChange={e => setNewType(e.target.value)}>
                  <option value="base">Base (regular data)</option>
                  <option value="auth">Auth (user accounts)</option>
                  <option value="view">View (read-only)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Collection</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}