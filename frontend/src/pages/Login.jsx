import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton'

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
    <div className="flex min-h-screen">
      {/* Left panel — dark */}
      <div className="relative hidden w-[55%] flex-col justify-center overflow-hidden bg-bg px-16 lg:flex">
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 40% 50%, #00C4A1, transparent)',
          }}
        />
        <div className="relative z-10">
          <Link to="/" className="mb-12 flex items-center gap-2">
            <CheckCircle size={22} className="text-accent" />
            <span className="font-heading text-lg text-text-primary">FitCheck</span>
          </Link>
          <h1 className="mb-8 font-heading text-5xl leading-tight text-text-primary">
            Know before<br />you train.
          </h1>
          <ul className="flex flex-col gap-4">
            {PROOF_POINTS.map(point => (
              <li key={point} className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20">
                  <Check size={12} className="text-accent" />
                </div>
                <span className="font-body text-sm text-text-secondary">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel — light */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#F0F2F5] px-8 py-16">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <CheckCircle size={22} className="text-accent" />
            <span className="font-heading text-lg text-gray-900">FitCheck</span>
          </div>

          <h2 className="mb-2 font-heading text-2xl text-gray-900">Create your account</h2>
          <p className="mb-8 font-body text-sm text-gray-500">
            Verify fitness claims against peer-reviewed research.
          </p>

          <GoogleAuthButton />

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200" />
            <span className="font-body text-xs text-gray-400">or</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <button
            disabled
            className="w-full rounded-lg border border-gray-200 bg-white px-5 py-3 font-body text-sm text-gray-400 cursor-not-allowed"
          >
            Continue with email — Coming soon
          </button>

          <p className="mt-6 text-center font-body text-xs text-gray-400">
            By continuing you agree to FitCheck's{' '}
            <a href="#" className="text-accent hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-accent hover:underline">Privacy Policy</a>.
          </p>

          <p className="mt-6 text-center font-body text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
