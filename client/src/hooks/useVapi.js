import { useEffect, useRef, useState, useCallback } from 'react'
import Vapi from '@vapi-ai/web'

function selectVoice(gender) {
  const g = (gender || 'male').toLowerCase()
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

    // Explicitly request microphone before VAPI starts so the browser
    // permission dialog fires at the right moment with a clear user gesture.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
    } catch (micErr) {
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
      const isAndroid = /Android/.test(navigator.userAgent)
      let msg = 'Microphone access was blocked. '
      if (isIOS) {
        msg += 'On iPhone: go to Settings → Safari → Microphone → Allow for this site.'
      } else if (isAndroid) {
        msg += 'Tap the lock icon in the address bar → Permissions → Microphone → Allow, then refresh.'
      } else {
        msg += 'Click the lock icon in your browser address bar and allow microphone access, then try again.'
      }
      setError(msg)
      setCallStatus('idle')
      return
    }

    messagesRef.current = []
    callMetaRef.current = {}
    setMessages([])
    setPartialTranscript('')
    setCallStatus('connecting')
    setError(null)

    const callContext = (() => {
      const t = persona.callType
      const ctx = persona.prospectContext
      if (t === 'Warm follow-up') {
        return `You have spoken with this rep before. ${ctx ? `Context from the last interaction: ${ctx}` : 'You vaguely remember a previous conversation but want specifics before committing any time.'} You are open but still skeptical — they need to earn your trust with substance, not just pleasantries.`
      }
      if (t === 'Discovery call') {
        return `This is a scheduled discovery call you agreed to take. ${ctx ? `Background: ${ctx}` : 'You have a rough idea of what they sell but no details yet.'} You are willing to talk but you have 20 minutes max and high expectations.`
      }
      if (t === 'Demo / evaluation') {
        return `You are evaluating this product alongside 1-2 competitors. ${ctx ? `Context: ${ctx}` : 'You want to see concrete proof it solves your problem before you spend any more time.'} You will ask hard questions about specifics.`
      }
      // Cold outbound or unset
      return `You are a BUSY EXECUTIVE receiving an unsolicited cold call. ${ctx ? `Note: ${ctx}` : ''} You did not expect this call and your default is to get off the phone quickly.`
    })()

    const systemPrompt = `You are ${persona.name}, ${persona.role} at ${persona.company}. You are the BUYER, not a seller.

${callContext}

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
- Speak naturally. No stage directions, no asterisks, no action words.
- You CAN hang up ONLY if: the rep is explicitly rude or insulting, they have repeated the same pitch verbatim 3+ times with no adjustment, or you have firmly said you are not interested and they continue anyway. Say exactly: "I have to jump." to end the call. Do NOT hang up just because a call is going well or because you are naturally wrapping a thought.`

    const voice = selectVoice(persona.gender, persona.region)
    console.log('[Bout] Voice selected:', voice, '| persona gender:', persona.gender, '| region:', persona.region)

    const assistantConfig = {
      model: {
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
        maxTokens: 80,
        messages: [{ role: 'system', content: systemPrompt }]
      },
      voice,
      firstMessage: persona.callType === 'Warm follow-up'
        ? `${persona.name}.`
        : persona.callType === 'Discovery call' || persona.callType === 'Demo / evaluation'
        ? `${persona.name}, go ahead.`
        : `${persona.name} speaking.`,
      endCallMessage: "I have to jump.",
      endCallPhrases: ["I have to jump.", "I have to jump", "don't call me again", "please don't call again"],
      maxDurationSeconds: 300,
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
    hasVapiKey: !!(vapiKey && vapiKey !== 'your_vapi_public_key_here'),
    // Always returns live messages from ref, not stale React state
    getMessages: () => messagesRef.current
  }
}
