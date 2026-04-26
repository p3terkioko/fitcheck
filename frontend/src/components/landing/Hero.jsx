import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export function Hero() {
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
          className="mb-8 font-display font-bold text-text-primary text-[clamp(40px,5vw+1rem,96px)] leading-none"
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
            <em className="text-accent italic">blindly.</em>
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
          className={`relative mb-10 flex flex-wrap items-center justify-center gap-4 transition-all duration-700 delay-500 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Merlin-style SVG Scribble */}
          <div className="absolute -top-12 -right-6 hidden sm:block rotate-12 opacity-80">
            <svg width="80" height="50" viewBox="0 0 100 60" fill="none" className="text-accent stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10,40 Q30,10 60,10 T90,30" />
              <path d="M75,20 L90,30 L80,45" />
              <text x="15" y="15" fontSize="14" fill="currentColor" stroke="none" className="font-body opacity-90 rotate-[-10deg]">Free</text>
            </svg>
          </div>

          <Link
            to="/login"
            className="flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
          >
            Get started <ArrowRight size={15} />
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
