import React, { useState } from 'react'

const PASS_THRESHOLD = 75

const LEVELS = [
  {
    id: 'level-1',
    level: 1,
    title: 'First Impressions',
    difficulty: 'Easy',
    duration: '3 min',
    summary: 'Get past the first 15 seconds. A forgiving prospect who will stay on the line if you sound human.',
    content: [
      {
        heading: 'Your Scenario',
        body: 'You are selling Repora — a lightweight project management tool for marketing teams. You spotted that Brightline Co just hired 4 new marketers and figured their spreadsheet-based workflow is breaking down.'
      },
      {
        heading: 'The Goal',
        body: 'Open with Name + Company + Specific Reason. Your first sentence should give Sarah a reason to care. Never ask "is now a good time?" — it\'s an exit.'
      },
      {
        heading: 'What Works Here',
        body: 'Reference the hiring trigger. "I noticed Brightline just added four marketers — most teams at that size hit a wall with spreadsheets around now." Sarah is polite and will stay on if you sound relevant.'
      },
      {
        heading: 'What Fails Here',
        body: 'Generic openers ("we help marketing teams be more productive"). Asking how her day is going. Rambling past two sentences before pausing.'
      },
      {
        heading: 'Scoring',
        body: 'You need 75+ to unlock Level 2. Nail a specific opener and ask one impact question before pitching.'
      }
    ],
    practicePersona: {
      levelId: 'level-1',
      name: 'Sarah Kim',
      role: 'Marketing Manager',
      company: 'Brightline Co',
      initials: 'SK',
      gender: 'female',
      region: 'western',
      difficulty: 'Easy',
      callType: null,
      prospectContext: 'Brightline Co recently hired 4 new marketers. The team currently tracks campaigns in spreadsheets and Slack threads. Sarah manages a 12-person team.',
      style: 'Polite, patient, genuinely willing to hear a short pitch if the rep sounds relevant and human',
      traits: ['Patient', 'Gives reps a fair shot', 'Rewards specific openers'],
      objections: ['I\'ve got a few minutes — what\'s this about?', 'How did you get my number?', 'We already use spreadsheets and it works fine for now'],
      pressure_points: ['Campaign tracking is getting messy with the new hires', 'Her team wastes time chasing status updates in Slack'],
      briefing: 'LEVEL 1 — You are selling Repora (project management for marketing teams) to Sarah Kim at Brightline Co. She just grew her team and their spreadsheet workflow is cracking. She is forgiving — nail a specific opener tied to the hiring trigger and ask one real question.',
      systemPromptAddendum: `LEVEL 1 RULES (FORGIVING):
- Give the rep the benefit of the doubt for the first 2 exchanges.
- Only hang up if they are explicitly rude or silent for too long.
- If their opener is weak, push back mildly — do NOT hang up.
- You are curious by default. Reward clarity with more engagement.`
    }
  },
  {
    id: 'level-2',
    level: 2,
    title: 'Drawing Out Pain',
    difficulty: 'Easy-Medium',
    duration: '4 min',
    summary: 'A polite prospect who gives short answers by default. You earn depth by asking better questions.',
    content: [
      {
        heading: 'Your Scenario',
        body: 'You are selling PipelineIQ — a sales analytics platform that shows managers exactly where deals stall and why reps miss quota. You have a 30-minute discovery call booked with James Wu.'
      },
      {
        heading: 'The Goal',
        body: 'Surface a real, quantified problem before you pitch. James agreed to take this call but won\'t volunteer pain freely. Ask about impact, not process.'
      },
      {
        heading: 'What Works Here',
        body: '"When a rep misses quota, how long before you know why?" "What does a 6-month ramp cost you in missed revenue?" Let him finish. The real answer comes after the pause.'
      },
      {
        heading: 'What Fails Here',
        body: 'Asking "what CRM do you use?" — that\'s surface. Pitching after one vague answer. Rushing past silence.'
      },
      {
        heading: 'Scoring',
        body: 'Score 75+ to unlock Level 3. Get at least 3 discovery questions in and one quantified pain point before you attempt a next step.'
      }
    ],
    practicePersona: {
      levelId: 'level-2',
      name: 'James Wu',
      role: 'Director of Sales',
      company: 'ScaleUp Inc',
      initials: 'JW',
      gender: 'male',
      region: 'western',
      difficulty: 'Medium',
      callType: 'Discovery call',
      prospectContext: 'ScaleUp Inc has a 25-rep sales team. 40% hit quota last quarter. New reps average 7 months to ramp. James manages the team and reports to the CRO.',
      style: 'Polite but guarded — gives short one-line answers, opens up only when the question earns it',
      traits: ['Guarded', 'Short answers by default', 'Opens up with specific impact questions'],
      objections: ['We\'re pretty happy with our setup', 'I\'m not sure we have a specific problem here', 'We tried a tool like this before — reps didn\'t use it'],
      pressure_points: ['Only 40% of reps hit quota last quarter', 'New reps take 7 months to ramp — costing deals'],
      briefing: 'LEVEL 2 — You are selling PipelineIQ (sales analytics) to James Wu at ScaleUp Inc. His team has a quota attainment problem he hasn\'t fully admitted yet. He gives short answers. Only specific impact questions unlock the real pain. Do not pitch until you have a quantified problem.',
      systemPromptAddendum: `LEVEL 2 RULES (GUARDED):
- Default to short answers (5-10 words). Do NOT volunteer pain.
- Only expand when the rep asks a SPECIFIC impact/quantify question ("what does that cost you?", "how often does that happen?").
- If they pitch before 2 real discovery questions, push back: "Can I ask what specifically made you reach out?"
- Reward good discovery with a real, specific pain point. Punish pitching with a short "we're fine" answer.`
    }
  },
  {
    id: 'level-3',
    level: 3,
    title: 'The Wall',
    difficulty: 'Medium',
    duration: '5 min',
    summary: 'Every answer you give triggers a fresh objection. You need to handle three in a row without caving.',
    content: [
      {
        heading: 'Your Scenario',
        body: 'You are selling Clarix — a reporting automation platform that replaces manual data pulls with live dashboards. You spoke with Rachel two weeks ago. She liked it but the objections start immediately.'
      },
      {
        heading: 'The Goal',
        body: 'Handle budget, incumbent, and bandwidth objections in sequence without discounting or feature-dumping. Each answer you give triggers a new one.'
      },
      {
        heading: 'What Works Here',
        body: '"Is budget the only thing standing in the way, or is there something about the fit we haven\'t fully addressed?" Isolate first, reframe second. Tie every reframe back to the 10+ hours/week her team loses.'
      },
      {
        heading: 'What Fails Here',
        body: 'Dropping the price. Listing Clarix features as a counter to objections. Accepting "next quarter" without a specific date.'
      },
      {
        heading: 'Scoring',
        body: 'Score 75+ to unlock Level 4. Isolate at least two objections and land a reframe that earns a concrete advance.'
      }
    ],
    practicePersona: {
      levelId: 'level-3',
      name: 'Rachel Torres',
      role: 'Head of Operations',
      company: 'GrowthCo',
      initials: 'RT',
      gender: 'female',
      region: 'western',
      difficulty: 'Hard',
      callType: 'Warm follow-up',
      prospectContext: 'Had a brief intro call two weeks ago about Clarix (reporting automation). Rachel liked the product but flagged budget as tight. Her team spends 10+ hours a week on manual data pulls. CFO is pushing for efficiency gains.',
      style: 'Friendly tone, but stacks a fresh objection the moment you answer the last one',
      traits: ['Objection-stacker', 'Polite language masking real resistance', 'Will concede if reframed with specificity'],
      objections: ['We don\'t have budget this quarter', 'We use Tableau and it kind of works', 'My team doesn\'t have bandwidth to onboard anything new', 'Can we revisit next quarter?'],
      pressure_points: ['Manual reporting eating 10+ hours a week', 'Ops team is burning out', 'CFO pushing for headcount efficiency'],
      briefing: 'LEVEL 3 — You are selling Clarix (reporting automation) to Rachel Torres at GrowthCo on a warm follow-up call. She liked the product but will stack budget, incumbent, and bandwidth objections one after another. Diagnose, isolate, reframe. Do not drop price. Do not list features.',
      systemPromptAddendum: `LEVEL 3 RULES (OBJECTION WALL):
- Raise at LEAST 3 distinct objections across the call in sequence (budget, incumbent, bandwidth).
- Every time the rep answers an objection, introduce a NEW one before moving forward.
- If they discount or drop price, immediately become suspicious ("so the original price wasn't real?").
- Only concede if they acknowledge the objection, isolate it, and reframe with a specific impact tied to your pressure points.
- Do NOT hang up unless they become rude. This is an objection drill.`
    }
  },
  {
    id: 'level-4',
    level: 4,
    title: 'The Read',
    difficulty: 'Hard',
    duration: '5 min',
    summary: 'A CEO with razor-sharp radar for scripted delivery. Sound like a vendor and you\'re done in 20 seconds.',
    content: [
      {
        heading: 'Your Scenario',
        body: 'You are selling Rampfast — an AI onboarding tool that cuts new sales rep ramp time in half. Marcus just closed a Series A and is about to double his sales headcount. This is a cold call.'
      },
      {
        heading: 'The Goal',
        body: 'Sound like a peer, not a vendor. Marcus will interrupt the moment you sound scripted and he will call out weak tonality by name.'
      },
      {
        heading: 'What Works Here',
        body: 'Lead with an insight, not a question: "Most teams that double headcount post-Series A lose 6 months of productivity to ramp — you\'re probably about to find out why." Slow. Declarative. No upward inflection.'
      },
      {
        heading: 'What Fails Here',
        body: 'Enthusiasm spikes. "Is now a good time?" Complimenting FastGrowth. Listing Rampfast features. Asking permission to share.'
      },
      {
        heading: 'Scoring',
        body: 'Score 75+ to unlock Level 5. Marcus must give you a real next step — he won\'t unless you sound like you belong in the room.'
      }
    ],
    practicePersona: {
      levelId: 'level-4',
      name: 'Marcus Bell',
      role: 'CEO',
      company: 'FastGrowth Labs',
      initials: 'MB',
      gender: 'male',
      region: 'western',
      difficulty: 'Hard',
      callType: null,
      prospectContext: 'FastGrowth Labs just closed a $12M Series A and is hiring 15 new sales reps over the next 90 days. Marcus has no onboarding system in place. Current ramp time is 7 months.',
      style: 'High-energy, zero patience for rehearsed delivery, respects peers and blunt directness',
      traits: ['Instant radar for scripts', 'Interrupts rambling after 10 words', 'Rewards sharp declarative insights'],
      objections: ['You sound like you\'re reading from a script', 'Why should I care?', 'Get to the point', 'I get 20 calls like this a week'],
      pressure_points: ['Doubling headcount with no onboarding system', 'Revenue plateau despite new hires', 'Board expects results in 90 days'],
      briefing: 'LEVEL 4 — You are selling Rampfast (AI sales onboarding) to Marcus Bell, CEO of FastGrowth Labs. He just raised a Series A and is about to hire 15 reps with no ramp system. Cold call. He will cut you off the moment you sound scripted. Lead with a specific insight about his situation. No enthusiasm. No permission-asking.',
      systemPromptAddendum: `LEVEL 4 RULES (TONALITY READER):
- You INTERRUPT rambling or scripted-sounding reps after 10-12 words.
- Call out specific weaknesses explicitly: "that sounded scripted", "you're asking permission", "you sound nervous".
- Reward ONLY declarative statements and specific insights. Vague benefit claims get "so what?"
- If the rep compliments your company or uses filler words, cut in with "cut the fluff".
- Only agree to a next step if they land at least one sharp insight about YOUR market (not their product).`
    }
  },
  {
    id: 'level-5',
    level: 5,
    title: 'The Close',
    difficulty: 'Expert',
    duration: '5 min',
    summary: 'A master staller who has been pushing decisions for months. Get a specific next step or get a clean no.',
    content: [
      {
        heading: 'Your Scenario',
        body: 'You are selling OpsLayer — a workflow automation platform priced at $72k/year. This is your third call with Diana. She has seen the full demo. She has been pushing the decision for two months.'
      },
      {
        heading: 'The Goal',
        body: 'Get a specific commitment — a date, an intro to the CFO, or a clean no. Diana agrees enthusiastically and commits to nothing. You need to name that pattern out loud.'
      },
      {
        heading: 'What Works Here',
        body: '"Diana, we\'ve moved this twice now — I\'d rather know if there\'s a real blocker than keep the calendar spinning. Is Thursday or Friday better for a 20-minute call with you and your CFO?" Two options. Not one. Not open-ended.'
      },
      {
        heading: 'What Fails Here',
        body: 'Accepting "sounds great, let me check" as progress. Letting her suggest the timing. Sending a follow-up email instead of getting the date live. Chasing after the call.'
      },
      {
        heading: 'Scoring',
        body: 'Score 75+ to complete the track. You must get a specific date + named next person, OR a genuine no. Vague "yes" is a loss.'
      }
    ],
    practicePersona: {
      levelId: 'level-5',
      name: 'Diana Marsh',
      role: 'COO',
      company: 'MidMarket Corp',
      initials: 'DM',
      gender: 'female',
      region: 'western',
      difficulty: 'Hard',
      callType: 'Warm follow-up',
      prospectContext: 'Third call about OpsLayer ($72k/year workflow automation). Full demo done. Diana loves the product. She has pushed the decision twice — "budget review next month" then "let\'s revisit in Q2". Her team loses 15 hours/week to manual ops. CFO sign-off is required.',
      style: 'Warm, enthusiastic, and a master of non-committal language. Says "definitely" and commits to nothing.',
      traits: ['Master staller', 'Agrees in principle, avoids every specific', 'Will say "definitely" but name no date', 'Gives in only when pinned to two concrete options'],
      objections: ['Let me think about it', 'Let\'s circle back next quarter', 'I need to loop in my CFO first', 'The timing still isn\'t quite right', 'Send me a summary and I\'ll review'],
      pressure_points: ['Q2 ops efficiency target set by the board', 'Her team manually processes 15 hours of reports per week', 'CFO is pushing for headcount reduction — automation would help her case'],
      briefing: 'LEVEL 5 — You are selling OpsLayer ($72k/year) to Diana Marsh, COO of MidMarket Corp. Third call. Full demo done. She loves it but has stalled twice. Get a specific date + her CFO on a call, or a clean no. She will agree warmly and commit to nothing unless you propose two concrete options and name the stalling pattern directly.',
      systemPromptAddendum: `LEVEL 5 RULES (MASTER STALLER — BRUTAL):
- Default mode: agree enthusiastically, commit to NOTHING. "Sounds great", "let me think", "circle back".
- Every time the rep proposes a next step, dodge with soft language ("let me check with the team", "I'll get back to you").
- If they accept vague language, keep stalling indefinitely. You WIN by running out the clock.
- Only give a specific commitment if they: (a) name the pattern explicitly, (b) propose two concrete options (date A or date B), AND (c) tie it to your pressure points.
- If they chase or beg, say you're not sure this is the right time and mean it.
- You CAN give a clean honest "no" if they pin you down to specifics you genuinely can't meet — that is also a passing outcome.`
    }
  }
]

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function PracticeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  )
}

