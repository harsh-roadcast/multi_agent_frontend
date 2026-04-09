import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, Database, Users, MessageSquare,
  ArrowRight, CheckCircle, AlertCircle
} from 'lucide-react'
import { healthAPI, datasourcesAPI, agentsAPI } from '../services/api'
import logo from '../assets/Smart Sync Logo Head.png'
import './Dashboard.css'

/* ── Floating particle canvas ───────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let W = canvas.offsetWidth
    let H = canvas.offsetHeight
    canvas.width = W
    canvas.height = H

    const PARTICLE_COUNT = 55
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.5 + 0.15,
    }))

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
    }
    window.addEventListener('resize', resize)

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      // draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 110) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(56,189,248,${0.12 * (1 - dist / 110)})`
            ctx.lineWidth = 0.7
            ctx.stroke()
          }
        }
      }
      // draw dots
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(56,189,248,${p.alpha})`
        ctx.fill()
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="db-particles" />
}

/* ── Main component ─────────────────────────────────────── */
function Dashboard() {
  const navigate = useNavigate()
  const [health, setHealth] = useState(null)
  const [stats, setStats] = useState({ datasources: 0, agents: 0 })
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    loadDashboardData()
    // stagger entrance animation
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  const loadDashboardData = async () => {
    try {
      const [healthData, datasourcesData, agentsData] = await Promise.all([
        healthAPI.check(),
        datasourcesAPI.list(),
        agentsAPI.list(),
      ])
      setHealth(healthData)
      setStats({
        datasources: datasourcesData.total || 0,
        agents: agentsData.total || 0,
      })
    } catch (e) {
      console.error('Dashboard load error:', e)
    } finally {
      setLoading(false)
    }
  }

  const isHealthy = health?.status === 'healthy'

  const statCards = [
    {
      icon: Activity,
      label: 'System Status',
      value: loading ? '…' : (isHealthy ? 'Healthy' : 'Offline'),
      accent: isHealthy ? '#10b981' : '#ef4444',
      pulse: true,
    },
    {
      icon: Database,
      label: 'Datasources',
      value: loading ? '…' : stats.datasources,
      accent: '#38bdf8',
    },
    {
      icon: Users,
      label: 'Agents',
      value: loading ? '…' : stats.agents,
      accent: '#7dd3fc',
    },
    {
      icon: MessageSquare,
      label: 'Chat',
      value: 'Active',
      accent: '#0ea5e9',
    },
  ]

  const quickActions = [
    {
      icon: MessageSquare,
      title: 'Start Chatting',
      desc: 'Ask questions across all your data sources with parallel AI agents',
      path: '/chat',
      accent: '#38bdf8',
    },
    {
      icon: Database,
      title: 'Datasources',
      desc: 'Register, index, and manage your SQL, document, and GitBook sources',
      path: '/datasources',
      accent: '#7dd3fc',
    },
    {
      icon: Users,
      title: 'Agents',
      desc: 'Configure specialized AI agents and control routing keywords',
      path: '/agents',
      accent: '#0ea5e9',
    },
  ]

  return (
    <div className={`db-root${visible ? ' db-visible' : ''}`}>
      <ParticleCanvas />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="db-hero db-fadein" style={{ '--delay': '0ms' }}>
        <div className="db-logo-wrap">
          <div className="db-logo-ring db-ring1" />
          <div className="db-logo-ring db-ring2" />
          <div className="db-logo-ring db-ring3" />
          <img src={logo} alt="SmartSync" className="db-logo" />
        </div>
        <h1 className="db-hero-title">SmartSync</h1>
        <p className="db-hero-sub">Multi-Agent Intelligence Platform</p>
        <div className="db-status-pill">
          {isHealthy
            ? <><CheckCircle size={14} /> All systems operational</>
            : <><AlertCircle size={14} /> System offline</>}
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────── */}
      <section className="db-stats db-fadein" style={{ '--delay': '120ms' }}>
        {statCards.map((s, i) => (
          <div
            key={s.label}
            className="db-stat"
            style={{ '--accent': s.accent, '--i': i }}
          >
            <div className="db-stat-icon">
              <s.icon size={22} />
              {s.pulse && <span className="db-live-dot" style={{ background: s.accent }} />}
            </div>
            <p className="db-stat-val">{s.value}</p>
            <p className="db-stat-label">{s.label}</p>
          </div>
        ))}
      </section>

      {/* ── Quick Actions ─────────────────────────────────── */}
      <section className="db-actions db-fadein" style={{ '--delay': '220ms' }}>
        <h2 className="db-section-title">Quick Actions</h2>
        <div className="db-action-grid">
          {quickActions.map((a) => (
            <button
              key={a.path}
              className="db-action-card"
              style={{ '--accent': a.accent }}
              onClick={() => navigate(a.path)}
            >
              <div className="db-action-icon">
                <a.icon size={28} />
              </div>
              <div className="db-action-body">
                <h3>{a.title}</h3>
                <p>{a.desc}</p>
              </div>
              <ArrowRight size={18} className="db-action-arrow" />
            </button>
          ))}
        </div>
      </section>

    </div>
  )
}

export default Dashboard