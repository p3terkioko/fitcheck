const AGE_OPTIONS = [
  { value: 'under_18', label: 'Under 18' },
  { value: '18_35',    label: '18–35' },
  { value: '36_55',    label: '36–55' },
  { value: '55_plus',  label: '55+' },
]

export function AgeGroupCard({ value, onChange }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <label className="mb-4 block font-body text-sm font-semibold text-text-primary">
        How old are you?
      </label>
      <div className="flex flex-wrap gap-2">
        {AGE_OPTIONS.map(opt => (
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
