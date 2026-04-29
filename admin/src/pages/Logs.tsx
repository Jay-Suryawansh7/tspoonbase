import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [perPage] = useState(50)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadLogs() }, [page])

  async function loadLogs() {
    setLoading(true)
    try {
      const data = await api.get(`/api/logs?page=${page}&perPage=${perPage}`)
      setLogs(data.items || []); setTotalItems(data.totalItems || 0)
    } catch (err: any) { console.error('Failed to load logs', err) }
    finally { setLoading(false) }
  }

  const totalPages = Math.ceil(totalItems / perPage)

  const badgeClass = (level: string) => {
    switch (level) {
      case 'error': return 'badge-red'
      case 'warn': return 'badge-orange'
      default: return 'badge-gray'
    }
  }

  if (loading && logs.length === 0) return <div className="empty-state"><div className="spinner" /></div>

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Logs</h2>
      <div className="card">
        {logs.length === 0 ? (
          <div className="empty-state">No logs found</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Level</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.created).toLocaleString()}
                    </td>
                    <td><span className={`badge ${badgeClass(log.level)}`}>{log.level}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft size={14} />
          </button>
          <span className="pagination-info">Page {page} of {totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
