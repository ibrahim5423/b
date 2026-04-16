import React, { useState } from 'react'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function formatDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function scoreColor(score) {
  if (score >= 70) return 'var(--green)'
  if (score >= 40) return 'var(--yellow)'
  return 'var(--red)'
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
    </svg>
  )
}

function TranscriptView({ transcript, personaName }) {
  if (!transcript || transcript.length === 0) {
    return <div style={{ color: 'var(--muted)', fontSize: 11, padding: '12px 0' }}>No transcript available.</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {transcript.map((msg, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3,
          alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
          <span style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {msg.role === 'user' ? 'You' : personaName}
          </span>
          <div style={{
            padding: '8px 12px', fontSize: 12, lineHeight: 1.6, maxWidth: '85%',
            background: msg.role === 'user' ? 'var(--text)' : 'var(--surface-2)',
            color: msg.role === 'user' ? 'var(--bg)' : 'var(--text)',
            border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none'
          }}>
            {msg.text}
          </div>
        </div>
      ))}
    </div>
  )
}

function ReportView({ report }) {
  if (!report) return <div style={{ color: 'var(--muted)', fontSize: 11, padding: '12px 0' }}>Report not available.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Scores */}
      <div>
        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 10 }}>
          Scores
        </div>
        {report.scores?.map((s, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span>{s.label}</span>
              <span style={{ color: scoreColor(s.score), fontFamily: 'DM Serif Display, serif', fontSize: 14 }}>{s.score}</span>
            </div>
            <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1 }}>
              <div style={{ height: '100%', width: `${s.score}%`, background: scoreColor(s.score), borderRadius: 1 }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* Verdict */}
      {report.verdict && (
        <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 12, fontSize: 11, color: 'var(--muted)', lineHeight: 1.7, fontStyle: 'italic' }}>
          "{report.verdict}"
        </div>
      )}

      {/* Focus drill */}
      {report.focus_title && (
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', padding: '14px 16px' }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--red)', marginBottom: 6 }}>
            Focus Drill
          </div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 15, marginBottom: 6 }}>{report.focus_title}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7 }}>{report.focus_desc}</div>
        </div>
      )}
    </div>
  )
}

function CallDetails({ call }) {
  const [tab, setTab] = useState('transcript') // transcript | report | recording

  const tabs = [
    { id: 'transcript', label: 'Transcript' },
    { id: 'report',     label: 'Report' },
    { id: 'recording',  label: 'Recording' }
  ]

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '7px 14px',
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? '1px solid var(--text)' : '1px solid transparent',
              color: tab === t.id ? 'var(--text)' : 'var(--muted)',
              cursor: 'pointer',
              marginBottom: '-1px',
              fontFamily: 'DM Mono, monospace',
              transition: 'color 0.15s ease'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'transcript' && (
        <TranscriptView transcript={call.transcript} personaName={call.persona?.name} />
      )}

      {tab === 'report' && (
        <ReportView report={call.report} />
      )}

      {tab === 'recording' && (
        <div>
          {call.meta?.localRecordingUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.04em' }}>
                Your mic · recorded locally
              </div>
              <audio
                controls
                src={call.meta.localRecordingUrl}
                style={{ width: '100%', height: 36, outline: 'none' }}
              />
              <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.6 }}>
                Note: recording is available this session only — it clears on page refresh.
              </div>
              {call.meta.callId && (
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>
                  VAPI Call ID: {call.meta.callId}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: 11, lineHeight: 1.8 }}>
              No recording available for this call.
              <br /><br />
              Recordings are captured automatically from your next session.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CallCard({ call, index, total, onPracticeAgain }) {
  const [expanded, setExpanded] = useState(false)
  const score = call.report?.overall
  const msgCount = call.transcript?.filter(m => m.role === 'user').length || 0

  return (
    <div style={{
      border: '1px solid var(--border)',
      background: expanded ? 'rgba(255,255,255,0.015)' : 'var(--surface-1)',
      transition: 'background 0.2s ease',
      marginBottom: 8
    }}>
      {/* Card header */}
      <div
        style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
        onClick={() => setExpanded(o => !o)}
      >
        {/* Avatar */}
        <div style={{
          width: 34, height: 34, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--text) 0%, rgba(240,237,232,0.8) 100%)',
          color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, fontFamily: 'DM Mono, monospace'
        }}>
          {call.persona?.initials || '??'}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 14, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {call.persona?.name || 'Unknown'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.02em' }}>
            {call.persona?.role} · {formatDate(call.timestamp)}
          </div>
        </div>

        {/* Meta badges */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          {score != null && (
            <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: scoreColor(score), lineHeight: 1 }}>
              {score}
            </span>
          )}
          <span style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.06em' }}>
            {formatTime(call.duration || 0)} · {msgCount}msg
          </span>
        </div>

        <ChevronIcon open={expanded} />
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 16px' }}>
          <CallDetails call={call} />
          {/* Practice Again button */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <button
              onClick={e => { e.stopPropagation(); onPracticeAgain(call.persona) }}
              style={{
                width: '100%', padding: '11px 0',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 11,
                fontFamily: 'DM Mono, monospace',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--surface-hover)'
                e.currentTarget.style.borderColor = 'var(--border-hover)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--surface-2)'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              <span style={{
                width: 24, height: 24,
                background: 'linear-gradient(135deg, var(--text) 0%, rgba(240,237,232,0.8) 100%)',
                color: 'var(--bg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, flexShrink: 0
              }}>
                {call.persona?.initials || '??'}
              </span>
              Practice Again with {call.persona?.name?.split(' ')[0] || 'this persona'} →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CallHistory({ history, onClose, onPracticeAgain }) {
  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 420, maxWidth: '92vw',
        background: 'var(--bg-2)',
        borderRight: '1px solid var(--border)',
        zIndex: 101,
        display: 'flex', flexDirection: 'column',
        animation: 'slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 20px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HistoryIcon />
            <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18 }}>Call History</span>
            <span style={{
              fontSize: 10, color: 'var(--muted)', border: '1px solid var(--border)',
              padding: '2px 8px', letterSpacing: '0.06em'
            }}>
              {history.length}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4, transition: 'color 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Call list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--muted)', fontSize: 12, lineHeight: 1.8 }}>
              No calls yet.<br />
              Complete a session to see it here.
            </div>
          ) : (
            [...history].reverse().map((call, i) => (
              <CallCard key={call.id} call={call} index={i} total={history.length} onPracticeAgain={onPracticeAgain} />
            ))
          )}
        </div>
      </div>
    </>
  )
}
