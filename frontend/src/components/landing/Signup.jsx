import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'

export function Signup() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  
  // Intersection Observer state
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

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
    <section id="signup" ref={sectionRef} className="px-6 py-20 md:py-32 overflow-hidden">
      <div className="mx-auto max-w-2xl text-center">
        
        {/* Animated Header Block */}
        <div className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-accent">Get started</p>
          <h2 className="mb-6 font-display font-bold text-[clamp(32px,5vw,72px)] leading-tight text-text-primary">
            Know what's <em className="text-accent italic">actually</em>
            <br />
            worth your time.
          </h2>
          <p className="mx-auto mb-10 max-w-md text-base text-text-secondary">
            Start fact-checking fitness claims today.
          </p>
        </div>

        {/* Animated Form Block */}
        <div className={`transition-all duration-1000 delay-300 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {done ? (
            <div className="mx-auto max-w-md rounded-2xl border border-[#00C4A1]/30 bg-[#00C4A1]/10 p-8 shadow-sm">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#00C4A1] mx-auto bg-[#00C4A1]/20">
                <Check size={20} className="text-[#00C4A1]" />
              </div>
              <p className="text-lg font-semibold text-[#00C4A1]">You're in!</p>
              <p className="mt-2 text-sm text-text-secondary">Check your inbox to confirm your account.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row relative">
              <label htmlFor="signup-email" className="sr-only">Email address</label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 rounded-full border border-border bg-card px-5 py-3 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:border-accent transition-colors shadow-sm focus:shadow-[0_0_15px_rgba(0,196,161,0.1)]"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-bg transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg border-t-transparent" />
                ) : (
                  'Create account'
                )}
              </button>
            </form>
          )}

          {error && <p role="alert" aria-live="polite" className="mt-3 text-xs text-[#F04E4E]">{error}</p>}

          {!done && (
            <p className="mt-4 text-sm text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-text-primary hover:underline transition-colors">
                Log in →
              </Link>
            </p>
          )}
        </div>

        {/* Animated Stats Row */}
        <div className="mt-24 flex flex-col items-center gap-8 sm:flex-row sm:justify-center sm:divide-x sm:divide-border">
          {[
            { stat: '900+', label: 'Peer-reviewed papers' },
            { stat: '4', label: 'Verdict categories' },
            { stat: 'Seconds', label: 'Fast results' },
          ].map(({ stat, label }, i) => (
            <div 
              key={i} 
              className={`px-8 text-center transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${500 + i * 150}ms` }}
            >
              <div className="text-3xl font-bold text-text-primary">{stat}</div>
              <div className="mt-1 text-sm text-text-secondary">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
