import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { AgeGroupCard } from '../components/onboarding/AgeGroupCard'
import { BiologicalSexCard } from '../components/onboarding/BiologicalSexCard'
import { ConditionsCard } from '../components/onboarding/ConditionsCard'
import { Button } from '../components/ui/Button'
import { useProfile } from '../hooks/useProfile'
import { useNavigate } from 'react-router-dom'

export function Onboarding() {
  const [ageGroup, setAgeGroup] = useState(null)
  const [biologicalSex, setBiologicalSex] = useState(null)
  const [conditions, setConditions] = useState([])
  const { saving, error, saveProfile } = useProfile()
  const navigate = useNavigate()

  async function handleComplete() {
    const data = {}
    if (ageGroup)           data.age_group = ageGroup
    if (biologicalSex)      data.biological_sex = biologicalSex
    if (conditions.length)  data.conditions = conditions
    await saveProfile(data)
    navigate('/submit', { replace: true })
  }

  function handleSkip() {
    saveProfile({}).then(() => navigate('/submit', { replace: true }))
  }

  return (
    <div className="min-h-screen bg-bg px-6 py-12">
      {/* Top bar */}
      <div className="mx-auto mb-10 flex max-w-xl items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle size={20} className="text-accent" />
          <span className="font-heading text-base text-text-primary">FitCheck</span>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full ${i === 0 ? 'bg-accent' : 'bg-border'}`}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 font-heading text-3xl text-text-primary">
          Help FitCheck give you better results.
        </h1>
        <p className="mb-8 font-body text-sm text-text-secondary">
          Takes 30 seconds. You can update this anytime in Settings.
        </p>

        <div className="flex flex-col gap-4">
          <AgeGroupCard value={ageGroup} onChange={setAgeGroup} />
          <BiologicalSexCard value={biologicalSex} onChange={setBiologicalSex} />
          <ConditionsCard value={conditions} onChange={setConditions} />
        </div>

        {error && (
          <p className="mt-4 font-body text-sm text-[#F04E4E]">{error}</p>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="font-body text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Skip for now
          </button>
          <Button onClick={handleComplete} loading={saving}>
            Continue →
          </Button>
        </div>

        <p className="mt-6 text-center font-body text-xs text-text-secondary">
          This stays private and is never shared.
        </p>
      </div>
    </div>
  )
}
