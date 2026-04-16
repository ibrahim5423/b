import React, { useState } from 'react'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function formatDate(ts) {
  const d = new Date(ts)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return 'Today · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function scoreColor(score) {
  if (score >= 70) return 'var(--green)'
  if (score >= 40) return 'var(--yellow)'
  return 'var(--red)'
}

function ChevronIcon({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

function TranscriptView({ transcript, personaName }) {
  if (!transcript?.length)
    return <p style={{ color: 'var(--muted)', fontSize: 12, padding: '16px 0' }}>No transcript available.</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {transcript.map((msg, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
          <span style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            {msg.role === 'user' ? 'You' : personaName}
          </span>
          <div style={{
            padding: '10px 14px', fontSize: 13, lineHeight: 1.6, maxWidth: '88%',
            background: msg.role === 'user' ? 'var(--text)' : 'var(--surface-2)',
            color: msg.role === 'user' ? 'var(--bg)' : 'var(--text)',
            border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none'
          }}>{msg.text}</div>
        </div>
      ))}
    </div>
  )
}

function ReportView({ report }) {
  if (!report) return <p style={{ color: 'var(--muted)', fontSize: 12, padding: '16px 0' }}>Report not available.</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Overall */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 52, lineHeight: 1, color: scoreColor(report.overall) }}>
          {report.overall}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>Overall Score</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, fontStyle: 'italic' }}>"{report.verdict}"</div>
        </div>
      </div>

      {/* Scores */}
      <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {report.scores?.map((s, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12 }}>{s.label}</span>
              <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: scoreColor(s.score) }}>{s.score}</span>
            </div>
            <div style={{ height: 2, background: 'var(--surface-2)', borderRadius: 1 }}>
              <div style={{ height: '100%', width: `${s.score}%`, background: scoreColor(s.score), borderRadius: 1, transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5, lineHeight: 1.6 }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* Focus */}
      {report.focus_title && (
        <div style={{ marginTop: 20, background: 'var(--surface-2)', border: '1px solid var(--border)', borderLeft: '2px solid var(--red)', padding: '16px' }}>
          <div style={{ fontSize: 9, color: 'var(--red)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>Focus Drill</div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 16, marginBottom: 8 }}>{report.focus_title}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7 }}>{report.focus_desc}</div>
        </div>
      )}
    </div>
  )
}

function RecordingView({ call }) {
  return (
    <div style={{ padding: '12px 0' }}>
      {call.meta?.localRecordingUrl ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.04em' }}>Your mic · recorded locally</div>
          <audio controls src={call.meta.localRecordingUrl} style={{ width: '100%', outline: 'none' }} />
          <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.7 }}>
            Recording is available this session only — clears on page refresh.
          </div>
        </div>
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.8 }}>No recording available for this call.</p>
      )}
    </div>
  )
}

function CallCard({ call, onPracticeAgain }) {
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState('report')
  const score = call.report?.overall
  const msgCount = call.transcript?.filter(m => m.role === 'user').length || 0

  return (
    <div style={{ background: 'var(--bg)', marginBottom: 1 }}>
      {/* Card header */}
      <div
        onClick={() => setExpanded(o => !o)}
        style={{
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
          cursor: 'pointer', background: expanded ? 'var(--surface-1)' : 'var(--bg)',
          transition: 'background 0.15s ease', WebkitTapHighlightColor: 'transparent'
        }}
      >
        <div style={{
          width: 44, height: 44, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(240,237,232,0.15) 0%, rgba(240,237,232,0.06) 100%)',
          border: '1px solid var(--border)',
          color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600, fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em'
        }}>
          {call.persona?.initials || '??'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 16, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {call.persona?.name || 'Unknown'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.02em' }}>
            {call.persona?.role}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, letterSpacing: '0.02em' }}>
            {formatDate(call.timestamp)} · {formatTime(call.duration || 0)} · {msgCount} msgs
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, marginRight: 8 }}>
          {score != null ? (
            <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, color: scoreColor(score), lineHeight: 1 }}>{score}</span>
          ) : (
            <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em' }}>No report</span>
          )}
        </div>

        <ChevronIcon open={expanded} />
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ background: 'var(--surface-1)', borderTop: '1px solid var(--border)', animation: 'slideUp 0.2s ease' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {['report', 'transcript', 'recording'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '13px 8px', fontSize: 10,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: 'none', border: 'none',
                  borderBottom: tab === t ? '1px solid var(--text)' : '1px solid transparent',
                  color: tab === t ? 'var(--text)' : 'var(--muted)',
                  cursor: 'pointer', fontFamily: 'DM Mono, monospace',
                  marginBottom: '-1px', transition: 'color 0.15s ease',
                  minHeight: 44, WebkitTapHighlightColor: 'transparent'
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: '20px 20px 0' }}>
            {tab === 'report' && <ReportView report={call.report} />}
            {tab === 'transcript' && <TranscriptView transcript={call.transcript} personaName={call.persona?.name} />}
            {tab === 'recording' && <RecordingView call={call} />}
          </div>

          {/* Practice Again */}
          <div style={{ padding: '20px' }}>
            <button
              onClick={() => onPracticeAgain(call.persona)}
              className="btn-mobile-primary"
              style={{ gap: 12 }}
            >
              <span style={{
                width: 26, height: 26, flexShrink: 0,
                background: 'rgba(0,0,0,0.2)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.04em'
              }}>{call.persona?.initials || '??'}</span>
              Practice Again with {call.persona?.name?.split(' ')[0] || 'Persona'} →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CallHistory({ history, onClose, onPracticeAgain }) {
  const sorted = [...(history || [])].reverse()

  return (
    <div className="mobile-page">
      {/* Header */}
      <div style={{ padding: '52px 24px 24px' }}>
        <div className="screen-logo">Bout</div>
        <div className="screen-eyebrow">Your Progress</div>
        <h1 className="screen-title" style={{ fontSize: 30 }}>Call History</h1>
        {sorted.length > 0 && (
          <p className="screen-sub" style={{ marginTop: 8 }}>
            {sorted.length} session{sorted.length !== 1 ? 's' : ''} completed
          </p>
        )}
      </div>

      {/* Stats summary row (if any calls) */}
      {sorted.length > 0 && (() => {
        const withReports = sorted.filter(c => c.report?.overall != null)
        const avg = withReports.length
          ? Math.round(withReports.reduce((a, c) => a + c.report.overall, 0) / withReports.length)
          : null
        const best = withReports.length
          ? Math.max(...withReports.map(c => c.report.overall))
          : null
        const totalMins = Math.round(sorted.reduce((a, c) => a + (c.duration || 0), 0) / 60)

        return (
          <div style={{ display: 'flex', margin: '0 24px 28px', background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
            {[
              { label: 'Sessions', value: sorted.length },
              { label: 'Avg Score', value: avg ?? '—' },
              { label: 'Best Score', value: best ?? '—' },
              { label: 'Mins', value: totalMins },
            ].map((stat, i, arr) => (
              <div key={i} style={{
                flex: 1, padding: '16px 12px', textAlign: 'center',
                borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, lineHeight: 1, color: 'var(--text)', marginBottom: 6 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Call list */}
      {sorted.length === 0 ? (
        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: 'var(--text)', marginBottom: 12 }}>
            No sessions yet
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>
            Complete your first voice session to see your call history and performance reports here.
          </p>
        </div>
      ) : (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {sorted.map(call => (
            <CallCard key={call.id} call={call} onPracticeAgain={onPracticeAgain} />
          ))}
        </div>
      )}

      <div style={{ height: 20 }} />
    </div>
  )
}
