/**
 * AgentPoolSelector
 *
 * Fetches all registered agents from the backend and renders a multi-select
 * dropdown so the user can choose which agent pool(s) to use for a query.
 *
 * Props:
 *   value          – array of selected source_type strings, or null (= Auto)
 *   onChange       – (newValue: string[]|null) => void
 *   disabled       – boolean, disables interaction while a request is in flight
 *   id             – optional id prefix for accessibility labels
 */

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check, Bot } from 'lucide-react'
import { agentsAPI } from '../services/api'
import './AgentPoolSelector.css'

const AUTO_VALUE = '__auto__'

function AgentPoolSelector({ value, onChange, disabled = false, id = 'agent-pool' }) {
  const [agents, setAgents] = useState([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const loadAgents = () => {
    setLoadingAgents(true)
    agentsAPI
      .list()
      .then((data) => setAgents(data.items || []))
      .catch(() => setAgents([]))
      .finally(() => setLoadingAgents(false))
  }

  // Fetch agents on mount
  useEffect(() => {
    loadAgents()
  }, [])

  // Refresh agents list every time the dropdown opens
  useEffect(() => {
    if (open) loadAgents()
  }, [open])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isAuto = value === null || value === undefined

  const toggleAuto = () => onChange(null)

  const toggleAgent = (agentId) => {
    if (isAuto) {
      // Switching away from Auto – select only this one
      onChange([agentId])
      return
    }
    const current = value || []
    const next = current.includes(agentId)
      ? current.filter((s) => s !== agentId)
      : [...current, agentId]
    // If nothing left, revert to Auto
    onChange(next.length === 0 ? null : next)
  }

  /** Human-readable summary for the trigger button */
  const summary = () => {
    if (loadingAgents) return 'Loading agents…'
    if (isAuto || agents.length === 0) return 'Auto (supervisor decides)'
    if (value.length === agents.length) return 'All agents selected'
    if (value.length === 1) {
      const match = agents.find((a) => a.id === value[0])
      return match ? match.name : value[0]
    }
    return `${value.length} agents selected`
  }

  return (
    <div
      className={`aps-container${disabled ? ' aps-disabled' : ''}`}
      ref={containerRef}
      id={id}
    >
      <button
        type="button"
        className={`aps-trigger${open ? ' aps-trigger--open' : ''}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <Bot size={15} className="aps-icon" />
        <span className="aps-summary">{summary()}</span>
        <ChevronDown size={15} className={`aps-chevron${open ? ' aps-chevron--up' : ''}`} />
      </button>

      {open && (
        <div className="aps-dropdown" role="listbox" aria-multiselectable="true">
          {/* Auto option */}
          <button
            type="button"
            className={`aps-option${isAuto ? ' aps-option--selected' : ''}`}
            onClick={toggleAuto}
            role="option"
            aria-selected={isAuto}
          >
            <span className="aps-check">{isAuto && <Check size={13} />}</span>
            <span className="aps-option-label">
              Auto
              <small>Orchestrator decides</small>
            </span>
          </button>

          {agents.length > 0 && <div className="aps-divider" />}

          {loadingAgents ? (
            <div className="aps-loading">Loading agents…</div>
          ) : (
            agents.map((agent) => {
              const active = !isAuto && (value || []).includes(agent.id)
              return (
                <button
                  key={agent.id || agent.name}
                  type="button"
                  className={`aps-option${active ? ' aps-option--selected' : ''}`}
                  onClick={() => toggleAgent(agent.id)}
                  role="option"
                  aria-selected={active}
                >
                  <span className="aps-check">{active && <Check size={13} />}</span>
                  <span className="aps-option-label">
                    {agent.name}
                    <small>{agent.source_type}</small>
                  </span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default AgentPoolSelector
