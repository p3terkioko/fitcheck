import { useState, useEffect, useRef } from 'react'

const DEMO_CLAIM = 'Creatine improves strength and muscle mass when combined with resistance training.'

export function ScrollDemo() {
  const trackRef = useRef(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Only apply complex scroll jacking on desktop to avoid mobile jank
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      setProgress(1) // Show full state on mobile
      return
    }

    const onScroll = () => {
      if (!trackRef.current) return
      const { top, height } = trackRef.current.getBoundingClientRect()
      const vh = window.innerHeight
      const p = Math.max(0, Math.min(1, -top / (height - vh)))
      // Throttle state update a bit by rounding
      setProgress(Math.round(p * 100) / 100)
    }
    
    // Initial check
    onScroll()
    
    // Use requestAnimationFrame for smoother performance
    let ticking = false
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          onScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', scrollListener, { passive: true })
    return () => window.removeEventListener('scroll', scrollListener)
  }, [])

  // Phase 1: 5–45% → typing animation
  const typingProgress = Math.max(0, Math.min(1, (progress - 0.05) / 0.40))
  const typedChars = Math.floor(typingProgress * DEMO_CLAIM.length)
  const isTyping = typingProgress > 0 && typingProgress < 1

  // Phase 2: 55–65% → verdict card fades in
  const verdictOpacity = Math.max(0, Math.min(1, (progress - 0.55) / 0.10))

  // Phase 3: 66–75% → confidence bar fills
  const confProgress = Math.max(0, Math.min(1, (progress - 0.66) / 0.09))

  // Phase 4: 76–92% → citation tags slide in
  const citProgress = Math.max(0, Math.min(1, (progress - 0.76) / 0.16))

  return (
    <section ref={trackRef} className="relative md:h-[300vh]">
      <div className="md:sticky md:top-0 flex h-auto md:h-[100svh] items-center justify-center px-6 py-16 md:py-0">
        <div className="w-full max-w-2xl">
          {/* Browser chrome mockup */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            {/* Traffic lights + URL bar */}
            <div className="flex items-center gap-2 border-b border-border bg-elevated px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-[#F04E4E]" />
              <div className="h-3 w-3 rounded-full bg-[#F59E0B]" />
              <div className="h-3 w-3 rounded-full bg-[#00C4A1]" />
              <div className="ml-3 flex-1 rounded border border-border bg-card px-3 py-1 text-xs text-text-secondary">
                fitcheck.works/check
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Input row with typing animation */}
              <div className="mb-4 flex flex-col sm:flex-row gap-3">
                <div
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm transition-all duration-300 ${
                    isTyping ? 'border-accent shadow-[0_0_16px_rgba(0,196,161,0.2)]' : 'border-border'
                  } bg-elevated text-text-primary`}
                  style={{ minHeight: '48px' }}
                >
                  <span>{DEMO_CLAIM.slice(0, typedChars)}</span>
                  {isTyping && (
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-accent align-middle" />
                  )}
                </div>
                <button className="whitespace-nowrap rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-bg">
                  Check it
                </button>
              </div>

              {/* Verdict card with fade-in */}
              <div
                style={{
                  opacity: verdictOpacity,
                  transform: `translateY(${(1 - verdictOpacity) * 12}px)`,
                  transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
                }}
              >
                <div className="rounded-xl border border-[#00C4A1]/30 bg-[#00C4A1]/5 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                      Claim
                    </span>
                    <span className="rounded-full bg-[#00C4A1]/15 px-3 py-0.5 text-xs font-semibold text-[#00C4A1]">
                      Supported
                    </span>
                  </div>
                  <p className="mb-3 text-sm text-text-primary">{DEMO_CLAIM}</p>

                  {/* Confidence bar with fill animation */}
                  <div style={{ opacity: confProgress, transition: 'none' }}>
                    <div className="mb-1 flex justify-between text-xs text-text-secondary">
                      <span>Confidence</span>
                      <span>{Math.round(confProgress * 91)}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-elevated">
                      <div
                        className="h-full rounded-full bg-accent transition-none"
                        style={{ width: `${confProgress * 91}%` }}
                      />
                    </div>
                  </div>

                  {/* Citation tags with staggered slide-in */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { label: 'Lanhers et al., 2017', idx: 0 },
                      { label: 'Rawson & Volek, 2003', idx: 1 },
                      { label: 'Lanhers et al., 2015', idx: 2 },
                    ].map(({ label, idx }) => {
                      const tagProgress = Math.max(0, Math.min(1, (citProgress - idx * 0.34) / 0.34))
                      return (
                        <span
                          key={label}
                          className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary transition-none"
                          style={{
                            opacity: tagProgress,
                            transform: `translateX(${tagProgress === 0 ? 8 : 0}px)`,
                          }}
                        >
                          {label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
