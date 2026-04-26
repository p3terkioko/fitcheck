import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import { Navbar } from '../components/layout/Navbar'
import { Hero } from '../components/landing/Hero'
import { ScrollDemo } from '../components/landing/ScrollDemo'
import { HowItWorks } from '../components/landing/HowItWorks'
import { Marquee } from '../components/landing/Marquee'
import { Signup } from '../components/landing/Signup'
import { Footer } from '../components/landing/Footer'

/* ─────────────────────────────────────────────────────────────────────────────
   BACKGROUND: Grain overlay + animated radial mesh blobs
   ───────────────────────────────────────────────────────────────────────────── */
function Background() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />
      <div
        className="pointer-events-none fixed -top-[20%] -left-[10%] z-0 h-[700px] w-[700px] rounded-full opacity-[0.12]"
        style={{
          background: 'radial-gradient(circle, #00C4A1 0%, transparent 70%)',
          animation: 'blob1 18s ease-in-out infinite',
        }}
      />
      <div
        className="pointer-events-none fixed top-[40%] -right-[15%] z-0 h-[600px] w-[600px] rounded-full opacity-[0.08]"
        style={{
          background: 'radial-gradient(circle, #2D3350 0%, transparent 70%)',
          animation: 'blob2 22s ease-in-out infinite',
        }}
      />
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
        <Navbar variant="landing" />
        <main>
          <Hero />
          <ScrollDemo />
          <HowItWorks />
          <Marquee />
          <Signup />
        </main>
        <Footer />
      </div>
    </div>
  )
}
