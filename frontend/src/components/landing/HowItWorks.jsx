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
  const containerRef = useRef(null)
  const itemRefs = useRef([])
  const [opacities, setOpacities] = useState([1, 0.2, 0.2, 0.2]) // Initial opacities
  const [activeVisual, setActiveVisual] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!itemRefs.current.length) return
      
      const newOpacities = []
      let newActiveVisual = 0
      
      const windowHeight = window.innerHeight
      const centerLine = windowHeight / 2

      itemRefs.current.forEach((el, index) => {
        if (!el) return
        
        const rect = el.getBoundingClientRect()
        // Calculate distance of the element's center from the viewport's center
        const elCenter = rect.top + rect.height / 2
        const distFromCenter = Math.abs(centerLine - elCenter)
        
        // Define an activation zone (e.g. within 200px of center)
        const activationZone = 250
        
        if (distFromCenter < activationZone) {
          // Inside the zone, it approaches opacity 1
          const intensity = 1 - (distFromCenter / activationZone)
          newOpacities.push(0.2 + (0.8 * intensity))
          
          // Set the visual state to the one most central
          if (distFromCenter < 100) newActiveVisual = index
        } else {
          // Outside the zone
          newOpacities.push(0.2)
        }
      })
      
      setOpacities(newOpacities)
      setActiveVisual(newActiveVisual)
    }

    let ticking = false
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', scrollListener, { passive: true })
    handleScroll() // initial check
    
    return () => window.removeEventListener('scroll', scrollListener)
  }, [])

  return (
    <section id="how-it-works" ref={containerRef} className="relative py-24 md:py-32">
      <div className="relative mx-auto w-full max-w-6xl px-6">
        <p className="mb-16 text-center text-xs font-semibold uppercase tracking-widest text-accent md:text-left">
          How it works
        </p>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_400px]">
          {/* Left: Scroll-driven text steps */}
          <div className="flex flex-col gap-32 pb-32">
            {HOW_STEPS.map((step, i) => (
              <div
                key={i}
                ref={(el) => (itemRefs.current[i] = el)}
                className="transition-opacity duration-150 ease-out"
                style={{ opacity: window.innerWidth < 768 ? 1 : opacities[i] }} // Always 100% on mobile for readability
              >
                <div className="mb-4 text-sm font-bold tracking-widest text-accent/80">
                  {step.num}
                </div>
                <h3 className="mb-4 font-display font-bold text-4xl leading-[1.1] text-text-primary md:text-5xl">
                  {step.title}
                </h3>
                <p className="max-w-md text-lg text-text-secondary leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          {/* Right: Sticky visual panel */}
          <div className="hidden md:block">
            <div className="sticky top-1/2 -translate-y-1/2 flex aspect-square w-full items-center justify-center rounded-3xl border border-border/50 bg-[#1A1D27]/80 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-700">
              
              {/* Dynamic visual state based on active step */}
              {activeVisual === 0 && (
                <div className="animate-in fade-in zoom-in-95 duration-500 text-center">
                  <div className="text-7xl font-bold text-accent mb-4 blur-[2px] opacity-20 relative">
                    <span className="absolute inset-0 blur-none opacity-100 text-accent">01</span>
                    01
                  </div>
                  <p className="text-sm font-medium text-text-secondary uppercase tracking-widest">Input Claim</p>
                </div>
              )}
              {activeVisual === 1 && (
                <div className="animate-in fade-in zoom-in-95 duration-500 text-center">
                  <div className="text-7xl font-bold text-accent mb-4 blur-[2px] opacity-20 relative">
                    <span className="absolute inset-0 blur-none opacity-100 text-accent">02</span>
                    02
                  </div>
                  <p className="text-sm font-medium text-text-secondary uppercase tracking-widest">Search DB</p>
                </div>
              )}
              {activeVisual === 2 && (
                <div className="animate-in fade-in zoom-in-95 duration-500 text-center">
                  <div className="text-7xl font-bold text-accent mb-4 blur-[2px] opacity-20 relative">
                    <span className="absolute inset-0 blur-none opacity-100 text-accent">03</span>
                    03
                  </div>
                  <p className="text-sm font-medium text-text-secondary uppercase tracking-widest">Verdict</p>
                </div>
              )}
              {activeVisual === 3 && (
                <div className="animate-in fade-in zoom-in-95 duration-500 text-center">
                  <div className="text-7xl font-bold text-accent mb-4 blur-[2px] opacity-20 relative">
                    <span className="absolute inset-0 blur-none opacity-100 text-accent">04</span>
                    04
                  </div>
                  <p className="text-sm font-medium text-text-secondary uppercase tracking-widest">Clarity</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
