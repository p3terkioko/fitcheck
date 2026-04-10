import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { VerificationProvider } from './context/VerificationContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

import { Landing }     from './pages/Landing'
import { Login }       from './pages/Login'
import { AuthCallback } from './pages/AuthCallback'
import { Onboarding }  from './pages/Onboarding'
import { Submit }      from './pages/Submit'
import { Processing }  from './pages/Processing'
import { Results }     from './pages/Results'
import { ClaimDetail } from './pages/ClaimDetail'
import { History }     from './pages/History'
import { Settings }    from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <VerificationProvider>
          <Routes>
            {/* Public */}
            <Route path="/"              element={<Landing />} />
            <Route path="/login"         element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Onboarding — session required, but blocked if already completed */}
            <Route element={<ProtectedRoute requireOnboarding={false} />}>
              <Route path="/onboarding" element={<Onboarding />} />
            </Route>

            {/* Protected — session + onboarding required */}
            <Route element={<ProtectedRoute requireOnboarding={true} />}>
              <Route path="/submit"      element={<Submit />} />
              <Route path="/processing"  element={<Processing />} />
              <Route path="/results"     element={<Results />} />
              <Route path="/results/:id" element={<ClaimDetail />} />
              <Route path="/history"     element={<History />} />
              <Route path="/settings"    element={<Settings />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </VerificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
