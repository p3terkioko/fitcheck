const STATS = [
  { key: 'total',            label: 'Total Checked',    color: '#00C4A1' },
  { key: 'backedByResearch', label: 'Backed by Research', color: '#00C4A1' },
  { key: 'notSupported',     label: 'Not Supported',    color: '#F04E4E' },
  { key: 'unclear',          label: 'Unclear',          color: '#8B5CF6' },
]

export function StatsRow({ stats }) {
  if (!stats) return null

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {STATS.map(s => (
        <div key={s.key} className="rounded-xl border border-border bg-card p-4">
          <p className="font-mono text-3xl font-medium" style={{ color: s.color }}>
            {stats[s.key] ?? 0}
          </p>
          <p className="mt-1 font-body text-xs text-text-secondary">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
