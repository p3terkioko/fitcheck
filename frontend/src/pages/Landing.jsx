import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

/* ─────────────────────────────────────────────────────────────────────────────
   BACKGROUND: Grain overlay + animated radial mesh blobs
   ───────────────────────────────────────────────────────────────────────────── */

function Background() {
  return (
    <>
      {/* Grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />
      {/* Blob 1 - Top left teal */}
      <div
        className="pointer-events-none fixed -top-[20%] -left-[10%] z-0 h-[700px] w-[700px] rounded-full opacity-[0.12]"
        style={{
          background: 'radial-gradient(circle, #00C4A1 0%, transparent 70%)',
          animation: 'blob1 18s ease-in-out infinite',
        }}
      />
      {/* Blob 2 - Right middle dark */}
      <div
        className="pointer-events-none fixed top-[40%] -right-[15%] z-0 h-[600px] w-[600px] rounded-full opacity-[0.08]"
        style={{
          background: 'radial-gradient(circle, #2D3350 0%, transparent 70%)',
          animation: 'blob2 22s ease-in-out infinite',
        }}
      />
      {/* Blob 3 - Bottom left teal */}
      <div
        className="pointer-events-none fixed -bottom-[10%] left-[30%] z-0 h-[500px] w-[500px] rounded-full opacity-[0.1]"
        style={{
          background: 'radial-gradient(circle, #00C4A1 0%, transparent 70%)',
          animation: 'blob3 16s ease-in-out infinite',
        }}
      />
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   NAVIGATION: Fixed, scrollable with frosted glass effect
   ───────────────────────────────────────────────────────────────────────────── */

function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-border bg-[#0F1117]/80 backdrop-blur-xl' : ''}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded border border-accent">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8l3.5 3.5L13 4.5"
                stroke="#00C4A1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="font-heading text-lg font-bold text-text-primary">FitCheck</span>
        </div>

        {/* Right: Log in + Try free */}
        <div className="flex items-center gap-3">
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary">
            Log in
          </Link>
          <a
            href="#signup"
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
          >
            Try FitCheck free
          </a>
        </div>
      </div>
    </nav>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   HERO: Full viewport height with staggered animations
   ───────────────────────────────────────────────────────────────────────────── */

function Hero() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6 pt-20">
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Live pill */}
        <div
          className={`mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00C4A1] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00C4A1]" />
          </span>
          <span className="text-xs text-text-secondary">Now live · fitcheck.works</span>
        </div>

        {/* Headline with staggered lines */}
        <h1
          className="mb-8 text-text-primary"
          style={{
            fontFamily: '"Wyte Inktrap", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(44px, 9vw, 140px)',
            lineHeight: 1.0,
          }}
        >
          <span
            className={`block transition-all duration-700 delay-100 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Stop trusting
          </span>
          <span
            className={`block transition-all duration-700 delay-200 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            fitness advice
          </span>
          <span
            className={`block transition-all duration-700 delay-300 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <em style={{ color: '#00C4A1', fontStyle: 'italic' }}>blindly.</em>
          </span>
        </h1>

        {/* Subheading */}
        <p
          className={`mx-auto mb-10 max-w-xl text-lg text-text-secondary transition-all duration-700 delay-[400ms] ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          FitCheck cross-references fitness and nutrition claims against peer-reviewed research and returns a verdict in under 30 seconds.
        </p>

        {/* CTA buttons */}
        <div
          className={`mb-10 flex flex-wrap items-center justify-center gap-4 transition-all duration-700 delay-500 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
          >
            Get started free <ArrowRight size={15} />
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-semibold text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            See how it works
          </a>
        </div>

        {/* Trust line */}
        <div
          className={`flex items-center justify-center transition-all duration-700 delay-[600ms] ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="text-sm text-text-secondary">Trusted by people who care about the science.</span>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   SCROLL DEMO: 300vh scroll track with sticky browser mockup
   ───────────────────────────────────────────────────────────────────────────── */

const DEMO_CLAIM = 'Creatine improves strength and muscle mass when combined with resistance training.'

function ScrollDemo() {
  const trackRef = useRef(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      if (!trackRef.current) return
      const { top, height } = trackRef.current.getBoundingClientRect()
      const vh = window.innerHeight
      const p = Math.max(0, Math.min(1, -top / (height - vh)))
      setProgress(p)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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
    <section ref={trackRef} style={{ height: '300vh' }} className="relative">
      <div className="sticky top-0 flex h-[100svh] items-center justify-center px-6">
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
              <div className="mb-4 flex gap-3">
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
                  transition: 'none',
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

/* ─────────────────────────────────────────────────────────────────────────────
   HOW IT WORKS: 400vh scroll track with sticky two-column layout
   ───────────────────────────────────────────────────────────────────────────── */

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

function HowItWorks() {
  const trackRef = useRef(null)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      if (!trackRef.current) return
      const { top, height } = trackRef.current.getBoundingClientRect()
      const vh = window.innerHeight
      const p = Math.max(0, Math.min(1, -top / (height - vh)))
      setActiveStep(Math.min(HOW_STEPS.length - 1, Math.floor(p * HOW_STEPS.length)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section id="how-it-works" ref={trackRef} style={{ height: '400vh' }} className="relative">
      <div className="sticky top-0 flex h-[100svh] items-center px-6">
        <div className="relative mx-auto w-full max-w-6xl">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            {/* Left: text steps */}
            <div className="flex flex-col justify-center">
              <p className="mb-8 text-xs font-semibold uppercase tracking-widest text-accent">How it works</p>
              {HOW_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`mb-8 transition-all duration-500 ${i === activeStep ? 'opacity-100' : 'opacity-25'}`}
                >
                  <div className="mb-2 text-xs font-semibold text-accent">{step.num}</div>
                  <h3
                    className="mb-3 text-text-primary"
                    style={{
                      fontFamily: '"Wyte Inktrap", system-ui, sans-serif',
                      fontWeight: 700,
                      fontSize: 'clamp(24px, 3vw, 42px)',
                    }}
                  >
                    {step.title}
                  </h3>
                  <p className="max-w-md text-base text-text-secondary">{step.body}</p>
                </div>
              ))}
            </div>

            {/* Right: visual panel (hidden on mobile) */}
            <div className="hidden md:flex items-center justify-center">
              <div className="flex h-72 w-72 items-center justify-center rounded-2xl border border-border bg-card text-7xl transition-all duration-500">
                {['📋', '🔬', '✅', '🎯'][activeStep]}
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

/* ─────────────────────────────────────────────────────────────────────────────
   MARQUEE: Infinite horizontal scroll of claim cards
   ───────────────────────────────────────────────────────────────────────────── */

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

function Marquee() {
  const [paused, setPaused] = useState(false)
  const doubled = [...MARQUEE_CLAIMS, ...MARQUEE_CLAIMS]

  return (
    <section className="overflow-hidden py-16">
      <div className="relative">
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-bg to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-bg to-transparent" />

        {/* Scrolling container */}
        <div
          className="flex gap-4"
          style={{
            animation: `marquee 30s linear infinite ${paused ? 'paused' : 'running'}`,
            width: 'max-content',
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {doubled.map((item, i) => (
            <div key={i} className="flex-shrink-0 rounded-xl border border-border bg-card px-5 py-3" style={{ minWidth: '240px' }}>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-semibold" style={{ color: item.color }}>
                  {item.verdict}
                </span>
              </div>
              <p className="text-sm text-text-primary">{item.claim}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   SIGNUP: Email form with success state
   ───────────────────────────────────────────────────────────────────────────── */

function Signup() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    setDone(true)
  }

  return (
    <section id="signup" className="px-6 py-32">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-accent">Get started</p>

        <h2
          className="mb-6 text-text-primary"
          style={{
            fontFamily: '"Wyte Inktrap", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(32px, 5vw, 72px)',
            lineHeight: 1.1,
          }}
        >
          Know what's <em style={{ color: '#00C4A1', fontStyle: 'italic' }}>actually</em>
          <br />
          worth your time.
        </h2>

        <p className="mx-auto mb-10 max-w-md text-base text-text-secondary">
          Start fact-checking fitness claims for free. No credit card required.
        </p>

        {done ? (
          <div className="mx-auto max-w-md rounded-2xl border border-[#00C4A1]/30 bg-[#00C4A1]/10 p-8">
            <div className="mb-3 text-4xl">✓</div>
            <p className="text-lg font-semibold text-[#00C4A1]">You're in!</p>
            <p className="mt-2 text-sm text-text-secondary">Check your inbox to confirm your account.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 rounded-full border border-border bg-card px-5 py-3 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-70"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg border-t-transparent" />
              ) : (
                'Create free account'
              )}
            </button>
          </form>
        )}

        {error && <p className="mt-3 text-xs text-[#F04E4E]">{error}</p>}

        {!done && (
          <p className="mt-4 text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-text-primary underline">
              Log in →
            </Link>
          </p>
        )}

        {/* Stats row */}
        <div className="mt-16 flex flex-col items-center gap-8 sm:flex-row sm:justify-center sm:divide-x sm:divide-border">
          {[
            { stat: '900+', label: 'Peer-reviewed papers' },
            { stat: '4', label: 'Verdict categories' },
            { stat: 'Seconds', label: 'Fast results' },
          ].map(({ stat, label }, i) => (
            <div key={i} className="px-8 text-center">
              <div className="text-3xl font-bold text-text-primary">{stat}</div>
              <div className="mt-1 text-sm text-text-secondary">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   FOOTER: Single row
   ───────────────────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-border px-6 py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-text-secondary">
          © 2026 <span className="text-accent">FitCheck</span>
        </p>
        <div className="flex gap-6 text-sm text-text-secondary">
          {['About', 'Pricing', 'Privacy', 'Contact'].map((l) => (
            <a key={l} href="#" className="transition-colors hover:text-text-primary">
              {l}
            </a>
          ))}
          <Link to="/login" className="transition-colors hover:text-text-primary">
            Log in
          </Link>
        </div>
      </div>
    </footer>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN EXPORT
   ───────────────────────────────────────────────────────────────────────────── */

export function Landing() {
  const { session } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (session) navigate('/submit', { replace: true })
  }, [session, navigate])

  return (
    <div className="relative min-h-screen bg-bg">
      <Background />
      <div className="relative z-10">
        <Nav />
        <Hero />
        <ScrollDemo />
        <HowItWorks />
        <Marquee />
        <Signup />
        <Footer />
      </div>
    </div>
  )
}
