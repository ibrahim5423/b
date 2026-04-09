import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function DifficultyBadge({ difficulty }) {
  const cls = difficulty?.toLowerCase() || 'medium'
  return <span className={`difficulty-badge ${cls}`}>{difficulty}</span>
}

function PersonaCard({ persona }) {
  if (!persona) return null

  return (
    <div className="persona-card">
      <div className="persona-card-header">
        <div className="persona-avatar">{persona.initials}</div>
        <div style={{ flex: 1 }}>
          <div className="persona-name">{persona.name}</div>
          <div className="persona-role">{persona.role} · {persona.company}</div>
        </div>
        <DifficultyBadge difficulty={persona.difficulty} />
      </div>

      <div className="persona-meta" style={{ gridTemplateColumns: '1fr 1fr' }}>
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

        <div className="persona-section" style={{ gridColumn: '1 / -1', borderRight: 'none' }}>
          <span className="persona-section-label">Objections to expect</span>
          <ol className="objection-list">
            {persona.objections.map((o, i) => (
              <li key={i} data-num={`${i + 1}.`}>{o}</li>
            ))}
          </ol>
        </div>

        <div className="persona-section" style={{ gridColumn: '1 / -1', borderRight: 'none', borderBottom: 'none' }}>
          <span className="persona-section-label">Pressure Points</span>
          <span className="persona-section-value">{persona.pressure_points.join(' · ')}</span>
        </div>

        {persona.briefing && (
          <div className="persona-section" style={{ gridColumn: '1 / -1', borderRight: 'none', borderBottom: 'none', borderTop: '1px solid var(--border)', marginTop: -1 }}>
            <span className="persona-section-label" style={{ color: 'var(--muted)' }}>Tailored to your pitch</span>
            <span style={{ fontSize: 11, color: '#888', lineHeight: 1.8 }}>{persona.briefing}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function SquareRadioGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map(opt => (
        <label
          key={opt}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', fontSize: 12, fontFamily: 'DM Mono, monospace',
            fontWeight: 300, color: value === opt ? '#f0ede8' : '#555',
            transition: 'color 0.15s ease'
          }}
        >
          <span style={{
            width: 13, height: 13, border: '1px solid',
            borderColor: value === opt ? '#f0ede8' : 'rgba(245,244,240,0.2)',
            background: value === opt ? '#f0ede8' : 'transparent',
            display: 'inline-block', flexShrink: 0,
            transition: 'all 0.15s ease'
          }} />
          <input
            type="radio"
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            style={{ display: 'none' }}
          />
          {opt}
        </label>
      ))}
    </div>
  )
}

