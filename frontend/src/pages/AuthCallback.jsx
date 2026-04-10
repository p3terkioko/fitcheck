import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FullPageSpinner } from '../components/ui/Spinner'

export function AuthCallback() {
  const { session, user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    // Navigate even if backend user fetch failed — default to onboarding
    navigate(user?.onboardingCompleted ? '/submit' : '/onboarding', { replace: true })
  }, [session, user, loading])

  return <FullPageSpinner />
}
