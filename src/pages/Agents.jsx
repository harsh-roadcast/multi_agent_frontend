import { useState, useEffect } from 'react'
import { Users, Plus, RefreshCw, MessageSquare, CheckCircle, AlertCircle, Trash2, Key, Tag } from 'lucide-react'
import { agentsAPI, datasourcesAPI } from '../services/api'
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
    description: '',
    datasource_id: '',
    keywords: ''
  })
  const [notification, setNotification] = useState(null)
  const [datasources, setDatasources] = useState([])  // for datasource_id dropdown
  const [deletingId, setDeletingId] = useState(null)   // id being deleted
  const [confirmDeleteId, setConfirmDeleteId] = useState(null) // id awaiting confirm

  useEffect(() => {
    loadAgents()
    // Load datasources for the registration form dropdown
    datasourcesAPI.list()
      .then((data) => setDatasources(data.items || []))
      .catch(() => {})
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
      const keywords = formData.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
      const payload = {
        name: formData.name,
        source_type: formData.source_type,
        description: formData.description || `${formData.source_type} agent`,
        datasource_id: formData.datasource_id || undefined,
        keywords,
        config: {},
      }
      await agentsAPI.register(payload)
      showNotification('Agent registered successfully', 'success')
      setShowRegisterForm(false)
      setFormData({ name: '', source_type: 'postgres', description: '', datasource_id: '', keywords: '' })
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
      // Use agent UUID for direct pinned routing
      const result = await agentsAPI.query(selectedAgent.id, queryText)
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
                  <option value="document">Documents</option>
                  <option value="gitbook">GitBook</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Searches fleet management data in PostgreSQL"
                />
              </div>
              <div className="form-group">
                <label htmlFor="datasource_id">Link to Datasource (optional)</label>
                <select
                  id="datasource_id"
                  value={formData.datasource_id}
                  onChange={(e) => setFormData({ ...formData, datasource_id: e.target.value })}
                >
                  <option value="">— None (broad access) —</option>
                  {(() => {
                    const typeMatch = datasources.filter((ds) =>
                      ds.source_type === formData.source_type ||
                      (formData.source_type === 'gitbook' && ds.source_type === 'gitbook') ||
                      (formData.source_type === 'document' && ds.source_type === 'documents')
                    )
                    const list = typeMatch.length > 0 ? typeMatch : datasources
                    return list.map((ds) => (
                      <option key={ds.id} value={ds.id}>
                        {ds.name} ({ds.source_type})
                      </option>
                    ))
                  })()}
                </select>
                <small style={{ color: '#94a3b8' }}>Linking locks this agent to that datasource only.</small>
              </div>
              <div className="form-group">
                <label htmlFor="keywords">Keywords (comma-separated, optional)</label>
                <input
                  id="keywords"
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="fleet, driver, trip, vehicle"
                />
                <small style={{ color: '#94a3b8' }}>Any matching keyword skips LLM routing and calls this agent directly.</small>
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
                  {agent.description && (
                    <div className="info-section">
                      <p style={{ color: '#94a3b8', fontSize: '0.85em', margin: 0 }}>{agent.description}</p>
                    </div>
                  )}
                  {agent.datasource_id && (
                    <div className="info-row" style={{ marginTop: 6 }}>
                      <span className="info-label"><Tag size={12} style={{ marginRight: 3 }} />Datasource:</span>
                      <span className="connection-string" title={agent.datasource_id}>
                        {datasources.find((d) => d.id === agent.datasource_id)?.name || agent.datasource_id.substring(0, 8) + '…'}
                      </span>
                    </div>
                  )}
                  {agent.keywords && agent.keywords.length > 0 && (
                    <div className="info-section" style={{ marginTop: 6 }}>
                      <span className="info-label"><Key size={12} style={{ marginRight: 3 }} />Keywords:</span>
                      <div className="tags" style={{ marginTop: 4 }}>
                        {agent.keywords.map((kw, idx) => (
                          <span key={idx} className="tag">{kw}</span>
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