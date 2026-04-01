import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function ScoreBar({ score, animate }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => setWidth(score), 100)
      return () => clearTimeout(t)
    } else {
      setWidth(score)
    }
  }, [score, animate])

  return (
    <div className="progress-bar-track" style={{ height: 2, marginTop: 8, marginBottom: 4 }}>
      <div
        className="progress-bar-fill"
        style={{
          width: `${width}%`,
          background: score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--text)' : 'var(--red)',
          transition: 'width 1.4s ease'
        }}
      />
    </div>
  )
}

function MomentCard({ moment }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="moment-card">
      <div className="moment-header" onClick={() => setOpen(o => !o)}>
        <span className={`moment-badge ${moment.type}`}>
          {moment.type === 'fumble' ? '✗ Fumble' : '✓ Win'}
        </span>
        <span className="moment-label">{moment.label}</span>
        <span className="moment-time">{moment.time}</span>
        <span className={`moment-chevron ${open ? 'open' : ''}`}>▼</span>
      </div>
      {open && (
        <div className="moment-body">
          <div>
            <div className="moment-quote-label">What was said</div>
            <div className="moment-quote">"{moment.said}"</div>
          </div>
          {moment.type === 'fumble' && moment.rewrite && (
            <div>
              <div className="moment-rewrite-label">↳ The Rewrite</div>
              <div className="moment-rewrite">"{moment.rewrite}"</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Report({ persona, transcript, sessionDuration, existingReport, onReportReady, onPracticeAgain, onNewPersona }) {
  const navigate = useNavigate()
  const [report, setReport] = useState(existingReport || null)
  const [loading, setLoading] = useState(!existingReport)
  const [error, setError] = useState(null)
  const [animateBars, setAnimateBars] = useState(false)
  const hasFetched = useRef(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!persona || !transcript) {
      navigate('/')
      return
    }
  }, [])

  useEffect(() => {
    if (existingReport) {
      setReport(existingReport)
      setLoading(false)
      setTimeout(() => setAnimateBars(true), 200)
      return
    }

    if (hasFetched.current) return
    hasFetched.current = true

    async function fetchReport() {
      try {
        const res = await fetch('/api/generate-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ persona, transcript: transcript || [] })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)
        if (!data.report) throw new Error('No report returned.')
        setReport(data.report)
        if (onReportReady) onReportReady(data.report)
        setTimeout(() => setAnimateBars(true), 300)
      } catch (err) {
        setError(err.message || 'Failed to generate report.')
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [])

  function handleCopy() {
    if (!report || !persona) return
    const lines = [
      `BOUT — Session Report`,
      ``,
      `Persona: ${persona.name}, ${persona.role} at ${persona.company}`,
      `Duration: ${formatTime(sessionDuration)}`,
      `Overall Score: ${report.overall}/100`,
      ``,
      `Verdict:`,
      report.verdict,
      ``,
      `Dimension Scores:`,
      ...report.scores.map(s => `  ${s.label}: ${s.score}/100 — ${s.note}`),
      ``,
      `Key Moments:`,
      ...report.moments.map(m => `  [${m.type.toUpperCase()}] ${m.time} — ${m.label}\n  Said: "${m.said}"${m.rewrite ? `\n  Rewrite: "${m.rewrite}"` : ''}`),
      ``,
      `Focus Drill: ${report.focus_title}`,
      report.focus_desc
    ]
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {})
  }

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="loading-center">
          <span className="spinner" style={{ width: 28, height: 28 }} />
          <span className="loading-text">Analysing your session with Claude...</span>
          <span className="loading-subtext">This takes about 10 seconds</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <div className="logo">Bout.</div>
        <div className="banner banner-error" style={{ marginTop: 32 }}>
          {error}
        </div>
        <button
          className="btn-primary"
          style={{ marginTop: 16 }}
          onClick={() => {
            hasFetched.current = false
            setError(null)
            setLoading(true)
          }}
        >
          Retry →
        </button>
        <div style={{ marginTop: 16 }}>
          <button className="btn-text" onClick={onNewPersona}>← Back to Start</button>
        </div>
      </div>
    )
  }

  if (!report) return null

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* HEADER */}
      <div className="report-header">
        <div className="report-header-left">
          <div className="persona-avatar">{persona?.initials || '??'}</div>
          <div className="report-persona-info">
            <div className="report-persona-name">{persona?.name}</div>
            <div className="report-persona-role">{persona?.role} · {persona?.company}</div>
            <div className="report-duration">{formatTime(sessionDuration)} session</div>
          </div>
        </div>

        <div className="report-score-block">
          <div className="report-score-number" style={{
            color: report.overall >= 70 ? 'var(--green)' : report.overall >= 40 ? 'var(--text)' : 'var(--red)'
          }}>
            {report.overall}
          </div>
          <div className="report-score-label">Overall Score</div>
        </div>
      </div>

      {/* VERDICT */}
      <div className="report-verdict">{report.verdict}</div>

      <div className="report-body">
        {/* DIMENSION SCORES */}
        <div>
          <div className="report-section-label">Dimension Scores</div>
          {report.scores.map((s, i) => (
            <div key={i} className="score-row">
              <div className="score-row-header">
                <span>{s.label}</span>
                <span className="score-row-num">{s.score}</span>
              </div>
              <ScoreBar score={s.score} animate={animateBars} />
              <div className="score-row-note">{s.note}</div>
            </div>
          ))}
        </div>

        {/* KEY MOMENTS */}
        {report.moments && report.moments.length > 0 && (
          <div>
            <div className="report-section-label">Key Moments</div>
            {report.moments.map((m, i) => (
              <MomentCard key={i} moment={m} />
            ))}
          </div>
        )}

        {/* FOCUS DRILL */}
        <div>
          <div className="report-section-label">Focus Drill</div>
          <div className="focus-drill">
            <div className="focus-drill-eyebrow">One thing to fix next session</div>
            <div className="focus-drill-title">{report.focus_title}</div>
            <div className="focus-drill-desc">{report.focus_desc}</div>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="report-actions">
        <button className="btn-primary" onClick={onPracticeAgain}>
          Practice Again →
        </button>
        <button className="btn-ghost" onClick={onNewPersona}>
          New Persona
        </button>
        <button className="btn-ghost" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy Report'}
        </button>
      </div>
    </div>
  )
}
