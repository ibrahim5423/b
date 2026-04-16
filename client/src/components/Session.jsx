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
    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

// Large avatar with gradient ring, voice rings, breathing
function AvatarTile({ children, speaking, accent, label, sublabel }) {
  const accentColor = accent === 'blue' ? 'var(--blue)' : accent === 'red' ? 'var(--red)' : 'rgba(240,237,232,0.9)'
  const accentGlow = accent === 'blue' ? 'var(--blue-glow)' : accent === 'red' ? 'var(--red-glow)' : 'rgba(240,237,232,0.15)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Outer ambient halo */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: speaking ? `radial-gradient(circle, ${accentGlow} 0%, transparent 65%)` : 'transparent',
          transition: 'background 0.4s ease',
          filter: 'blur(8px)'
        }} />

        {/* Voice rings */}
        {speaking && (
          <>
            <span style={{
              position: 'absolute', width: 140, height: 140, borderRadius: '50%',
              border: `1px solid ${accentColor}`, opacity: 0.4,
              animation: 'ring-expand 2.2s ease-out infinite'
            }} />
            <span style={{
              position: 'absolute', width: 140, height: 140, borderRadius: '50%',
              border: `1px solid ${accentColor}`, opacity: 0.25,
              animation: 'ring-expand 2.2s ease-out infinite', animationDelay: '0.7s'
            }} />
            <span style={{
              position: 'absolute', width: 140, height: 140, borderRadius: '50%',
              border: `1px solid ${accentColor}`, opacity: 0.12,
              animation: 'ring-expand 2.2s ease-out infinite', animationDelay: '1.4s'
            }} />
          </>
        )}

        {/* Slow rotating gradient ring (only when speaking) */}
        {speaking && (
          <div style={{
            position: 'absolute', width: 132, height: 132, borderRadius: '50%',
            padding: 1,
            background: `conic-gradient(from 0deg, transparent 0%, ${accentColor} 30%, transparent 60%, ${accentColor} 90%, transparent 100%)`,
            animation: 'rotate-slow 4s linear infinite',
            mask: 'radial-gradient(circle, transparent 58px, black 60px)',
            WebkitMask: 'radial-gradient(circle, transparent 58px, black 60px)',
            opacity: 0.9
          }} />
        )}

        {/* Avatar disc */}
        <div style={{
          width: 124, height: 124, borderRadius: '50%',
          background: speaking
            ? `linear-gradient(145deg, ${accent === 'blue' ? 'rgba(77,166,255,0.15)' : accent === 'red' ? 'rgba(232,93,74,0.15)' : 'rgba(240,237,232,0.08)'} 0%, var(--surface-2) 90%)`
            : 'linear-gradient(145deg, var(--surface-2) 0%, var(--surface-1) 100%)',
          border: `1px solid ${speaking ? accentColor : 'rgba(240,237,232,0.08)'}`,
          boxShadow: speaking
            ? `0 0 40px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.04)`
            : 'inset 0 1px 0 rgba(255,255,255,0.03), 0 20px 40px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: speaking ? (accent === 'red' ? 'var(--red)' : 'var(--text)') : 'var(--muted)',
          fontSize: 34, fontWeight: 300, letterSpacing: '0.06em',
          fontFamily: 'DM Serif Display, serif',
          transition: 'all 0.4s ease',
          animation: speaking ? 'breathe 2.8s ease-in-out infinite' : 'none',
          position: 'relative', zIndex: 1
        }}>
          {children}
        </div>
      </div>

      {/* Labels */}
      <div style={{ textAlign: 'center', minHeight: 42 }}>
        <div style={{
          fontSize: 13, color: 'var(--text)',
          fontFamily: 'DM Serif Display, serif',
          letterSpacing: '0.01em', fontWeight: 400
        }}>{label}</div>
        <div style={{
          fontSize: 9, color: speaking ? accentColor : 'var(--muted)',
          letterSpacing: '0.22em', textTransform: 'uppercase',
          marginTop: 6, fontWeight: 400,
          transition: 'color 0.3s ease'
        }}>
          {sublabel}
        </div>
      </div>
    </div>
  )
}

