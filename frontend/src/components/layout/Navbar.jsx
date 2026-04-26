import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function Navbar({ variant = 'landing' }) {
  const { session } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [pastHero, setPastHero] = useState(false)

  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 10)
      setPastHero(window.scrollY > 600) // Adjust threshold based on typical hero height
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const isLanding = variant === 'landing'

  // Top Nav styling
  const topNavBase = 'fixed top-0 left-0 right-0 z-50 transition-all duration-500'
  const topNavState = isLanding 
    ? pastHero 
      ? '-translate-y-full opacity-0' // Hide completely when past hero on landing
      : scrolled 
        ? 'border-b border-border bg-[#0F1117]/80 backdrop-blur-xl translate-y-0 opacity-100' 
        : 'bg-transparent translate-y-0 opacity-100'
    : 'border-b border-border bg-bg/90 backdrop-blur-sm translate-y-0 opacity-100'

  return (
    <>
      {/* ─────────────────────────────────────────────────────────
          TOP NAVIGATION
          ───────────────────────────────────────────────────────── */}
      <nav className={`${topNavBase} ${topNavState}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-accent">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 4.5" stroke="#00C4A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-heading text-lg font-bold text-text-primary">FitCheck</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {isLanding && (
              <div className="flex items-center gap-6">
                <a href="#how-it-works" className="font-body text-sm text-text-secondary hover:text-text-primary transition-colors">
                  How it works
                </a>
              </div>
            )}

            <div className="flex items-center gap-3">
              {session ? (
                <Link to="/submit" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90">
                  Go to App
                </Link>
              ) : (
                <>
                  <Link to="/login" className="rounded-lg px-4 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary">
                    Log in
                  </Link>
                  <Link to="/login" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90">
                    Try FitCheck
                  </Link>
                </>
              )}
            </div>
          </div>

          <button
            className="md:hidden text-text-secondary hover:text-text-primary focus:outline-none"
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────
          FLOATING BOTTOM NAVIGATION (MERLIN STYLE)
          ───────────────────────────────────────────────────────── */}
      {isLanding && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            pastHero ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-24 opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-2 rounded-full border border-[#ffffff1a] bg-[#1a1d27]/70 px-2 py-2 pr-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <Link to="/" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0F1117] border border-[#ffffff10] transition-colors hover:bg-[#2D3350]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 4.5" stroke="#00C4A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            
            <div className="hidden h-5 w-px bg-border sm:block mx-2" />
            
            <div className="hidden items-center gap-4 sm:flex px-2">
              <a href="#how-it-works" className="font-body text-xs font-medium text-[#A0A6B6] hover:text-white transition-colors">
                How it works
              </a>
              <Link to="/login" className="font-body text-xs font-medium text-[#A0A6B6] hover:text-white transition-colors">
                Log in
              </Link>
            </div>

            <div className="h-5 w-px bg-border mx-2" />

            <Link
              to="/login"
              className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-bg transition-transform hover:scale-105 active:scale-95"
            >
              Get started
            </Link>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          MOBILE MENU OVERLAY
          ───────────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-16 left-4 right-4 rounded-2xl border border-border bg-card px-6 py-6 shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
            {isLanding && (
              <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="block font-body text-base font-medium text-text-secondary hover:text-white">
                How it works
              </a>
            )}
            
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-6">
              {session ? (
                <Link to="/submit" className="flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-bg">
                  Go to App
                </Link>
              ) : (
                <>
                  <Link to="/login" className="flex items-center justify-center rounded-xl border border-border bg-elevated px-4 py-3 text-sm font-medium text-text-primary hover:bg-[#2D3350]">
                    Log in
                  </Link>
                  <Link to="/login" className="flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-bg">
                    Try FitCheck
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
