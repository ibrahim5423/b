import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function DifficultyBadge({ difficulty }) {
  const cls = difficulty?.toLowerCase() || 'medium'
  return (
    <span className={`difficulty-badge ${cls}`}>{difficulty}</span>
  )
}

function PersonaCard({ persona }) {
  if (!persona) return null

  return (
    <div className="persona-card">
      <div className="persona-card-header">
        <div className="persona-avatar">{persona.initials}</div>
        <div>
          <div className="persona-name">{persona.name}</div>
          <div className="persona-role">{persona.role} · {persona.company}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <DifficultyBadge difficulty={persona.difficulty} />
        </div>
      </div>

      <div className="persona-meta" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="persona-section">
          <span className="persona-section-label">Traits</span>
          <div className="trait-tags">
            {persona.traits.map((t, i) => (
              <span key={i} className="trait-tag">{t}</span>
            ))}
          </div>
        </div>

        <div className="persona-section">
          <span className="persona-section-label">Communication Style</span>
          <span className="persona-section-value">{persona.style}</span>
        </div>

        <div className="persona-section" style={{ gridColumn: '1 / -1' }}>
          <span className="persona-section-label">Objections</span>
          <ol className="objection-list">
            {persona.objections.map((o, i) => (
              <li key={i} data-num={`${i + 1}.`}>{o}</li>
            ))}
          </ol>
        </div>

        <div className="persona-section" style={{ gridColumn: '1 / -1' }}>
          <span className="persona-section-label">Pressure Points</span>
          <span className="persona-section-value">{persona.pressure_points.join(' · ')}</span>
        </div>
      </div>
    </div>
  )
}

export default function Setup({ initialPersona, onPersonaReady }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [persona, setPersona] = useState(initialPersona || null)

  const vapiKey = import.meta.env.VITE_VAPI_PUBLIC_KEY
  const missingVapi = !vapiKey || vapiKey === 'your_vapi_public_key_here'

  async function handleGenerate(e) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/generate-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Server error ${res.status}`)
      }

      if (!data.persona) {
        throw new Error('No persona returned from server.')
      }

      setPersona(data.persona)
      onPersonaReady(data.persona)
    } catch (err) {
      setError(err.message || 'Failed to generate persona. Check that the server is running and ANTHROPIC_API_KEY is set.')
    } finally {
      setLoading(false)
    }
  }

  function handleStart() {
    if (persona) navigate('/session')
  }

  return (
    <div className="page">
      <div className="logo">Bout.</div>

      {missingVapi && (
        <div className="banner banner-warn">
          <strong>VAPI key missing.</strong> Add <code>VITE_VAPI_PUBLIC_KEY</code> to <code>client/.env</code> to enable voice sessions.
          Get your key at vapi.ai → Dashboard → API Keys.
        </div>
      )}

      <h1 style={{ fontSize: '36px', lineHeight: 1.15, marginBottom: '40px', maxWidth: '540px' }}>
        Train on the exact<br />person you're calling.
      </h1>

      <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <textarea
          className="input-field"
          rows={3}
          placeholder="Paste LinkedIn URL or describe your prospect (e.g. VP of Sales at a Series B SaaS company)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={loading}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleGenerate(e)
            }
          }}
        />

        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
          Paste a LinkedIn URL or describe a persona. Claude builds your opponent in seconds.
        </div>

        {error && (
          <div className="banner banner-error">{error}</div>
        )}

        <div>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !query.trim()}
          >
            {loading ? (
              <>
                <span className="spinner spinner-sm" />
                Building persona...
              </>
            ) : (
              'Generate Persona →'
            )}
          </button>
        </div>
      </form>

      {persona && <PersonaCard persona={persona} />}

      {persona && (
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="btn-primary" onClick={handleStart}>
            Start Voice Session →
          </button>
          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
            Make sure your microphone is enabled before starting
          </div>
        </div>
      )}
    </div>
  )
}
