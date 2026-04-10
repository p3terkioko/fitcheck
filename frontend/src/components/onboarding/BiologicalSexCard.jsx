import { Info } from 'lucide-react'

const SEX_OPTIONS = [
  { value: 'male',              label: 'Male' },
  { value: 'female',            label: 'Female' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export function BiologicalSexCard({ value, onChange }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <label className="font-body text-sm font-semibold text-text-primary">
          Biological sex
        </label>
        <div className="group relative">
          <Info size={14} className="text-text-secondary cursor-help" />
          <div className="absolute left-5 top-0 z-10 hidden w-56 rounded-lg border border-border bg-elevated p-3 font-body text-xs text-text-secondary group-hover:block">
            Used to personalise hormonal and physiological context in results.
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {SEX_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? null : opt.value)}
            className={`
              rounded-full border px-5 py-2 font-body text-sm transition-colors
              ${value === opt.value
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border bg-transparent text-text-secondary hover:border-accent/50 hover:text-text-primary'
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
