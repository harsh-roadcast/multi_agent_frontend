import { Link, useLocation } from 'react-router-dom'
import { MessageSquare, Database, Users, LayoutDashboard } from 'lucide-react'
import logo from '../assets/Smart Sync Logo Head.png'
import './Sidebar.css'

function Sidebar({ isOpen, onToggle, onNavClick }) {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/datasources', icon: Database, label: 'Datasources' },
    { path: '/agents', icon: Users, label: 'Agents' },
  ]

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <button className="sidebar-brand" onClick={onToggle} title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
          <img src={logo} alt="Sarthi" className="sidebar-logo" />
          {isOpen && <span className="sidebar-title">S<span style={{color:'#14b8a6'}}>a</span>rth<span style={{color:'#14b8a6'}}>i</span></span>}
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
              onClick={onNavClick}
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