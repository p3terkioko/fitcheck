const FILTER_OPTIONS = [
  { value: 'all',                      label: 'All' },
  { value: 'BACKED_BY_RESEARCH',       label: 'Backed by Research' },
  { value: 'PARTLY_TRUE',              label: 'Partly True' },
  { value: 'NOT_SUPPORTED_BY_EVIDENCE',label: 'Not Supported' },
  { value: 'UNCLEAR_LIMITED_RESEARCH', label: 'Unclear' },
]

export function FilterBar({ filter, onFilter }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-body text-xs text-text-secondary">Filter:</span>
      {FILTER_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onFilter(opt.value)}
          className={`
            rounded-full border px-3 py-1 font-body text-xs transition-colors
            ${filter === opt.value
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border text-text-secondary hover:border-accent/50 hover:text-text-primary'
            }
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
