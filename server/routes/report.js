import { Router } from 'express'
import Groq from 'groq-sdk'

const router = Router()
const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

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

  const questionMarks = repMsgs.reduce(
    (a, m) => a + ((m.text || '').match(/\?/g) || []).length,
    0
  )

  const fillerRegex = /\b(um+|uh+|uhh+|er+|hmm+|like|you know|kind of|sort of|basically|literally|actually|i mean)\b/gi
  const fillers = repMsgs.reduce(
    (a, m) => a + ((m.text || '').match(fillerRegex) || []).length,
    0
  )

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
    case 'Discovery call':
      return '30–45% (listen-heavy — the prospect should be doing most of the talking)'
    case 'Demo / evaluation':
      return '50–65% (you are explaining and demonstrating)'
    case 'Warm follow-up':
      return '40–55% (balanced — advance the deal)'
    default:
      return '35–50% (cold calls — lead with a hook, then ask)'
  }
}

const TOO_SHORT_REPORT = (personaName, metrics) => ({
  overall: 0,
  grade: 'F',
  verdict: `The session was too short to analyse. Start a voice session, have a real conversation with ${personaName || 'the prospect'}, and then get your report.`,
  headline_strength: 'Not enough data',
  headline_weakness: 'Session too short',
  scores: [
    { label: 'Discovery Quality', score: 0, rubric_bucket: 'Failing', note: 'No data — session too short.' },
    { label: 'Challenger Positioning', score: 0, rubric_bucket: 'Failing', note: 'No data — session too short.' },
    { label: 'Objection Handling', score: 0, rubric_bucket: 'Failing', note: 'No data — session too short.' },
    { label: 'Talk / Listen Ratio', score: 0, rubric_bucket: 'Failing', note: 'No data — session too short.' },
    { label: 'Professionalism', score: 0, rubric_bucket: 'Failing', note: 'No data — session too short.' }
  ],
  strengths: [],
  weaknesses: [],
  moments: [],
  coachability: { trend: 'flat', note: 'Not enough exchanges to assess.' },
  focus_title: 'Complete a Full Session',
  focus_desc: 'Start a voice session and engage in a full conversation before generating a report. Aim for at least 5 exchanges with the prospect.',
  focus_sample_phrase: null,
  metrics: metrics || null
})

