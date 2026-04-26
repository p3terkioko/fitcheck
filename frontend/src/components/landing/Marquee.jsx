import { useState } from 'react'

const MARQUEE_CLAIMS = [
  { claim: 'Creatine builds muscle mass', verdict: 'Supported', color: '#00C4A1' },
  { claim: 'Spot reduction of fat is possible', verdict: 'Unsupported', color: '#F04E4E' },
  { claim: '10,000 steps a day is optimal', verdict: 'Mixed', color: '#F59E0B' },
  { claim: 'High reps tone, low reps bulk', verdict: 'Unsupported', color: '#F04E4E' },
  { claim: 'Protein within 30 min post-workout', verdict: 'Mixed', color: '#F59E0B' },
  { claim: 'Cold showers increase testosterone', verdict: 'Unsupported', color: '#F04E4E' },
  { claim: 'Compound lifts burn more fat', verdict: 'Supported', color: '#00C4A1' },
  { claim: 'Stretching prevents injury', verdict: 'Mixed', color: '#F59E0B' },
]

export function Marquee() {
  const [paused, setPaused] = useState(false)
  const doubled = [...MARQUEE_CLAIMS, ...MARQUEE_CLAIMS]

  return (
    <section className="overflow-hidden py-16 md:py-24">
      <div className="relative">
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 md:w-24 bg-gradient-to-r from-bg to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 md:w-24 bg-gradient-to-l from-bg to-transparent" />

        {/* Scrolling container */}
        <div
          className="marquee-container flex gap-4"
          style={{
            animation: `marquee 30s linear infinite ${paused ? 'paused' : 'running'}`,
            width: 'max-content',
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {doubled.map((item, i) => (
            <div key={i} className="flex-shrink-0 rounded-xl border border-border bg-card px-5 py-4 shadow-sm" style={{ minWidth: '240px' }}>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: item.color }}>
                  {item.verdict}
                </span>
              </div>
              <p className="text-sm font-medium text-text-primary">{item.claim}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
