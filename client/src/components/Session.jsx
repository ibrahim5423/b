import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVapi } from '../hooks/useVapi.js'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function getCoachingTip(talkRatio, messageCount) {
  if (messageCount < 3) return "Open with a strong hook, then ask one question and stop talking."
  if (talkRatio > 55)   return "You're dominating. Ask a question and wait for the answer."
  if (talkRatio > 45)   return "Slightly high. Slow down and let them talk."
  return "Good ratio — go deeper. Ask what this problem costs them."
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  )
}

function MicMutedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23"/>
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

export default function Session({ persona, onSessionEnd }) {
  const navigate = useNavigate()
  const [elapsed, setElapsed] = useState(0)
  const [micError, setMicError] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const messagesEndRef = useRef(null)
  const timerRef = useRef(null)
  const elapsedRef = useRef(0)
  const hasEndedRef = useRef(false)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const localRecordingUrlRef = useRef(null)

  useEffect(() => {
    if (!persona) navigate('/')
  }, [persona, navigate])

  function stopRecorder() {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') { resolve(null); return }
      const timeout = setTimeout(() => resolve(localRecordingUrlRef.current), 1500)
      recorder.onstop = () => {
        clearTimeout(timeout)
        try {
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          const url = URL.createObjectURL(blob)
          localRecordingUrlRef.current = url
          resolve(url)
        } catch { resolve(null) }
      }
      try { recorder.stop() } catch { clearTimeout(timeout); resolve(null) }
    })
  }

  const handleCallEnd = useCallback(async (finalMessages, vapiMeta) => {
    if (hasEndedRef.current) return
    hasEndedRef.current = true
    clearInterval(timerRef.current)
    const recordingUrl = await stopRecorder()
    onSessionEnd(finalMessages, elapsedRef.current, { ...vapiMeta, localRecordingUrl: recordingUrl })
  }, [onSessionEnd])

  const { callStatus, isSpeaking, isAiSpeaking, isMuted, partialTranscript, messages, error, startCall, stopCall, toggleMute, hasVapiKey, getMessages } = useVapi({
    persona,
    onCallEnd: handleCallEnd,
    onTranscriptUpdate: null
  })

  useEffect(() => {
    if (!persona || !hasVapiKey) return
    const tryStart = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setMicError(null)
        try {
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
          const recorder = new MediaRecorder(stream, { mimeType })
          mediaRecorderRef.current = recorder
          audioChunksRef.current = []
          recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data) }
          recorder.start(1000)
        } catch (recErr) { console.warn('Local recording unavailable:', recErr) }
        startCall()
      } catch {
        setMicError('Microphone access denied. Allow microphone access in your browser settings and reload.')
      }
    }
    tryStart()
  }, [persona, hasVapiKey])

  useEffect(() => {
    if (callStatus === 'active') {
      timerRef.current = setInterval(() => {
        setElapsed(prev => { elapsedRef.current = prev + 1; return prev + 1 })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [callStatus])

  useEffect(() => {
    if (showChat && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, partialTranscript, showChat])

  async function handleEndSession() {
    if (hasEndedRef.current) return
    stopCall()
    setTimeout(async () => {
      if (!hasEndedRef.current) {
        hasEndedRef.current = true
        clearInterval(timerRef.current)
        const recordingUrl = await stopRecorder()
        onSessionEnd(getMessages(), elapsedRef.current, { localRecordingUrl: recordingUrl })
      }
    }, 2500)
  }

  if (!persona) return null

  const userMessages = messages.filter(m => m.role === 'user')
  const userWordCount = userMessages.reduce((acc, m) => acc + (m.text?.split(' ').length || 0), 0)
  const totalWordCount = messages.reduce((acc, m) => acc + (m.text?.split(' ').length || 0), 0)
  const talkRatio = totalWordCount > 0 ? Math.round((userWordCount / totalWordCount) * 100) : 0
  const ratioColor = talkRatio > 55 ? 'var(--red)' : talkRatio > 45 ? 'var(--yellow)' : 'var(--green)'
  const coachingTip = getCoachingTip(talkRatio, userMessages.length)

  const youSpeaking = isSpeaking && !isMuted
  const aiSpeaking = isAiSpeaking

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>

      {/* TOP BAR */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="persona-avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{persona.initials}</div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 400 }}>{persona.name}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.04em' }}>{persona.role} · {persona.company}</div>
          </div>
        </div>

        <div style={{ fontSize: 22, fontWeight: 300, letterSpacing: '0.08em', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(elapsed)}
        </div>

        <button className="btn-danger" onClick={handleEndSession} style={{ fontSize: 11 }}>End Session</button>
      </div>

      {/* MAIN — two avatars */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 48 }}>

        {(!hasVapiKey || micError || error) && (
          <div style={{ position: 'absolute', top: 80, left: 0, right: 0, padding: '0 24px' }}>
            {!hasVapiKey && <div className="mic-error"><p>VAPI key not configured.</p></div>}
            {micError && <div className="mic-error"><p>{micError}</p></div>}
            {error && !micError && <div className="banner banner-error">{error}</div>}
          </div>
        )}

        {/* Avatars row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 80 }}>

          {/* You */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {youSpeaking && (
                <>
                  <span style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: '1px solid var(--red)', opacity: 0.5, animation: 'ring-expand 1.5s ease-out infinite' }} />
                  <span style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: '1px solid var(--red)', opacity: 0.3, animation: 'ring-expand 1.5s ease-out infinite', animationDelay: '0.5s' }} />
                  <span style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: '1px solid var(--red)', opacity: 0.15, animation: 'ring-expand 1.5s ease-out infinite', animationDelay: '1s' }} />
                </>
              )}
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: youSpeaking ? 'var(--red-dim)' : 'var(--surface-2)',
                border: `2px solid ${youSpeaking ? 'var(--red)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: youSpeaking ? 'var(--red)' : 'var(--muted)',
                transition: 'all 0.3s ease'
              }}>
                <UserIcon />
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text)', letterSpacing: '0.04em' }}>You</div>
              {youSpeaking && <div style={{ fontSize: 10, color: 'var(--red)', letterSpacing: '0.08em', marginTop: 2 }}>speaking</div>}
              {isMuted && <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', marginTop: 2 }}>muted</div>}
            </div>
          </div>

          {/* Divider / status */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {callStatus === 'connecting' ? (
              <span className="spinner" style={{ width: 20, height: 20 }} />
            ) : (
              <div style={{ width: 40, height: 1, background: 'var(--border)' }} />
            )}
            <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {callStatus === 'connecting' ? 'connecting' : callStatus === 'ended' ? 'ended' : 'live'}
            </div>
          </div>

          {/* Persona (AI) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {aiSpeaking && (
                <>
                  <span style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: '1px solid rgba(240,237,232,0.4)', opacity: 0.5, animation: 'ring-expand 1.5s ease-out infinite' }} />
                  <span style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: '1px solid rgba(240,237,232,0.3)', opacity: 0.3, animation: 'ring-expand 1.5s ease-out infinite', animationDelay: '0.5s' }} />
                  <span style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: '1px solid rgba(240,237,232,0.2)', opacity: 0.15, animation: 'ring-expand 1.5s ease-out infinite', animationDelay: '1s' }} />
                </>
              )}
              <div className="persona-avatar" style={{
                width: 80, height: 80, fontSize: 22,
                border: `2px solid ${aiSpeaking ? 'rgba(240,237,232,0.5)' : 'var(--border)'}`,
                background: aiSpeaking ? 'rgba(240,237,232,0.06)' : 'var(--surface-2)',
                transition: 'all 0.3s ease'
              }}>
                {persona.initials}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text)', letterSpacing: '0.04em' }}>{persona.name}</div>
              {aiSpeaking
                ? <div style={{ fontSize: 10, color: 'var(--text)', letterSpacing: '0.08em', marginTop: 2 }}>speaking</div>
                : <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', marginTop: 2 }}>AI</div>
              }
            </div>
          </div>
        </div>

        {/* Talk ratio */}
        {callStatus === 'active' && totalWordCount > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 120, height: 2, background: 'var(--surface-2)', position: 'relative', borderRadius: 2 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.min(talkRatio, 100)}%`, background: ratioColor, borderRadius: 2, transition: 'width 0.6s ease' }} />
                <div style={{ position: 'absolute', left: '45%', top: -3, width: 1, height: 8, background: 'var(--muted-2)' }} />
              </div>
              <span style={{ fontSize: 11, color: ratioColor, fontVariantNumeric: 'tabular-nums' }}>{talkRatio}% you</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.04em', maxWidth: 280, textAlign: 'center', lineHeight: 1.6 }}>
              {coachingTip}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM BAR */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 32px', borderTop: '1px solid var(--border)', flexShrink: 0
      }}>
        <button className="btn-text" onClick={handleEndSession} style={{ fontSize: 11 }}>
          End &amp; Get Report →
        </button>

        {/* Mic button */}
        <div className="mic-btn-wrapper">
          {youSpeaking && (
            <>
              <span className="voice-ring ring-1" />
              <span className="voice-ring ring-2" />
              <span className="voice-ring ring-3" />
            </>
          )}
          <button
            className={`mic-btn ${isMuted ? 'muted' : isSpeaking ? 'speaking' : callStatus === 'active' ? 'active' : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            disabled={callStatus !== 'active'}
          >
            {isMuted ? <MicMutedIcon /> : <MicIcon />}
          </button>
        </div>

        <button
          onClick={() => setShowChat(v => !v)}
          style={{
            background: 'none', border: '1px solid var(--border)',
            color: messages.length > 0 ? 'var(--text)' : 'var(--muted)',
            fontSize: 11, fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em',
            padding: '8px 16px', cursor: 'pointer', transition: 'all 0.2s ease',
            position: 'relative'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = messages.length > 0 ? 'var(--text)' : 'var(--muted)' }}
        >
          {showChat ? 'Hide Chat ▼' : 'Show Chat ▲'}
          {!showChat && messages.length > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              background: 'var(--red)', color: 'white', borderRadius: '50%',
              width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 600
            }}>{messages.length}</span>
          )}
        </button>
      </div>

      {/* CHAT PANEL — slides up from bottom */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: showChat ? '60%' : '0%',
        background: 'var(--surface-1)',
        borderTop: '1px solid var(--border)',
        transition: 'height 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        zIndex: 10
      }}>
        {/* Chat header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0
        }}>
          <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Transcript · {messages.length} messages
          </span>
          <button
            onClick={() => setShowChat(false)}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >×</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 11, textAlign: 'center', paddingTop: 24, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {callStatus === 'active' ? 'Session live — start talking' : 'No messages yet'}
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`message-row ${msg.role}`}>
              <span className="message-label">{msg.role === 'user' ? 'You' : persona.name}</span>
              <div className={`message-bubble ${msg.role}`}>{msg.text}</div>
            </div>
          ))}
          {partialTranscript && <div className="message-partial">{partialTranscript}</div>}
          {isAiSpeaking && !partialTranscript && (
            <div className="typing-indicator">
              <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  )
}