function LevelModal({ lesson, bestScore, locked, onClose, onStartPractice }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column',
      animation: 'pageEnter 0.2s ease both'
    }} onClick={onClose}>
      <div style={{
        marginTop: 'auto',
        background: 'var(--surface)',
        borderRadius: '20px 20px 0 0',
        maxHeight: '88dvh',
        overflowY: 'auto',
        padding: '0 0 max(32px, calc(32px + env(safe-area-inset-bottom))) 0'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        <div style={{ padding: '16px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
              color: 'var(--accent)', textTransform: 'uppercase'
            }}>Level {lesson.level} · {lesson.difficulty} · {lesson.duration}</span>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: 'var(--muted)',
              fontSize: 22, cursor: 'pointer', padding: '0 0 0 16px', lineHeight: 1
            }}>×</button>
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 26, fontWeight: 400, lineHeight: 1.2,
            color: 'var(--text)', margin: 0
          }}>{lesson.title}</h2>
          <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.5 }}>
            {lesson.summary}
          </p>

          {bestScore != null && (
            <div style={{
              marginTop: 14,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 12px',
              background: bestScore >= PASS_THRESHOLD ? 'rgba(120,200,140,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${bestScore >= PASS_THRESHOLD ? 'rgba(120,200,140,0.35)' : 'var(--border)'}`,
              borderRadius: 20,
              fontSize: 12, fontWeight: 600,
              color: bestScore >= PASS_THRESHOLD ? 'rgb(170,220,180)' : 'var(--muted)'
            }}>
              Best: {bestScore} {bestScore >= PASS_THRESHOLD ? '· Passed' : `· Need ${PASS_THRESHOLD}`}
            </div>
          )}
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '0 24px' }} />

        <div style={{ padding: '20px 24px 0' }}>
          {lesson.content.map((section, i) => (
            <div key={i} style={{ marginBottom: 24 }}>
              <h3 style={{
                fontSize: 13, fontWeight: 600, letterSpacing: '0.04em',
                color: 'var(--text)', margin: '0 0 8px',
                textTransform: 'uppercase'
              }}>{section.heading}</h3>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 15, lineHeight: 1.6 }}>
                {section.body}
              </p>
            </div>
          ))}
        </div>

        <div style={{ padding: '8px 24px 0' }}>
          <div style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />

          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 14
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent)', textTransform: 'uppercase' }}>
              Opponent
            </p>
            <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>
              {lesson.practicePersona.name} · {lesson.practicePersona.role}, {lesson.practicePersona.company}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.45 }}>
              {lesson.practicePersona.briefing}
            </p>
          </div>

          {locked ? (
            <div style={{
              padding: '14px 16px',
              border: '1px dashed var(--border)',
              borderRadius: 12,
              color: 'var(--muted)',
              fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <LockIcon />
              <span>Score {PASS_THRESHOLD}+ on Level {lesson.level - 1} to unlock this level.</span>
            </div>
          ) : (
            <button
              onClick={() => onStartPractice(lesson.practicePersona)}
              className="btn-mobile-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <PracticeIcon />
              Start Level {lesson.level}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Learn({ onStartPractice, levelScores = {} }) {
  const [openLesson, setOpenLesson] = useState(null)

  function isUnlocked(level) {
    if (level.level === 1) return true
    const prevId = LEVELS[level.level - 2].id
    return (levelScores[prevId] || 0) >= PASS_THRESHOLD
  }

  function handleStartPractice(persona) {
    setOpenLesson(null)
    onStartPractice(persona)
  }

  const completedCount = LEVELS.filter(l => (levelScores[l.id] || 0) >= PASS_THRESHOLD).length

  return (
    <div className="mobile-page" style={{ paddingTop: 0 }}>
      <div style={{ padding: '20px 20px 0' }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>
          Progression · {completedCount}/5 cleared
        </p>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 30, fontWeight: 400, lineHeight: 1.15,
          color: 'var(--text)', margin: '4px 0 6px'
        }}>Learn</h1>
        <p style={{ margin: '0 0 18px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.5 }}>
          Five levels. Each one noticeably harder. Score {PASS_THRESHOLD}+ to unlock the next.
        </p>

        <div style={{
          height: 6, borderRadius: 3, background: 'var(--border)',
          overflow: 'hidden', marginBottom: 4
        }}>
          <div style={{
            height: '100%',
            width: `${(completedCount / LEVELS.length) * 100}%`,
            background: 'var(--accent)',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        {LEVELS.map((lesson, i) => {
          const unlocked = isUnlocked(lesson)
          const best = levelScores[lesson.id]
          const passed = (best || 0) >= PASS_THRESHOLD

          return (
            <button
              key={lesson.id}
              onClick={() => setOpenLesson(lesson)}
              style={{
                width: '100%', textAlign: 'left',
                background: 'var(--surface)',
                border: `1px solid ${passed ? 'rgba(120,200,140,0.35)' : 'var(--border)'}`,
                borderRadius: 14,
                padding: '16px 18px',
                marginBottom: 10,
                cursor: 'pointer',
                opacity: unlocked ? 1 : 0.55,
                animation: `pageEnter 0.2s ease ${i * 0.05}s both`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                      color: passed ? 'rgb(170,220,180)' : 'var(--accent)',
                      textTransform: 'uppercase'
                    }}>Level {lesson.level}</span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)', display: 'inline-block' }} />
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{lesson.difficulty}</span>
                    {passed && (
                      <>
                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)', display: 'inline-block' }} />
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 11, color: 'rgb(170,220,180)', fontWeight: 600
                        }}>
                          <CheckIcon /> {best}
                        </span>
                      </>
                    )}
                    {!passed && best != null && (
                      <>
                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)', display: 'inline-block' }} />
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>Best {best}</span>
                      </>
                    )}
                  </div>
                  <p style={{
                    margin: '0 0 6px',
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 17, fontWeight: 400, lineHeight: 1.3,
                    color: 'var(--text)'
                  }}>{lesson.title}</p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.45 }}>
                    {lesson.summary}
                  </p>
                </div>
                {!unlocked ? (
                  <span style={{ color: 'var(--muted)', flexShrink: 0, marginTop: 2 }}><LockIcon /></span>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {openLesson && (
        <LevelModal
          lesson={openLesson}
          bestScore={levelScores[openLesson.id] ?? null}
          locked={!isUnlocked(openLesson)}
          onClose={() => setOpenLesson(null)}
          onStartPractice={handleStartPractice}
        />
      )}
    </div>
  )
}
