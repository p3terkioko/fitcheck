import { Search } from 'lucide-react'

const FILTERS = [
  { value: 'all',                       label: 'All' },
  { value: 'BACKED_BY_RESEARCH',        label: 'Backed' },
  { value: 'PARTLY_TRUE',               label: 'Partly True' },
  { value: 'NOT_SUPPORTED_BY_EVIDENCE', label: 'Not Supported' },
  { value: 'UNCLEAR_LIMITED_RESEARCH',  label: 'Unclear' },
]

export function HistoryFilters({ searchQuery, onSearch, verdictFilter, onFilter }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <Search size={14} className="text-text-secondary" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search your claims..."
          className="
            w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4
            font-body text-sm text-text-primary placeholder-text-secondary
            focus:border-accent focus:outline-none transition-colors
          "
        />
      </div>

      {/* Verdict filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => onFilter(f.value)}
            className={`
              rounded-full border px-3 py-1.5 font-body text-xs transition-colors
              ${verdictFilter === f.value
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-text-secondary hover:border-accent/50'}
            `}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
