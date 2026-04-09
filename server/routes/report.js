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
          content: `You are a brutally honest elite B2B sales coach. Analyse this sales roleplay session. Do NOT sugarcoat. Be SPECIFIC — reference exact quotes, name the persona, and tie every observation to what actually happened.

PERSONA PROFILE:
- Name: ${personaName}, ${persona?.role || 'Executive'} at ${persona?.company || 'a company'}
- Difficulty: ${persona?.difficulty || 'Medium'}
- Traits: ${persona?.traits?.join(', ') || 'Unknown'}
- Communication style: ${persona?.style || 'Unknown'}
- Objections they were primed to raise: ${persona?.objections?.join(' | ') || 'None specified'}
- Pressure points (what they actually care about): ${persona?.pressure_points?.join(' | ') || 'None specified'}
${persona?.briefing ? `- Rep briefing (what the rep was told to watch for): ${persona.briefing}` : ''}

TRANSCRIPT:
${formattedTranscript}

ANALYSIS RULES:
1. NEVER use generic feedback like "could improve discovery" or "need better objection handling". Instead reference EXACT quotes: "When ${personaName} said [X], you responded with [Y] — that was a miss because [Z]."
2. Score each dimension based on what ACTUALLY happened in the transcript. If the rep never asked a discovery question, say "You asked zero discovery questions in the entire call."
3. Check if the rep addressed ${personaName}'s specific pressure points (${persona?.pressure_points?.join(', ') || 'none listed'}). If they missed them, call it out by name.
4. Check if the rep handled ${personaName}'s objections. For each objection raised, assess whether the rep's response was effective or weak.
${persona?.briefing ? `5. The rep was briefed: "${persona.briefing}" — Did they follow this advice? If not, flag it as a missed tactical opportunity.` : ''}
6. Flag unprofessional language, insults, rudeness, off-topic remarks as automatic fumbles.
7. Every "note" in scores must contain a direct quote or specific reference — NO vague statements.

Return ONLY a raw JSON object, no markdown, no backticks:
{
  "overall": number (0-100, dock heavily for missed pressure points and unprofessional behaviour),
  "verdict": string (2-3 brutally honest sentences. Name the persona. Reference a specific quote for the biggest win and biggest miss. Example: "When ${personaName} pushed back on budget, you folded immediately instead of reframing value."),
  "scores": [
    {
      "label": string,
      "score": number (0-100),
      "note": string (one sentence with a SPECIFIC quote or reference — e.g. 'You asked "${personaName} what keeps you up at night" which opened the door to their pipeline concerns.' NOT 'Good discovery questions.')
    }
  ] (exactly 5 items: "Discovery Quality", "Challenger Positioning", "Objection Handling", "Talk / Listen Ratio", "Professionalism"),
  "moments": [
    {
      "type": "fumble" | "win",
      "time": string (MM:SS approximate),
      "label": string (short, specific — e.g. "Ignored budget objection" not "Weak handling"),
      "said": string (exact quote from transcript),
      "rewrite": string | null (null for wins. For fumbles: a specific, professional alternative that addresses ${personaName}'s actual concern)
    }
  ] (3-6 moments — every objection the persona raised should be assessed as a win or fumble),
  "focus_title": string (one specific skill to fix, e.g. "Ask about their ${persona?.pressure_points?.[0] || 'core pain'} before pitching"),
  "focus_desc": string (2 sentences: what specifically went wrong and exactly what to say differently next time. Include a sample phrase the rep should practice.)
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
