import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import { Plus, Search, ChevronLeft, ChevronRight, ArrowLeft, X, Trash2 } from 'lucide-react'

export default function Records() {
  const { collectionId } = useParams()
  const [collection, setCollection] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newRecord, setNewRecord] = useState<Record<string, any>>({})

  useEffect(() => { loadCollection() }, [collectionId])
  useEffect(() => { loadRecords() }, [collectionId, page, filter])

  async function loadCollection() {
    try { setCollection(await api.get(`/api/collections/${collectionId}`)) }
    catch (err: any) { console.error('Failed to load collection', err) }
  }

  async function loadRecords() {
    setLoading(true)
    try {
      let url = `/api/collections/${collectionId}/records?page=${page}&perPage=${perPage}`
      if (filter) url += `&filter=${encodeURIComponent(filter)}`
      const data = await api.get(url)
      setRecords(data.items || []); setTotalItems(data.totalItems || 0)
    } catch (err: any) { console.error('Failed to load records', err) }
    finally { setLoading(false) }
  }

  async function createRecord(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.post(`/api/collections/${collectionId}/records`, newRecord)
      setShowModal(false); setNewRecord({})
      setPage(1); loadRecords()
    } catch (err: any) { alert(err.message) }
  }

  async function deleteRecord(id: string) {
    if (!confirm('Delete this record?')) return
    try {
      await api.delete(`/api/collections/${collectionId}/records/${id}`)
      loadRecords()
    } catch (err: any) { alert(err.message) }
  }

  const totalPages = Math.ceil(totalItems / perPage)
  const displayFields = collection?.fields?.filter((f: any) => !f.system && f.type !== 'json' && f.type !== 'editor')?.slice(0, 4) || []

  const getFieldValue = (rec: any, field: any) => {
    const val = rec[field.name]
    if (val === null || val === undefined) return <span style={{ color: 'var(--text-muted)' }}>—</span>
    if (field.type === 'bool') return val ? 'Yes' : 'No'
    if (field.type === 'date') return new Date(val).toLocaleString()
    if (typeof val === 'object') return JSON.stringify(val).slice(0, 40) + '...'
    return String(val).slice(0, 60)
  }

  if (!collection && loading) return <div className="empty-state"><div className="spinner" /></div>

  return (
    <div>
      <button className="btn btn-ghost" onClick={() => window.history.back()} style={{ marginBottom: 16 }}>
        <ArrowLeft size={15} /> Back
      </button>
      <div className="card-header">
        <h2>Records: {collection?.name || '...'}</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} /> New Record
        </button>
      </div>

      <div className="search-bar">
        <input
          placeholder={`Search ${collection?.name || ''} records...`}
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(1) }}
        />
        <button className="btn btn-ghost"><Search size={15} /></button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner" /></div>
      ) : records.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            {filter ? 'No records match your filter.' : 'No records yet.'}
          </p>
          {!filter && <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Create Record</button>}
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  {displayFields.map((f: any) => <th key={f.id}>{f.name}</th>)}
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map(rec => (
                  <tr key={rec.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                      {rec.id?.slice(0, 8)}...
                    </td>
                    {displayFields.map((f: any) => (
                      <td key={f.id}>{getFieldValue(rec, f)}</td>
                    ))}
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <Link to={`/records/${collectionId}/${rec.id}`} className="btn btn-ghost btn-sm">Edit</Link>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteRecord(rec.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={14} />
              </button>
              <span className="pagination-info">Page {page} of {totalPages} ({totalItems} total)</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Record — {collection?.name}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={createRecord}>
              {collection?.fields?.filter((f: any) => !f.system).map((field: any) => (
                <div className="form-group" key={field.id}>
                  <label>{field.name}</label>
                  <input
                    value={newRecord[field.name] || ''}
                    onChange={e => setNewRecord({ ...newRecord, [field.name]: e.target.value })}
                    placeholder={`Enter ${field.name}`}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
