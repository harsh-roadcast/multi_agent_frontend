import { Link, useLocation } from 'react-router-dom'
import { MessageSquare, Database, Users, Upload, LayoutDashboard, Menu, X } from 'lucide-react'
import './Sidebar.css'

function Sidebar({ isOpen, onToggle }) {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/datasources', icon: Database, label: 'Datasources' },
    { path: '/agents', icon: Users, label: 'Agents' },
    { path: '/ingestion', icon: Upload, label: 'Ingestion' },
  ]

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        {isOpen && <h1 className="sidebar-title">LLM Chatbot</h1>}
        <button className="toggle-btn" onClick={onToggle}>
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={!isOpen ? item.label : ''}
            >
              <Icon size={20} className="nav-icon" />
              {isOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar