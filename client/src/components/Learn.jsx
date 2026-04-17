import React, { useState } from 'react'

const LESSONS = [
  {
    id: 'cold-open',
    category: 'Cold Calling',
    title: 'The 10-Second Cold Open',
    duration: '3 min',
    summary: 'You have one sentence to earn the next thirty seconds. Learn the pattern that gets prospects to stay on the line.',
    content: [
      {
        heading: 'The Formula',
        body: 'Name + Company + Specific Reason. That\'s it. Never ask "Is now a good time?" — you\'re handing them an exit. Lead with the reason you called before they can hang up.'
      },
      {
        heading: 'Strong Example',
        body: '"Hey Sarah, it\'s Marcus from Notion — I saw your team just doubled in size and wanted to share how other ops leads handled the documentation chaos that usually follows." — specific, relevant, no permission-asking.'
      },
      {
        heading: 'Weak Example',
        body: '"Hi, my name is Marcus and I\'m calling from Notion. We help companies with productivity. Is now a good time?" — generic, self-centered, exits offered.'
      },
      {
        heading: 'Drill',
        body: 'Write your own 10-second open for your product. It should mention: who you called, a specific trigger event, and a benefit — in that order.'
      }
    ],
    practicePersona: {
      name: 'Alex Chen',
      role: 'VP of Engineering',
      company: 'DataStream',
      gender: 'male',
      difficulty: 'Hard',
      callType: null,
      prospectContext: null,
      style: 'Blunt, impatient, screens every call ruthlessly',
      traits: ['Time-pressed', 'Skeptical of vendors', 'Hangs up fast if no value in 10 seconds', 'Hates generic openers'],
      objections: ['Who gave you this number?', "I'm not interested", "Send me an email", "I don't have time for this"],
      pressure_points: ['Engineering team is slowing down deploys', 'Too much technical debt blocking new features'],
      briefing: 'COLD CALL drill. You have ~10 seconds before Alex hangs up. Lead with a specific trigger event and a clear benefit — before he shuts you down. No "is now a good time?"',
    }
  },
  {
    id: 'objection-budget',
    category: 'Objections',
    title: 'Handling "We Don\'t Have Budget"',
    duration: '4 min',
    summary: 'Budget objections are rarely about money. Learn how to diagnose what\'s really happening and reframe the conversation.',
    content: [
      {
        heading: 'What It Usually Means',
        body: '"No budget" is almost always one of three things: (1) they haven\'t prioritized this, (2) they don\'t see enough value yet, or (3) the decision isn\'t theirs. Your job is to find out which.'
      },
      {
        heading: 'The Clarifying Question',
        body: 'Don\'t cave. Ask: "Is budget the only thing standing in the way, or is there something about the fit we haven\'t addressed?" — this separates a real constraint from a brush-off.'
      },
      {
        heading: 'The Priority Reframe',
        body: 'If they confirm budget is tight: "Totally fair — when you do have budget, is this the kind of problem that would be at the top of the list?" Gets them to articulate the value themselves.'
      },
      {
        heading: 'Never Do This',
        body: 'Don\'t immediately discount or offer a stripped-down version. It signals that your original price wasn\'t real, and it starts a negotiation you\'re already losing.'
      }
    ],
    practicePersona: {
      name: 'Rachel Torres',
      role: 'Head of Operations',
      company: 'GrowthCo',
      gender: 'female',
      difficulty: 'Medium',
      callType: 'Warm follow-up',
      prospectContext: 'Had an intro call two weeks ago where Rachel expressed interest but flagged that budget is tight this quarter.',
      style: 'Friendly but cautious, deflects with budget concerns whenever the conversation gets serious',
      traits: ['Budget-conscious', 'Risk-averse', 'Needs CFO approval for new tools', 'Genuinely likes the product but stalls on cost'],
      objections: ["We don't have budget right now", "Can we revisit next quarter?", "I need to check with finance", "Can you do a lower tier or pilot?"],
      pressure_points: ['Manual reporting eating 10+ hours a week', 'Team is burning out on spreadsheets', 'CFO is pushing for efficiency gains'],
      briefing: 'BUDGET OBJECTION drill. Rachel remembers your last call and likes what she heard. She will lean hard on budget objections. Diagnose whether it\'s a real constraint or a priority issue — don\'t discount immediately.',
    }
  },
  {
    id: 'discovery',
    category: 'Discovery',
    title: 'Questions That Actually Uncover Pain',
    duration: '5 min',
    summary: 'Most reps ask surface questions. The ones who close ask questions that make the prospect feel understood before a product is ever mentioned.',
    content: [
      {
        heading: 'Surface vs. Deep',
        body: 'Surface: "What tools do you use today?" Deep: "What does your team have to do manually that drives them crazy?" Surface reveals process. Deep reveals pain.'
      },
      {
        heading: 'The Impact Question',
        body: 'After any problem surfaces, always follow with: "What does that cost you — in time, in money, in headcount?" Quantified pain is 10x more powerful than described pain.'
      },
      {
        heading: 'The Priority Check',
        body: '"Where does solving this rank against everything else on your plate right now?" — if it\'s not top 3, you don\'t have a real deal. Better to know now.'
      },
      {
        heading: 'Silence is a Tool',
        body: 'After a good question, shut up. Reps who rush to fill silence after "what\'s the main challenge?" get shallow answers. The good stuff comes after a 3-second pause.'
      }
    ],
    practicePersona: {
      name: 'James Wu',
      role: 'Director of Sales',
      company: 'ScaleUp Inc',
      gender: 'male',
      difficulty: 'Medium',
      callType: 'Discovery call',
      prospectContext: null,
      style: 'Polite but guarded — gives short answers by default and won\'t volunteer pain freely',
      traits: ['Guarded', 'Gives short answers unless asked the right question', 'Opens up when asked specific impact questions', 'Skeptical of pitches but open to honest conversation'],
      objections: ["We're pretty happy with our current setup", "I'm not sure we have a specific problem here", "We've looked at tools like this before and it didn't stick"],
      pressure_points: ['Sales team hitting quota inconsistently', 'Pipeline visibility is poor', 'New reps take 6+ months to ramp up'],
      briefing: 'DISCOVERY drill. James agreed to this call but won\'t volunteer pain. Ask specific, impact-focused questions to draw out what\'s really broken. Don\'t pitch until you\'ve found a real problem.',
    }
  },
  {
    id: 'closing',
    category: 'Closing',
    title: 'Asking for the Next Step (Not the Deal)',
    duration: '3 min',
    summary: 'Closing isn\'t a moment — it\'s a series of small commitments. Learn how to advance deals without pressure.',
    content: [
      {
        heading: 'Always Close on Next Steps',
        body: 'At the end of every call, you need a specific next action with a date. Not "I\'ll follow up." "Let\'s put 30 minutes on Thursday to walk your VP through this — does 2pm or 4pm work better?"'
      },
      {
        heading: 'The Assumptive Advance',
        body: 'Frame next steps as the natural thing to do, not a request: "The logical next step would be getting your CTO on a call to review the security docs — who\'s the best way to loop them in?"'
      },
      {
        heading: 'When They Stall',
        body: '"What would need to be true for this to be a priority in Q1?" — this reveals the real blockers and gives you something concrete to address rather than chasing a ghost deal.'
      },
      {
        heading: 'The Mutual Action Plan',
        body: 'For complex deals: share a short doc with dates, owners, and steps on both sides. Deals with a shared plan close 2x faster. It turns your deal into their project.'
      }
    ],
    practicePersona: {
      name: 'Diana Marsh',
      role: 'COO',
      company: 'MidMarket Corp',
      gender: 'female',
      difficulty: 'Hard',
      callType: 'Warm follow-up',
      prospectContext: 'You have had two previous calls and a full product demo. Diana has seen everything, likes the product, but has been pushing the decision to next quarter for two months.',
      style: 'Warm and polite but a master of non-committal responses — agrees in principle, avoids specifics',
      traits: ['Likes the product but expert at stalling', 'Risk-averse decision-maker', 'Responds to urgency and concrete next steps', 'Will say "definitely" but avoid any date or commitment'],
      objections: ['Let me think about it', "Can we push to next quarter?", 'I need to get my team aligned first', "The timing isn't quite right"],
      pressure_points: ['Ops efficiency target for Q2', 'Board is pushing for headcount reduction', 'Current process costs her team 15 hours a week'],
      briefing: 'CLOSING drill. This is your third call with Diana. She has seen the demo and likes it. Do not let her push to next quarter again — get a specific date commitment for a next step or a clear no.',
    }
  },
  {
    id: 'tonality',
    category: 'Delivery',
    title: 'Tonality: The Rep\'s Hidden Weapon',
    duration: '4 min',
    summary: 'Prospects make trust decisions in the first 7 seconds — before you\'ve said anything substantive. Your tone is doing more work than your words.',
    content: [
      {
        heading: 'The Three Fatal Tones',
        body: '(1) Overly enthusiastic — sounds scripted and desperate. (2) Monotone — sounds like you\'ve said this 200 times. (3) Uptalk — rising inflection makes statements sound like questions, undermining confidence.'
      },
      {
        heading: 'The Peer Frame',
        body: 'Talk to prospects as a peer, not a vendor. Peers don\'t beg for time or apologize for calling. They assume their call has value. Slow down, lower your pitch slightly, and state things rather than asking permission.'
      },
      {
        heading: 'Pattern Interrupt',
        body: 'If someone sounds defensive or rushed, break the pattern: pause, slow down, then say something unexpected — "I\'ll be honest, I almost didn\'t call you today." Curiosity buys 10 more seconds.'
      },
      {
        heading: 'The Recording Test',
        body: 'Record one of your practice calls. Listen back with the volume low so you can\'t hear the words — only the rhythm and tone. Does it sound confident? Curious? Or rushed and apologetic?'
      }
    ],
    practicePersona: {
      name: 'Marcus Bell',
      role: 'CEO',
      company: 'FastGrowth Labs',
      gender: 'male',
      difficulty: 'Hard',
      callType: null,
      prospectContext: null,
      style: 'High-energy, instant radar for scripted pitches, respects confidence and peers — not vendors',
      traits: ['Instantly detects scripted or rehearsed delivery', 'Hangs up on over-enthusiastic reps', 'Respects directness and confidence', 'Tests reps with sharp one-liners'],
      objections: ['You sound like you\'re reading from a script', 'I get 20 calls like this a week', 'Why should I care?', 'Get to the point — fast'],
      pressure_points: ['Scaling sales team too fast without systems', 'Revenue growth plateauing after Series A', 'Losing deals to better-funded competitors'],
      briefing: 'TONALITY drill. Marcus will hang up in seconds if your delivery sounds scripted, desperate, or over-eager. Sound like a confident peer — not a vendor. Slow down, lower your energy slightly, and make statements rather than asking permission.',
    }
  }
]

