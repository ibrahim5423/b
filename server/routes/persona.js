import { Router } from 'express'
import Groq from 'groq-sdk'

const router = Router()
const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

const FALLBACK_PERSONA = {
  name: 'Sarah Chen',
  role: 'VP of Sales',
  company: 'NovaTech Solutions',
  initials: 'SC',
  gender: 'female',
  region: 'western',
  traits: ['Direct', 'Data-driven', 'Time-poor'],
  objections: [
    "We already have a solution in place and switching costs are high.",
    "I don't see a clear ROI in the first 90 days.",
    "My team doesn't have bandwidth to implement anything new right now."
  ],
  pressure_points: [
    'Missing Q3 quota targets',
    'Board pressure to reduce CAC'
  ],
  difficulty: 'Medium',
  style: 'Cuts to the point quickly, challenges assumptions, and expects data before committing to anything.'
}

router.post('/generate-persona', async (req, res) => {
  const { query } = req.body

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'query is required' })
  }

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' })
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate a realistic B2B sales prospect persona based on: ${query.trim()}

IMPORTANT: The "gender" and "region" fields control the AI voice during roleplay. You MUST set them accurately based on the persona's name and background. For example: an Indian name like "Rajesh" → gender "male", region "indian". A British name like "Charlotte" → gender "female", region "british".

Return ONLY a raw JSON object with no markdown, no backticks, no explanation. Fields:
{
  "name": string (a culturally appropriate full name),
  "role": string,
  "company": string,
  "initials": string (2 chars, uppercase),
  "gender": "male" | "female" (REQUIRED — must match the name),
  "region": "western" | "indian" | "british" | "australian" | "middle_eastern" | "east_asian" | "african" | "latin_american" (REQUIRED — must match the persona's cultural background),
  "traits": string[] (exactly 3),
  "objections": string[] (exactly 3),
  "pressure_points": string[] (exactly 2),
  "difficulty": "Easy" | "Medium" | "Hard",
  "style": string (one sentence describing their communication style)
}`
        }
      ]
    })

    const raw = completion.choices[0].message.content.trim()
    let persona

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      persona = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
    } catch {
      console.error('JSON parse error for persona, using fallback. Raw:', raw.slice(0, 200))
      persona = FALLBACK_PERSONA
    }

    // Validate required fields, fill with fallback values if missing
    if (!persona.name) persona.name = FALLBACK_PERSONA.name
    if (!persona.role) persona.role = FALLBACK_PERSONA.role
    if (!persona.company) persona.company = FALLBACK_PERSONA.company
    if (!persona.initials || persona.initials.length < 2) {
      persona.initials = (persona.name || 'XX').slice(0, 2).toUpperCase()
    }
    if (!Array.isArray(persona.traits) || persona.traits.length !== 3) {
      persona.traits = FALLBACK_PERSONA.traits
    }
    if (!Array.isArray(persona.objections) || persona.objections.length !== 3) {
      persona.objections = FALLBACK_PERSONA.objections
    }
    if (!Array.isArray(persona.pressure_points) || persona.pressure_points.length !== 2) {
      persona.pressure_points = FALLBACK_PERSONA.pressure_points
    }
    if (!['Easy', 'Medium', 'Hard'].includes(persona.difficulty)) {
      persona.difficulty = 'Medium'
    }
    if (!persona.style) persona.style = FALLBACK_PERSONA.style
    if (!['male', 'female'].includes(persona.gender)) persona.gender = 'male'
    const validRegions = ['western', 'indian', 'british', 'australian', 'middle_eastern', 'east_asian', 'african', 'latin_american']
    if (!validRegions.includes(persona.region)) persona.region = 'western'

    res.json({ persona })
  } catch (err) {
    console.error('Persona generation error:', err)
    res.json({ persona: FALLBACK_PERSONA, warning: 'Used fallback persona due to generation error.' })
  }
})

export default router
