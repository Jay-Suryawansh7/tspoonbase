import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'

export default function Records() {
  const { collectionId } = useParams()
  const [collection, setCollection] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [filter, setFilter] = useState('')
  const [, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newRecord, setNewRecord] = useState<Record<string, any>>({})

  useEffect(() => {
    loadCollection()
  }, [collectionId])

  useEffect(() => {
    loadRecords()
  }, [collectionId, page, filter])

  async function loadCollection() {
    try {
      const data = await api.get(`/api/collections/${collectionId}`)
      setCollection(data)
    } catch (err: any) {
      console.error('Failed to load collection', err)
    }
  }

  async function loadRecords() {
    setLoading(true)
    try {
      let url = `/api/collections/${collectionId}/records?page=${page}&perPage=${perPage}`
      if (filter) url += `&filter=${encodeURIComponent(filter)}`
      const data = await api.get(url)
      setRecords(data.items || [])
      setTotalItems(data.totalItems || 0)
    } catch (err: any) {
      console.error('Failed to load records', err)
    } finally {
      setLoading(false)
    }
  }

  async function createRecord(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.post(`/api/collections/${collectionId}/records`, newRecord)
      setShowModal(false)
      setNewRecord({})
      loadRecords()
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function deleteRecord(id: string) {
    if (!confirm('Delete this record?')) return
    try {
      await api.delete(`/api/collections/${collectionId}/records/${id}`)
      loadRecords()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const totalPages = Math.ceil(totalItems / perPage)

  if (!collection) return <div className="empty-state">Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>{collection.name} Records</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Record
        </button>
      </div>

      <div className="search-bar">
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter..."
          onKeyDown={e => e.key === 'Enter' && loadRecords()}
        />
        <button className="btn btn-secondary" onClick={loadRecords}>
          <Search size={16} />
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              {collection.fields?.filter((f: any) => !f.hidden).slice(0, 4).map((f: any) => (
                <th key={f.id}>{f.name}</th>
              ))}
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td>
                  <Link to={`/records/${collectionId}/${r.id}`} style={{ color: '#0066cc', textDecoration: 'none', fontFamily: 'monospace', fontSize: 12 }}>
                    {r.id.slice(0, 8)}...
                  </Link>
                </td>
                {collection.fields?.filter((f: any) => !f.hidden).slice(0, 4).map((f: any) => (
                  <td key={f.id} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {String(r[f.name] ?? '').slice(0, 50)}
                  </td>
                ))}
                <td style={{ fontSize: 12, color: '#666' }}>{new Date(r.created).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => deleteRecord(r.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && <div className="empty-state">No records found</div>}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft size={14} /> Prev
          </button>
          <span style={{ padding: '8px 16px', fontSize: 14 }}>Page {page} of {totalPages}</span>
          <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Record</h3>
              <button onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={createRecord}>
              {collection.fields?.filter((f: any) => !f.system).map((field: any) => (
                <div className="form-group" key={field.id}>
                  <label>{field.name}</label>
                  {field.type === 'bool' ? (
                    <input type="checkbox" checked={!!newRecord[field.name]} onChange={e => setNewRecord({ ...newRecord, [field.name]: e.target.checked })} />
                  ) : field.type === 'select' ? (
                    <select value={newRecord[field.name] || ''} onChange={e => setNewRecord({ ...newRecord, [field.name]: e.target.value })}>
                      <option value="">--</option>
                      {field.values?.map((v: string) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ) : (
                    <input value={newRecord[field.name] || ''} onChange={e => setNewRecord({ ...newRecord, [field.name]: e.target.value })} />
                  )}
                </div>
              ))}
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
