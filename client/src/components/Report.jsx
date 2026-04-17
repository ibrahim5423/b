import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function formatTime(seconds) {
  const total = Math.max(0, Math.round(seconds || 0))
  const m = Math.floor(total / 60).toString().padStart(2, '0')
  const s = (total % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function scoreColor(score) {
  if (score >= 70) return 'var(--green)'
  if (score >= 40) return 'var(--yellow)'
  return 'var(--red)'
}

function gradeFromScore(n) {
  if (n >= 93) return 'A+'
  if (n >= 87) return 'A'
  if (n >= 83) return 'A-'
  if (n >= 77) return 'B+'
  if (n >= 73) return 'B'
  if (n >= 68) return 'B-'
  if (n >= 63) return 'C+'
  if (n >= 58) return 'C'
  if (n >= 53) return 'C-'
  if (n >= 40) return 'D'
  return 'F'
}

function useCountUp(target, active, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) { setValue(0); return }
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active, duration])
  return value
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

function MetricCell({ label, value, sub }) {
  return (
    <div style={{ flex: 1, padding: '14px 8px', textAlign: 'center', minWidth: 0 }}>
      <div style={{
        fontFamily: 'DM Serif Display, serif',
        fontSize: 22, color: 'var(--text)', lineHeight: 1,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
      }}>
        {value}
      </div>
      <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 6 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 9, color: 'var(--muted-2, #3a3a3a)', marginTop: 2 }}>{sub}</div>
      )}
    </div>
  )
}

function TrendBadge({ trend }) {
  const map = {
    improved: { color: 'var(--green)', arrow: '↗', label: 'Improved' },
    flat: { color: 'var(--muted)', arrow: '→', label: 'Flat' },
    declined: { color: 'var(--red)', arrow: '↘', label: 'Declined' }
  }
  const s = map[trend] || map.flat
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
      color: s.color
    }}>
      <span style={{ fontSize: 14 }}>{s.arrow}</span>{s.label}
    </span>
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
          {moment.said && (
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
          )}

          {moment.why && (
            <div>
              <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>
                Why it mattered
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>{moment.why}</div>
            </div>
          )}

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

