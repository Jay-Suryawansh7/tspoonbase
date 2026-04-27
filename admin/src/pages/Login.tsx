import { useState, useEffect } from 'react'
import { api } from '../api/client'

interface LoginProps {
  onLogin: (data: { token: string; admin: any }) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isInstaller, setIsInstaller] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkInstaller()
  }, [])

  const checkInstaller = async () => {
    try {
      const res = await api.get('/api/installer/check')
      setIsInstaller(!res.installed)
    } catch {
      setIsInstaller(true)
    } finally {
      setChecking(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
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

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== passwordConfirm) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await api.post('/api/installer', { email, password, passwordConfirm })
      const data = await api.post('/api/admins/auth-with-password', { identity: email, password })
      onLogin(data)
    } catch (err: any) {
      setError(err.message || 'Installation failed')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a2e',
      }}>
        <div style={{ color: 'white', fontSize: 18 }}>Loading...</div>
      </div>
    )
  }

  if (isInstaller) {
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
          maxWidth: 440,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img 
              src="/tspoonbase-logo.png" 
              alt="TspoonBase" 
              style={{ 
                width: 80, 
                height: 80, 
                borderRadius: 16,
                marginBottom: 20,
                objectFit: 'contain'
              }} 
            />
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>Welcome to TspoonBase</h1>
            <p style={{ color: '#666', fontSize: 15 }}>Create your admin account to get started</p>
          </div>

          {error && (
            <div style={{ background: '#fee', color: '#c33', padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleInstall}>
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
                placeholder=" Minimum 6 characters"
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '12px 24px', fontSize: 16 }}
            >
              {loading ? 'Creating Account...' : 'Create Admin Account'}
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 13, color: '#888', textAlign: 'center' }}>
            This will create your first superuser account with full admin access.
          </p>
        </div>
      </div>
    )
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
        <img 
          src="/tspoonbase-logo.png" 
          alt="TspoonBase" 
          style={{ 
            width: 60, 
            height: 60, 
            borderRadius: 12,
            display: 'block',
            margin: '0 auto 16px',
            objectFit: 'contain'
          }} 
        />
        <h1 style={{ fontSize: 24, marginBottom: 8, textAlign: 'center' }}>TspoonBase</h1>
        <p style={{ color: '#666', textAlign: 'center', marginBottom: 24 }}>Admin Dashboard</p>

        {error && (
          <div style={{ background: '#fee', color: '#c33', padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
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