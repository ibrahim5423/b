import { useEffect, useRef, useState, useCallback } from 'react'
import Vapi from '@vapi-ai/web'

export function useVapi({ persona, onCallEnd, onTranscriptUpdate }) {
  const vapiRef = useRef(null)
  const [callStatus, setCallStatus] = useState('idle') // idle | connecting | active | ended
  const [isSpeaking, setIsSpeaking] = useState(false)  // user speaking
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [partialTranscript, setPartialTranscript] = useState('')
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const messagesRef = useRef([])

  const vapiKey = import.meta.env.VITE_VAPI_PUBLIC_KEY

  useEffect(() => {
    if (!vapiKey || vapiKey === 'your_vapi_public_key_here') return

    const vapi = new Vapi(vapiKey)
    vapiRef.current = vapi

    vapi.on('call-start', () => {
      setCallStatus('active')
      setError(null)
    })

    vapi.on('call-end', () => {
      setCallStatus('ended')
      if (onCallEnd) onCallEnd(messagesRef.current)
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
          if (onTranscriptUpdate) onTranscriptUpdate(messagesRef.current)
        }
      }

      // Detect when AI is generating/speaking
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
    setMessages([])
    setPartialTranscript('')
    setCallStatus('connecting')
    setError(null)

    const systemPrompt = `${persona.name}, ${persona.role} at ${persona.company}. Style: ${persona.style}. Traits: ${persona.traits.join(', ')}. Concerns: ${persona.pressure_points.join(', ')}. Raise objections: ${persona.objections.join(' | ')}. Rules: stay in character, 1-2 sentences max, speak naturally (no actions like "sigh" or "*pauses*"), push back on weak points, only agree to next step if earned. Difficulty: ${persona.difficulty}.`

    const assistantConfig = {
      model: {
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        temperature: 0.4,
        maxTokens: 80,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          }
        ]
      },
      voice: {
        provider: 'vapi',
        voiceId: 'Elliot'
      },
      firstMessage: `${persona.name} speaking.`,
      endCallMessage: "I have to jump.",
      transcriber: {
        provider: 'deepgram',
        model: 'nova-3',
        language: 'en-US'
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
