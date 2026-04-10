import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { AgeGroupCard } from '../components/onboarding/AgeGroupCard'
import { BiologicalSexCard } from '../components/onboarding/BiologicalSexCard'
import { ConditionsCard } from '../components/onboarding/ConditionsCard'

export function Settings() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { saving, saved, error, saveProfile } = useProfile()
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  // Form state seeded from user profile
  const [ageGroup, setAgeGroup] = useState(user?.ageGroup || null)
  const [biologicalSex, setBiologicalSex] = useState(user?.biologicalSex || null)
  const [conditions, setConditions] = useState(user?.conditions || [])

  async function handleSave() {
    const data = {}
    if (ageGroup)          data.age_group = ageGroup
    if (biologicalSex)     data.biological_sex = biologicalSex
    data.conditions = conditions
    await saveProfile(data)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-8 font-heading text-4xl text-text-primary">Settings</h1>

      {/* Account section */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar src={user?.avatarUrl} name={user?.displayName || user?.email} size={48} />
            <div>
              <p className="font-body text-base font-medium text-text-primary">
                {user?.displayName || 'User'}
              </p>
              <p className="font-body text-sm text-text-secondary">{user?.email}</p>
              <p className="mt-1 font-body text-xs text-text-secondary">Connected with Google</p>
            </div>
          </div>

          {/* Sign out */}
          {!confirmSignOut ? (
            <Button
              variant="ghost"
              onClick={() => setConfirmSignOut(true)}
              className="shrink-0"
            >
              <LogOut size={14} />
              Sign out
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-body text-xs text-text-secondary">Sign out?</span>
              <Button variant="danger" onClick={handleSignOut} className="text-xs px-3 py-1.5">
                Confirm
              </Button>
              <Button variant="ghost" onClick={() => setConfirmSignOut(false)} className="text-xs px-3 py-1.5">
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Health Profile section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-1 font-body text-base font-semibold text-text-primary">Health Profile</h2>
        <p className="mb-6 font-body text-sm text-text-secondary">
          FitCheck uses this to personalise verdict warnings for your specific situation.
        </p>

        <div className="flex flex-col gap-4">
          <AgeGroupCard value={ageGroup} onChange={setAgeGroup} />
          <BiologicalSexCard value={biologicalSex} onChange={setBiologicalSex} />
          <ConditionsCard value={conditions} onChange={setConditions} />
        </div>

        {error && (
          <p className="mt-4 font-body text-sm text-[#F04E4E]">{error}</p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <p className="font-body text-xs text-text-secondary italic">
            This information is private and never shared or used for advertising.
          </p>
          <div className="flex items-center gap-3">
            {saved && (
              <div className="flex items-center gap-1 text-accent">
                <Check size={14} />
                <span className="font-body text-xs">Saved</span>
              </div>
            )}
            <Button onClick={handleSave} loading={saving}>
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
