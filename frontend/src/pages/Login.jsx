import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton'
import { Navbar } from '../components/layout/Navbar'

const PROOF_POINTS = [
  '900+ peer-reviewed papers',
  'Verdict in under 30 seconds',
  'Personalised for your health profile',
]

export function Login() {
  const { session } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (session) navigate('/submit', { replace: true })
  }, [session])

  return (
    <div className="relative flex min-h-screen flex-col bg-bg pt-16">
      <Navbar variant="landing" />

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left panel — Value Prop */}
        <div className="relative flex w-full flex-col justify-center overflow-hidden px-8 py-12 lg:w-[55%] lg:px-16">
          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 40% 50%, #00C4A1, transparent)',
            }}
          />
          <div className="relative z-10 max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
            <h1 className="mb-6 lg:mb-8 font-heading text-4xl lg:text-5xl leading-tight text-text-primary">
              Know before<br />you train.
            </h1>
            <ul className="flex flex-col gap-4 mx-auto lg:mx-0 w-fit">
              {PROOF_POINTS.map(point => (
                <li key={point} className="flex items-center gap-3 text-left">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20">
                    <Check size={12} className="text-accent" />
                  </div>
                  <span className="font-body text-sm text-text-secondary">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right panel — Auth Form */}
        <div className="flex flex-1 flex-col items-center justify-center bg-card px-8 py-16 border-t lg:border-t-0 lg:border-l border-border">
          <div className="w-full max-w-sm">
            <h2 className="mb-2 font-heading text-2xl text-text-primary text-center lg:text-left">Create your account</h2>
            <p className="mb-8 font-body text-sm text-text-secondary text-center lg:text-left">
              Verify fitness claims against peer-reviewed research.
            </p>

            <GoogleAuthButton />

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="font-body text-xs text-text-secondary">or</span>
              <div className="flex-1 border-t border-border" />
            </div>

            <button
              disabled
              className="w-full rounded-lg border border-border bg-elevated px-5 py-3 font-body text-sm text-text-secondary cursor-not-allowed"
            >
              Continue with email — Coming soon
            </button>

            <p className="mt-8 text-center font-body text-xs text-text-secondary">
              By continuing you agree to FitCheck's{' '}
              <a href="#" className="text-accent hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-accent hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
