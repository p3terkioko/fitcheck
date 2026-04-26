import { useState, useEffect, useRef } from 'react'

const HOW_STEPS = [
  {
    num: '01',
    title: 'Paste the claim',
    body: 'Type any exercise or nutrition claim, or drop in a TikTok, Instagram Reel, or YouTube Short URL.',
  },
  {
    num: '02',
    title: 'We scan the science',
    body: 'Our semantic AI searches 921+ peer-reviewed studies in milliseconds to find the most relevant evidence.',
  },
  {
    num: '03',
    title: 'Get a clear verdict',
    body: 'A structured result with a confidence score, cited papers, and plain-English reasoning — in under 30 seconds.',
  },
  {
    num: '04',
    title: 'Four honest categories',
    body: 'Backed by Research · Partly True · Not Supported · Unclear. No spin, just what the evidence shows.',
  },
]

export function HowItWorks() {
  const trackRef = useRef(null)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    // Disable sticky scroll math on mobile
    const isMobile = window.innerWidth < 768
    if (isMobile) return

    const onScroll = () => {
      if (!trackRef.current) return
      const { top, height } = trackRef.current.getBoundingClientRect()
      const vh = window.innerHeight
      const p = Math.max(0, Math.min(1, -top / (height - vh)))
      setActiveStep(Math.min(HOW_STEPS.length - 1, Math.floor(p * HOW_STEPS.length)))
    }
    
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

  return (
    <section id="how-it-works" ref={trackRef} className="relative md:h-[400vh]">
      <div className="md:sticky md:top-0 flex h-auto md:h-[100svh] items-center px-6 py-20 md:py-0">
        <div className="relative mx-auto w-full max-w-6xl">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            {/* Left: text steps */}
            <div className="flex flex-col justify-center">
              <p className="mb-8 text-xs font-semibold uppercase tracking-widest text-accent">How it works</p>
              
              {/* On mobile, show all steps at once. On desktop, fade them. */}
              {HOW_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`mb-12 md:mb-8 transition-all duration-500 md:${i === activeStep ? 'opacity-100' : 'opacity-25'}`}
                >
                  <div className="mb-2 text-xs font-semibold text-accent">{step.num}</div>
                  <h3 className="mb-3 font-display font-bold text-[clamp(24px,3vw,42px)] text-text-primary">
                    {step.title}
                  </h3>
                  <p className="max-w-md text-base text-text-secondary">{step.body}</p>
                </div>
              ))}
            </div>

            {/* Right: visual panel (hidden on mobile) */}
            <div className="hidden md:flex items-center justify-center">
              <div className="flex h-72 w-72 items-center justify-center rounded-2xl border border-border bg-card transition-all duration-500 shadow-xl">
                {activeStep === 0 && <div className="text-center"><div className="text-5xl font-bold text-accent mb-2">01</div><p className="text-xs text-text-secondary uppercase tracking-wider">Claim Input</p></div>}
                {activeStep === 1 && <div className="text-center"><div className="text-5xl font-bold text-accent mb-2">02</div><p className="text-xs text-text-secondary uppercase tracking-wider">Research Scan</p></div>}
                {activeStep === 2 && <div className="text-center"><div className="text-5xl font-bold text-accent mb-2">03</div><p className="text-xs text-text-secondary uppercase tracking-wider">Get Verdict</p></div>}
                {activeStep === 3 && <div className="text-center"><div className="text-5xl font-bold text-accent mb-2">04</div><p className="text-xs text-text-secondary uppercase tracking-wider">Four Categories</p></div>}
              </div>
            </div>
          </div>

          {/* Step indicators (hidden on mobile) */}
          <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-2 md:flex">
            {HOW_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  i === activeStep ? 'bg-accent scale-125' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