router.post('/generate-report', async (req, res) => {
  const { persona, transcript, durationSeconds } = req.body
  const personaName = persona?.name || 'Prospect'

  const metrics = Array.isArray(transcript) ? computeMetrics(transcript, durationSeconds) : null

  if (!Array.isArray(transcript) || transcript.length < 2) {
    return res.json({ report: TOO_SHORT_REPORT(personaName, metrics) })
  }

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' })
  }

  const formattedTranscript = transcript
    .map((msg, i) => {
      const label = msg.role === 'user' ? 'Rep' : personaName
      return `[${i + 1}] ${label}: ${msg.text}`
    })
    .join('\n')

  const callType = persona?.callType || 'Cold call'
  const talkHint = idealTalkRatioHint(callType)

  const systemPrompt = `You are an elite B2B sales coach. You analyse sales roleplays with ruthless specificity. Every observation must cite an exact quote. Never give generic feedback. Always tie scores to what actually happened in the transcript. Reference the prospect by name. Return ONLY valid JSON — no prose, no markdown, no backticks.`

  const userPrompt = `Analyse this sales roleplay session.

=== PERSONA ===
Name: ${personaName}
Role: ${persona?.role || 'Executive'} at ${persona?.company || 'a company'}
Call type: ${callType}
Difficulty: ${persona?.difficulty || 'Medium'}
Communication style: ${persona?.style || 'Unknown'}
Traits: ${persona?.traits?.join(', ') || 'Unknown'}
Pressure points (what they actually care about): ${persona?.pressure_points?.join(' | ') || 'None specified'}
Objections they were primed to raise: ${persona?.objections?.join(' | ') || 'None specified'}
${persona?.briefing ? `Rep briefing (what the rep was told to practice): ${persona.briefing}` : ''}
${persona?.prospectContext ? `Prior context: ${persona.prospectContext}` : ''}

=== COMPUTED METRICS (use these numbers in your analysis) ===
Duration: ${formatDuration(metrics.duration_seconds)}
Rep turns: ${metrics.rep_turns}  |  Prospect turns: ${metrics.prospect_turns}
Rep words: ${metrics.rep_words}  |  Prospect words: ${metrics.prospect_words}
Talk ratio (rep): ${metrics.talk_ratio_rep_pct}%  (ideal for a ${callType}: ${talkHint})
Questions asked by rep: ${metrics.rep_questions}
Filler words used by rep: ${metrics.filler_count}
Avg rep message length: ${metrics.avg_rep_msg_words} words
Rep speaking pace: ${metrics.words_per_minute} WPM

=== TRANSCRIPT ===
${formattedTranscript}

=== SCORING RUBRIC (apply strictly) ===
85–100 "Elite": Reference exact quotes proving mastery of this dimension.
70–84 "Strong": Mostly on-target, 1–2 missed opportunities.
50–69 "Developing": Some solid moves, clear fundamental gaps.
30–49 "Weak": Missed core fundamentals.
0–29 "Failing": Off-topic, unprofessional, or gave up.

=== DIMENSIONS (score each 0–100) ===
1. Discovery Quality — Did they ask open-ended questions about ${personaName}'s pressure points? Probe for impact/cost? Uncover pain BEFORE pitching? (Rep asked ${metrics.rep_questions} questions total.)
2. Challenger Positioning — Did they bring insight, reframe ${personaName}'s thinking, or teach? Or were they a vendor delivering features?
3. Objection Handling — For each objection ${personaName} raised, did they reframe value and probe, or concede/dodge?
4. Talk / Listen Ratio — Based on the ${metrics.talk_ratio_rep_pct}% rep talk ratio. Ideal for ${callType}: ${talkHint}.
5. Professionalism — Tone, clarity, respect. Flag rudeness, rambling, filler words (${metrics.filler_count} detected), or scripted/robotic delivery.

=== OUTPUT REQUIREMENTS ===
- Every "note" in scores MUST contain either a direct quote OR a specific number/count.
- "verdict" must name "${personaName}" explicitly and cite ONE specific moment.
- "strengths" and "weaknesses" each must contain a direct quote.
- "coachability": did the rep get stronger, flatter, or weaker as the call progressed?
- "focus_sample_phrase": a literal phrase the rep can rehearse and say next time — tailored to ${personaName}'s actual pressure points.
- Every "moment" must include a "why" field explaining the impact in one sentence.
- Dock heavily for: ignoring pressure points by name, unprofessional behaviour, giving up after the first objection.

Return ONLY this JSON structure:
{
  "overall": number (0-100),
  "grade": "A+"|"A"|"A-"|"B+"|"B"|"B-"|"C+"|"C"|"C-"|"D"|"F",
  "verdict": string (2-3 sentences, names ${personaName}, cites one quote),
  "headline_strength": string (short phrase, under 50 chars),
  "headline_weakness": string (short phrase, under 50 chars),
  "scores": [
    {
      "label": "Discovery Quality"|"Challenger Positioning"|"Objection Handling"|"Talk / Listen Ratio"|"Professionalism",
      "score": number,
      "rubric_bucket": "Failing"|"Weak"|"Developing"|"Strong"|"Elite",
      "note": string
    }
  ] (exactly 5, in the order above),
  "strengths": [
    { "title": string (short), "quote": string (exact from rep), "why": string (one sentence) }
  ] (1-3, empty array if nothing genuinely strong),
  "weaknesses": [
    { "title": string, "quote": string (exact from rep), "rewrite": string (what they should have said) }
  ] (1-3),
  "moments": [
    {
      "type": "fumble" | "win",
      "time": string (MM:SS approx, based on turn position),
      "label": string (specific, 4-8 words),
      "said": string (exact quote),
      "rewrite": string | null (null for wins),
      "why": string (one sentence on impact)
    }
  ] (3-6 moments — assess every objection ${personaName} raised),
  "coachability": {
    "trend": "improved" | "flat" | "declined",
    "note": string (one sentence, cite evidence from early vs late turns)
  },
  "focus_title": string (one specific skill, e.g. "Probe impact before pitching"),
  "focus_desc": string (2 sentences: what went wrong + what to do differently),
  "focus_sample_phrase": string (literal phrase to rehearse, tied to ${personaName}'s pressure points)
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
      console.error('JSON parse error for report. Raw:', raw.slice(0, 300))
      return res.json({ report: TOO_SHORT_REPORT(personaName, metrics) })
    }

    // Validate + normalise with sensible fallbacks
    if (typeof report.overall !== 'number' || report.overall < 0 || report.overall > 100) {
      report.overall = 0
    }
    report.overall = Math.round(report.overall)

    if (typeof report.grade !== 'string') report.grade = gradeFromScore(report.overall)
    if (typeof report.verdict !== 'string') report.verdict = 'Unable to generate verdict.'
    if (typeof report.headline_strength !== 'string') report.headline_strength = '—'
    if (typeof report.headline_weakness !== 'string') report.headline_weakness = '—'

    const expectedLabels = [
      'Discovery Quality',
      'Challenger Positioning',
      'Objection Handling',
      'Talk / Listen Ratio',
      'Professionalism'
    ]

    if (!Array.isArray(report.scores) || report.scores.length !== 5) {
      report.scores = TOO_SHORT_REPORT(personaName, metrics).scores
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
    if (!['improved', 'flat', 'declined'].includes(report.coachability.trend)) {
      report.coachability.trend = 'flat'
    }
    if (typeof report.coachability.note !== 'string') report.coachability.note = '—'

    if (typeof report.focus_title !== 'string') report.focus_title = 'Review the session'
    if (typeof report.focus_desc !== 'string') report.focus_desc = 'Review your transcript and identify areas for improvement.'
    if (typeof report.focus_sample_phrase !== 'string') report.focus_sample_phrase = null

    report.metrics = metrics

    res.json({ report })
  } catch (err) {
    console.error('Report generation error:', err)
    res.json({
      report: TOO_SHORT_REPORT(personaName, metrics),
      warning: 'Report generation failed, showing empty report.'
    })
  }
})

export default router
