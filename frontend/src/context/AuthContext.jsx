import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)       // backend user shape
  const [loading, setLoading] = useState(true)
  // Prevents concurrent fetchBackendUser calls (e.g. getSession + INITIAL_SESSION
  // event both firing on page load, or rapid auth state changes).
  const fetchingRef = useRef(false)

  async function fetchBackendUser(retried = false) {
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      const { user: backendUser } = await api.getMe()
      setUser(backendUser)
      setLoading(false)
    } catch (err) {
      // AbortError = Web Lock stolen by another tab — retry once after a short delay.
      // Do NOT call setLoading(false) here; the retry will handle it so loading
      // stays true while the retry is in flight (fixes premature loading=false).
      if (err.name === 'AbortError' && !retried) {
        fetchingRef.current = false
        setTimeout(() => fetchBackendUser(true), 800)
        return
      }
      console.error('Failed to fetch backend user:', err.message)
      setUser(null)
      setLoading(false)
    } finally {
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchBackendUser()
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        if (event === 'SIGNED_IN') {
          await fetchBackendUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  function signOut() {
    return supabase.auth.signOut()
  }

  function updateUser(updates) {
    setUser(prev => prev ? { ...prev, ...updates } : prev)
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signInWithGoogle, signOut, updateUser, fetchBackendUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
