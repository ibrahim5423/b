import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Setup from './components/Setup.jsx'
import Session from './components/Session.jsx'
import Report from './components/Report.jsx'
import CallHistory from './components/CallHistory.jsx'

function HistoryButtonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
    </svg>
  )
}

function App() {
  const [persona, setPersona] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bout_persona') || 'null') } catch { return null }
  })
  const [transcript, setTranscript] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bout_transcript') || '[]') } catch { return [] }
  })
  const [report, setReport] = useState(null)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [callHistory, setCallHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bout_call_history') || '[]') } catch { return [] }
  })
  const [showHistory, setShowHistory] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    try {
      if (persona) localStorage.setItem('bout_persona', JSON.stringify(persona))
      else localStorage.removeItem('bout_persona')
    } catch {}
  }, [persona])

  useEffect(() => {
    try { localStorage.setItem('bout_transcript', JSON.stringify(transcript)) } catch {}
  }, [transcript])

  useEffect(() => {
    try { localStorage.setItem('bout_call_history', JSON.stringify(callHistory)) } catch {}
  }, [callHistory])

  function handlePersonaReady(p) {
    setPersona(p)
  }

  function handleSessionEnd(msgs, duration, meta) {
    setTranscript(msgs)
    setSessionDuration(duration)
    // Save to history immediately (report will be added later via handleReportReady)
    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      persona,
      transcript: msgs,
      report: null,
      duration,
      meta: meta || {}
    }
    setCallHistory(prev => {
      const next = [...prev, record]
      // Keep last 50 calls
      return next.slice(-50)
    })
    // Store the record id so we can attach the report later
    localStorage.setItem('bout_pending_record_id', record.id)
    navigate('/report')
  }

  function handleReportReady(r) {
    setReport(r)
    // Attach report to the most recent history record
    const pendingId = localStorage.getItem('bout_pending_record_id')
    if (pendingId) {
      setCallHistory(prev =>
        prev.map(rec => rec.id === pendingId ? { ...rec, report: r } : rec)
      )
      localStorage.removeItem('bout_pending_record_id')
    }
  }

  function handleReset() {
    setPersona(null)
    setTranscript([])
    setReport(null)
    setSessionDuration(0)
    localStorage.removeItem('bout_persona')
    localStorage.removeItem('bout_transcript')
    navigate('/')
  }

  function handlePracticeAgain() {
    setTranscript([])
    setReport(null)
    setSessionDuration(0)
    localStorage.removeItem('bout_transcript')
    navigate('/')
  }

  // Show history button on all pages except session (fullscreen)
  const showHistoryBtn = location.pathname !== '/session'

  return (
    <>
      <Routes>
        <Route path="/" element={<Setup initialPersona={persona} onPersonaReady={handlePersonaReady} />} />
        <Route path="/session" element={<Session persona={persona} onSessionEnd={handleSessionEnd} />} />
        <Route
          path="/report"
          element={
            <Report
              persona={persona}
              transcript={transcript}
              sessionDuration={sessionDuration}
              existingReport={report}
              onReportReady={handleReportReady}
              onPracticeAgain={handlePracticeAgain}
              onNewPersona={handleReset}
            />
          }
        />
      </Routes>

      {/* Floating history button */}
      {showHistoryBtn && (
        <button
          onClick={() => setShowHistory(true)}
          style={{
            position: 'fixed',
            bottom: 28,
            left: 28,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--muted)',
            fontSize: 11,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            fontFamily: 'DM Mono, monospace',
            transition: 'all 0.2s ease',
            zIndex: 50
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border-hover)'
            e.currentTarget.style.color = 'var(--text)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--muted)'
          }}
        >
          <HistoryButtonIcon />
          CALL STATS
          {callHistory.length > 0 && (
            <span style={{
              background: 'var(--red)', color: 'white', borderRadius: '50%',
              width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 600, flexShrink: 0
            }}>
              {callHistory.length > 99 ? '99+' : callHistory.length}
            </span>
          )}
        </button>
      )}

      {/* History drawer */}
      {showHistory && (
        <CallHistory
          history={callHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </>
  )
}

export default App
