import { Router } from 'express'
import Groq from 'groq-sdk'

const router = Router()
const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

const TOO_SHORT_REPORT = (personaName) => ({
  overall: 0,
  verdict: `The session was too short to analyse. Start a voice session, have a real conversation with ${personaName || 'the prospect'}, and then get your report.`,
  scores: [
    { label: 'Discovery Quality', score: 0, note: 'No data — session too short.' },
    { label: 'Challenger Positioning', score: 0, note: 'No data — session too short.' },
    { label: 'Objection Handling', score: 0, note: 'No data — session too short.' },
    { label: 'Talk / Listen Ratio', score: 0, note: 'No data — session too short.' },
    { label: 'Close Attempt', score: 0, note: 'No data — session too short.' }
  ],
  moments: [],
  focus_title: 'Complete a Full Session',
  focus_desc: 'Start a voice session and engage in a full conversation before generating a report. Aim for at least 5 exchanges with the prospect.'
})

router.post('/generate-report', async (req, res) => {
  const { persona, transcript } = req.body

  const personaName = persona?.name || 'Prospect'

  if (!Array.isArray(transcript) || transcript.length < 2) {
    return res.json({ report: TOO_SHORT_REPORT(personaName) })
  }

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' })
  }

  const formattedTranscript = transcript
    .map(msg => {
      const label = msg.role === 'user' ? 'Rep' : personaName
      return `${label}: ${msg.text}`
    })
    .join('\n')

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are a brutally honest B2B sales coach. Analyse this sales roleplay session. Do NOT sugarcoat.

Persona: ${personaName}, ${persona?.role || 'Executive'} at ${persona?.company || 'a company'}. Difficulty: ${persona?.difficulty || 'Medium'}.

Transcript:
${formattedTranscript}

IMPORTANT: Flag EVERYTHING that would lose a real deal — including unprofessional language, insults, rudeness, off-topic remarks, rambling, weak openers, and poor objection handling. If the rep said anything inappropriate (insults, profanity, disrespect), that is an automatic fumble and must appear in moments with a rewrite. Be specific and harsh where warranted.

Return ONLY a raw JSON object, no markdown, no backticks:
{
  "overall": number (0-100, dock heavily for unprofessional behaviour),
  "verdict": string (2-3 brutally honest sentences, name the biggest win and biggest miss — call out bad behaviour directly),
  "scores": [
    {
      "label": string,
      "score": number (0-100),
      "note": string (one specific, direct sentence — call out what happened)
    }
  ] (exactly 5 items in this order: "Discovery Quality", "Challenger Positioning", "Objection Handling", "Talk / Listen Ratio", "Professionalism"),
  "moments": [
    {
      "type": "fumble" | "win",
      "time": string (MM:SS approximate),
      "label": string (short description),
      "said": string (exact quote from transcript),
      "rewrite": string | null (null for wins, professional rewrite for fumbles)
    }
  ] (2-5 moments — include ALL unprofessional moments as fumbles),
  "focus_title": string (the single most important thing to fix),
  "focus_desc": string (2 sentences of direct coaching — tell them exactly what to do differently)
}`
        }
      ]
    })

    const raw = completion.choices[0].message.content.trim()
    let report

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      report = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
    } catch {
      console.error('JSON parse error for report. Raw:', raw.slice(0, 200))
      return res.json({ report: TOO_SHORT_REPORT(personaName) })
    }

    // Validate and normalise
    if (typeof report.overall !== 'number') report.overall = 0
    if (typeof report.verdict !== 'string') report.verdict = 'Unable to generate verdict.'
    if (!Array.isArray(report.scores) || report.scores.length !== 5) {
      report.scores = TOO_SHORT_REPORT(personaName).scores
    }
    if (!Array.isArray(report.moments)) report.moments = []
    if (typeof report.focus_title !== 'string') report.focus_title = 'Review the session'
    if (typeof report.focus_desc !== 'string') report.focus_desc = 'Review your transcript and identify areas for improvement.'

    res.json({ report })
  } catch (err) {
    console.error('Report generation error:', err)
    res.json({ report: TOO_SHORT_REPORT(personaName), warning: 'Report generation failed, showing empty report.' })
  }
})

export default router
