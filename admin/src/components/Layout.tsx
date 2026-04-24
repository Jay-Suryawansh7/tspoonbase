import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Database, Settings, LogOut, FileText,
  Archive, Bot, ChevronRight
} from 'lucide-react'
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  onLogout: () => void
  admin: any
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/collections', icon: Database, label: 'Collections' },
  { path: '/settings', icon: Settings, label: 'Settings' },
  { path: '/logs', icon: FileText, label: 'Logs' },
  { path: '/backups', icon: Archive, label: 'Backups' },
  { path: '/ai', icon: Bot, label: 'AI Assistant' },
]

export default function Layout({ children, onLogout, admin }: LayoutProps) {
  const location = useLocation()

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>TspoonBase</h2>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div>{admin?.email || 'Admin'}</div>
          <button onClick={onLogout} className="btn btn-secondary" style={{ marginTop: 8, width: '100%' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>
      <div className="main-content">
        <header className="top-bar">
          <div style={{ fontSize: 14, color: '#666' }}>
            {navItems.find(n => n.path === location.pathname)?.label || 'Admin'}
          </div>
        </header>
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}
