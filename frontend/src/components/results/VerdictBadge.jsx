import { getVerdictConfig } from '../../lib/verdictUtils'

export function VerdictBadge({ verdict, size = 'sm' }) {
  const cfg = getVerdictConfig(verdict)
  const padding = size === 'lg' ? 'px-4 py-1.5 text-xs' : 'px-3 py-1 text-[10px]'

  return (
    <span
      className={`inline-flex items-center rounded-full font-mono font-medium uppercase tracking-wide border ${padding}`}
      style={{
        backgroundColor: cfg.color + '18',
        color: cfg.color,
        borderColor: cfg.color + '4D',
      }}
    >
      {cfg.label}
    </span>
  )
}
