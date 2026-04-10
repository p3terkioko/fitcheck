import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Hero } from '../components/landing/Hero'
import { HowItWorks } from '../components/landing/HowItWorks'
import { SampleVerdicts } from '../components/landing/SampleVerdicts'
import { TrustStrip } from '../components/landing/TrustStrip'
import { Footer } from '../components/landing/Footer'

export function Landing() {
  const { session } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (session) navigate('/submit', { replace: true })
  }, [session])

  return (
    <div className="min-h-screen bg-bg">
      {/* Minimal nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={22} className="text-accent" />
            <span className="font-heading text-lg text-text-primary">FitCheck</span>
          </div>
          <Link
            to="/login"
            className="rounded-lg border border-border px-4 py-2 font-body text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors"
          >
            Sign In
          </Link>
        </div>
      </nav>

      <Hero />
      <TrustStrip />
      <HowItWorks />
      <SampleVerdicts />
      <Footer />
    </div>
  )
}
