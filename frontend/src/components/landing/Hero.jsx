import { Link } from 'react-router-dom'
import { ArrowRight, Play } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-6 py-24">
      {/* Ambient teal glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #00C4A1, transparent)',
          animation: 'pulse 8s ease-in-out infinite',
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="font-mono text-xs text-text-secondary">900+ peer-reviewed papers</span>
        </div>

        <h1 className="mb-6 font-heading text-5xl leading-tight text-text-primary md:text-6xl">
          Does that fitness claim<br />hold up?
        </h1>

        <p className="mx-auto mb-10 max-w-xl font-body text-lg text-text-secondary">
          FitCheck cross-references exercise and nutrition claims against peer-reviewed research — in seconds.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-lg bg-accent px-7 py-3.5 font-body text-sm font-medium text-bg hover:bg-accent/90 transition-colors"
          >
            Get Started Free
            <ArrowRight size={16} />
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 rounded-lg border border-border px-7 py-3.5 font-body text-sm font-medium text-text-secondary hover:border-accent hover:text-accent transition-colors"
          >
            <Play size={14} />
            See How It Works
          </a>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.04; }
          50% { opacity: 0.08; }
        }
      `}</style>
    </section>
  )
}
