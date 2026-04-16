import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function DifficultyBadge({ difficulty }) {
  const cls = difficulty?.toLowerCase() || 'medium'
  return <span className={`difficulty-badge ${cls}`}>{difficulty}</span>
}

function PersonaCard({ persona }) {
  if (!persona) return null

  return (
    <div className="mobile-persona-card">
      <div className="mobile-persona-header">
        <div className="persona-avatar" style={{ width: 52, height: 52, fontSize: 16, flexShrink: 0 }}>
          {persona.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, letterSpacing: '-0.2px', marginBottom: 3 }}>
            {persona.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.04em' }}>
            {persona.role} · {persona.company}
          </div>
        </div>
        <DifficultyBadge difficulty={persona.difficulty} />
      </div>

      <div className="mobile-persona-body">
        <div className="mobile-persona-row">
          <span className="section-label" style={{ marginBottom: 6 }}>Traits</span>
          <div className="trait-tags">
            {persona.traits.map((t, i) => <span key={i} className="trait-tag">{t}</span>)}
          </div>
        </div>

        <div className="mobile-persona-row">
          <span className="section-label" style={{ marginBottom: 4 }}>Communication Style</span>
          <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7 }}>{persona.style}</span>
        </div>

        <div className="mobile-persona-row">
          <span className="section-label" style={{ marginBottom: 8 }}>Objections to Expect</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {persona.objections.map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 10, color: 'var(--red)', fontWeight: 600, minWidth: 16, marginTop: 2 }}>{i + 1}.</span>
                <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7, flex: 1 }}>{o}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mobile-persona-row">
          <span className="section-label" style={{ marginBottom: 4 }}>Pressure Points</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {persona.pressure_points.map((p, i) => (
              <span key={i} style={{
                fontSize: 11, padding: '4px 10px',
                background: 'rgba(240,237,232,0.04)',
                border: '1px solid var(--border)',
                color: 'var(--text)'
              }}>{p}</span>
            ))}
          </div>
        </div>

        {persona.briefing && (
          <div className="mobile-persona-row" style={{ background: 'rgba(232,93,74,0.04)', borderBottom: 'none' }}>
            <span className="section-label" style={{ color: 'var(--red)', marginBottom: 6 }}>
              Tailored to your pitch
            </span>
            <span style={{ fontSize: 12, color: 'rgba(240,237,232,0.6)', lineHeight: 1.8 }}>
              {persona.briefing}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function SquareRadioGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {options.map(opt => (
        <label key={opt} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer', minHeight: 36
        }}>
          <span style={{
            width: 14, height: 14, border: '1px solid',
            borderColor: value === opt ? '#f0ede8' : 'rgba(245,244,240,0.2)',
            background: value === opt ? '#f0ede8' : 'transparent',
            display: 'inline-block', flexShrink: 0,
            transition: 'all 0.15s ease'
          }} />
          <input type="radio" value={opt} checked={value === opt}
            onChange={() => onChange(opt)} style={{ display: 'none' }} />
          <span style={{
            fontSize: 13, fontFamily: 'DM Mono, monospace', fontWeight: 300,
            color: value === opt ? '#f0ede8' : '#666',
            transition: 'color 0.15s ease'
          }}>{opt}</span>
        </label>
      ))}
    </div>
  )
}

