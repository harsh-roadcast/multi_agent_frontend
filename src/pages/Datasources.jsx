import { useState, useEffect } from 'react'
import { Database, Plus, RefreshCw, Upload, CheckCircle, AlertCircle, Trash2, X, Info } from 'lucide-react'
import { datasourcesAPI, ingestionAPI } from '../services/api'
import './Datasources.css'

function Datasources() {
  const [datasources, setDatasources] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    source_type: 'postgres',
    connection: ''
  })
  const [documentFiles, setDocumentFiles] = useState([])
  const [indexingSource, setIndexingSource] = useState(null)
  const [deletingSource, setDeletingSource] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    loadDatasources()
  }, [])

  const loadDatasources = async () => {
    try {
      setLoading(true)
      const data = await datasourcesAPI.list()
      setDatasources(data.items || [])
    } catch (error) {
      console.error('Error loading datasources:', error)
      showNotification('Failed to load datasources', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      // Close form immediately
      setShowRegisterForm(false)
      showNotification('Registering datasource...', 'info')

      // Register datasource FIRST (so it exists in backend)
      const payload = {
        name: formData.name,
        source_type: formData.source_type,
        ...(formData.source_type === 'documents'
          ? (formData.connection ? { file_path: formData.connection } : {})
          : { db_url: formData.connection })
      }
      const registrationResult = await datasourcesAPI.register(payload)
      const datasourceId = registrationResult.datasource?.id
      
      // THEN ingest documents if provided (now datasource exists)
      if (formData.source_type === 'documents' && documentFiles.length > 0 && datasourceId) {
        await ingestionAPI.ingest({
          files: documentFiles,
          metadata: { datasource_name: formData.name }
        })
        
        // Mark as indexed after successful ingestion
        await datasourcesAPI.index(datasourceId, false, false)
      }
      
      // Show success after registration completes
      showNotification('Datasource registered successfully', 'success')
      setFormData({ name: '', source_type: 'postgres', connection: '' })
      setDocumentFiles([])
      loadDatasources()
    } catch (error) {
      console.error('Error registering datasource:', error)
      // Show error notification
      showNotification(error.response?.data?.detail || 'Failed to register datasource', 'error')
    }
  }

  const handleIndex = async (datasourceId) => {
    try {
      setIndexingSource(datasourceId)
      await datasourcesAPI.index(datasourceId)
      showNotification(`Successfully indexed datasource`, 'success')
      loadDatasources()
    } catch (error) {
      console.error('Error indexing datasource:', error)
      showNotification(error.response?.data?.detail || 'Failed to index datasource', 'error')
    } finally {
      setIndexingSource(null)
    }
  }

  const handleDelete = async (datasourceId) => {
    try {
      setDeletingSource(datasourceId)
      await datasourcesAPI.delete(datasourceId)
      showNotification('Datasource deleted successfully', 'success')
      setConfirmDelete(null)
      loadDatasources()
    } catch (error) {
      console.error('Error deleting datasource:', error)
      showNotification(error.response?.data?.detail || 'Failed to delete datasource', 'error')
    } finally {
      setDeletingSource(null)
    }
  }

  const showNotification = (message, type) => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  return (
    <div className="datasources-page">
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Datasource?</h2>
              <button onClick={() => setConfirmDelete(null)} className="modal-close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{confirmDelete.name}</strong>?</p>
              <p className="warning-text">This action cannot be undone and will remove all indexed data.</p>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setConfirmDelete(null)} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(confirmDelete.id)} 
                className="btn btn-danger"
                disabled={deletingSource === confirmDelete.id}
              >
                {deletingSource === confirmDelete.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'success' ? (
            <CheckCircle size={20} />
          ) : notification.type === 'error' ? (
            <AlertCircle size={20} />
          ) : (
            <Info size={20} />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <header className="datasources-header">
        <div className="header-content">
          <div className="header-left">
            <Database className="page-icon" size={28} />
            <div>
              <h1 className="page-title">Datasources</h1>
              <p className="page-subtitle">Manage and index your data sources</p>
            </div>
          </div>
          <div className="header-actions">
            <button onClick={loadDatasources} className="btn btn-secondary" disabled={loading}>
              <RefreshCw size={18} className={loading ? 'spinning' : ''} />
              Refresh
            </button>
            <button onClick={() => setShowRegisterForm(true)} className="btn btn-primary">
              <Plus size={18} />
              Add Datasource
            </button>
          </div>
        </div>
      </header>

      {showRegisterForm && (
        <div className="modal-overlay" onClick={() => setShowRegisterForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Register New Datasource</h2>
              <button onClick={() => setShowRegisterForm(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleRegister} className="datasource-form">
              <div className="form-group">
                <label htmlFor="name">Datasource Name</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="my_database"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="type">Type</label>
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
                <label htmlFor="connection">Connection</label>
                {formData.source_type === 'documents' ? (
                  <>
                    <input
                      id="document-upload"
                      type="file"
                      multiple
                      accept=".pdf,.docx,.pptx,.txt,.md"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        setDocumentFiles(files)
                      }}
                    />
                    <textarea
                      id="connection"
                      value={formData.connection}
                      onChange={(e) => setFormData({ ...formData, connection: e.target.value })}
                      placeholder="Optional: /absolute/path/to/docs"
                      rows="2"
                    />
                  </>
                ) : (
                  <textarea
                    id="connection"
                    value={formData.connection}
                    onChange={(e) => setFormData({ ...formData, connection: e.target.value })}
                    placeholder="postgresql://user:password@localhost:5432/dbname"
                    rows="3"
                    required
                  />
                )}
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

      <div className="datasources-content">
        {loading ? (
          <div className="loading-state">
            <RefreshCw size={40} className="spinning" />
            <p>Loading datasources...</p>
          </div>
        ) : datasources.length === 0 ? (
          <div className="empty-state">
            <Database size={64} className="empty-icon" />
            <h2>No Datasources Yet</h2>
            <p>Get started by registering your first datasource</p>
            <button onClick={() => setShowRegisterForm(true)} className="btn btn-primary">
              <Plus size={18} />
              Add Datasource
            </button>
          </div>
        ) : (
          <div className="datasources-grid">
            {datasources.map((ds) => (
              <div key={ds.id || ds.name} className="datasource-card">
                <div className="card-header">
                  <Database size={24} className="card-icon" />
                  <div className="card-title-section">
                    <h3 className="card-title">{ds.name}</h3>
                    <span className="datasource-type">{ds.source_type || 'unknown'}</span>
                  </div>
                </div>
                <div className="card-body">
                  <div className="info-row">
                    <span className="info-label">Status:</span>
                    <span className={`status-badge ${(ds.state?.indexed || ds.indexed) ? 'indexed' : 'not-indexed'}`}>
                      {(ds.state?.indexed || ds.indexed) ? 'Indexed' : 'Not Indexed'}
                    </span>
                  </div>
                  {(ds.db_url || ds.file_path) && (
                    <div className="info-row">
                      <span className="info-label">Connection:</span>
                      <span className="connection-string">{(ds.db_url || ds.file_path).substring(0, 40)}...</span>
                    </div>
                  )}
                </div>
                <div className="card-footer">
                  <button
                    onClick={() => handleIndex(ds.id)}
                    className="btn btn-primary btn-sm"
                    disabled={indexingSource === ds.id}
                  >
                    {indexingSource === ds.id ? (
                      <>
                        <RefreshCw size={16} className="spinning" />
                        Indexing...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        {(ds.state?.indexed || ds.indexed) ? 'Re-index' : 'Index'}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(ds)}
                    className="btn btn-danger btn-sm"
                    disabled={deletingSource === ds.id}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Datasources