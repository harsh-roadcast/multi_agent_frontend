import { useState, useEffect } from 'react'
import { Users, Plus, RefreshCw, MessageSquare, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'
import { agentsAPI } from '../services/api'
import './Agents.css'

function Agents() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [showQueryModal, setShowQueryModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [queryText, setQueryText] = useState('')
  const [queryResult, setQueryResult] = useState(null)
  const [querying, setQuerying] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    source_type: 'postgres',
    capabilities: '',
    datasources: ''
  })
  const [notification, setNotification] = useState(null)
  const [deletingId, setDeletingId] = useState(null)   // id being deleted
  const [confirmDeleteId, setConfirmDeleteId] = useState(null) // id awaiting confirm

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      setLoading(true)
      const data = await agentsAPI.list()
      setAgents(data.items || [])
    } catch (error) {
      console.error('Error loading agents:', error)
      showNotification('Failed to load agents', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        name: formData.name,
        source_type: formData.source_type,
        description: `Capabilities: ${formData.capabilities || 'n/a'}`,
        config: {
          capabilities: formData.capabilities.split(',').map(c => c.trim()).filter(Boolean),
          datasources: formData.datasources.split(',').map(d => d.trim()).filter(Boolean)
        }
      }
      await agentsAPI.register(payload)
      showNotification('Agent registered successfully', 'success')
      setShowRegisterForm(false)
      setFormData({ name: '', source_type: 'postgres', capabilities: '', datasources: '' })
      loadAgents()
    } catch (error) {
      console.error('Error registering agent:', error)
      showNotification(error.response?.data?.detail || 'Failed to register agent', 'error')
    }
  }

  const handleQuery = async () => {
    if (!queryText.trim()) return
    
    try {
      setQuerying(true)
      const result = await agentsAPI.query(selectedAgent.source_type, queryText)
      setQueryResult(result)
    } catch (error) {
      console.error('Error querying agent:', error)
      showNotification(error.response?.data?.detail || 'Failed to query agent', 'error')
    } finally {
      setQuerying(false)
    }
  }

  const openQueryModal = (agent) => {
    setSelectedAgent(agent)
    setQueryText('')
    setQueryResult(null)
    setShowQueryModal(true)
  }

  const showNotification = (message, type) => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleDeleteRequest = (agentId) => {
    setConfirmDeleteId(agentId)
  }

  const handleDeleteCancel = () => {
    setConfirmDeleteId(null)
  }

  const handleDeleteConfirm = async (agentId) => {
    setConfirmDeleteId(null)
    setDeletingId(agentId)
    try {
      await agentsAPI.delete(agentId)
      showNotification('Agent deleted successfully', 'success')
      setAgents((prev) => prev.filter((a) => (a.id || a.name) !== agentId))
    } catch (error) {
      console.error('Error deleting agent:', error)
      showNotification(error.response?.data?.detail || 'Failed to delete agent', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="agents-page">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      <header className="agents-header">
        <div className="header-content">
          <div className="header-left">
            <Users className="page-icon" size={28} />
            <div>
              <h1 className="page-title">AI Agents</h1>
              <p className="page-subtitle">Manage specialized AI agents for different tasks</p>
            </div>
          </div>
          <div className="header-actions">
            <button onClick={loadAgents} className="btn btn-secondary" disabled={loading}>
              <RefreshCw size={18} className={loading ? 'spinning' : ''} />
              Refresh
            </button>
            <button onClick={() => setShowRegisterForm(true)} className="btn btn-primary">
              <Plus size={18} />
              Add Agent
            </button>
          </div>
        </div>
      </header>

      {showRegisterForm && (
        <div className="modal-overlay" onClick={() => setShowRegisterForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Register New Agent</h2>
              <button onClick={() => setShowRegisterForm(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleRegister} className="agent-form">
              <div className="form-group">
                <label htmlFor="name">Agent Name</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="data_analyst"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="type">Agent Type</label>
                <select
                  id="type"
                  value={formData.source_type}
                  onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
                >
                  <option value="postgres">Postgres</option>
                  <option value="mysql">MySQL</option>
                  <option value="redis">Redis</option>
                  <option value="elasticsearch">Elasticsearch</option>
                  <option value="documents">Documents</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="capabilities">Capabilities (comma-separated)</label>
                <input
                  id="capabilities"
                  type="text"
                  value={formData.capabilities}
                  onChange={(e) => setFormData({ ...formData, capabilities: e.target.value })}
                  placeholder="sql_query, data_analysis, visualization"
                />
              </div>
              <div className="form-group">
                <label htmlFor="datasources">Connected Datasources (comma-separated)</label>
                <input
                  id="datasources"
                  type="text"
                  value={formData.datasources}
                  onChange={(e) => setFormData({ ...formData, datasources: e.target.value })}
                  placeholder="postgres_db, mongodb_cluster"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowRegisterForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQueryModal && selectedAgent && (
        <div className="modal-overlay" onClick={() => setShowQueryModal(false)}>
          <div className="modal query-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Query Agent: {selectedAgent.name}</h2>
              <button onClick={() => setShowQueryModal(false)} className="close-btn">&times;</button>
            </div>
            <div className="query-content">
              <div className="form-group">
                <label htmlFor="query">Your Query</label>
                <textarea
                  id="query"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Ask the agent a question..."
                  rows="4"
                  disabled={querying}
                />
              </div>
              <button 
                onClick={handleQuery} 
                className="btn btn-primary" 
                disabled={!queryText.trim() || querying}
                style={{ width: '100%' }}
              >
                {querying ? 'Processing...' : 'Send Query'}
              </button>
              {queryResult && (
                <div className="query-result">
                  <h3>Response:</h3>
                  <div className="result-content">
                    {typeof queryResult === 'string' ? queryResult : JSON.stringify(queryResult, null, 2)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="agents-content">
        {loading ? (
          <div className="loading-state">
            <RefreshCw size={40} className="spinning" />
            <p>Loading agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="empty-state">
            <Users size={64} className="empty-icon" />
            <h2>No Agents Yet</h2>
            <p>Create specialized AI agents to handle different tasks</p>
            <button onClick={() => setShowRegisterForm(true)} className="btn btn-primary">
              <Plus size={18} />
              Add Agent
            </button>
          </div>
        ) : (
          <div className="agents-grid">
            {agents.map((agent) => (
              <div key={agent.id || agent.name} className="agent-card">
                <div className="card-header">
                  <Users size={24} className="card-icon" />
                  <div className="card-title-section">
                    <h3 className="card-title">{agent.name}</h3>
                    <span className="agent-type">{agent.source_type || 'unknown'}</span>
                  </div>
                </div>
                <div className="card-body">
                  {agent.config?.capabilities && agent.config.capabilities.length > 0 && (
                    <div className="info-section">
                      <span className="info-label">Capabilities:</span>
                      <div className="tags">
                        {agent.config.capabilities.map((cap, idx) => (
                          <span key={idx} className="tag">{cap}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {agent.datasources && agent.datasources.length > 0 && (
                    <div className="info-section">
                      <span className="info-label">Connected Data:</span>
                      <div className="tags">
                        {agent.datasources.map((ds, idx) => (
                          <span key={idx} className="tag datasource-tag">{ds}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="card-footer">
                  <button
                    onClick={() => openQueryModal(agent)}
                    className="btn btn-primary btn-sm"
                  >
                    <MessageSquare size={16} />
                    Query Agent
                  </button>

                  {confirmDeleteId === (agent.id || agent.name) ? (
                    <div className="delete-confirm">
                      <span>Delete?</span>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteConfirm(agent.id || agent.name)}
                      >
                        Yes
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleDeleteCancel}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDeleteRequest(agent.id || agent.name)}
                      className="btn btn-ghost-danger btn-sm"
                      disabled={deletingId === (agent.id || agent.name)}
                      title="Delete agent"
                    >
                      <Trash2 size={16} />
                      {deletingId === (agent.id || agent.name) ? 'Deleting…' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Agents