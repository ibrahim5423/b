# Bout

Bout is an AI sales roleplay trainer that generates realistic B2B sales prospects and lets you practice live voice calls against them. After each session, Claude analyses your conversation and gives you a scored coaching report.

## Prerequisites

- Node.js 18+

## Installation

```bash
# 1. Install server dependencies (from repo root)
npm install

# 2. Install client dependencies
cd client && npm install && cd ..
```

## Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and add your server key:
```
ANTHROPIC_API_KEY=your_key_here
PORT=3001
```

Edit `client/.env` and add your VAPI key:
```
VITE_VAPI_PUBLIC_KEY=your_key_here
```

## Running

```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173) concurrently. Open http://localhost:5173.

## Where to get keys

- **ANTHROPIC_API_KEY** — https://console.anthropic.com → API Keys
- **VITE_VAPI_PUBLIC_KEY** — https://vapi.ai → Dashboard → API Keys (use the Public Key)

## How to use

1. **Paste a persona** — Enter a LinkedIn URL or describe your prospect (e.g. "VP of Sales at a Series B fintech"). Claude generates a realistic persona with objections and traits.
2. **Start the call** — Click "Start Voice Session". VAPI connects you live to the AI prospect via voice. Practice your pitch, handle objections, and try to book a next step.
3. **Get your report** — End the session to receive a scored coaching report with dimension scores, key moments (wins and fumbles), and a single focus drill for next time.
