import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVapi } from '../hooks/useVapi.js'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function getStatusLabel(callStatus, isSpeaking, isAiSpeaking) {
  if (callStatus === 'idle') return { label: 'Not connected', dot: '' }
  if (callStatus === 'connecting') return { label: 'Connecting', dot: 'connecting' }
  if (callStatus === 'ended') return { label: 'Ended', dot: '' }
  if (isSpeaking) return { label: 'You Speaking', dot: 'speaking' }
  if (isAiSpeaking) return { label: 'AI Speaking', dot: 'speaking' }
  return { label: 'Live', dot: 'active' }
}

function getCoachingTip(talkRatio, messageCount) {
  if (messageCount < 3) return "Open with a hook and a question — then stop talking."
  if (talkRatio > 50) return "You're dominating. Ask a question and wait."
  return "Good ratio. Go deeper — ask what this problem costs them."
}

export default function Session({ persona, onSessionEnd }) {
  const navigate = useNavigate()
  const [elapsed, setElapsed] = useState(0)
  const [notes, setNotes] = useState('')
  const [sessionStarted, setSessionStarted] = useState(false)
  const [micError, setMicError] = useState(null)
  const messagesEndRef = useRef(null)
  const timerRef = useRef(null)
  const elapsedRef = useRef(0)
  const hasEndedRef = useRef(false)

  // Redirect if no persona
  useEffect(() => {
    if (!persona) navigate('/')
  }, [persona, navigate])

  const handleCallEnd = useCallback((finalMessages) => {
    if (hasEndedRef.current) return
    hasEndedRef.current = true
    clearInterval(timerRef.current)
    onSessionEnd(finalMessages, elapsedRef.current)
  }, [onSessionEnd])

  const { callStatus, isSpeaking, isAiSpeaking, isMuted, partialTranscript, messages, error, startCall, stopCall, toggleMute, hasVapiKey } = useVapi({
    persona,
    onCallEnd: handleCallEnd,
    onTranscriptUpdate: null
  })

  // Auto-start call on mount
  useEffect(() => {
    if (!persona) return
    if (!hasVapiKey) return

    const tryStart = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        setMicError(null)
        setSessionStarted(true)
        startCall()
      } catch (err) {
        setMicError('Microphone access denied. Please allow microphone access in your browser settings and reload the page.')
      }
    }

    tryStart()
  }, [persona, hasVapiKey])

  // Timer
  useEffect(() => {
    if (callStatus === 'active') {
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          elapsedRef.current = prev + 1
          return prev + 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [callStatus])

  // Auto scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, partialTranscript])

  // Talk ratio calculation
  const userMessages = messages.filter(m => m.role === 'user')
  const aiMessages = messages.filter(m => m.role === 'assistant')
  const userWordCount = userMessages.reduce((acc, m) => acc + (m.text?.split(' ').length || 0), 0)
  const totalWordCount = messages.reduce((acc, m) => acc + (m.text?.split(' ').length || 0), 0)
  const talkRatio = totalWordCount > 0 ? Math.round((userWordCount / totalWordCount) * 100) : 0

  const statusInfo = getStatusLabel(callStatus, isSpeaking, isAiSpeaking)
  const coachingTip = getCoachingTip(talkRatio, userMessages.length)

  function handleEndSession() {
    if (hasEndedRef.current) return
    stopCall()
    // Give VAPI a tick to fire call-end; fallback after 500ms
    setTimeout(() => {
      if (!hasEndedRef.current) {
        hasEndedRef.current = true
        clearInterval(timerRef.current)
        onSessionEnd(messages, elapsedRef.current)
      }
    }, 500)
  }

  if (!persona) return null

  return (
    <div className="session-layout">
      {/* TOP BAR */}
      <div className="session-topbar">
        <div className="session-topbar-left">
          <div className="persona-avatar" style={{ width: 38, height: 38, fontSize: 13 }}>
            {persona.initials}
          </div>
          <div>
            <div className="session-persona-name">{persona.name}</div>
            <div className="session-persona-role">{persona.role} · {persona.company}</div>
          </div>
        </div>

        <div className="session-timer">{formatTime(elapsed)}</div>

        <div className="session-topbar-right">
          <div className="status-pill">
            <span className={`status-dot ${statusInfo.dot}`} />
            {statusInfo.label}
          </div>
          <button className="btn-danger" onClick={handleEndSession}>
            End Session
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="session-main">
        {/* LEFT: Transcript */}
        <div className="transcript-col">
          {/* No-key or mic error states */}
          {!hasVapiKey && (
            <div className="mic-error">
              <p>VAPI Public Key not configured.</p>
              <p style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
                Add <code style={{ background: 'rgba(245,244,240,0.08)', padding: '2px 6px' }}>VITE_VAPI_PUBLIC_KEY</code> to <code style={{ background: 'rgba(245,244,240,0.08)', padding: '2px 6px' }}>client/.env</code> and restart.
              </p>
            </div>
          )}

          {micError && (
            <div className="mic-error">
              <p>{micError}</p>
            </div>
          )}

          {error && !micError && (
            <div className="banner banner-error" style={{ margin: '16px' }}>
              {error}
            </div>
          )}

          <div className="transcript-messages">
            {callStatus === 'connecting' && (
              <div className="loading-center" style={{ padding: '40px 0' }}>
                <span className="spinner" />
                <span className="loading-text">Connecting to {persona.name}...</span>
              </div>
            )}

            {messages.length === 0 && callStatus === 'active' && (
              <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', paddingTop: 40 }}>
                Session is live. Start talking.
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`message-row ${msg.role}`}>
                <span className="message-label">
                  {msg.role === 'user' ? 'You' : persona.name}
                </span>
                <div className={`message-bubble ${msg.role}`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Partial transcript */}
            {partialTranscript && (
              <div className="message-partial">{partialTranscript}</div>
            )}

            {/* Typing indicator when AI is generating */}
            {isAiSpeaking && !partialTranscript && (
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* RIGHT: Live Metrics */}
        <div className="metrics-col">
          {/* Talk Ratio */}
          <div className="metrics-block">
            <div className="metrics-block-label">Talk Ratio</div>
            <div className="talk-ratio-number">{talkRatio}%</div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.min(talkRatio, 100)}%`, transition: 'width 0.5s ease' }}
              />
              <div className="progress-bar-marker" style={{ left: '45%' }} />
            </div>
            <div className="talk-ratio-target">You · Target: &lt;45%</div>
          </div>

          {/* Session Stats */}
          <div className="metrics-block">
            <div className="metrics-block-label">Session Stats</div>
            <div className="stat-row">
              <span className="stat-label">Messages sent</span>
              <span className="stat-value">{userMessages.length}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Duration</span>
              <span className="stat-value">{formatTime(elapsed)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Connection</span>
              <span className="stat-value" style={{
                color: callStatus === 'active' ? 'var(--green)' : callStatus === 'connecting' ? 'var(--yellow)' : 'var(--muted)'
              }}>
                {callStatus === 'active' ? 'Live' : callStatus === 'connecting' ? 'Connecting' : callStatus}
              </span>
            </div>
          </div>

          {/* Coaching Tip */}
          <div className="metrics-block">
            <div className="metrics-block-label">Coaching Tip</div>
            <div className="coaching-tip">{coachingTip}</div>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="session-bottombar">
        <button
          className="btn-text"
          onClick={handleEndSession}
          style={{ fontSize: 12 }}
        >
          End &amp; Get Report
        </button>

        <button
          className={`mic-btn ${isMuted ? 'muted' : isSpeaking ? 'speaking' : callStatus === 'active' ? 'active' : ''}`}
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          disabled={callStatus !== 'active'}
        >
          {isMuted ? '🔇' : '🎙'}
        </button>

        <textarea
          className="session-notes"
          placeholder="Session notes..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>
    </div>
  )
}
