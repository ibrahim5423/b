import Groq from 'groq-sdk'

function gradeFromScore(n) {
  if (n >= 93) return 'A+'
  if (n >= 87) return 'A'
  if (n >= 83) return 'A-'
  if (n >= 77) return 'B+'
  if (n >= 73) return 'B'
  if (n >= 68) return 'B-'
  if (n >= 63) return 'C+'
  if (n >= 58) return 'C'
  if (n >= 53) return 'C-'
  if (n >= 40) return 'D'
  return 'F'
}

function bucketFromScore(n) {
  if (n >= 85) return 'Elite'
  if (n >= 70) return 'Strong'
  if (n >= 50) return 'Developing'
  if (n >= 30) return 'Weak'
  return 'Failing'
}

function computeMetrics(transcript, durationSeconds) {
  const repMsgs = transcript.filter(m => m.role === 'user')
  const proMsgs = transcript.filter(m => m.role !== 'user')
  const countWords = (txt) => (txt || '').trim().split(/\s+/).filter(Boolean).length
  const repWords = repMsgs.reduce((a, m) => a + countWords(m.text), 0)
  const proWords = proMsgs.reduce((a, m) => a + countWords(m.text), 0)
  const totalWords = repWords + proWords || 1
  const questionMarks = repMsgs.reduce((a, m) => a + ((m.text || '').match(/\?/g) || []).length, 0)
  const fillerRegex = /\b(um+|uh+|uhh+|er+|hmm+|like|you know|kind of|sort of|basically|literally|actually|i mean)\b/gi
  const fillers = repMsgs.reduce((a, m) => a + ((m.text || '').match(fillerRegex) || []).length, 0)
  const avgRepMsgLen = repMsgs.length ? Math.round(repWords / repMsgs.length) : 0
  return {
    duration_seconds: Number.isFinite(durationSeconds) ? Math.round(durationSeconds) : 0,
    rep_turns: repMsgs.length,
    prospect_turns: proMsgs.length,
    rep_words: repWords,
    prospect_words: proWords,
    talk_ratio_rep_pct: Math.round((repWords / totalWords) * 100),
    talk_ratio_prospect_pct: Math.round((proWords / totalWords) * 100),
    rep_questions: questionMarks,
    filler_count: fillers,
    avg_rep_msg_words: avgRepMsgLen,
    words_per_minute: durationSeconds > 0 ? Math.round((repWords / durationSeconds) * 60) : 0
  }
}

