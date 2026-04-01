import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import personaRouter from './routes/persona.js'
import reportRouter from './routes/report.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.use('/api', personaRouter)
app.use('/api', reportRouter)

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: Date.now() })
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Bout server running on http://localhost:${PORT}`)
})