const CATEGORIES = ['All', ...Array.from(new Set(LESSONS.map(l => l.category)))]

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

function LessonModal({ lesson, onClose, onStartPractice }) {
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
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '16px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
              color: 'var(--accent)', textTransform: 'uppercase'
            }}>{lesson.category} · {lesson.duration}</span>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: 'var(--muted)',
              fontSize: 22, cursor: 'pointer', padding: '0 0 0 16px', lineHeight: 1
            }}>×</button>
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 24, fontWeight: 400, lineHeight: 1.2,
            color: 'var(--text)', margin: 0
          }}>{lesson.title}</h2>
          <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.5 }}>
            {lesson.summary}
          </p>
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '0 24px' }} />

        {/* Content */}
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

        {/* Practice CTA */}
        <div style={{ padding: '8px 24px 0' }}>
          <div style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />

          {/* Scenario preview */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 14
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent)', textTransform: 'uppercase' }}>
              Practice Scenario
            </p>
            <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>
              {lesson.practicePersona.name} · {lesson.practicePersona.role}, {lesson.practicePersona.company}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.45 }}>
              {lesson.practicePersona.briefing}
            </p>
          </div>

          <button
            onClick={() => onStartPractice(lesson.practicePersona)}
            className="btn-mobile-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <PracticeIcon />
            Practice This Skill
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Learn({ onStartPractice }) {
  const [activeCategory, setActiveCategory] = useState('All')
  const [openLesson, setOpenLesson] = useState(null)

  const filtered = activeCategory === 'All'
    ? LESSONS
    : LESSONS.filter(l => l.category === activeCategory)

  function handleStartPractice(persona) {
    setOpenLesson(null)
    onStartPractice(persona)
  }

  return (
    <div className="mobile-page" style={{ paddingTop: 0 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>
          Playbook
        </p>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 30, fontWeight: 400, lineHeight: 1.15,
          color: 'var(--text)', margin: '4px 0 16px'
        }}>Learn</h1>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                flexShrink: 0,
                padding: '7px 14px',
                borderRadius: 20,
                border: activeCategory === cat ? 'none' : '1px solid var(--border)',
                background: activeCategory === cat ? 'var(--text)' : 'transparent',
                color: activeCategory === cat ? 'var(--bg)' : 'var(--muted)',
                fontSize: 13, fontWeight: activeCategory === cat ? 600 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* Lessons list */}
      <div style={{ padding: '16px 20px 0' }}>
        {filtered.map((lesson, i) => (
          <button
            key={lesson.id}
            onClick={() => setOpenLesson(lesson)}
            style={{
              width: '100%', textAlign: 'left',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '16px 18px',
              marginBottom: 10,
              cursor: 'pointer',
              animation: `pageEnter 0.2s ease ${i * 0.05}s both`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                    color: 'var(--accent)', textTransform: 'uppercase'
                  }}>{lesson.category}</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{lesson.duration}</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>+ Practice</span>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </button>
        ))}
      </div>

      {openLesson && (
        <LessonModal
          lesson={openLesson}
          onClose={() => setOpenLesson(null)}
          onStartPractice={handleStartPractice}
        />
      )}
    </div>
  )
}