function AdditionalDetailsPanel({ details, onChange }) {
  function set(field, value) { onChange({ ...details, [field]: value }) }

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

  const fieldStyle = {
    width: '100%', background: 'transparent',
    border: '1px solid rgba(245,244,240,0.1)',
    color: '#f0ede8', fontSize: 13, fontFamily: 'DM Mono, monospace',
    fontWeight: 300, padding: '14px 16px', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s ease',
    WebkitAppearance: 'none'
  }

  const rowLabel = {
    fontSize: 9, fontFamily: 'DM Mono, monospace',
    textTransform: 'uppercase', letterSpacing: '0.18em',
    color: '#555', display: 'block', marginBottom: 12
  }

  const section = {
    background: 'var(--bg)', padding: '20px',
    borderBottom: '1px solid rgba(245,244,240,0.06)'
  }

  return (
    <div style={{ border: '1px solid rgba(245,244,240,0.08)' }}>
      <div style={section}>
        <span style={rowLabel}>Product / Service</span>
        <input type="text" style={fieldStyle}
          placeholder="e.g. AI sales coaching tool, $19/month, targets SDR teams"
          value={details.product} onChange={e => set('product', e.target.value)}
          onFocus={e => e.target.style.borderColor = 'rgba(245,244,240,0.35)'}
          onBlur={e => e.target.style.borderColor = 'rgba(245,244,240,0.1)'} />
      </div>

      <div style={section}>
        <span style={rowLabel}>Your Company</span>
        <input type="text" style={fieldStyle}
          placeholder="e.g. Bout — early stage, 10 employees, founded 2024"
          value={details.yourCompany} onChange={e => set('yourCompany', e.target.value)}
          onFocus={e => e.target.style.borderColor = 'rgba(245,244,240,0.35)'}
          onBlur={e => e.target.style.borderColor = 'rgba(245,244,240,0.1)'} />
      </div>

      <div style={section}>
        <span style={rowLabel}>Typical Deal Size</span>
        <SquareRadioGroup
          options={['Under $1K / month', '$1K – $10K', '$10K – $50K', '$50K+']}
          value={details.dealSize} onChange={v => set('dealSize', v)} />
      </div>

      <div style={section}>
        <span style={rowLabel}>Call Type</span>
        <SquareRadioGroup
          options={['Cold outbound', 'Warm follow-up', 'Discovery call', 'Demo / evaluation']}
          value={details.callType} onChange={v => set('callType', v)} />
      </div>

      <div style={section}>
        <span style={rowLabel}>Common Objections</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {details.objections.map((obj, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="text" style={{ ...fieldStyle, flex: 1 }}
                placeholder={
                  idx === 0 ? 'e.g. We already have a process' :
                  idx === 1 ? 'e.g. Budget is frozen until Q3' :
                  "e.g. My reps won't adopt it"
                }
                value={obj} onChange={e => setObjection(idx, e.target.value)}
                onFocus={e => e.target.style.borderColor = 'rgba(245,244,240,0.35)'}
                onBlur={e => e.target.style.borderColor = 'rgba(245,244,240,0.1)'} />
              {idx > 0 && (
                <button type="button" onClick={() => removeObjection(idx)}
                  style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 20, padding: '0 4px', lineHeight: 1 }}>×</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addObjection}
            style={{ background: 'none', border: 'none', color: '#555', fontSize: 11, fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em', cursor: 'pointer', padding: '6px 0', textAlign: 'left' }}>
            + Add another
          </button>
        </div>
      </div>

      <div style={{ ...section, borderBottom: 'none' }}>
        <span style={rowLabel}>Prospect Context</span>
        <textarea style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.7 }} rows={3}
          placeholder="e.g. Just raised Series B, posted about pipeline problems last week, mutual connection via LinkedIn"
          value={details.prospectContext} onChange={e => set('prospectContext', e.target.value)}
          onFocus={e => e.target.style.borderColor = 'rgba(245,244,240,0.35)'}
          onBlur={e => e.target.style.borderColor = 'rgba(245,244,240,0.1)'} />
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
    product: '', objections: ['', '', ''],
    dealSize: '', callType: '', yourCompany: '', prospectContext: ''
  })

  const hasDetails = !!(
    additionalDetails.product || additionalDetails.objections.some(o => o.trim()) ||
    additionalDetails.dealSize || additionalDetails.callType ||
    additionalDetails.yourCompany || additionalDetails.prospectContext
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
      setError(err.message || 'Failed to generate persona.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mobile-page">

      {/* Header */}
      <div className="screen-header" style={{ padding: '52px 24px 0' }}>
        <div className="screen-logo">Bout</div>

        {missingVapi && (
          <div className="banner banner-warn" style={{ marginBottom: 24, fontSize: 12 }}>
            <strong>VAPI key missing.</strong> Add <code>VITE_VAPI_PUBLIC_KEY</code> to <code>client/.env</code> and restart.
          </div>
        )}

        <div className="screen-eyebrow">AI Sales Roleplay</div>
        <h1 className="screen-title">Train on the exact<br />person you're calling.</h1>
        <p className="screen-sub" style={{ marginTop: 12 }}>
          Describe your prospect and we'll build a realistic AI to practice on.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} style={{ padding: '32px 24px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <textarea
          className="mobile-input"
          rows={4}
          placeholder={'Paste a LinkedIn URL or describe your prospect — e.g. "VP of Sales at a Series B SaaS, skeptical, budget-conscious"'}
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={loading}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(e) }
          }}
        />

        {error && <div className="banner banner-error" style={{ fontSize: 12 }}>{error}</div>}

        <button type="submit" className="btn-mobile-primary" disabled={loading || !query.trim()}>
          {loading ? <><span className="spinner spinner-sm" />Building persona...</> : 'Generate Persona →'}
        </button>

        {/* Additional Details toggle */}
        <button
          type="button"
          onClick={() => setShowAdditional(v => !v)}
          style={{
            background: 'none',
            border: `1px solid ${hasDetails ? 'rgba(111,207,151,0.4)' : 'rgba(245,244,240,0.1)'}`,
            color: hasDetails ? 'var(--green)' : 'var(--muted)',
            fontSize: 11, fontFamily: 'DM Mono, monospace',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '14px 16px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            minHeight: 48, WebkitTapHighlightColor: 'transparent'
          }}
        >
          <span style={{ fontSize: 14 }}>{hasDetails ? '✓' : showAdditional ? '−' : '+'}</span>
          {hasDetails ? 'Details added' : 'Additional Details'}
        </button>

        {/* Animated panel */}
        <div style={{
          overflow: 'hidden',
          maxHeight: showAdditional ? '1200px' : '0',
          opacity: showAdditional ? 1 : 0,
          transition: 'max-height 0.25s ease, opacity 0.2s ease'
        }}>
          <AdditionalDetailsPanel details={additionalDetails} onChange={setAdditionalDetails} />
        </div>
      </form>

      {/* Persona card */}
      {persona && (
        <div style={{ marginTop: 32 }}>
          <div style={{ padding: '0 24px 14px' }}>
            <span className="section-label">Your Prospect</span>
          </div>
          <PersonaCard persona={persona} />
        </div>
      )}

      {/* Start button */}
      {persona && (
        <div style={{ padding: '24px 24px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn-mobile-primary" onClick={() => navigate('/session')}>
            Start Voice Session →
          </button>
          <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
            Make sure your microphone is enabled before starting.
          </p>
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  )
}
