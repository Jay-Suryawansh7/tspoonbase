import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'

interface Field { id: string; name: string; type: string; required: boolean }

const fieldTypes = ['text','number','bool','email','url','date','select','file','relation','json','editor','geoPoint','autodate','vector']

export default function CollectionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [collection, setCollection] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadCollection() }, [id])

  async function loadCollection() {
    try { setCollection(await api.get(`/api/collections/${id}`)) }
    catch (err: any) { console.error('Failed to load collection', err) }
    finally { setLoading(false) }
  }

  async function saveCollection(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try { await api.patch(`/api/collections/${id}`, collection); alert('Collection saved') }
    catch (err: any) { alert(err.message) }
    finally { setSaving(false) }
  }

  function addField() {
    setCollection({ ...collection, fields: [...(collection.fields || []), { id: `fld_${Date.now()}`, name: '', type: 'text', required: false, system: false }] })
  }

  function updateField(index: number, updates: Partial<Field>) {
    const fields = [...collection.fields]; fields[index] = { ...fields[index], ...updates }
    setCollection({ ...collection, fields })
  }

  function removeField(index: number) {
    setCollection({ ...collection, fields: collection.fields.filter((_: any, i: number) => i !== index) })
  }

  if (loading) return <div className="empty-state"><div className="spinner" /></div>
  if (!collection) return <div className="empty-state">Collection not found</div>

  return (
    <div>
      <button className="btn btn-ghost" onClick={() => navigate('/collections')} style={{ marginBottom: 16 }}>
        <ArrowLeft size={15} /> Back to Collections
      </button>
      <h2 style={{ marginBottom: 24 }}>Edit: {collection.name}</h2>

      <form onSubmit={saveCollection}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>General</h3>
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
          <div className="card-header">
            <h3>Fields</h3>
            <button type="button" className="btn btn-primary btn-sm" onClick={addField}>
              <Plus size={14} /> Add Field
            </button>
          </div>
          {collection.fields?.map((field: Field, index: number) => (
            <div className="field-row" key={field.id}>
              <div className="form-group" style={{ flex: 2 }}>
                <label>Name</label>
                <input value={field.name} onChange={e => updateField(index, { name: e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Type</label>
                <select value={field.type} onChange={e => updateField(index, { type: e.target.value })}>
                  {fieldTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 2 }}>
                <input type="checkbox" id={`req-${index}`} checked={field.required} onChange={e => updateField(index, { required: e.target.checked })} />
                <label htmlFor={`req-${index}`} style={{ margin: 0, cursor: 'pointer' }}>Required</label>
              </div>
              <button type="button" className="btn btn-danger btn-icon" onClick={() => removeField(index)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {(!collection.fields || collection.fields.length === 0) && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 16 }}>No fields yet. Click "Add Field" to create one.</p>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>API Rules</h3>
          {['listRule', 'viewRule', 'createRule', 'updateRule', 'deleteRule'].map(rule => (
            <div className="form-group" key={rule}>
              <label>{rule}</label>
              <input value={collection[rule] || ''} onChange={e => setCollection({ ...collection, [rule]: e.target.value || null })} placeholder="@request.auth.id != ''" />
            </div>
          ))}
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <><span className="spinner" /> Saving...</> : 'Save Collection'}
        </button>
      </form>
    </div>
  )
}
