import { useEffect, useRef, useState, useCallback } from 'react'
import Vapi from '@vapi-ai/web'

function selectVoice(gender, region) {
  const g = (gender || 'male').toLowerCase()
  const r = (region || 'western').toLowerCase()

  if (r === 'indian' || r === 'south_asian') {
    return g === 'female'
      ? { provider: 'azure', voiceId: 'en-IN-NeerjaNeural' }
      : { provider: 'azure', voiceId: 'en-IN-PrabhatNeural' }
  }
  if (r === 'british' || r === 'uk') {
    return g === 'female'
      ? { provider: 'azure', voiceId: 'en-GB-SoniaNeural' }
      : { provider: 'azure', voiceId: 'en-GB-RyanNeural' }
  }
  if (r === 'australian') {
    return g === 'female'
      ? { provider: 'azure', voiceId: 'en-AU-NatashaNeural' }
      : { provider: 'azure', voiceId: 'en-AU-WilliamNeural' }
  }
  if (r === 'middle_eastern') {
    return g === 'female'
      ? { provider: 'azure', voiceId: 'en-US-AnaNeural' }
      : { provider: 'azure', voiceId: 'en-US-BrandonNeural' }
  }
  if (r === 'east_asian') {
    return g === 'female'
      ? { provider: 'azure', voiceId: 'en-US-JaneNeural' }
      : { provider: 'azure', voiceId: 'en-US-JasonNeural' }
  }
  if (r === 'african') {
    return g === 'female'
      ? { provider: 'azure', voiceId: 'en-US-MichelleNeural' }
      : { provider: 'azure', voiceId: 'en-US-GuyNeural' }
  }
  if (r === 'latin_american') {
    return g === 'female'
      ? { provider: 'azure', voiceId: 'en-US-AmberNeural' }
      : { provider: 'azure', voiceId: 'en-US-TonyNeural' }
  }
  // Default western
  return g === 'female'
    ? { provider: 'vapi', voiceId: 'Kylie' }
    : { provider: 'vapi', voiceId: 'Elliot' }
}

