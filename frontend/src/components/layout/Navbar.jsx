import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function Navbar({ variant = 'landing' }) {
  const { session } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // If we're on the landing page, we want it to be transparent at top, then glassmorphism
  const isLanding = variant === 'landing'
  const navBgClass = isLanding
    ? scrolled ? 'border-b border-border bg-[#0F1117]/80 backdrop-blur-xl' : 'bg-transparent'
    : 'border-b border-border bg-bg/90 backdrop-blur-sm'

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBgClass}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
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
          </Link>

          {/* Desktop nav */}
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
                <Link
                  to="/submit"
                  className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
                >
                  Go to App
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-lg px-4 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
                  >
                    Try FitCheck
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-text-secondary hover:text-text-primary focus:outline-none"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          {/* Menu panel */}
          <div className="absolute top-16 left-0 right-0 border-b border-border bg-card px-6 py-6 shadow-xl flex flex-col gap-4">
            {isLanding && (
              <a
                href="#how-it-works"
                onClick={() => setMenuOpen(false)}
                className="block font-body text-base text-text-secondary hover:text-text-primary"
              >
                How it works
              </a>
            )}
            
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-6">
              {session ? (
                <Link
                  to="/submit"
                  className="flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-bg"
                >
                  Go to App
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center justify-center rounded-lg border border-border px-4 py-3 text-sm text-text-primary hover:bg-elevated"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/login"
                    className="flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-bg"
                  >
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
