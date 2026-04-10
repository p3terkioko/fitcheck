import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FullPageSpinner } from '../ui/Spinner'
import { AppShell } from './AppShell'

/**
 * requireOnboarding (default true):
 *   - true  → blocks access if onboarding not completed, redirects to /onboarding
 *   - false → used for /onboarding itself; blocks access if already completed
 */
export function ProtectedRoute({ requireOnboarding = true }) {
  const { session, user, loading } = useAuth()

  if (loading) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" replace />

  if (requireOnboarding && user && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />
  }

  if (!requireOnboarding && user?.onboardingCompleted) {
    return <Navigate to="/submit" replace />
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
