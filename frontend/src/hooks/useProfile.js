import { useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export function useProfile() {
  const { user, fetchBackendUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  async function saveProfile(profileData) {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await api.saveProfile(profileData)
      await fetchBackendUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return { user, saving, saved, error, saveProfile }
}
