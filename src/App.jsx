import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import StreamingChat from './pages/StreamingChat'
import Datasources from './pages/Datasources'
import Agents from './pages/Agents'
import './App.css'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768)
  const touchStartX = useRef(null)

  // Close sidebar by default on mobile; reopen on desktop resize
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth <= 768) setSidebarOpen(false)
      else setSidebarOpen(true)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Swipe-right to open, swipe-left to close on mobile
  useEffect(() => {
    const onTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX
    }
    const onTouchEnd = (e) => {
      if (touchStartX.current === null) return
      const dx = e.changedTouches[0].clientX - touchStartX.current
      if (window.innerWidth <= 768) {
        if (dx > 60 && touchStartX.current < 40) setSidebarOpen(true)   // swipe right from edge
        if (dx < -60) setSidebarOpen(false)                              // swipe left anywhere
      }
      touchStartX.current = null
    }
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  const isMobile = () => window.innerWidth <= 768
  const handleToggle = () => setSidebarOpen(o => !o)
  const closeSidebar = () => { if (isMobile()) setSidebarOpen(false) }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app">
        <Sidebar isOpen={sidebarOpen} onToggle={handleToggle} onNavClick={closeSidebar} />

        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<StreamingChat />} />
            <Route path="/datasources" element={<Datasources />} />
            <Route path="/agents" element={<Agents />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