export function useVapi({ persona, onCallEnd, onTranscriptUpdate }) {
  const vapiRef = useRef(null)
  const [callStatus, setCallStatus] = useState('idle')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [partialTranscript, setPartialTranscript] = useState('')
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const messagesRef = useRef([])
  const callMetaRef = useRef({})

  // Use refs for callbacks to avoid stale closure in VAPI event handlers
  const onCallEndRef = useRef(onCallEnd)
  const onTranscriptUpdateRef = useRef(onTranscriptUpdate)
  useEffect(() => { onCallEndRef.current = onCallEnd }, [onCallEnd])
  useEffect(() => { onTranscriptUpdateRef.current = onTranscriptUpdate }, [onTranscriptUpdate])

  const vapiKey = import.meta.env.VITE_VAPI_PUBLIC_KEY

  useEffect(() => {
    if (!vapiKey || vapiKey === 'your_vapi_public_key_here') return

    const vapi = new Vapi(vapiKey)
    vapiRef.current = vapi

    vapi.on('call-start', () => {
      setCallStatus('active')
      setError(null)
      callMetaRef.current = {}
    })

    vapi.on('call-end', () => {
      setCallStatus('ended')
      // Use ref to get the latest callback — avoids stale closure
      if (onCallEndRef.current) onCallEndRef.current(messagesRef.current, callMetaRef.current)
    })

    vapi.on('speech-start', () => {
      setIsSpeaking(true)
      setIsAiSpeaking(false)
    })

    vapi.on('speech-end', () => {
      setIsSpeaking(false)
      setPartialTranscript('')
    })

    vapi.on('message', (msg) => {
      if (msg.type === 'transcript') {
        if (msg.transcriptType === 'partial') {
          setPartialTranscript(msg.transcript || '')
        } else if (msg.transcriptType === 'final') {
          const newMessage = {
            role: msg.role === 'user' ? 'user' : 'assistant',
            text: msg.transcript || '',
            timestamp: Date.now()
          }
          messagesRef.current = [...messagesRef.current, newMessage]
          setMessages(prev => [...prev, newMessage])
          setPartialTranscript('')
          if (onTranscriptUpdateRef.current) onTranscriptUpdateRef.current(messagesRef.current)
        }
      }

      if (msg.type === 'end-of-call-report') {
        callMetaRef.current = {
          recordingUrl: msg.artifact?.recordingUrl || msg.recordingUrl || null,
          stereoRecordingUrl: msg.artifact?.stereoRecordingUrl || null,
          callId: msg.call?.id || null,
          summary: msg.analysis?.summary || null,
          endedReason: msg.endedReason || null
        }
      }

      if (msg.type === 'voice-input') {
        setIsAiSpeaking(msg.status === 'started')
      }
    })

    vapi.on('error', (err) => {
      console.error('VAPI error:', err)
      setError(err?.message || 'Voice session error. Check your VAPI key and microphone.')
      setCallStatus('idle')
    })

    return () => {
      try { vapi.stop() } catch {}
    }
  }, [vapiKey])

  const startCall = useCallback(async () => {
    if (!vapiRef.current) {
      setError('VAPI is not initialised. Check your VITE_VAPI_PUBLIC_KEY.')
      return
    }
    if (!persona) {
      setError('No persona loaded.')
      return
    }

    messagesRef.current = []
    callMetaRef.current = {}
    setMessages([])
    setPartialTranscript('')
    setCallStatus('connecting')
    setError(null)

    const systemPrompt = `You are ${persona.name}, ${persona.role} at ${persona.company}. You are a BUSY EXECUTIVE receiving an unsolicited sales call. You are the BUYER, not a seller.

Your job: be a realistic, skeptical prospect. Push back. Be hard to impress. Only warm up if the rep earns it.

Your personality: ${persona.style}
Your traits: ${persona.traits.join(', ')}
Your pain points (things you actually care about): ${persona.pressure_points.join(', ')}
Objections you will raise: ${persona.objections.join(' | ')}
Difficulty level: ${persona.difficulty}

STRICT RULES:
- You are ALWAYS the prospect. The person talking to you is the sales rep trying to sell to YOU.
- Respond in 1-2 short sentences max.
- Be skeptical, busy, and direct. Challenge weak claims.
- Only agree to a next step if the rep has genuinely impressed you.
- Speak naturally. No stage directions, no asterisks, no action words.`

    const voice = selectVoice(persona.gender, persona.region)
    console.log('[Bout] Voice selected:', voice, '| persona gender:', persona.gender, '| region:', persona.region)

    const assistantConfig = {
      model: {
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        temperature: 0.4,
        maxTokens: 80,
        messages: [{ role: 'system', content: systemPrompt }]
      },
      voice,
      firstMessage: `${persona.name} speaking.`,
      endCallMessage: "I have to jump.",
      transcriber: {
        provider: 'deepgram',
        model: 'nova-3',
        language: 'en-US'
      },
      artifactPlan: {
        recordingEnabled: true,
        videoRecordingEnabled: false
      }
    }

    try {
      await vapiRef.current.start(assistantConfig)
    } catch (err) {
      console.error('Failed to start VAPI call:', err)
      setError(err?.message || 'Failed to start voice session. Check microphone permissions.')
      setCallStatus('idle')
    }
  }, [persona])

  const stopCall = useCallback(() => {
    if (vapiRef.current) {
      try { vapiRef.current.stop() } catch {}
    }
    setCallStatus('ended')
  }, [])

  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      const next = !isMuted
      try { vapiRef.current.setMuted(next) } catch {}
      setIsMuted(next)
    }
  }, [isMuted])

  return {
    callStatus,
    isSpeaking,
    isAiSpeaking,
    isMuted,
    partialTranscript,
    messages,
    error,
    startCall,
    stopCall,
    toggleMute,
    hasVapiKey: !!(vapiKey && vapiKey !== 'your_vapi_public_key_here')
  }
}