function formatDuration(s) {
  if (!s || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function idealTalkRatioHint(callType) {
  switch (callType) {
    case 'Discovery call': return '30–45% (listen-heavy)'
    case 'Demo / evaluation': return '50–65% (you are explaining)'
    case 'Warm follow-up': return '40–55% (balanced)'
    default: return '35–50% (cold call — hook then ask)'
  }
}

function emptyReport(personaName, metrics) {
  return {
    overall: 0, grade: 'F',
    verdict: `The session was too short to analyse. Have a real conversation with ${personaName || 'the prospect'} first.`,
    headline_strength: 'Not enough data',
    headline_weakness: 'Session too short',
    scores: [
      { label: 'Discovery Quality', score: 0, rubric_bucket: 'Failing', note: 'No data.' },
      { label: 'Challenger Positioning', score: 0, rubric_bucket: 'Failing', note: 'No data.' },
      { label: 'Objection Handling', score: 0, rubric_bucket: 'Failing', note: 'No data.' },
      { label: 'Talk / Listen Ratio', score: 0, rubric_bucket: 'Failing', note: 'No data.' },
      { label: 'Professionalism', score: 0, rubric_bucket: 'Failing', note: 'No data.' }
    ],
    strengths: [], weaknesses: [], moments: [],
    coachability: { trend: 'flat', note: 'Not enough exchanges to assess.' },
    focus_title: 'Complete a Full Session',
    focus_desc: 'Aim for at least 5 exchanges before generating a report.',
    focus_sample_phrase: null,
    metrics: metrics || null
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { persona, transcript, durationSeconds } = req.body
  const personaName = persona?.name || 'Prospect'
  const metrics = Array.isArray(transcript) ? computeMetrics(transcript, durationSeconds) : null

  if (!Array.isArray(transcript) || transcript.length < 2) {
    return res.json({ report: emptyReport(personaName, metrics) })
  }

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured.' })
  }

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const formattedTranscript = transcript
    .map((msg, i) => `[${i + 1}] ${msg.role === 'user' ? 'Rep' : personaName}: ${msg.text}`)
    .join('\n')

  const callType = persona?.callType || 'Cold call'
  const talkHint = idealTalkRatioHint(callType)

  const systemPrompt = `You are an elite B2B sales coach. Analyse sales roleplays with ruthless specificity. Every observation must cite an exact quote. Never give generic feedback. Return ONLY valid JSON — no prose, no markdown, no backticks.`

  const userPrompt = `Analyse this sales roleplay session.

=== PERSONA ===
Name: ${personaName}
Role: ${persona?.role || 'Executive'} at ${persona?.company || 'a company'}
Call type: ${callType}
Difficulty: ${persona?.difficulty || 'Medium'}
Style: ${persona?.style || 'Unknown'}
Traits: ${persona?.traits?.join(', ') || 'Unknown'}
Pressure points: ${persona?.pressure_points?.join(' | ') || 'None'}
Objections primed to raise: ${persona?.objections?.join(' | ') || 'None'}
${persona?.briefing ? `Rep briefing: ${persona.briefing}` : ''}
${persona?.prospectContext ? `Prior context: ${persona.prospectContext}` : ''}

=== COMPUTED METRICS ===
Duration: ${formatDuration(metrics.duration_seconds)}
Rep turns: ${metrics.rep_turns} | Prospect turns: ${metrics.prospect_turns}
Rep words: ${metrics.rep_words} | Prospect words: ${metrics.prospect_words}
Talk ratio (rep): ${metrics.talk_ratio_rep_pct}% (ideal for ${callType}: ${talkHint})
Questions asked by rep: ${metrics.rep_questions}
Filler words: ${metrics.filler_count}
Avg rep message: ${metrics.avg_rep_msg_words} words | WPM: ${metrics.words_per_minute}

=== TRANSCRIPT ===
${formattedTranscript}

=== SCORING RUBRIC ===
85–100 "Elite" | 70–84 "Strong" | 50–69 "Developing" | 30–49 "Weak" | 0–29 "Failing"

=== DIMENSIONS (score 0–100) ===
1. Discovery Quality — open-ended questions, probing for impact, uncovering pain before pitching
2. Challenger Positioning — bringing insight vs. feature-dumping
3. Objection Handling — reframing value vs. conceding/dodging
4. Talk / Listen Ratio — based on ${metrics.talk_ratio_rep_pct}% rep talk (ideal: ${talkHint})
5. Professionalism — tone, clarity, filler words (${metrics.filler_count} detected), scripted delivery

=== RULES ===
- Every "note" must contain a direct quote or specific number.
- "verdict" must name "${personaName}" and cite one specific moment.
- "strengths" and "weaknesses" must each contain direct quotes.
- "coachability": did the rep improve, stay flat, or decline as the call progressed?
- "focus_sample_phrase": literal phrase tied to ${personaName}'s actual pressure points.
- Every "moment" must include a "why" field (one sentence on impact).

Return ONLY this JSON:
{
  "overall": number,
  "grade": "A+"|"A"|"A-"|"B+"|"B"|"B-"|"C+"|"C"|"C-"|"D"|"F",
  "verdict": string,
  "headline_strength": string,
  "headline_weakness": string,
  "scores": [
    { "label": string, "score": number, "rubric_bucket": string, "note": string }
  ],
  "strengths": [ { "title": string, "quote": string, "why": string } ],
  "weaknesses": [ { "title": string, "quote": string, "rewrite": string } ],
  "moments": [
    { "type": "fumble"|"win", "time": string, "label": string, "said": string, "rewrite": string|null, "why": string }
  ],
  "coachability": { "trend": "improved"|"flat"|"declined", "note": string },
  "focus_title": string,
  "focus_desc": string,
  "focus_sample_phrase": string
}`

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 3000,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })

    const raw = completion.choices[0].message.content.trim()
    let report

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      report = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
    } catch {
      console.error('JSON parse error. Raw:', raw.slice(0, 300))
      return res.json({ report: emptyReport(personaName, metrics) })
    }

    if (typeof report.overall !== 'number') report.overall = 0
    report.overall = Math.round(Math.max(0, Math.min(100, report.overall)))
    if (typeof report.grade !== 'string') report.grade = gradeFromScore(report.overall)
    if (typeof report.verdict !== 'string') report.verdict = 'Unable to generate verdict.'
    if (typeof report.headline_strength !== 'string') report.headline_strength = '—'
    if (typeof report.headline_weakness !== 'string') report.headline_weakness = '—'

    const expectedLabels = ['Discovery Quality', 'Challenger Positioning', 'Objection Handling', 'Talk / Listen Ratio', 'Professionalism']
    if (!Array.isArray(report.scores) || report.scores.length !== 5) {
      report.scores = emptyReport(personaName, metrics).scores
    } else {
      report.scores = report.scores.map((s, i) => ({
        label: typeof s.label === 'string' ? s.label : expectedLabels[i],
        score: typeof s.score === 'number' ? Math.round(Math.max(0, Math.min(100, s.score))) : 0,
        rubric_bucket: typeof s.rubric_bucket === 'string' ? s.rubric_bucket : bucketFromScore(s.score || 0),
        note: typeof s.note === 'string' ? s.note : '—'
      }))
    }

    if (!Array.isArray(report.strengths)) report.strengths = []
    if (!Array.isArray(report.weaknesses)) report.weaknesses = []
    if (!Array.isArray(report.moments)) report.moments = []

    report.moments = report.moments.map(m => ({
      type: m.type === 'win' ? 'win' : 'fumble',
      time: typeof m.time === 'string' ? m.time : '—',
      label: typeof m.label === 'string' ? m.label : 'Moment',
      said: typeof m.said === 'string' ? m.said : '',
      rewrite: typeof m.rewrite === 'string' ? m.rewrite : null,
      why: typeof m.why === 'string' ? m.why : ''
    }))

    if (!report.coachability || typeof report.coachability !== 'object') {
      report.coachability = { trend: 'flat', note: '—' }
    }
    if (!['improved', 'flat', 'declined'].includes(report.coachability.trend)) report.coachability.trend = 'flat'
    if (typeof report.coachability.note !== 'string') report.coachability.note = '—'

    if (typeof report.focus_title !== 'string') report.focus_title = 'Review the session'
    if (typeof report.focus_desc !== 'string') report.focus_desc = 'Review your transcript and identify areas for improvement.'
    if (typeof report.focus_sample_phrase !== 'string') report.focus_sample_phrase = null

    report.metrics = metrics

    res.json({ report })
  } catch (err) {
    console.error('Report generation error:', err)
    res.json({ report: emptyReport(personaName, metrics), warning: 'Generation failed.' })
  }
}
