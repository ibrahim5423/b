import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Setup from './components/Setup.jsx'
import Session from './components/Session.jsx'
import Report from './components/Report.jsx'

function App() {
  const [persona, setPersona] = useState(() => {
    try {
      const stored = localStorage.getItem('bout_persona')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [transcript, setTranscript] = useState(() => {
    try {
      const stored = localStorage.getItem('bout_transcript')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [report, setReport] = useState(null)
  const [sessionDuration, setSessionDuration] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    try {
      if (persona) localStorage.setItem('bout_persona', JSON.stringify(persona))
      else localStorage.removeItem('bout_persona')
    } catch {}
  }, [persona])

  useEffect(() => {
    try {
      localStorage.setItem('bout_transcript', JSON.stringify(transcript))
    } catch {}
  }, [transcript])

  function handlePersonaReady(p) {
    setPersona(p)
  }

  function handleSessionEnd(msgs, duration) {
    setTranscript(msgs)
    setSessionDuration(duration)
    navigate('/report')
  }

  function handleReportReady(r) {
    setReport(r)
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

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Setup
            initialPersona={persona}
            onPersonaReady={handlePersonaReady}
          />
        }
      />
      <Route
        path="/session"
        element={
          <Session
            persona={persona}
            onSessionEnd={handleSessionEnd}
          />
        }
      />
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
  )
}

export default App
