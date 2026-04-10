import { getVerdictConfig } from '../../lib/verdictUtils'

export function ConfidenceBar({ verdict, confidenceScore, confidenceLabel, sourcesCount }) {
  const cfg = getVerdictConfig(verdict)

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-body text-xs text-text-secondary">
          {confidenceLabel} — based on{' '}
          <span className="font-mono">{sourcesCount}</span>{' '}
          {sourcesCount === 1 ? 'paper' : 'papers'}
        </span>
        <span className="font-mono text-sm font-medium" style={{ color: cfg.color }}>
          {confidenceScore}%
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${confidenceScore}%`, backgroundColor: cfg.color }}
        />
      </div>
    </div>
  )
}
