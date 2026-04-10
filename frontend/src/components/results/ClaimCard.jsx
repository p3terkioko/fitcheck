import { useNavigate } from 'react-router-dom'
import { User } from 'lucide-react'
import { VerdictBadge } from './VerdictBadge'
import { ConfidenceBar } from './ConfidenceBar'
import { useVerification } from '../../context/VerificationContext'

export function ClaimCard({ item, index }) {
  const { claim, result } = item
  const navigate = useNavigate()
  const { setCurrentResult } = useVerification()

  function handleView() {
    setCurrentResult(result)
    navigate(`/results/${index}`, { state: { claim, result } })
  }

  if (!result) return null

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <VerdictBadge verdict={result.verdict} />
        <span className="shrink-0 font-mono text-xs text-text-secondary">
          Claim {index + 1}
        </span>
      </div>

      {/* Claim text */}
      <p className="line-clamp-2 font-body text-sm font-medium text-text-primary">
        "{claim}"
      </p>

      {/* Summary */}
      {result.oneLineSummary && (
        <p className="line-clamp-1 font-body text-xs text-text-secondary">
          {result.oneLineSummary}
        </p>
      )}

      {/* Confidence bar */}
      <ConfidenceBar
        verdict={result.verdict}
        confidenceScore={result.confidenceScore}
        confidenceLabel={result.confidenceLabel}
        sourcesCount={result.sourcesCount}
      />

      {/* Profile context indicator */}
      {result.profileContext?.hasRelevantContext && (
        <div className="flex items-center gap-1.5">
          <User size={12} className="text-accent" />
          <span className="font-body text-xs text-accent">Personalised note</span>
        </div>
      )}

      {/* View link */}
      <button
        onClick={handleView}
        className="self-end font-body text-xs text-accent hover:underline"
      >
        View full verdict →
      </button>
    </div>
  )
}
