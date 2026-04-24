import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [perPage] = useState(50)
  const [totalItems, setTotalItems] = useState(0)
  const [, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [page])

  async function loadLogs() {
    setLoading(true)
    try {
      const data = await api.get(`/api/logs?page=${page}&perPage=${perPage}`)
      setLogs(data.items || [])
      setTotalItems(data.totalItems || 0)
    } catch (err: any) {
      console.error('Failed to load logs', err)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalItems / perPage)

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Logs</h2>
      <div className="card">
        <table className="table">
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
                <td style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>{new Date(log.created).toLocaleString()}</td>
                <td>
                  <span className={`badge badge-${log.level === 'error' ? 'danger' : log.level === 'warn' ? 'orange' : 'green'}`}>
                    {log.level}
                  </span>
                </td>
                <td>{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="empty-state">No logs found</div>}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span style={{ padding: '8px 16px' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </div>
  )
}
