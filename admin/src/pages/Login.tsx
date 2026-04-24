import { useState } from 'react'
import { api } from '../api/client'

interface LoginProps {
  onLogin: (data: { token: string; admin: any }) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await api.post('/api/admins/auth-with-password', { identity: email, password })
      onLogin(data)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a1a2e',
    }}>
      <div style={{
        background: 'white',
        padding: 40,
        borderRadius: 12,
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <h1 style={{ fontSize: 24, marginBottom: 8, textAlign: 'center' }}>TspoonBase</h1>
        <p style={{ color: '#666', textAlign: 'center', marginBottom: 24 }}>Admin Dashboard</p>

        {error && (
          <div style={{ background: '#fee', color: '#c33', padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
