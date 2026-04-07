import { useState } from 'react'
import { Upload, FileText, Link as LinkIcon, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { ingestionAPI } from '../services/api'
import './Ingestion.css'

function Ingestion() {
  const [activeTab, setActiveTab] = useState('file')
  const [file, setFile] = useState(null)
  const [textInput, setTextInput] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [collectionName, setCollectionName] = useState('document_embeddings')
  const [isProcessing, setIsProcessing] = useState(false)
  const [notification, setNotification] = useState(null)
  const [result, setResult] = useState(null)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleFileUpload = async () => {
    if (!file) {
      showNotification('Please select a file', 'error')
      return
    }

    try {
      setIsProcessing(true)
      const response = await ingestionAPI.ingest({
        files: [file],
        metadata: { collection_name: collectionName }
      })

      setResult(response)
      showNotification('File uploaded and processed successfully', 'success')
      setFile(null)
    } catch (error) {
      console.error('Error uploading file:', error)
      showNotification(error.response?.data?.detail || 'Failed to upload file', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTextIngest = async () => {
    if (!textInput.trim()) {
      showNotification('Please enter some text', 'error')
      return
    }

    try {
      setIsProcessing(true)
      const response = await ingestionAPI.ingest({
        text: textInput,
        document_id: `text-${Date.now()}`,
        metadata: { collection_name: collectionName }
      })

      setResult(response)
      showNotification('Text ingested successfully', 'success')
      setTextInput('')
    } catch (error) {
      console.error('Error ingesting text:', error)
      showNotification(error.response?.data?.detail || 'Failed to ingest text', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUrlIngest = async () => {
    if (!urlInput.trim()) {
      showNotification('Please enter a URL', 'error')
      return
    }

    try {
      setIsProcessing(true)
      const response = await ingestionAPI.ingest({
        text: urlInput,
        document_id: `url-${Date.now()}`,
        metadata: { source_url: urlInput, collection_name: collectionName }
      })

      setResult(response)
      showNotification('URL content ingested successfully', 'success')
      setUrlInput('')
    } catch (error) {
      console.error('Error ingesting URL:', error)
      showNotification(error.response?.data?.detail || 'Failed to ingest URL', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const showNotification = (message, type) => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  return (
    <div className="ingestion-page">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      <header className="ingestion-header">
        <div className="header-content">
          <div className="header-left">
            <Upload className="page-icon" size={28} />
            <div>
              <h1 className="page-title">Data Ingestion</h1>
              <p className="page-subtitle">Upload and process data for AI analysis</p>
            </div>
          </div>
        </div>
      </header>

      <div className="ingestion-content">
        <div className="ingestion-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'file' ? 'active' : ''}`}
              onClick={() => setActiveTab('file')}
            >
              <FileText size={18} />
              File Upload
            </button>
            <button
              className={`tab ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTab('text')}
            >
              <FileText size={18} />
              Text Input
            </button>
            <button
              className={`tab ${activeTab === 'url' ? 'active' : ''}`}
              onClick={() => setActiveTab('url')}
            >
              <LinkIcon size={18} />
              URL
            </button>
          </div>

          <div className="tab-content">
            <div className="collection-selector">
              <label htmlFor="collection">Target Collection:</label>
              <select
                id="collection"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
              >
                <option value="document_embeddings">Document Embeddings</option>
                <option value="schema_embeddings">Schema Embeddings</option>
                <option value="custom">Custom Collection</option>
              </select>
            </div>

            {activeTab === 'file' && (
              <div className="upload-section">
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileChange}
                    accept=".txt,.pdf,.doc,.docx,.csv,.json"
                    disabled={isProcessing}
                  />
                  <label htmlFor="file-upload" className="file-input-label">
                    <Upload size={40} />
                    <span className="label-text">
                      {file ? file.name : 'Click to select a file or drag and drop'}
                    </span>
                    <span className="label-subtext">
                      Supports: TXT, PDF, DOC, DOCX, CSV, JSON
                    </span>
                  </label>
                </div>
                <button
                  onClick={handleFileUpload}
                  disabled={!file || isProcessing}
                  className="btn btn-primary btn-lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader size={20} className="spinning" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Upload and Process
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="text-section">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste or type your text here..."
                  className="text-input"
                  rows="12"
                  disabled={isProcessing}
                />
                <button
                  onClick={handleTextIngest}
                  disabled={!textInput.trim() || isProcessing}
                  className="btn btn-primary btn-lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader size={20} className="spinning" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Ingest Text
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'url' && (
              <div className="url-section">
                <div className="url-input-wrapper">
                  <LinkIcon size={20} className="url-icon" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/document"
                    className="url-input"
                    disabled={isProcessing}
                  />
                </div>
                <button
                  onClick={handleUrlIngest}
                  disabled={!urlInput.trim() || isProcessing}
                  className="btn btn-primary btn-lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader size={20} className="spinning" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Fetch and Ingest
                    </>
                  )}
                </button>
              </div>
            )}

            {result && (
              <div className="result-section">
                <h3>Ingestion Result:</h3>
                <div className="result-card">
                  <div className="result-item">
                    <span className="result-label">Status:</span>
                    <span className="result-value success">✓ Success</span>
                  </div>
                  {result.chunks_created && (
                    <div className="result-item">
                      <span className="result-label">Chunks Created:</span>
                      <span className="result-value">{result.chunks_created}</span>
                    </div>
                  )}
                  {result.embeddings_generated && (
                    <div className="result-item">
                      <span className="result-label">Embeddings Generated:</span>
                      <span className="result-value">{result.embeddings_generated}</span>
                    </div>
                  )}
                  {result.collection && (
                    <div className="result-item">
                      <span className="result-label">Collection:</span>
                      <span className="result-value">{result.collection}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="info-panel">
          <h3>How It Works</h3>
          <div className="info-steps">
            <div className="info-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Select Input Type</h4>
                <p>Choose between file upload, direct text input, or URL fetching</p>
              </div>
            </div>
            <div className="info-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Choose Collection</h4>
                <p>Select the target vector database collection</p>
              </div>
            </div>
            <div className="info-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Process Data</h4>
                <p>Content is chunked, embedded, and stored for AI retrieval</p>
              </div>
            </div>
          </div>

          <div className="supported-formats">
            <h4>Supported Formats</h4>
            <ul>
              <li>Text files (.txt)</li>
              <li>PDF documents (.pdf)</li>
              <li>Word documents (.doc, .docx)</li>
              <li>CSV files (.csv)</li>
              <li>JSON files (.json)</li>
              <li>Web pages (via URL)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Ingestion