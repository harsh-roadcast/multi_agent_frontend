import { useState, useEffect } from 'react'
import { Activity, Database, Users, MessageSquare } from 'lucide-react'
import { healthAPI, datasourcesAPI, agentsAPI } from '../services/api'
import './Dashboard.css'

function Dashboard() {
  const [health, setHealth] = useState(null)
  const [stats, setStats] = useState({
    datasources: 0,
    agents: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [healthData, datasourcesData, agentsData] = await Promise.all([
        healthAPI.check(),
        datasourcesAPI.list(),
        agentsAPI.list()
      ])
      
      setHealth(healthData)
      setStats({
        datasources: datasourcesData.total || 0,
        agents: agentsData.total || 0
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}15`, color }}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  )

  return (
    <div className="dashboard">
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Multi-Agent LLM Chatbot System Overview</p>
      </header>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard
              icon={Activity}
              title="System Status"
              value={health?.status === 'healthy' ? 'Healthy' : 'Offline'}
              color="var(--success)"
            />
            <StatCard
              icon={Database}
              title="Datasources"
              value={stats.datasources}
              color="var(--primary-blue)"
            />
            <StatCard
              icon={Users}
              title="Agents"
              value={stats.agents}
              color="var(--secondary-blue)"
            />
            <StatCard
              icon={MessageSquare}
              title="Chat Ready"
              value="Active"
              color="var(--primary-blue)"
            />
          </div>

          <div className="info-section">
            <div className="info-card">
              <h2 className="info-title">🚀 Quick Start</h2>
              <ul className="info-list">
                <li><strong>Chat:</strong> Start chatting with the AI assistant</li>
                <li><strong>Datasources:</strong> Manage and index your data sources</li>
                <li><strong>Agents:</strong> Create and configure intelligent agents</li>
                <li><strong>Ingestion:</strong> Upload and process documents</li>
              </ul>
            </div>

            <div className="info-card">
              <h2 className="info-title">📊 System Information</h2>
              <div className="info-grid">
                <div>
                  <p className="info-label">Database</p>
                  <p className="info-value">{health?.database?.type || 'Qdrant'}</p>
                </div>
                <div>
                  <p className="info-label">Collections</p>
                  <p className="info-value">{health?.database?.collections || 0}</p>
                </div>
                <div>
                  <p className="info-label">MCP Status</p>
                  <p className="info-value">{health?.mcp?.status || 'Ready'}</p>
                </div>
                <div>
                  <p className="info-label">Tools</p>
                  <p className="info-value">{health?.mcp?.tools || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard