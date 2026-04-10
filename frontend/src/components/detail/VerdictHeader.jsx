import { VerdictBadge } from '../results/VerdictBadge'
import { ConfidenceBar } from '../results/ConfidenceBar'

export function VerdictHeader({ result, claim }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Claim blockquote */}
      <div className="rounded-xl border border-l-4 border-border bg-card p-6" style={{ borderLeftColor: '#2D3350' }}>
        <span className="font-heading text-4xl text-accent leading-none">"</span>
        <p className="font-heading text-xl italic text-text-primary mt-1">{claim}</p>
      </div>

      {/* Verdict badge + confidence */}
      <div className="flex flex-col gap-4">
        <VerdictBadge verdict={result.verdict} size="lg" />
        <ConfidenceBar
          verdict={result.verdict}
          confidenceScore={result.confidenceScore}
          confidenceLabel={result.confidenceLabel}
          sourcesCount={result.sourcesCount}
        />
      </div>

      {/* One-line summary */}
      {result.oneLineSummary && (
        <p className="font-heading text-2xl leading-snug text-text-primary">
          {result.oneLineSummary}
        </p>
      )}
    </div>
  )
}