// Connection indicator between the two avatars
function CallLink({ active, youSpeaking, aiSpeaking }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 10, marginBottom: 60, opacity: active ? 1 : 0.35, transition: 'opacity 0.3s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <span key={i} style={{
            width: 3, height: 3, borderRadius: '50%',
            background: active ? 'var(--text)' : 'var(--muted-2)',
            opacity: 0.6,
            animation: active ? 'signal-flow 2s ease-in-out infinite' : 'none',
            animationDelay: `${i * 0.2}s`,
            transform: youSpeaking ? 'scaleX(-1)' : aiSpeaking ? 'scaleX(1)' : 'none'
          }} />
        ))}
      </div>
      <div style={{
        fontSize: 8, color: 'var(--muted)',
        letterSpacing: '0.3em', textTransform: 'uppercase'
      }}>
        {active ? 'connected' : 'linking'}
      </div>
    </div>
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
  const aiRatio = 100 - talkRatio
  const ratioColor = talkRatio > 55 ? 'var(--red)' : talkRatio > 45 ? 'var(--yellow)' : 'var(--green)'
  const coachingTip = getCoachingTip(talkRatio, userMessages.length)

  const youSpeaking = isSpeaking && !isMuted
  const aiSpeaking = isAiSpeaking
  const isActive = callStatus === 'active'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', background: 'var(--bg)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Radial backdrop glow - subtle scene-setting */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 50% 40% at 50% 45%, rgba(232,93,74,0.04) 0%, transparent 70%)',
        zIndex: 0
      }} />

      {/* TOP BAR */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 28px', borderBottom: '1px solid var(--border)',
        flexShrink: 0, position: 'relative', zIndex: 2,
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="persona-avatar" style={{ width: 30, height: 30, fontSize: 10 }}>{persona.initials}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'DM Serif Display, serif', letterSpacing: '0.01em' }}>
              {persona.name}
            </div>
            <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {persona.role} · {persona.company}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isActive ? 'var(--green)' : callStatus === 'connecting' ? 'var(--yellow)' : 'var(--muted)',
            animation: isActive ? 'pulse 2s ease-in-out infinite' : 'none',
            boxShadow: isActive ? '0 0 8px var(--green)' : 'none'
          }} />
          <div style={{
            fontSize: 24, fontWeight: 200, letterSpacing: '0.14em',
            color: 'var(--text)', fontVariantNumeric: 'tabular-nums',
            fontFamily: 'DM Mono, monospace'
          }}>
            {formatTime(elapsed)}
          </div>
        </div>

        <button className="btn-danger" onClick={handleEndSession} style={{ fontSize: 10, letterSpacing: '0.1em' }}>
          End Session
        </button>
      </div>

      {/* Error banners */}
      {(!hasVapiKey || micError || error) && (
        <div style={{ position: 'absolute', top: 80, left: 24, right: 24, zIndex: 3 }}>
          {!hasVapiKey && <div className="mic-error"><p>VAPI key not configured.</p></div>}
          {micError && <div className="mic-error"><p>{micError}</p></div>}
          {error && !micError && <div className="banner banner-error">{error}</div>}
        </div>
      )}

      {/* MAIN */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 56, position: 'relative', zIndex: 1
      }}>
        {/* Two avatars + connection indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <AvatarTile
            speaking={youSpeaking}
            accent="blue"
            label="You"
            sublabel={isMuted ? 'Muted' : youSpeaking ? 'Speaking' : 'Listening'}
          >
            <UserIcon />
          </AvatarTile>

          <CallLink active={isActive} youSpeaking={youSpeaking} aiSpeaking={aiSpeaking} />

          <AvatarTile
            speaking={aiSpeaking}
            accent="red"
            label={persona.name}
            sublabel={
              callStatus === 'connecting' ? 'Connecting' :
              aiSpeaking ? 'Speaking' : 'Listening'
            }
          >
            {persona.initials}
          </AvatarTile>
        </div>

        {/* Talk ratio bar + coaching */}
        {isActive && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 14, opacity: totalWordCount > 0 ? 1 : 0,
            transition: 'opacity 0.6s ease', minHeight: 60
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, minWidth: 360 }}>
              {/* Your % */}
              <div style={{ textAlign: 'right', minWidth: 80 }}>
                <div style={{ fontSize: 18, fontWeight: 300, color: ratioColor, fontVariantNumeric: 'tabular-nums', fontFamily: 'DM Serif Display, serif' }}>
                  {talkRatio}%
                </div>
                <div style={{ fontSize: 8, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 2 }}>
                  You
                </div>
              </div>

              {/* Bar with target marker */}
              <div style={{ position: 'relative', width: 220, height: 3, background: 'var(--surface-2)', borderRadius: 2 }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: '100%',
                  width: `${Math.min(talkRatio, 100)}%`,
                  background: `linear-gradient(90deg, ${ratioColor} 0%, ${ratioColor} 100%)`,
                  borderRadius: 2, transition: 'width 0.6s ease',
                  boxShadow: `0 0 8px ${ratioColor}60`
                }} />
                {/* Target marker at 45% */}
                <div style={{
                  position: 'absolute', left: '45%', top: -4,
                  width: 1, height: 11, background: 'var(--muted)'
                }} />
              </div>

              {/* AI % */}
              <div style={{ textAlign: 'left', minWidth: 80 }}>
                <div style={{ fontSize: 18, fontWeight: 300, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', fontFamily: 'DM Serif Display, serif' }}>
                  {aiRatio}%
                </div>
                <div style={{ fontSize: 8, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 2 }}>
                  {persona.name.split(' ')[0]}
                </div>
              </div>
            </div>

            {/* Coaching tip */}
            <div style={{
              fontSize: 11, color: 'var(--muted)', letterSpacing: '0.02em',
              maxWidth: 380, textAlign: 'center', lineHeight: 1.7,
              fontStyle: 'italic', fontFamily: 'DM Serif Display, serif',
              marginTop: 4
            }}>
              {coachingTip}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM BAR */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '22px 36px', borderTop: '1px solid var(--border)',
        flexShrink: 0, position: 'relative', zIndex: 2,
        backdropFilter: 'blur(8px)'
      }}>
        <button className="btn-text" onClick={handleEndSession} style={{ fontSize: 10, letterSpacing: '0.1em' }}>
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
            background: messages.length > 0 ? 'rgba(240,237,232,0.03)' : 'transparent',
            border: '1px solid var(--border)',
            color: messages.length > 0 ? 'var(--text)' : 'var(--muted)',
            fontSize: 10, fontFamily: 'DM Mono, monospace',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '9px 18px', cursor: 'pointer',
            transition: 'all 0.2s ease', position: 'relative',
            display: 'flex', alignItems: 'center', gap: 10
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = messages.length > 0 ? 'var(--text)' : 'var(--muted)' }}
        >
          <span style={{ fontSize: 9 }}>{showChat ? '▼' : '▲'}</span>
          Transcript
          {!showChat && messages.length > 0 && (
            <span style={{
              background: 'var(--red)', color: 'white',
              borderRadius: 2, padding: '1px 5px',
              fontSize: 9, fontWeight: 500, letterSpacing: '0.05em',
              fontVariantNumeric: 'tabular-nums'
            }}>{messages.length}</span>
          )}
        </button>
      </div>

      {/* CHAT PANEL */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: showChat ? '60%' : '0%',
        background: 'rgba(17,17,17,0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border)',
        transition: 'height 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        zIndex: 10,
        boxShadow: showChat ? '0 -24px 60px rgba(0,0,0,0.6)' : 'none'
      }}>
        {/* Chat header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text)' }}>
              Transcript
            </span>
            <span style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em' }}>
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </span>
          </div>
          <button
            onClick={() => setShowChat(false)}
            style={{
              background: 'none', border: 'none', color: 'var(--muted)',
              cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 4px',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >×</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 10, textAlign: 'center', paddingTop: 32, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
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