function AdditionalDetailsPanel({ details, onChange }) {
  function set(field, value) {
    onChange({ ...details, [field]: value })
  }

  function setObjection(idx, value) {
    const objections = [...details.objections]
    objections[idx] = value
    onChange({ ...details, objections })
  }

  function addObjection() {
    onChange({ ...details, objections: [...details.objections, ''] })
  }

  function removeObjection(idx) {
    const objections = details.objections.filter((_, i) => i !== idx)
    onChange({ ...details, objections: objections.length ? objections : [''] })
  }

  const inputStyle = {
    width: '100%', background: 'transparent',
    border: '1px solid rgba(245,244,240,0.1)',
    color: '#f0ede8', fontSize: 12, fontFamily: 'DM Mono, monospace',
    fontWeight: 300, padding: '8px 10px', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s ease'
  }

  const labelStyle = {
    fontSize: 9, fontFamily: 'DM Mono, monospace',
    textTransform: 'uppercase', letterSpacing: '0.15em',
    color: '#666', display: 'block', marginBottom: 10
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: 1,
      background: 'rgba(245,244,240,0.08)',
      border: '1px solid rgba(245,244,240,0.08)'
    }}>
      {/* Box 1 — Product */}
      <div style={{ background: '#0a0a0a', padding: 16 }}>
        <span style={labelStyle}>Product / Service</span>
        <input
          type="text"
          style={inputStyle}
          placeholder="e.g. AI sales coaching tool, $19/month, targets SDR teams"
          value={details.product}
          onChange={e => set('product', e.target.value)}
          onFocus={e => e.target.style.borderColor = 'rgba(245,244,240,0.35)'}
          onBlur={e => e.target.style.borderColor = 'rgba(245,244,240,0.1)'}
        />
      </div>

      {/* Box 3 — Deal Size */}
      <div style={{ background: '#0a0a0a', padding: 16 }}>
        <span style={labelStyle}>Typical Deal Size</span>
        <SquareRadioGroup
          options={['Under $1K / month', '$1K – $10K', '$10K – $50K', '$50K+']}
          value={details.dealSize}
          onChange={v => set('dealSize', v)}
        />
      </div>

      {/* Box 2 — Objections (full width) */}
      <div style={{ background: '#0a0a0a', padding: 16, gridColumn: 'span 2' }}>
        <span style={labelStyle}>Common Objections</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {details.objections.map((obj, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="text"
                style={{ ...inputStyle, flex: 1 }}
                placeholder={
                  idx === 0 ? 'e.g. We already have a process' :
                  idx === 1 ? 'e.g. Budget is frozen until Q3' :
                  idx === 2 ? "e.g. My reps won't adopt it" :
                  'Another objection...'
                }
                value={obj}
                onChange={e => setObjection(idx, e.target.value)}
                onFocus={e => e.target.style.borderColor = 'rgba(245,244,240,0.35)'}
                onBlur={e => e.target.style.borderColor = 'rgba(245,244,240,0.1)'}
              />
              {idx > 0 && (
                <button
                  type="button"
                  onClick={() => removeObjection(idx)}
                  style={{
                    background: 'none', border: 'none', color: '#555',
                    cursor: 'pointer', fontSize: 14, padding: '0 4px',
                    lineHeight: 1, flexShrink: 0, transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f0ede8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#555'}
                >×</button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addObjection}
            style={{
              background: 'none', border: 'none', color: '#555',
              fontSize: 10, fontFamily: 'DM Mono, monospace',
              letterSpacing: '0.08em', cursor: 'pointer', padding: '4px 0',
              textAlign: 'left', transition: 'color 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f0ede8'}
            onMouseLeave={e => e.currentTarget.style.color = '#555'}
          >+ Add another</button>
        </div>
      </div>

      {/* Box 4 — Call Type */}
      <div style={{ background: '#0a0a0a', padding: 16 }}>
        <span style={labelStyle}>Call Type</span>
        <SquareRadioGroup
          options={['Cold outbound', 'Warm follow-up', 'Discovery call', 'Demo / evaluation']}
          value={details.callType}
          onChange={v => set('callType', v)}
        />
      </div>

      {/* Box 5 — Your Company */}
      <div style={{ background: '#0a0a0a', padding: 16 }}>
        <span style={labelStyle}>Your Company</span>
        <input
          type="text"
          style={inputStyle}
          placeholder="e.g. Bout — early stage, 10 employees, founded 2024"
          value={details.yourCompany}
          onChange={e => set('yourCompany', e.target.value)}
          onFocus={e => e.target.style.borderColor = 'rgba(245,244,240,0.35)'}
          onBlur={e => e.target.style.borderColor = 'rgba(245,244,240,0.1)'}
        />
      </div>

      {/* Box 6 — Extra Context (full width) */}
      <div style={{ background: '#0a0a0a', padding: 16, gridColumn: 'span 2' }}>
        <span style={labelStyle}>Prospect Context</span>
        <textarea
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          rows={3}
          placeholder={"e.g. Just raised Series B, posted about pipeline problems last week, we have a mutual connection via LinkedIn"}
          value={details.prospectContext}
          onChange={e => set('prospectContext', e.target.value)}
          onFocus={e => e.target.style.borderColor = 'rgba(245,244,240,0.35)'}
          onBlur={e => e.target.style.borderColor = 'rgba(245,244,240,0.1)'}
        />
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

  const [showAdditional, setShowAdditional] = useState(false)
  const [additionalDetails, setAdditionalDetails] = useState({
    product: '',
    objections: ['', '', ''],
    dealSize: '',
    callType: '',
    yourCompany: '',
    prospectContext: ''
  })

  const hasDetails = !!(
    additionalDetails.product ||
    additionalDetails.objections.some(o => o.trim()) ||
    additionalDetails.dealSize ||
    additionalDetails.callType ||
    additionalDetails.yourCompany ||
    additionalDetails.prospectContext
  )

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
        body: JSON.stringify({ query: query.trim(), additionalDetails })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)
      if (!data.persona) throw new Error('No persona returned from server.')

      setPersona(data.persona)
      onPersonaReady(data.persona)
    } catch (err) {
      setError(err.message || 'Failed to generate persona. Check that the server is running.')
    } finally {
      setLoading(false)
    }
  }

  function handleStart() {
    if (persona) navigate('/session')
  }

  return (
    <div className="page">
      <div className="logo">Bout</div>

      {missingVapi && (
        <div className="banner banner-warn">
          <strong>VAPI key missing.</strong> Add <code>VITE_VAPI_PUBLIC_KEY</code> to <code>client/.env</code> and restart.
        </div>
      )}

      <div className="setup-subtitle">AI Sales Roleplay Trainer</div>
      <h1 className="setup-headline">
        Train on the exact<br />person you're calling.
      </h1>

      <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <textarea
          className="input-field"
          rows={3}
          placeholder="Paste a LinkedIn URL or describe your prospect — e.g. 'VP of Sales at a Series B SaaS company, skeptical, budget-conscious'"
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

        <div className="setup-hint">
          Describe a persona or paste a LinkedIn URL. The AI builds your opponent in seconds.
        </div>

        {error && <div className="banner banner-error">{error}</div>}

        <div>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !query.trim()}
          >
            {loading ? (
              <><span className="spinner spinner-sm" />Building persona...</>
            ) : (
              'Generate Persona →'
            )}
          </button>
        </div>

        {/* Additional Details Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdditional(v => !v)}
            style={{
              background: 'none',
              border: '1px solid rgba(245,244,240,0.1)',
              color: hasDetails ? '#6fcf97' : '#666',
              fontSize: 10,
              fontFamily: 'DM Mono, monospace',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '8px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              if (!hasDetails) {
                e.currentTarget.style.borderColor = 'rgba(245,244,240,0.25)'
                e.currentTarget.style.color = '#f0ede8'
              }
            }}
            onMouseLeave={e => {
              if (!hasDetails) {
                e.currentTarget.style.borderColor = 'rgba(245,244,240,0.1)'
                e.currentTarget.style.color = '#666'
              }
            }}
          >
            {hasDetails ? '✓ Details added' : `${showAdditional ? '− ' : '+ '}Additional Details`}
          </button>
        </div>

        {/* Animated Panel */}
        <div style={{
          overflow: 'hidden',
          maxHeight: showAdditional ? '800px' : '0px',
          opacity: showAdditional ? 1 : 0,
          transition: 'max-height 0.2s ease, opacity 0.2s ease'
        }}>
          <AdditionalDetailsPanel
            details={additionalDetails}
            onChange={setAdditionalDetails}
          />
        </div>
      </form>

      {persona && <PersonaCard persona={persona} />}

      {persona && (
        <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <button className="btn-primary" onClick={handleStart}>
              Start Voice Session →
            </button>
          </div>
          <div className="setup-hint">Make sure your microphone is enabled before starting.</div>
        </div>
      )}
    </div>
  )
}
