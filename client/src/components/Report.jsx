import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function scoreColor(score) {
  if (score >= 70) return 'var(--green)'
  if (score >= 40) return 'var(--yellow)'
  return 'var(--red)'
}

function ScoreBar({ score, animate }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => setWidth(score), 120)
      return () => clearTimeout(t)
    } else {
      setWidth(score)
    }
  }, [score, animate])

  return (
    <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, marginTop: 8, marginBottom: 6 }}>
      <div style={{
        height: '100%', width: `${width}%`,
        background: scoreColor(score), borderRadius: 1,
        transition: 'width 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: `0 0 6px ${scoreColor(score)}40`
      }} />
    </div>
  )
}

function MomentCard({ moment }) {
  const [open, setOpen] = useState(false)
  const isFumble = moment.type === 'fumble'

  return (
    <div style={{
      background: 'var(--bg)', borderBottom: '1px solid var(--border)',
      borderLeft: `2px solid ${isFumble ? 'var(--red)' : 'var(--green)'}`
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', minHeight: 52, WebkitTapHighlightColor: 'transparent' }}
      >
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: isFumble ? 'var(--red)' : 'var(--green)',
          flexShrink: 0, minWidth: 40
        }}>
          {isFumble ? '✗ Fumble' : '✓ Win'}
        </span>
        <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{moment.label}</span>
        <span style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>{moment.time}</span>
        <span style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0, marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14, animation: 'slideUp 0.15s ease' }}>
          <div>
            <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>
              What was said
            </div>
            <div style={{
              fontSize: 13, lineHeight: 1.7, padding: '12px 16px',
              background: 'var(--surface-1)', border: `1px solid ${isFumble ? 'rgba(232,93,74,0.2)' : 'rgba(111,207,151,0.2)'}`,
              color: 'var(--text)'
            }}>"{moment.said}"</div>
          </div>
          {isFumble && moment.rewrite && (
            <div>
              <div style={{ fontSize: 9, color: 'var(--green)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>
                ↳ The Rewrite
              </div>
              <div style={{
                fontSize: 13, lineHeight: 1.7, padding: '12px 16px',
                background: 'var(--surface-1)', border: '1px solid rgba(111,207,151,0.2)',
                color: 'var(--green)'
              }}>"{moment.rewrite}"</div>
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
  const [copied, setCopied] = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!persona || !transcript) navigate('/')
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
      `Persona: ${persona.name}, ${persona.role} at ${persona.company}`,
      `Duration: ${formatTime(sessionDuration)} · Score: ${report.overall}/100`,
      ``, `Verdict:`, report.verdict, ``,
      `Scores:`, ...report.scores.map(s => `  ${s.label}: ${s.score}/100 — ${s.note}`),
      ``, `Focus: ${report.focus_title}`, report.focus_desc
    ]
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
      .catch(() => {})
  }

  // Loading
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: 'var(--bg)', gap: 20 }}>
        <div style={{ position: 'relative' }}>
          <span className="spinner" style={{ width: 40, height: 40, borderWidth: 2 }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, marginBottom: 10 }}>Analysing your session</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>This takes about 10 seconds...</div>
        </div>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--bg)', padding: '52px 24px 40px' }}>
        <div className="screen-logo">Bout</div>
        <div className="banner banner-error" style={{ marginBottom: 20, fontSize: 12 }}>{error}</div>
        <button className="btn-mobile-primary" onClick={() => { hasFetched.current = false; setError(null); setLoading(true) }}>
          Retry →
        </button>
        <button className="btn-mobile-secondary" style={{ marginTop: 10 }} onClick={onNewPersona}>
          ← New Persona
        </button>
      </div>
    )
  }

  if (!report) return null

  const color = scoreColor(report.overall)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', animation: 'pageEnter 0.22s ease both' }}>

      {/* Hero score block */}
      <div style={{
        background: 'var(--surface-1)',
        borderBottom: '1px solid var(--border)',
        padding: '52px 24px 32px'
      }}>
        {/* Back button */}
        <button
          onClick={onNewPersona}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 12, fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em', cursor: 'pointer', padding: '0 0 28px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← New Persona
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <div className="persona-avatar" style={{ width: 52, height: 52, fontSize: 16, flexShrink: 0 }}>
            {persona?.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, marginBottom: 4 }}>{persona?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{persona?.role} · {persona?.company}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{formatTime(sessionDuration)} session</div>
          </div>
        </div>

        {/* Big score */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 16 }}>
          <div style={{
            fontFamily: 'DM Serif Display, serif', fontSize: 80, lineHeight: 1,
            color, textShadow: `0 0 80px ${color}30`
          }}>
            {report.overall}
          </div>
          <div style={{ fontSize: 20, color: 'var(--muted)', marginBottom: 10 }}>/100</div>
        </div>

        {/* Verdict */}
        <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.7)', lineHeight: 1.8, fontStyle: 'italic', fontFamily: 'DM Serif Display, serif' }}>
          "{report.verdict}"
        </p>
      </div>

      {/* Dimension Scores */}
      <div style={{ padding: '28px 24px 0' }}>
        <span className="section-label">Dimension Scores</span>
      </div>
      <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        {report.scores.map((s, i) => (
          <div key={i} style={{
            padding: '16px 24px',
            borderBottom: i < report.scores.length - 1 ? '1px solid var(--border)' : 'none',
            background: 'var(--surface-1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 12, color: 'var(--text)' }}>{s.label}</span>
              <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: scoreColor(s.score) }}>{s.score}</span>
            </div>
            <ScoreBar score={s.score} animate={animateBars} />
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.65 }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* Key Moments */}
      {report.moments?.length > 0 && (
        <>
          <div style={{ padding: '28px 24px 14px' }}>
            <span className="section-label">Key Moments</span>
          </div>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {report.moments.map((m, i) => <MomentCard key={i} moment={m} />)}
          </div>
        </>
      )}

      {/* Focus Drill */}
      <div style={{ padding: '28px 24px 0' }}>
        <span className="section-label">Focus Drill</span>
      </div>
      <div style={{
        margin: '0 24px 32px',
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--red)',
        padding: '20px'
      }}>
        <div style={{ fontSize: 9, color: 'var(--red)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>
          One thing to fix next session
        </div>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, marginBottom: 10, lineHeight: 1.3 }}>
          {report.focus_title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.8 }}>
          {report.focus_desc}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '0 24px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn-mobile-primary" onClick={onPracticeAgain}>
          Practice Again →
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-mobile-secondary" style={{ flex: 1 }} onClick={onNewPersona}>
            New Persona
          </button>
          <button className="btn-mobile-secondary" style={{ flex: 1 }} onClick={handleCopy}>
            {copied ? 'Copied ✓' : 'Copy Report'}
          </button>
        </div>
      </div>
    </div>
  )
}
