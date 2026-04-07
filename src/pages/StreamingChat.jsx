import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader, Square } from 'lucide-react'
import { chatAPI } from '../services/api'
import { formatResponseAsMarkdown, renderMarkdown } from '../utils/markdownFormatter.jsx'
import AgentPoolSelector from '../components/AgentPoolSelector'
import './Chat.css'

function StreamingChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your multi-agent AI assistant. I\'ll show live agent progress and stream the response as it\'s generated.',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [selectedSources, setSelectedSources] = useState(null)   // null = Auto
  const [isLoading, setIsLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const elapsedRef = useRef(null)
  const abortRef = useRef(null)
  const timeoutRef = useRef(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentStatus])

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const agentText = (event) => {
    const id = event?.agent_id || event?.source_type || 'agent'
    const status = event?.status || 'running'
    const icons = { success: '✓', failed: '✗', empty: '—' }
    return `${id}: ${icons[status] || '●'} ${status}`
  }

  const handleSend = async () => {
    const userText = inputValue.trim()
    if (!userText || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: userText,
      timestamp: new Date(),
    }

    const botMessageId = Date.now() + 1
    const botPlaceholder = {
      id: botMessageId,
      type: 'bot',
      content: '',
      timestamp: new Date(),
      isMarkdown: false,
    }

    setMessages((prev) => [...prev, userMessage, botPlaceholder])
    setInputValue('')
    setIsLoading(true)
    setElapsedSeconds(0)
    setCurrentStatus('Starting stream...')
    elapsedRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)

    const controller = new AbortController()
    abortRef.current = controller
    timeoutRef.current = setTimeout(() => {
      controller.abort()
    }, 120_000)

    try {
      await chatAPI.streamMessage(userText, {
        selectedSources,
        signal: controller.signal,
        onStarted: () => {
          setCurrentStatus('Selecting agents...')
        },
        onDispatched: (event) => {
          const names = event?.agents?.join(', ') || 'agents'
          setCurrentStatus(`Running: ${names}`)
        },
        onAgent: (event) => {
          setCurrentStatus(agentText(event))
        },
        onToken: (event) => {
          const chunk = event?.chunk || ''
          if (!chunk) return
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, content: `${msg.content}${msg.content ? ' ' : ''}${chunk}`, isMarkdown: false }
                : msg
            )
          )
        },
        onFinal: (event) => {
          const markdownContent = formatResponseAsMarkdown(event)
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, content: markdownContent, isMarkdown: true }
                : msg
            )
          )
          setCurrentStatus('Completed')
        },
        onError: (event) => {
          clearTimeout(timeoutRef.current)
          const errorText = event?.error || event?.message || 'No agents returned a result for this query.'
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, content: `⚠️ ${errorText}`, isError: true, isMarkdown: false }
                : msg
            )
          )
          setCurrentStatus('Error')
          clearInterval(elapsedRef.current)
          setIsLoading(false)
        },
        onDone: () => {
          clearTimeout(timeoutRef.current)
          clearInterval(elapsedRef.current)
          setIsLoading(false)
          setTimeout(() => setCurrentStatus(''), 1200)
        },
      })
    } catch (error) {
      clearTimeout(timeoutRef.current)
      // Ignore abort errors — user intentionally stopped, or 120s timeout fired
      if (error?.name === 'AbortError') {
        clearInterval(elapsedRef.current)
        setIsLoading(false)
        const timedOut = elapsedSeconds >= 120
        if (timedOut) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, content: '⚠️ Request timed out after 120 seconds.', isError: true, isMarkdown: false }
                : msg
            )
          )
        }
        setCurrentStatus('')
        return
      }
      const errorText = error?.message || 'Streaming request failed'
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? { ...msg, content: `⚠️ ${errorText}`, isError: true, isMarkdown: false }
            : msg
        )
      )
      setCurrentStatus('Error')
      clearInterval(elapsedRef.current)
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div className="chat-header-content">
          <Bot className="chat-icon" size={24} />
          <div>
            <h1 className="chat-title">AI Chat Assistant</h1>
            <p className="chat-subtitle">Native token streaming · parallel agents</p>
          </div>
        </div>
        <div className="agent-pool-row">
          <label className="agent-pool-label">Agent pool</label>
          <AgentPoolSelector
            id="stream-agent-pool"
            value={selectedSources}
            onChange={setSelectedSources}
            disabled={isLoading}
          />
        </div>
      </header>

      <div className="chat-container">
        <div className="messages-container">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.type} ${message.isError ? 'error' : ''}`}
            >
              <div className="message-avatar">
                {message.type === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className="message-content">
                <div className="message-text">
                  {message.isMarkdown ? (
                    <div className="markdown-content">{renderMarkdown(message.content)}</div>
                  ) : (
                    message.content
                  )}
                </div>
                <div className="message-time">{formatTime(message.timestamp)}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message bot loading">
              <div className="message-avatar">
                <Loader size={20} className="spinner" />
              </div>
              <div className="message-content">
                <div className="message-text">
                  {currentStatus || 'Streaming...'}
                  {elapsedSeconds > 3 && (
                    <span style={{ color: '#94a3b8', marginLeft: 8, fontSize: '0.85em' }}>
                      ({elapsedSeconds}s)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="chat-input"
            rows="1"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="send-button"
          >
            <Send size={20} />
          </button>
          {isLoading && (
            <button
              onClick={() => {
                abortRef.current?.abort()
              }}
              className="send-button stop-button"
              title="Stop"
            >
              <Square size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default StreamingChat
