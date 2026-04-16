import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Setup from './components/Setup.jsx'
import Session from './components/Session.jsx'
import Report from './components/Report.jsx'
import CallHistory from './components/CallHistory.jsx'

function TrainIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  )
}

function HistoryIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
    </svg>
  )
}

function BottomNav({ callHistory }) {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname
  const isHidden = path === '/session' || path === '/report'
  if (isHidden) return null

  return (
    <nav className="bottom-nav">
      <button className={`bottom-nav-tab ${path === '/' ? 'active' : ''}`} onClick={() => navigate('/')}>
        <span className="nav-icon"><TrainIcon active={path === '/'} /></span>
        Train
      </button>
      <button className={`bottom-nav-tab ${path === '/history' ? 'active' : ''}`} onClick={() => navigate('/history')}>
        <span className="nav-icon" style={{ position: 'relative' }}>
          <HistoryIcon active={path === '/history'} />
          {callHistory.length > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -6,
              background: 'var(--red)', color: 'white',
              width: 14, height: 14, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 700, lineHeight: 1
            }}>
              {callHistory.length > 9 ? '9+' : callHistory.length}
            </span>
          )}
        </span>
        History
      </button>
    </nav>
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

  const navigate = useNavigate()

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

  function handlePersonaReady(p) { setPersona(p) }

  function handleSessionEnd(msgs, duration, meta) {
    setTranscript(msgs)
    setSessionDuration(duration)
    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      persona,
      transcript: msgs,
      report: null,
      duration,
      meta: meta || {}
    }
    setCallHistory(prev => [...prev, record].slice(-50))
    localStorage.setItem('bout_pending_record_id', record.id)
    navigate('/report')
  }

  function handleReportReady(r) {
    setReport(r)
    const pendingId = localStorage.getItem('bout_pending_record_id')
    if (pendingId) {
      setCallHistory(prev => prev.map(rec => rec.id === pendingId ? { ...rec, report: r } : rec))
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

  function handlePracticeAgainWithPersona(p) {
    setPersona(p)
    setTranscript([])
    setReport(null)
    setSessionDuration(0)
    localStorage.removeItem('bout_transcript')
    navigate('/session')
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Setup initialPersona={persona} onPersonaReady={handlePersonaReady} />} />
        <Route path="/history" element={<CallHistory history={callHistory} onPracticeAgain={handlePracticeAgainWithPersona} />} />
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
      <BottomNav callHistory={callHistory} />
    </div>
  )
}

export default App
