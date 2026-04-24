import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'

interface Field {
  id: string
  name: string
  type: string
  required: boolean
}

export default function CollectionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [collection, setCollection] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCollection()
  }, [id])

  async function loadCollection() {
    try {
      const data = await api.get(`/api/collections/${id}`)
      setCollection(data)
    } catch (err: any) {
      console.error('Failed to load collection', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveCollection(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch(`/api/collections/${id}`, collection)
      alert('Collection saved')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  function addField() {
    const newField = {
      id: `fld_${Date.now()}`,
      name: '',
      type: 'text',
      required: false,
      system: false,
      presentable: false,
      hidden: false,
    }
    setCollection({ ...collection, fields: [...(collection.fields || []), newField] })
  }

  function updateField(index: number, updates: Partial<Field>) {
    const fields = [...collection.fields]
    fields[index] = { ...fields[index], ...updates }
    setCollection({ ...collection, fields })
  }

  function removeField(index: number) {
    const fields = collection.fields.filter((_: any, i: number) => i !== index)
    setCollection({ ...collection, fields })
  }

  if (loading) return <div className="empty-state">Loading...</div>
  if (!collection) return <div className="empty-state">Collection not found</div>

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate('/collections')} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back
      </button>
      <h2 style={{ marginBottom: 20 }}>Edit Collection: {collection.name}</h2>

      <form onSubmit={saveCollection}>
        <div className="card">
          <h3>General</h3>
          <div className="form-group">
            <label>Name</label>
            <input value={collection.name} onChange={e => setCollection({ ...collection, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={collection.type} onChange={e => setCollection({ ...collection, type: e.target.value })}>
              <option value="base">Base</option>
              <option value="auth">Auth</option>
              <option value="view">View</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Fields</h3>
            <button type="button" className="btn btn-primary" onClick={addField}>
              <Plus size={16} /> Add Field
            </button>
          </div>

          {collection.fields?.map((field: Field, index: number) => (
            <div key={field.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 12, padding: 12, background: '#f9f9f9', borderRadius: 6 }}>
              <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                <label>Name</label>
                <input value={field.name} onChange={e => updateField(index, { name: e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Type</label>
                <select value={field.type} onChange={e => updateField(index, { type: e.target.value })}>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="bool">Bool</option>
                  <option value="email">Email</option>
                  <option value="url">URL</option>
                  <option value="date">Date</option>
                  <option value="select">Select</option>
                  <option value="file">File</option>
                  <option value="relation">Relation</option>
                  <option value="json">JSON</option>
                  <option value="editor">Editor</option>
                  <option value="geoPoint">GeoPoint</option>
                  <option value="vector">Vector</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>
                  <input type="checkbox" checked={field.required} onChange={e => updateField(index, { required: e.target.checked })} />
                  Required
                </label>
              </div>
              <button type="button" className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => removeField(index)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>API Rules</h3>
          {['listRule', 'viewRule', 'createRule', 'updateRule', 'deleteRule'].map(rule => (
            <div className="form-group" key={rule}>
              <label>{rule}</label>
              <input
                value={collection[rule] || ''}
                onChange={e => setCollection({ ...collection, [rule]: e.target.value || null })}
                placeholder="@request.auth.id != ''"
              />
            </div>
          ))}
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Collection'}
        </button>
      </form>
    </div>
  )
}
