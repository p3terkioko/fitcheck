const CONDITIONS = [
  { value: 'pregnant',       label: 'Pregnant' },
  { value: 'postpartum',     label: 'Postpartum' },
  { value: 'cardiovascular', label: 'Cardiovascular condition' },
  { value: 'diabetes',       label: 'Diabetes' },
  { value: 'kidney_liver',   label: 'Kidney or liver condition' },
  { value: 'osteoporosis',   label: 'Osteoporosis' },
  { value: 'none',           label: 'None of the above' },
]

export function ConditionsCard({ value = [], onChange }) {
  function toggle(condition) {
    if (condition === 'none') {
      onChange(['none'])
      return
    }
    const without = value.filter(c => c !== 'none')
    if (without.includes(condition)) {
      onChange(without.filter(c => c !== condition))
    } else {
      onChange([...without, condition])
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <label className="mb-1 block font-body text-sm font-semibold text-text-primary">
        Any relevant health conditions?
      </label>
      <p className="mb-4 font-body text-xs text-text-secondary">
        Select all that apply. This helps FitCheck flag claims that affect your specific situation.
      </p>
      <div className="flex flex-wrap gap-2">
        {CONDITIONS.map(opt => {
          const active = value.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`
                rounded-full border px-4 py-2 font-body text-sm transition-colors
                ${active
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-transparent text-text-secondary hover:border-accent/50 hover:text-text-primary'
                }
              `}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
