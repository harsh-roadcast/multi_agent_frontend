import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import StreamingChat from './pages/StreamingChat'
import Datasources from './pages/Datasources'
import Agents from './pages/Agents'
import Ingestion from './pages/Ingestion'
import './App.css'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <Router>
      <div className="app">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<StreamingChat />} />
            <Route path="/datasources" element={<Datasources />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/ingestion" element={<Ingestion />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