function TranscriptPanel({ transcript, personaName }) {
  const [open, setOpen] = useState(false)
  if (!transcript || transcript.length === 0) return null

  return (
    <div style={{ margin: '0 0 24px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '18px 24px',
          background: 'var(--surface-1)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', WebkitTapHighlightColor: 'transparent'
        }}
      >
        <span className="section-label" style={{ margin: 0 }}>Full Transcript</span>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
          {transcript.length} messages · {open ? 'hide ▲' : 'show ▼'}
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 24px 20px', animation: 'slideUp 0.2s ease' }}>
          {transcript.map((m, i) => {
            const isRep = m.role === 'user'
            return (
              <div key={i} style={{ padding: '12px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                <div style={{
                  fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase',
                  color: isRep ? 'var(--text)' : 'var(--red)',
                  marginBottom: 4
                }}>
                  {isRep ? 'You' : personaName}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{m.text}</div>
              </div>
            )
          })}
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

  // Hooks must be called unconditionally — fallback to 0 when report is absent.
  const animatedScore = useCountUp(report?.overall || 0, animateBars && !!report)

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
          body: JSON.stringify({
            persona,
            transcript: transcript || [],
            durationSeconds: sessionDuration || 0
          })
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
      `Duration: ${formatTime(sessionDuration)} · Score: ${report.overall}/100 (${report.grade || gradeFromScore(report.overall)})`,
      ``, `Verdict:`, report.verdict, ``,
      `Scores:`, ...report.scores.map(s => `  ${s.label}: ${s.score}/100 (${s.rubric_bucket || ''}) — ${s.note}`),
      ``, `Focus: ${report.focus_title}`, report.focus_desc,
      report.focus_sample_phrase ? `\nSay next time: "${report.focus_sample_phrase}"` : ''
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
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Computing metrics and coaching feedback…</div>
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
  const grade = report.grade || gradeFromScore(report.overall)
  const metrics = report.metrics || null

  const strengths = Array.isArray(report.strengths) ? report.strengths : []
  const weaknesses = Array.isArray(report.weaknesses) ? report.weaknesses : []

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', animation: 'pageEnter 0.22s ease both' }}>

      {/* Hero score block */}
      <div style={{
        background: 'var(--surface-1)',
        borderBottom: '1px solid var(--border)',
        padding: '52px 24px 28px'
      }}>
        {/* Back button */}
        <button
          onClick={onNewPersona}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 12, fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em', cursor: 'pointer', padding: '0 0 28px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← New Persona
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
          <div className="persona-avatar" style={{ width: 52, height: 52, fontSize: 16, flexShrink: 0 }}>
            {persona?.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, marginBottom: 4 }}>{persona?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{persona?.role} · {persona?.company}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
              {formatTime(sessionDuration)} session · {persona?.callType || 'Cold call'}
            </div>
          </div>
        </div>

        {/* Big score + grade */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            <div style={{
              fontFamily: 'DM Serif Display, serif', fontSize: 82, lineHeight: 1,
              color, textShadow: `0 0 80px ${color}30`,
              fontVariantNumeric: 'tabular-nums'
            }}>
              {animatedScore}
            </div>
            <div style={{ fontSize: 20, color: 'var(--muted)', marginBottom: 10 }}>/100</div>
          </div>

          <div style={{
            border: `1.5px solid ${color}`,
            borderRadius: 12,
            padding: '8px 14px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            minWidth: 64,
            background: `${color}08`
          }}>
            <div style={{
              fontFamily: 'DM Serif Display, serif', fontSize: 26, color,
              lineHeight: 1
            }}>{grade}</div>
            <div style={{
              fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--muted)', marginTop: 4
            }}>Grade</div>
          </div>
        </div>

        {/* Verdict */}
        <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.75)', lineHeight: 1.8, fontStyle: 'italic', fontFamily: 'DM Serif Display, serif', margin: 0 }}>
          "{report.verdict}"
        </p>
      </div>

      {/* Metrics strip */}
      {metrics && (
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--border)',
          background: 'var(--bg)'
        }}>
          <MetricCell label="Duration" value={formatTime(metrics.duration_seconds)} />
          <div style={{ width: 1, background: 'var(--border)' }} />
          <MetricCell
            label="Talk"
            value={`${metrics.talk_ratio_rep_pct}%`}
            sub={`${metrics.rep_words} words`}
          />
          <div style={{ width: 1, background: 'var(--border)' }} />
          <MetricCell label="Questions" value={metrics.rep_questions} />
          <div style={{ width: 1, background: 'var(--border)' }} />
          <MetricCell label="Fillers" value={metrics.filler_count} />
        </div>
      )}

      {/* Headline strength / weakness */}
      {(report.headline_strength || report.headline_weakness) && (
        <div style={{ padding: '24px 24px 0', display: 'flex', gap: 10 }}>
          <div style={{
            flex: 1, padding: '14px 14px',
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderLeft: '2px solid var(--green)',
            borderRadius: 2
          }}>
            <div style={{ fontSize: 9, color: 'var(--green)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>
              ✓ Strength
            </div>
            <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{report.headline_strength}</div>
          </div>
          <div style={{
            flex: 1, padding: '14px 14px',
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderLeft: '2px solid var(--red)',
            borderRadius: 2
          }}>
            <div style={{ fontSize: 9, color: 'var(--red)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>
              ✗ Gap
            </div>
            <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{report.headline_weakness}</div>
          </div>
        </div>
      )}

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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 12, color: 'var(--text)' }}>{s.label}</span>
                {s.rubric_bucket && (
                  <span style={{
                    fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                    padding: '2px 7px', borderRadius: 3,
                    color: scoreColor(s.score),
                    border: `1px solid ${scoreColor(s.score)}40`,
                    flexShrink: 0
                  }}>
                    {s.rubric_bucket}
                  </span>
                )}
              </div>
              <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: scoreColor(s.score), fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{s.score}</span>
            </div>
            <ScoreBar score={s.score} animate={animateBars} />
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.65 }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* Strengths */}
      {strengths.length > 0 && (
        <>
          <div style={{ padding: '28px 24px 14px' }}>
            <span className="section-label" style={{ color: 'var(--green)' }}>✓ What Worked</span>
          </div>
          <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {strengths.map((s, i) => (
              <div key={i} style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderLeft: '2px solid var(--green)',
                padding: '14px 16px'
              }}>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, marginBottom: 6 }}>{s.title}</div>
                {s.quote && (
                  <div style={{
                    fontSize: 12, color: 'var(--green)', lineHeight: 1.6,
                    fontFamily: 'DM Serif Display, serif', fontStyle: 'italic',
                    marginBottom: s.why ? 8 : 0
                  }}>
                    "{s.quote}"
                  </div>
                )}
                {s.why && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>{s.why}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Weaknesses */}
      {weaknesses.length > 0 && (
        <>
          <div style={{ padding: '28px 24px 14px' }}>
            <span className="section-label" style={{ color: 'var(--red)' }}>✗ Where You Slipped</span>
          </div>
          <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {weaknesses.map((w, i) => (
              <div key={i} style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderLeft: '2px solid var(--red)',
                padding: '14px 16px'
              }}>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, marginBottom: 6 }}>{w.title}</div>
                {w.quote && (
                  <div style={{
                    fontSize: 12, color: 'var(--text)', lineHeight: 1.6,
                    fontFamily: 'DM Serif Display, serif', fontStyle: 'italic',
                    marginBottom: w.rewrite ? 10 : 0
                  }}>
                    You said: "{w.quote}"
                  </div>
                )}
                {w.rewrite && (
                  <div style={{
                    fontSize: 12, color: 'var(--green)', lineHeight: 1.6,
                    paddingTop: 10, borderTop: '1px solid var(--border)'
                  }}>
                    <span style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--green)', marginRight: 6 }}>
                      Try:
                    </span>
                    "{w.rewrite}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

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

      {/* Coachability */}
      {report.coachability && report.coachability.note && report.coachability.note !== '—' && (
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: 2,
            padding: '16px 18px',
            display: 'flex', alignItems: 'flex-start', gap: 14
          }}>
            <div style={{ flexShrink: 0 }}>
              <TrendBadge trend={report.coachability.trend} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, flex: 1 }}>
              {report.coachability.note}
            </div>
          </div>
        </div>
      )}

      {/* Focus Drill */}
      <div style={{ padding: '28px 24px 0' }}>
        <span className="section-label">Focus Drill</span>
      </div>
      <div style={{
        margin: '0 24px 24px',
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

        {report.focus_sample_phrase && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 9, color: 'var(--green)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
              Rehearse saying
            </div>
            <div style={{
              fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--text)',
              background: 'var(--bg)', padding: '12px 14px',
              border: '1px dashed rgba(111,207,151,0.3)',
              lineHeight: 1.6
            }}>
              "{report.focus_sample_phrase}"
            </div>
          </div>
        )}
      </div>

      {/* Transcript */}
      <TranscriptPanel transcript={transcript} personaName={persona?.name || 'Prospect'} />

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
