const MAX = 2000

export function ClaimTextarea({ value, onChange }) {
  const len = value.length
  const counterColor =
    len >= 1900 ? 'text-[#F04E4E]' :
    len >= 1600 ? 'text-[#F59E0B]' :
    'text-text-secondary'

  return (
    <div className="relative">
      <textarea
        id="claim-text"
        aria-label="Fitness claim text"
        value={value}
        onChange={e => onChange(e.target.value.slice(0, MAX))}
        rows={6}
        placeholder={`e.g. "Creatine causes hair loss" or "You need to eat protein within 30 minutes of training"`}
        className="
          w-full rounded-xl border border-border bg-card px-5 pt-4 pb-8
          font-mono text-sm text-text-primary placeholder-text-secondary
          resize-none focus:border-accent focus:outline-none transition-colors
        "
      />
      <span className={`absolute bottom-3 right-4 font-mono text-xs ${counterColor}`}>
        {len} / {MAX}
      </span>
    </div>
  )
}
