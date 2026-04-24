import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Plus, Eye, Edit, Trash2 } from 'lucide-react'

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
    try {
      await api.post('/api/collections', {
        name: newName,
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
    if (!confirm('Delete this collection? This cannot be undone.')) return
    try {
      await api.delete(`/api/collections/${id}`)
      loadCollections()
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) return <div className="empty-state">Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Collections</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Collection
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>System</th>
              <th>Actions</th>
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
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/records/${c.id}`} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                      <Eye size={14} /> Records
                    </Link>
                    <Link to={`/collections/${c.id}`} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                      <Edit size={14} />
                    </Link>
                    {!c.system && (
                      <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => deleteCollection(c.id)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {collections.length === 0 && <div className="empty-state">No collections yet</div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Collection</h3>
              <button onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={createCollection}>
              <div className="form-group">
                <label>Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. posts" required />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={newType} onChange={e => setNewType(e.target.value)}>
                  <option value="base">Base</option>
                  <option value="auth">Auth</option>
                  <option value="view">View</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
