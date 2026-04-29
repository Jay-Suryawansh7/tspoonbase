import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { ArrowLeft } from 'lucide-react'

export default function RecordDetail() {
  const { collectionId, recordId } = useParams()
  const navigate = useNavigate()
  const [collection, setCollection] = useState<any>(null)
  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [collectionId, recordId])

  async function loadData() {
    try {
      const [col, rec] = await Promise.all([
        api.get(`/api/collections/${collectionId}`),
        api.get(`/api/collections/${collectionId}/records/${recordId}`),
      ])
      setCollection(col); setRecord(rec)
    } catch (err: any) { console.error('Failed to load record', err) }
    finally { setLoading(false) }
  }

  async function saveRecord(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      await api.patch(`/api/collections/${collectionId}/records/${recordId}`, record)
      alert('Record saved')
    } catch (err: any) { alert(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="empty-state"><div className="spinner" /></div>
  if (!record) return <div className="empty-state">Record not found</div>

  return (
    <div>
      <button className="btn btn-ghost" onClick={() => navigate(`/records/${collectionId}`)} style={{ marginBottom: 16 }}>
        <ArrowLeft size={15} /> Back to Records
      </button>
      <h2 style={{ marginBottom: 24 }}>Edit Record — {collection?.name}</h2>

      <form onSubmit={saveRecord}>
        <div className="card">
          {collection?.fields?.filter((f: any) => !f.system).map((field: any) => (
            <div className="form-group" key={field.id}>
              <label>{field.name}</label>
              {field.type === 'bool' ? (
                <input type="checkbox" checked={!!record[field.name]} onChange={e => setRecord({ ...record, [field.name]: e.target.checked })} />
              ) : field.type === 'json' || field.type === 'editor' ? (
                <textarea rows={4} value={JSON.stringify(record[field.name] || '', null, 2)} onChange={e => {
                  try { setRecord({ ...record, [field.name]: JSON.parse(e.target.value) }) } catch { setRecord({ ...record, [field.name]: e.target.value }) }
                }} />
              ) : (
                <input value={record[field.name] || ''} onChange={e => setRecord({ ...record, [field.name]: e.target.value })} />
              )}
            </div>
          ))}
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <><span className="spinner" /> Saving...</> : 'Save Record'}
        </button>
      </form>
    </div>
  )
}
